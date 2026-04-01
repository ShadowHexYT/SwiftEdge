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
use crate::models::EdgeSide;
use crate::state::{ClipboardState, SidebarRuntimeState};
use crate::window::{apply_sidebar_window, default_sidebar_window_state};
use device_query::{DeviceQuery, DeviceState};
use std::thread;
use std::time::{Duration, Instant};
use tauri::{Emitter, Manager};

const EDGE_TRIGGER_WIDTH_PX: i32 = 10;
const EDGE_POLL_INTERVAL_MS: u64 = 8;
const EDGE_REARM_DELAY_MS: u64 = 180;

fn start_edge_watcher(app: tauri::AppHandle) {
  thread::spawn(move || {
    let device_state = DeviceState::new();
    let mut edge_entered_at: Option<Instant> = None;
    let mut blocked_until: Option<Instant> = None;

    loop {
      let Some(window) = app.get_webview_window("main") else {
        break;
      };

      let Some(runtime_state) = app.try_state::<SidebarRuntimeState>() else {
        break;
      };

      let snapshot = match runtime_state.snapshot() {
        Ok(snapshot) => snapshot,
        Err(_) => {
          thread::sleep(Duration::from_millis(EDGE_POLL_INTERVAL_MS));
          continue;
        }
      };

      if snapshot.is_open {
        edge_entered_at = None;
        blocked_until = Some(Instant::now() + Duration::from_millis(EDGE_REARM_DELAY_MS));
        thread::sleep(Duration::from_millis(EDGE_POLL_INTERVAL_MS));
        continue;
      }

      if let Some(until) = blocked_until {
        if Instant::now() < until {
          thread::sleep(Duration::from_millis(EDGE_POLL_INTERVAL_MS));
          continue;
        }

        blocked_until = None;
      }

      let Ok(Some(monitor)) = window.current_monitor() else {
        thread::sleep(Duration::from_millis(EDGE_POLL_INTERVAL_MS));
        continue;
      };

      let mouse = device_state.get_mouse();
      let cursor_x = mouse.coords.0;
      let cursor_y = mouse.coords.1;
      let monitor_position = monitor.position();
      let monitor_size = monitor.size();
      let top_edge = monitor_position.y;
      let bottom_edge = monitor_position.y + monitor_size.height as i32;

      let is_within_vertical_bounds = cursor_y >= top_edge && cursor_y <= bottom_edge;
      let is_touching_edge = match snapshot.edge_side {
        EdgeSide::Left => cursor_x <= monitor_position.x + EDGE_TRIGGER_WIDTH_PX,
        EdgeSide::Right => {
          cursor_x >= monitor_position.x + monitor_size.width as i32 - EDGE_TRIGGER_WIDTH_PX
        }
      };

      if is_within_vertical_bounds && is_touching_edge {
        let entered_at = edge_entered_at.get_or_insert_with(Instant::now);
        if entered_at.elapsed() >= Duration::from_millis(snapshot.hover_delay_ms.min(180)) {
          let _ = app.emit("swiftedge://edge-activate", ());
          edge_entered_at = None;
          blocked_until = Some(Instant::now() + Duration::from_millis(EDGE_REARM_DELAY_MS));
        }
      } else {
        edge_entered_at = None;
      }

      thread::sleep(Duration::from_millis(EDGE_POLL_INTERVAL_MS));
    }
  });
}

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
      app.manage(SidebarRuntimeState::new());

      let main_window = app.get_webview_window("main").expect("main window missing");
      apply_sidebar_window(&main_window, &default_sidebar_window_state())?;
      start_clipboard_monitor(app.handle().clone());
      start_edge_watcher(app.handle().clone());

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
