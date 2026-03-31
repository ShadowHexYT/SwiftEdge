use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ClipboardItemKind {
  Text,
  Image,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipboardItem {
  pub id: String,
  pub kind: ClipboardItemKind,
  pub preview: String,
  pub created_at: i64,
  pub search_text: String,
  pub text_value: Option<String>,
  pub image_data_url: Option<String>,
  pub image_width: Option<u32>,
  pub image_height: Option<u32>,
  pub fingerprint: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum EdgeSide {
  Left,
  Right,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SidebarWindowPayload {
  pub edge_side: EdgeSide,
  pub sidebar_width: f64,
  pub is_open: bool,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipboardUpdatedPayload {
  pub items: Vec<ClipboardItem>,
}
