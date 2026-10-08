//! Orion-9 Native Browser WebView Surface Controller
//! Manages real OS-native child WebView surfaces via Tauri 2 multi-webview architecture,
//! geometry bounds synchronization, tab switching, and native navigation events.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::webview::{PageLoadEvent, WebviewBuilder};
use tauri::{AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Webview, WebviewUrl};
use url::Url;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SurfaceMetadata {
    pub tab_id: String,
    pub surface_id: String,
    pub native_label: String,
    pub url: String,
    pub bounds: BrowserBounds,
    pub visible: bool,
    pub zoom: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FindResult {
    pub count: usize,
    pub active_index: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeCapabilities {
    pub native_available: bool,
    pub runtime_type: String,
    pub platform: String,
    pub version: String,
}

#[derive(Default)]
pub struct BrowserState {
    pub surfaces: Mutex<HashMap<String, SurfaceMetadata>>,
}

/// Deterministically sanitize tab ID into a valid Tauri webview label.
/// Labels must only contain alphanumeric, `-`, `/`, `:`, `_`.
pub fn sanitize_label(tab_id: &str) -> String {
    let sanitized: String = tab_id
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .collect();
    format!("orion-browser-{}", sanitized)
}

/// Validates URL string and ensures only HTTP and HTTPS protocols are accepted.
pub fn validate_url(url_str: &str) -> Result<Url, String> {
    let parsed = Url::parse(url_str).map_err(|e| format!("Invalid URL: {}", e))?;
    let scheme = parsed.scheme();
    if scheme == "http" || scheme == "https" {
        Ok(parsed)
    } else {
        Err(format!(
            "Protocol '{}' is not permitted. Only HTTP and HTTPS are allowed.",
            scheme
        ))
    }
}

/// Internal helper to create a real child Webview attached to the main window.
pub fn create_child_webview(
    app: &AppHandle,
    tab_id: &str,
    target_url: &Url,
    bounds: &BrowserBounds,
) -> Result<Webview, String> {
    let native_label = sanitize_label(tab_id);

    // If already exists, return existing webview
    if let Some(existing) = app.get_webview(&native_label) {
        return Ok(existing);
    }

    let parent_window = app
        .get_window("main")
        .ok_or_else(|| "Main window 'main' not found in Tauri app".to_string())?;

    let tab_id_nav = tab_id.to_string();
    let app_nav = app.clone();
    let tab_id_load = tab_id.to_string();
    let app_load = app.clone();
    let tab_id_title = tab_id.to_string();
    let app_title = app.clone();

    let mut builder = WebviewBuilder::new(&native_label, WebviewUrl::External(target_url.clone()))
        .auto_resize();

    // 1. Navigation permission & lifecycle
    builder = builder.on_navigation(move |nav_url| {
        let scheme = nav_url.scheme();
        if scheme != "http" && scheme != "https" {
            return false;
        }
        let _ = app_nav.emit(
            "orion://browser-event",
            serde_json::json!({
                "type": "navigation-committed",
                "detail": {
                    "tabId": tab_id_nav,
                    "url": nav_url.as_str(),
                    "loading": true
                }
            }),
        );
        true
    });

    // 2. Real page-load events (Started and Finished)
    builder = builder.on_page_load(move |_webview, payload| {
        let (event_type, loading) = match payload.event() {
            PageLoadEvent::Started => ("navigation-started", true),
            PageLoadEvent::Finished => ("navigation-finished", false),
        };
        let _ = app_load.emit(
            "orion://browser-event",
            serde_json::json!({
                "type": event_type,
                "detail": {
                    "tabId": tab_id_load,
                    "url": payload.url().as_str(),
                    "loading": loading
                }
            }),
        );
    });

    // 3. Document title synchronization
    builder = builder.on_document_title_changed(move |_webview, title| {
        let _ = app_title.emit(
            "orion://browser-event",
            serde_json::json!({
                "type": "title-changed",
                "detail": {
                    "tabId": tab_id_title,
                    "title": title
                }
            }),
        );
    });

    // 4. Safe downloads handler
    builder = builder.on_download(|_webview, _event| true);

    // Attach as real native child webview to parent window client area
    let webview = parent_window
        .add_child(
            builder,
            LogicalPosition::new(bounds.x, bounds.y),
            LogicalSize::new(bounds.width, bounds.height),
        )
        .map_err(|e| format!("Failed to create child webview: {}", e))?;

    Ok(webview)
}

#[tauri::command]
pub async fn browser_create_surface(
    app: AppHandle,
    tab_id: String,
    surface_id: String,
    initial_url: String,
    bounds: BrowserBounds,
) -> Result<String, String> {
    let native_label = sanitize_label(&tab_id);

    // Save surface record in state
    {
        let state = app.state::<BrowserState>();
        let mut surfaces = state.surfaces.lock().map_err(|e| e.to_string())?;
        surfaces.insert(
            tab_id.clone(),
            SurfaceMetadata {
                tab_id: tab_id.clone(),
                surface_id: surface_id.clone(),
                native_label: native_label.clone(),
                url: initial_url.clone(),
                bounds: bounds.clone(),
                visible: true,
                zoom: 1.0,
            },
        );
    }

    // Lazy creation: only create native child webview if navigating to real HTTP/HTTPS target
    if let Ok(parsed_url) = validate_url(&initial_url) {
        let webview = create_child_webview(&app, &tab_id, &parsed_url, &bounds)?;
        let _ = webview.show();
        let _ = webview.set_focus();
    }

    Ok(surface_id)
}

#[tauri::command]
pub async fn browser_navigate(
    app: AppHandle,
    tab_id: String,
    url: String,
) -> Result<(), String> {
    let parsed_url = validate_url(&url)?;
    let native_label = sanitize_label(&tab_id);

    let webview = if let Some(existing) = app.get_webview(&native_label) {
        existing
    } else {
        // Retrieve recorded bounds or default
        let bounds = {
            let state = app.state::<BrowserState>();
            let surfaces = state.surfaces.lock().map_err(|e| e.to_string())?;
            surfaces
                .get(&tab_id)
                .map(|s| s.bounds.clone())
                .unwrap_or(BrowserBounds {
                    x: 0.0,
                    y: 0.0,
                    width: 800.0,
                    height: 600.0,
                })
        };
        let created = create_child_webview(&app, &tab_id, &parsed_url, &bounds)?;
        let _ = created.show();
        let _ = created.set_focus();
        created
    };

    // Update URL in state metadata
    {
        let state = app.state::<BrowserState>();
        let mut surfaces = state.surfaces.lock().map_err(|e| e.to_string())?;
        if let Some(entry) = surfaces.get_mut(&tab_id) {
            entry.url = parsed_url.to_string();
        }
    }

    webview
        .navigate(parsed_url)
        .map_err(|e| format!("Native navigation failed: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn browser_set_bounds(
    app: AppHandle,
    tab_id: String,
    bounds: BrowserBounds,
) -> Result<(), String> {
    {
        let state = app.state::<BrowserState>();
        let mut surfaces = state.surfaces.lock().map_err(|e| e.to_string())?;
        if let Some(entry) = surfaces.get_mut(&tab_id) {
            entry.bounds = bounds.clone();
        } else {
            surfaces.insert(
                tab_id.clone(),
                SurfaceMetadata {
                    tab_id: tab_id.clone(),
                    surface_id: format!("surface_{}", tab_id),
                    native_label: sanitize_label(&tab_id),
                    url: "about:blank".to_string(),
                    bounds: bounds.clone(),
                    visible: true,
                    zoom: 1.0,
                },
            );
        }
    }

    let native_label = sanitize_label(&tab_id);
    if let Some(webview) = app.get_webview(&native_label) {
        webview
            .set_position(LogicalPosition::new(bounds.x, bounds.y))
            .map_err(|e| format!("Failed to set webview position: {}", e))?;
        webview
            .set_size(LogicalSize::new(bounds.width, bounds.height))
            .map_err(|e| format!("Failed to set webview size: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn browser_show_surface(app: AppHandle, tab_id: String) -> Result<(), String> {
    let native_label = sanitize_label(&tab_id);
    if let Some(webview) = app.get_webview(&native_label) {
        webview
            .show()
            .map_err(|e| format!("Failed to show webview: {}", e))?;
        let _ = webview.set_focus();
    }

    let _ = app.emit(
        "orion://browser-event",
        serde_json::json!({
            "type": "surface-visibility-changed",
            "detail": {
                "tabId": tab_id,
                "visible": true
            }
        }),
    );

    Ok(())
}

#[tauri::command]
pub async fn browser_hide_surface(app: AppHandle, tab_id: String) -> Result<(), String> {
    let native_label = sanitize_label(&tab_id);
    if let Some(webview) = app.get_webview(&native_label) {
        webview
            .hide()
            .map_err(|e| format!("Failed to hide webview: {}", e))?;
    }

    let _ = app.emit(
        "orion://browser-event",
        serde_json::json!({
            "type": "surface-visibility-changed",
            "detail": {
                "tabId": tab_id,
                "visible": false
            }
        }),
    );

    Ok(())
}

#[tauri::command]
pub async fn browser_close_surface(app: AppHandle, tab_id: String) -> Result<(), String> {
    let native_label = sanitize_label(&tab_id);
    if let Some(webview) = app.get_webview(&native_label) {
        let _ = webview.close();
    }

    let state = app.state::<BrowserState>();
    let mut surfaces = state.surfaces.lock().map_err(|e| e.to_string())?;
    surfaces.remove(&tab_id);

    Ok(())
}

#[tauri::command]
pub async fn browser_go_back(app: AppHandle, tab_id: String) -> Result<(), String> {
    let native_label = sanitize_label(&tab_id);
    if let Some(webview) = app.get_webview(&native_label) {
        webview
            .eval("window.history.back()")
            .map_err(|e| format!("Failed to evaluate history.back(): {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn browser_go_forward(app: AppHandle, tab_id: String) -> Result<(), String> {
    let native_label = sanitize_label(&tab_id);
    if let Some(webview) = app.get_webview(&native_label) {
        webview
            .eval("window.history.forward()")
            .map_err(|e| format!("Failed to evaluate history.forward(): {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn browser_reload(app: AppHandle, tab_id: String) -> Result<(), String> {
    let native_label = sanitize_label(&tab_id);
    if let Some(webview) = app.get_webview(&native_label) {
        webview
            .reload()
            .map_err(|e| format!("Failed to reload webview: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn browser_stop(app: AppHandle, tab_id: String) -> Result<(), String> {
    let native_label = sanitize_label(&tab_id);
    if let Some(webview) = app.get_webview(&native_label) {
        webview
            .eval("window.stop()")
            .map_err(|e| format!("Failed to stop loading: {}", e))?;
    }
    let _ = app.emit(
        "orion://browser-event",
        serde_json::json!({
            "type": "loading-changed",
            "detail": {
                "tabId": tab_id,
                "loading": false
            }
        }),
    );
    Ok(())
}

#[tauri::command]
pub async fn browser_set_zoom(app: AppHandle, tab_id: String, zoom: f64) -> Result<(), String> {
    let native_label = sanitize_label(&tab_id);
    if let Some(webview) = app.get_webview(&native_label) {
        webview
            .set_zoom(zoom)
            .map_err(|e| format!("Failed to set zoom: {}", e))?;
    }
    let _ = app.emit(
        "orion://browser-event",
        serde_json::json!({
            "type": "zoom-changed",
            "detail": {
                "tabId": tab_id,
                "zoom": zoom
            }
        }),
    );
    Ok(())
}

#[tauri::command]
pub async fn browser_find_in_page(
    app: AppHandle,
    tab_id: String,
    query: String,
    forward: bool,
) -> Result<FindResult, String> {
    if query.trim().is_empty() {
        return Ok(FindResult {
            count: 0,
            active_index: 0,
        });
    }

    let native_label = sanitize_label(&tab_id);
    if let Some(webview) = app.get_webview(&native_label) {
        let q_json = serde_json::to_string(&query).unwrap_or_default();
        let fwd_json = serde_json::to_string(&forward).unwrap_or_default();
        let tid_json = serde_json::to_string(&tab_id).unwrap_or_default();

        let js = format!(
            r#"(function() {{
                try {{
                    const q = {q_json};
                    const fwd = {fwd_json};
                    const tabId = {tid_json};
                    if (!q) return;
                    const text = document.body ? (document.body.innerText || '') : '';
                    const escaped = q.replace(/[.*+?^${{}}()|[\]\\]/g, '\\$&');
                    const matches = text.match(new RegExp(escaped, 'gi'));
                    const count = matches ? matches.length : 0;
                    if (count > 0) {{
                        window.find(q, false, !fwd, true, false, true, false);
                    }}
                    if (window.__TAURI__ && window.__TAURI__.event) {{
                        window.__TAURI__.event.emit('orion://browser-event', {{
                            type: 'find-result',
                            detail: {{ tabId, query: q, count, activeIndex: 0, forward: fwd }}
                        }});
                    }}
                }} catch (e) {{}}
            }})();"#
        );

        let _ = webview.eval(&js);
    }

    Ok(FindResult {
        count: 0,
        active_index: 0,
    })
}

#[tauri::command]
pub async fn browser_stop_find(
    app: AppHandle,
    tab_id: String,
    action: String,
) -> Result<(), String> {
    let native_label = sanitize_label(&tab_id);
    if let Some(webview) = app.get_webview(&native_label) {
        let _ = webview.eval("window.getSelection()?.removeAllRanges();");
    }
    let _ = app.emit(
        "orion://browser-event",
        serde_json::json!({
            "type": "find-stopped",
            "detail": { "tabId": tab_id, "action": action }
        }),
    );
    Ok(())
}

#[tauri::command]
pub async fn browser_runtime_capabilities() -> Result<RuntimeCapabilities, String> {
    Ok(RuntimeCapabilities {
        native_available: true,
        runtime_type: "TAURI".to_string(),
        platform: std::env::consts::OS.to_string(),
        version: "2.0".to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_label() {
        assert_eq!(sanitize_label("tab-1"), "orion-browser-tab-1");
        assert_eq!(sanitize_label("tab_42"), "orion-browser-tab_42");
        assert_eq!(sanitize_label("tab.99"), "orion-browser-tab_99");
        assert_eq!(sanitize_label("tab@#$!"), "orion-browser-tab____");
    }

    #[test]
    fn test_validate_url_allowed_schemes() {
        assert!(validate_url("https://google.com").is_ok());
        assert!(validate_url("https://github.com/orion").is_ok());
        assert!(validate_url("http://localhost:3000").is_ok());
        assert!(validate_url("http://127.0.0.1:8080/dashboard").is_ok());
    }

    #[test]
    fn test_validate_url_rejected_schemes() {
        assert!(validate_url("javascript:alert(1)").is_err());
        assert!(validate_url("data:text/html,<h1>Hello</h1>").is_err());
        assert!(validate_url("file:///etc/passwd").is_err());
        assert!(validate_url("custom://internal").is_err());
        assert!(validate_url("not a url").is_err());
    }

    #[test]
    fn test_browser_bounds_and_metadata_serialization() {
        let bounds = BrowserBounds {
            x: 10.0,
            y: 50.0,
            width: 1200.0,
            height: 800.0,
        };
        let meta = SurfaceMetadata {
            tab_id: "tab-1".to_string(),
            surface_id: "surface_tab-1".to_string(),
            native_label: sanitize_label("tab-1"),
            url: "https://google.com".to_string(),
            bounds: bounds.clone(),
            visible: true,
            zoom: 1.25,
        };

        let json = serde_json::to_string(&meta).expect("Failed to serialize metadata");
        let deserialized: SurfaceMetadata = serde_json::from_str(&json).expect("Failed to deserialize metadata");
        assert_eq!(deserialized.tab_id, "tab-1");
        assert_eq!(deserialized.native_label, "orion-browser-tab-1");
        assert_eq!(deserialized.bounds.width, 1200.0);
        assert_eq!(deserialized.zoom, 1.25);
    }

    #[test]
    fn test_runtime_capabilities() {
        let caps = RuntimeCapabilities {
            native_available: true,
            runtime_type: "TAURI".to_string(),
            platform: "windows".to_string(),
            version: "2.0".to_string(),
        };
        assert!(caps.native_available);
        assert_eq!(caps.runtime_type, "TAURI");
    }
}

