use crate::models::{ClipboardItem, ClipboardItemKind, ClipboardUpdatedPayload};
use crate::persistence::save_history;
use crate::state::ClipboardState;
use arboard::{Clipboard, ImageData};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use image::{DynamicImage, ImageFormat, RgbaImage};
use sha2::{Digest, Sha256};
use std::borrow::Cow;
use std::io::Cursor;
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager};

const EVENT_NAME: &str = "swiftedge://clipboard-updated";

pub fn start_clipboard_monitor(app: AppHandle) {
  thread::spawn(move || {
    let mut clipboard = Clipboard::new().ok();

    loop {
      if clipboard.is_none() {
        clipboard = Clipboard::new().ok();
      }

      if let Some(active_clipboard) = clipboard.as_mut() {
        if let Err(error) = poll_clipboard(active_clipboard, &app) {
          log::debug!("clipboard poll failed: {error}");
          clipboard = None;
        }
      }

      thread::sleep(Duration::from_millis(700));
    }
  });
}

pub fn emit_history(app: &AppHandle, items: Vec<ClipboardItem>) -> Result<(), String> {
  app
    .emit(EVENT_NAME, ClipboardUpdatedPayload { items })
    .map_err(|error| error.to_string())
}

fn poll_clipboard(clipboard: &mut Clipboard, app: &AppHandle) -> Result<(), String> {
  let next_item = if let Ok(image) = clipboard.get_image() {
    Some(build_image_item(image)?)
  } else if let Ok(text) = clipboard.get_text() {
    build_text_item(text)
  } else {
    None
  };

  let Some(item) = next_item else {
    return Ok(());
  };

  let state = app.state::<ClipboardState>();
  let mut last_fingerprint = state
    .last_fingerprint
    .lock()
    .map_err(|_| "clipboard fingerprint lock poisoned".to_string())?;

  if last_fingerprint.as_ref() == Some(&item.fingerprint) {
    return Ok(());
  }

  *last_fingerprint = Some(item.fingerprint.clone());
  drop(last_fingerprint);

  let snapshot = upsert_history(state.inner(), item)?;
  emit_history(app, snapshot)?;

  Ok(())
}

pub fn get_history_snapshot(state: &ClipboardState) -> Result<Vec<ClipboardItem>, String> {
  let history = state
    .history
    .lock()
    .map_err(|_| "clipboard history lock poisoned".to_string())?;

  Ok(history.clone())
}

pub fn upsert_history(state: &ClipboardState, item: ClipboardItem) -> Result<Vec<ClipboardItem>, String> {
  let mut history = state
    .history
    .lock()
    .map_err(|_| "clipboard history lock poisoned".to_string())?;
  let limit = *state
    .history_limit
    .lock()
    .map_err(|_| "clipboard config lock poisoned".to_string())?;

  history.retain(|existing| existing.fingerprint != item.fingerprint);
  history.insert(0, item);
  history.truncate(limit);
  save_history(&state.storage_path, &history)?;

  Ok(history.clone())
}

pub fn delete_history_item(state: &ClipboardState, id: &str) -> Result<Vec<ClipboardItem>, String> {
  let mut history = state
    .history
    .lock()
    .map_err(|_| "clipboard history lock poisoned".to_string())?;
  history.retain(|item| item.id != id);
  save_history(&state.storage_path, &history)?;
  Ok(history.clone())
}

pub fn clear_history_items(state: &ClipboardState) -> Result<Vec<ClipboardItem>, String> {
  let mut history = state
    .history
    .lock()
    .map_err(|_| "clipboard history lock poisoned".to_string())?;
  history.clear();
  save_history(&state.storage_path, &history)?;
  Ok(history.clone())
}

pub fn replace_history_items(state: &ClipboardState, items: Vec<ClipboardItem>) -> Result<Vec<ClipboardItem>, String> {
  let limit = *state
    .history_limit
    .lock()
    .map_err(|_| "clipboard config lock poisoned".to_string())?;

  let mut next_items = items;
  next_items.sort_by(|left, right| right.created_at.cmp(&left.created_at));
  next_items.truncate(limit);

  {
    let mut history = state
      .history
      .lock()
      .map_err(|_| "clipboard history lock poisoned".to_string())?;
    *history = next_items;
    save_history(&state.storage_path, &history)?;
  }

  let snapshot = get_history_snapshot(state)?;
  let mut last_fingerprint = state
    .last_fingerprint
    .lock()
    .map_err(|_| "clipboard fingerprint lock poisoned".to_string())?;
  *last_fingerprint = snapshot.first().map(|item| item.fingerprint.clone());

  Ok(snapshot)
}

