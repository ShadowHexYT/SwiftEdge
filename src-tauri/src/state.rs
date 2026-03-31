use crate::models::ClipboardItem;
use crate::persistence::load_history;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

pub struct ClipboardState {
  pub history: Mutex<Vec<ClipboardItem>>,
  pub last_fingerprint: Mutex<Option<String>>,
  pub history_limit: Mutex<usize>,
  pub storage_path: PathBuf,
}

impl ClipboardState {
  pub fn bootstrap(app: &AppHandle) -> Result<Self, String> {
    let storage_path = app
      .path()
      .app_data_dir()
      .map_err(|error| error.to_string())?
      .join("clipboard-history.json");

    let history = load_history(&storage_path)?;
    let last_fingerprint = history.first().map(|item| item.fingerprint.clone());

    Ok(Self {
      history: Mutex::new(history),
      last_fingerprint: Mutex::new(last_fingerprint),
      history_limit: Mutex::new(80),
      storage_path,
    })
  }
}
