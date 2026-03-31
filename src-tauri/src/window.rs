use crate::models::{EdgeSide, SidebarWindowPayload};
use tauri::{LogicalPosition, LogicalSize, Position, Size, WebviewWindow};

const HANDLE_WIDTH: f64 = 14.0;
const VERTICAL_MARGIN: f64 = 18.0;

pub fn default_sidebar_window_state() -> SidebarWindowPayload {
  SidebarWindowPayload {
    edge_side: EdgeSide::Right,
    sidebar_width: 392.0,
    is_open: false,
  }
}

pub fn apply_sidebar_window(
  window: &WebviewWindow,
  payload: &SidebarWindowPayload,
) -> Result<(), String> {
  let monitor = window
    .current_monitor()
    .map_err(|error| error.to_string())?
    .ok_or_else(|| "No monitor available".to_string())?;

  let scale_factor = monitor.scale_factor();
  let monitor_size = monitor.size().to_logical::<f64>(scale_factor);
  let monitor_position = monitor.position().to_logical::<f64>(scale_factor);
  let width = if payload.is_open {
    payload.sidebar_width.clamp(320.0, 520.0)
  } else {
    HANDLE_WIDTH
  };
  let height = (monitor_size.height - (VERTICAL_MARGIN * 2.0)).max(420.0);
  let x = match payload.edge_side {
    EdgeSide::Left => monitor_position.x,
    EdgeSide::Right => monitor_position.x + monitor_size.width - width,
  };
  let y = monitor_position.y + VERTICAL_MARGIN;

  window
    .set_size(Size::Logical(LogicalSize::new(width, height)))
    .map_err(|error| error.to_string())?;
  window
    .set_position(Position::Logical(LogicalPosition::new(x, y)))
    .map_err(|error| error.to_string())?;

  Ok(())
}