pub fn update_history_limit(state: &ClipboardState, limit: usize) -> Result<Vec<ClipboardItem>, String> {
  let mut config_limit = state
    .history_limit
    .lock()
    .map_err(|_| "clipboard config lock poisoned".to_string())?;
  *config_limit = limit.max(1);
  drop(config_limit);

  let mut history = state
    .history
    .lock()
    .map_err(|_| "clipboard history lock poisoned".to_string())?;
  history.truncate(limit.max(1));
  save_history(&state.storage_path, &history)?;
  Ok(history.clone())
}

pub fn restore_item_to_clipboard(state: &ClipboardState, id: &str) -> Result<(), String> {
  let history = state
    .history
    .lock()
    .map_err(|_| "clipboard history lock poisoned".to_string())?;
  let item = history
    .iter()
    .find(|entry| entry.id == id)
    .cloned()
    .ok_or_else(|| "Clipboard item not found".to_string())?;
  drop(history);

  let mut clipboard = Clipboard::new().map_err(|error| error.to_string())?;

  match item.kind {
    ClipboardItemKind::Text => {
      clipboard
        .set_text(item.text_value.unwrap_or_default())
        .map_err(|error| error.to_string())?;
    }
    ClipboardItemKind::Image => {
      let encoded = item
        .image_data_url
        .as_deref()
        .and_then(|data_url| data_url.split_once(',').map(|(_, data)| data.to_string()))
        .ok_or_else(|| "Image data missing".to_string())?;
      let png_bytes = BASE64.decode(encoded).map_err(|error| error.to_string())?;
      let image = image::load_from_memory(&png_bytes).map_err(|error| error.to_string())?;
      let rgba = image.to_rgba8();
      let width = rgba.width() as usize;
      let height = rgba.height() as usize;

      clipboard
        .set_image(ImageData {
          width,
          height,
          bytes: Cow::Owned(rgba.into_raw()),
        })
        .map_err(|error| error.to_string())?;
    }
  }

  Ok(())
}

fn build_text_item(text: String) -> Option<ClipboardItem> {
  let trimmed = text.trim().to_string();
  if trimmed.is_empty() {
    return None;
  }

  let preview = trimmed
    .lines()
    .flat_map(str::split_whitespace)
    .collect::<Vec<_>>()
    .join(" ");
  let preview = truncate_preview(&preview, 240);
  let fingerprint = hash_bytes(trimmed.as_bytes());
  let timestamp = current_timestamp();

  Some(ClipboardItem {
    id: format!("{timestamp}-{}", &fingerprint[..10]),
    kind: ClipboardItemKind::Text,
    preview,
    created_at: timestamp,
    search_text: trimmed.clone(),
    text_value: Some(trimmed),
    image_data_url: None,
    image_width: None,
    image_height: None,
    fingerprint,
  })
}

fn build_image_item(image: ImageData<'_>) -> Result<ClipboardItem, String> {
  let width = image.width as u32;
  let height = image.height as u32;
  let rgba = RgbaImage::from_raw(width, height, image.bytes.into_owned())
    .ok_or_else(|| "Failed to decode image clipboard data".to_string())?;
  let fingerprint = hash_bytes(rgba.as_raw());
  let preview = format!("{} × {} image", width, height);
  let data_url = png_data_url(DynamicImage::ImageRgba8(rgba.clone()))?;
  let timestamp = current_timestamp();

  Ok(ClipboardItem {
    id: format!("{timestamp}-{}", &fingerprint[..10]),
    kind: ClipboardItemKind::Image,
    preview: preview.clone(),
    created_at: timestamp,
    search_text: preview,
    text_value: None,
    image_data_url: Some(data_url),
    image_width: Some(width),
    image_height: Some(height),
    fingerprint,
  })
}

fn png_data_url(image: DynamicImage) -> Result<String, String> {
  let mut output = Cursor::new(Vec::new());
  image
    .write_to(&mut output, ImageFormat::Png)
    .map_err(|error| error.to_string())?;
  Ok(format!("data:image/png;base64,{}", BASE64.encode(output.into_inner())))
}

fn truncate_preview(value: &str, max_len: usize) -> String {
  let truncated = value.chars().take(max_len).collect::<String>();
  if value.chars().count() > max_len {
    format!("{truncated}…")
  } else {
    truncated
  }
}

fn current_timestamp() -> i64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_default()
    .as_millis() as i64
}

fn hash_bytes(bytes: &[u8]) -> String {
  let mut hasher = Sha256::new();
  hasher.update(bytes);
  format!("{:x}", hasher.finalize())
}
