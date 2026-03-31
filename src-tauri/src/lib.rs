mod clipboard;
mod commands;
mod models;
mod persistence;
mod state;
mod window;

use crate::clipboard::start_clipboard_monitor;
use crate::commands::{
  clear_clipboard_history, copy_clipboard_item, delete_clipboard_item, get_clipboard_history,
  replace_clipboard_history, set_clipboard_history_limit, sync_sidebar_window,
};
use crate::state::ClipboardState;
use crate::window::{apply_sidebar_window, default_sidebar_window_state};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_autostart::Builder::new().build())
    .setup(|app| {
      #[cfg(desktop)]
      {
        app.handle()
          .plugin(tauri_plugin_global_shortcut::Builder::new().build())?;
      }

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let clipboard_state = ClipboardState::bootstrap(app.handle())?;
      app.manage(clipboard_state);

      let main_window = app.get_webview_window("main").expect("main window missing");
      apply_sidebar_window(&main_window, &default_sidebar_window_state())?;
      start_clipboard_monitor(app.handle().clone());

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      clear_clipboard_history,
      copy_clipboard_item,
      delete_clipboard_item,
      get_clipboard_history,
      replace_clipboard_history,
      set_clipboard_history_limit,
      sync_sidebar_window
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
