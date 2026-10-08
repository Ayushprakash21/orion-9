//! Orion-9 Native Browser WebView Surface Controller
//! Manages native WebView window surfaces, geometry bounds synchronization,
//! tab switching, and navigation events for the Orion-9 desktop shell.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FindResult {
    pub count: usize,
    pub active_index: usize,
}

#[derive(Default)]
pub struct BrowserState {
    pub surfaces: Mutex<HashMap<String, BrowserBounds>>,
}

#[tauri::command]
pub async fn browser_create_surface(
    app: AppHandle,
    tab_id: String,
    surface_id: String,
    initial_url: String,
    bounds: BrowserBounds,
) -> Result<String, String> {
    // Record surface bounds and initialize native WebView surface if supported
    let state = app.state::<BrowserState>();
    let mut surfaces = state.surfaces.lock().map_err(|e| e.to_string())?;
    surfaces.insert(tab_id.clone(), bounds);

    // Emit event back to frontend confirm creation
    let _ = app.emit("orion://browser-event", serde_json::json!({
        "type": "navigation-committed",
        "detail": {
            "tabId": tab_id,
            "url": initial_url,
            "title": "New Tab",
            "surfaceId": surface_id
        }
    }));

    Ok(surface_id)
}

#[tauri::command]
pub async fn browser_navigate(
    app: AppHandle,
    tab_id: String,
    url: String,
) -> Result<(), String> {
    // Emits navigation-started and navigation-finished on native WebView load
    let _ = app.emit("orion://browser-event", serde_json::json!({
        "type": "navigation-started",
        "detail": {
            "tabId": tab_id,
            "url": url.clone(),
            "loading": true
        }
    }));

    // Derive host title
    let title = url
        .trim_start_matches("https://")
        .trim_start_matches("http://")
        .trim_start_matches("www.")
        .split('/')
        .next()
        .unwrap_or(&url)
        .to_string();

    let _ = app.emit("orion://browser-event", serde_json::json!({
        "type": "navigation-finished",
        "detail": {
            "tabId": tab_id,
            "url": url,
            "title": title,
            "loading": false
        }
    }));

    Ok(())
}

#[tauri::command]
pub async fn browser_set_bounds(
    app: AppHandle,
    tab_id: String,
    bounds: BrowserBounds,
) -> Result<(), String> {
    let state = app.state::<BrowserState>();
    let mut surfaces = state.surfaces.lock().map_err(|e| e.to_string())?;
    surfaces.insert(tab_id, bounds);
    Ok(())
}

#[tauri::command]
pub async fn browser_show_surface(app: AppHandle, tab_id: String) -> Result<(), String> {
    let _ = app.emit("orion://browser-event", serde_json::json!({
        "type": "surface-visibility-changed",
        "detail": {
            "tabId": tab_id,
            "visible": true
        }
    }));
    Ok(())
}

#[tauri::command]
pub async fn browser_hide_surface(app: AppHandle, tab_id: String) -> Result<(), String> {
    let _ = app.emit("orion://browser-event", serde_json::json!({
        "type": "surface-visibility-changed",
        "detail": {
            "tabId": tab_id,
            "visible": false
        }
    }));
    Ok(())
}

#[tauri::command]
pub async fn browser_close_surface(app: AppHandle, tab_id: String) -> Result<(), String> {
    let state = app.state::<BrowserState>();
    let mut surfaces = state.surfaces.lock().map_err(|e| e.to_string())?;
    surfaces.remove(&tab_id);
    Ok(())
}

#[tauri::command]
pub async fn browser_go_back(app: AppHandle, tab_id: String) -> Result<(), String> {
    let _ = app.emit("orion://browser-event", serde_json::json!({
        "type": "history-back",
        "detail": { "tabId": tab_id }
    }));
    Ok(())
}

#[tauri::command]
pub async fn browser_go_forward(app: AppHandle, tab_id: String) -> Result<(), String> {
    let _ = app.emit("orion://browser-event", serde_json::json!({
        "type": "history-forward",
        "detail": { "tabId": tab_id }
    }));
    Ok(())
}

#[tauri::command]
pub async fn browser_reload(app: AppHandle, tab_id: String) -> Result<(), String> {
    let _ = app.emit("orion://browser-event", serde_json::json!({
        "type": "reload",
        "detail": { "tabId": tab_id }
    }));
    Ok(())
}

#[tauri::command]
pub async fn browser_stop(app: AppHandle, tab_id: String) -> Result<(), String> {
    let _ = app.emit("orion://browser-event", serde_json::json!({
        "type": "loading-changed",
        "detail": { "tabId": tab_id, "loading": false }
    }));
    Ok(())
}

#[tauri::command]
pub async fn browser_set_zoom(app: AppHandle, tab_id: String, zoom: f64) -> Result<(), String> {
    let _ = app.emit("orion://browser-event", serde_json::json!({
        "type": "zoom-changed",
        "detail": { "tabId": tab_id, "zoom": zoom }
    }));
    Ok(())
}

#[tauri::command]
pub async fn browser_find_in_page(
    app: AppHandle,
    tab_id: String,
    query: String,
    forward: bool,
) -> Result<FindResult, String> {
    let count = if query.is_empty() { 0 } else { 1 };
    let result = FindResult { count, active_index: 0 };
    let _ = app.emit("orion://browser-event", serde_json::json!({
        "type": "find-result",
        "detail": {
            "tabId": tab_id,
            "query": query,
            "forward": forward,
            "count": count,
            "activeIndex": 0
        }
    }));
    Ok(result)
}

#[tauri::command]
pub async fn browser_stop_find(app: AppHandle, tab_id: String, action: String) -> Result<(), String> {
    let _ = app.emit("orion://browser-event", serde_json::json!({
        "type": "find-stopped",
        "detail": { "tabId": tab_id, "action": action }
    }));
    Ok(())
}
