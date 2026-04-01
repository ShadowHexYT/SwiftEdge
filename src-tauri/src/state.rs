use crate::models::{ClipboardItem, EdgeSide};
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

#[derive(Clone)]
pub struct SidebarRuntimeSnapshot {
  pub edge_side: EdgeSide,
  pub hover_delay_ms: u64,
  pub is_open: bool,
}

pub struct SidebarRuntimeState {
  inner: Mutex<SidebarRuntimeSnapshot>,
}

impl SidebarRuntimeState {
  pub fn new() -> Self {
    Self {
      inner: Mutex::new(SidebarRuntimeSnapshot {
        edge_side: EdgeSide::Right,
        hover_delay_ms: 120,
        is_open: false,
      }),
    }
  }

  pub fn snapshot(&self) -> Result<SidebarRuntimeSnapshot, String> {
    self
      .inner
      .lock()
      .map(|guard| guard.clone())
      .map_err(|error| error.to_string())
  }

  pub fn update(&self, next: SidebarRuntimeSnapshot) -> Result<(), String> {
    let mut guard = self.inner.lock().map_err(|error| error.to_string())?;
    *guard = next;
    Ok(())
  }
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
