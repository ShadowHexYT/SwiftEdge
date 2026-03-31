use crate::models::ClipboardItem;
use std::fs;
use std::path::Path;

pub fn load_history(path: &Path) -> Result<Vec<ClipboardItem>, String> {
  if !path.exists() {
    return Ok(Vec::new());
  }

  let contents = fs::read_to_string(path).map_err(|error| error.to_string())?;
  serde_json::from_str(&contents).map_err(|error| error.to_string())
}

pub fn save_history(path: &Path, items: &[ClipboardItem]) -> Result<(), String> {
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent).map_err(|error| error.to_string())?;
  }

  let contents = serde_json::to_string_pretty(items).map_err(|error| error.to_string())?;
  fs::write(path, contents).map_err(|error| error.to_string())
}
