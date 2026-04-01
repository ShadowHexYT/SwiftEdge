use crate::clipboard::{
  clear_history_items, delete_history_item, emit_history, get_history_snapshot, replace_history_items,
  restore_item_to_clipboard, update_history_limit,
};
use crate::models::{ClipboardItem, SidebarWindowPayload};
use crate::state::{ClipboardState, SidebarRuntimeSnapshot, SidebarRuntimeState};
use crate::window::apply_sidebar_window;
use tauri::{AppHandle, State, WebviewWindow};

#[tauri::command]
pub fn get_clipboard_history(state: State<'_, ClipboardState>) -> Result<Vec<crate::models::ClipboardItem>, String> {
  get_history_snapshot(state.inner())
}

#[tauri::command]
pub fn copy_clipboard_item(id: String, state: State<'_, ClipboardState>) -> Result<(), String> {
  restore_item_to_clipboard(state.inner(), &id)
}

#[tauri::command]
pub fn delete_clipboard_item(
  id: String,
  app: AppHandle,
  state: State<'_, ClipboardState>,
) -> Result<(), String> {
  let snapshot = delete_history_item(state.inner(), &id)?;
  emit_history(&app, snapshot)
}

#[tauri::command]
pub fn clear_clipboard_history(
  app: AppHandle,
  state: State<'_, ClipboardState>,
) -> Result<(), String> {
  let snapshot = clear_history_items(state.inner())?;
  emit_history(&app, snapshot)
}

#[tauri::command]
pub fn set_clipboard_history_limit(
  limit: usize,
  app: AppHandle,
  state: State<'_, ClipboardState>,
) -> Result<(), String> {
  let snapshot = update_history_limit(state.inner(), limit)?;
  emit_history(&app, snapshot)
}

#[tauri::command]
pub fn replace_clipboard_history(
  items: Vec<ClipboardItem>,
  app: AppHandle,
  state: State<'_, ClipboardState>,
) -> Result<(), String> {
  let snapshot = replace_history_items(state.inner(), items)?;
  emit_history(&app, snapshot)
}

#[tauri::command]
pub fn sync_sidebar_window(
  window: WebviewWindow,
  payload: SidebarWindowPayload,
  runtime_state: State<'_, SidebarRuntimeState>,
) -> Result<(), String> {
  runtime_state.update(SidebarRuntimeSnapshot {
    edge_side: payload.edge_side.clone(),
    hover_delay_ms: payload.hover_delay_ms,
    is_open: payload.is_open,
  })?;
  apply_sidebar_window(&window, &payload)
}
