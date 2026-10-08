//! Orion-9 Native Browser WebView Surface Controller
//! Manages real OS-native child WebView surfaces via Tauri 2 multi-webview architecture,
//! geometry bounds synchronization, tab switching, and native navigation events.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::webview::{PageLoadEvent, WebviewBuilder};
use tauri::{AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Webview, WebviewUrl};
use url::Url;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct BrowserBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SurfaceLifecycleState {
    Creating,
    Ready,
    Visible,
    Hidden,
    Closing,
    Closed,
    Error,
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
    pub lifecycle_state: SurfaceLifecycleState,
    pub error_message: Option<String>,
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
    let parsed = Url::parse(url_str).map_err(|e| format!("NATIVE_INVALID_URL: Invalid URL: {}", e))?;
    let scheme = parsed.scheme();
    if scheme == "http" || scheme == "https" {
        Ok(parsed)
    } else {
        Err(format!(
            "NATIVE_INVALID_URL: Protocol '{}' is not permitted. Only HTTP and HTTPS are allowed.",
            scheme
        ))
    }
}

/// Validates and clamps geometry bounds to prevent negative, zero, or NaN dimensions.
pub fn clamp_bounds(bounds: &BrowserBounds) -> Result<BrowserBounds, String> {
    if bounds.width.is_nan() || bounds.height.is_nan() || bounds.x.is_nan() || bounds.y.is_nan() {
        return Err("NATIVE_BOUNDS_INVALID: Bounds contain NaN values".to_string());
    }
    if bounds.width <= 0.0 || bounds.height <= 0.0 {
        return Err("NATIVE_BOUNDS_INVALID: Dimensions must be greater than zero".to_string());
    }
    Ok(BrowserBounds {
        x: bounds.x.round(),
        y: bounds.y.round(),
        width: bounds.width.round().max(1.0),
        height: bounds.height.round().max(1.0),
    })
}

/// Internal helper to create a real child Webview attached to the main window.
pub fn create_child_webview(
    app: &AppHandle,
    tab_id: &str,
    target_url: &Url,
    bounds: &BrowserBounds,
    visible: bool,
) -> Result<Webview, String> {
    let native_label = sanitize_label(tab_id);

    // If already exists, return existing webview
    if let Some(existing) = app.get_webview(&native_label) {
        return Ok(existing);
    }

    let parent_window = app
        .get_window("main")
        .ok_or_else(|| "NATIVE_SURFACE_CREATE_FAILED: Main window 'main' not found in Tauri app".to_string())?;

    let tab_id_nav = tab_id.to_string();
    let app_nav = app.clone();
    let tab_id_load = tab_id.to_string();
    let app_load = app.clone();
    let tab_id_title = tab_id.to_string();
    let app_title = app.clone();
    let tab_id_dl = tab_id.to_string();
    let app_dl = app.clone();

    let mut builder = WebviewBuilder::new(&native_label, WebviewUrl::External(target_url.clone()))
        .auto_resize();

    // 1. Navigation permission & lifecycle
    builder = builder.on_navigation(move |nav_url| {
        let scheme = nav_url.scheme();
        if scheme != "http" && scheme != "https" {
            let _ = app_nav.emit(
                "orion://browser-event",
                serde_json::json!({
                    "type": "browser-navigation-error",
                    "detail": {
                        "tabId": tab_id_nav,
                        "url": nav_url.as_str(),
                        "error": format!("Forbidden scheme: {}", scheme)
                    }
                }),
            );
            return false;
        }

        // Canonical and legacy event emissions
        let payload = serde_json::json!({
            "tabId": tab_id_nav,
            "url": nav_url.as_str(),
            "loading": true
        });
        let _ = app_nav.emit("orion://browser-event", serde_json::json!({
            "type": "browser-navigation-committed",
            "detail": payload
        }));
        let _ = app_nav.emit("orion://browser-event", serde_json::json!({
            "type": "navigation-committed",
            "detail": payload
        }));
        true
    });

    // 2. Real page-load events (Started and Finished)
    builder = builder.on_page_load(move |_webview, payload| {
        let (canonical_type, legacy_type, loading) = match payload.event() {
            PageLoadEvent::Started => ("browser-navigation-started", "navigation-started", true),
            PageLoadEvent::Finished => ("browser-page-loaded", "navigation-finished", false),
        };
        let detail = serde_json::json!({
            "tabId": tab_id_load,
            "url": payload.url().as_str(),
            "loading": loading
        });
        let _ = app_load.emit(
            "orion://browser-event",
            serde_json::json!({ "type": canonical_type, "detail": detail }),
        );
        let _ = app_load.emit(
            "orion://browser-event",
            serde_json::json!({ "type": legacy_type, "detail": detail }),
        );
    });

    // 3. Document title synchronization
    builder = builder.on_document_title_changed(move |_webview, title| {
        let detail = serde_json::json!({
            "tabId": tab_id_title,
            "title": title
        });
        let _ = app_title.emit(
            "orion://browser-event",
            serde_json::json!({ "type": "browser-title-changed", "detail": detail }),
        );
        let _ = app_title.emit(
            "orion://browser-event",
            serde_json::json!({ "type": "title-changed", "detail": detail }),
        );
    });

    // 4. Safe downloads handler
    builder = builder.on_download(move |_webview, _event| {
        let _ = app_dl.emit(
            "orion://browser-event",
            serde_json::json!({
                "type": "browser-download-requested",
                "detail": {
                    "tabId": tab_id_dl,
                }
            }),
        );
        true
    });

    // Attach as real native child webview to parent window client area
    let webview = parent_window
        .add_child(
            builder,
            LogicalPosition::new(bounds.x, bounds.y),
            LogicalSize::new(bounds.width, bounds.height),
        )
        .map_err(|e| format!("NATIVE_SURFACE_CREATE_FAILED: Failed to create child webview: {}", e))?;

    // Surface starts initially hidden unless visible was explicitly requested
    if !visible {
        let _ = webview.hide();
    }

    Ok(webview)
}

/// Idempotent native surface creator.
/// Returns existing surface if already created, or instantiates new child webview.
#[tauri::command]
pub async fn browser_ensure_surface(
    app: AppHandle,
    tab_id: String,
    surface_id: String,
    initial_url: String,
    bounds: BrowserBounds,
) -> Result<String, String> {
    let native_label = sanitize_label(&tab_id);
    let clamped_bounds = clamp_bounds(&bounds)?;

    // Check if webview already exists
    if let Some(_existing) = app.get_webview(&native_label) {
        let state = app.state::<BrowserState>();
        let mut surfaces = state.surfaces.lock().map_err(|e| e.to_string())?;
        if let Some(entry) = surfaces.get_mut(&tab_id) {
            entry.bounds = clamped_bounds;
        }
        return Ok(surface_id);
    }

    // Save surface record in state with CREATING status
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
                bounds: clamped_bounds.clone(),
                visible: false,
                zoom: 1.0,
                lifecycle_state: SurfaceLifecycleState::Creating,
                error_message: None,
            },
        );
    }

    // If navigating to a real HTTP/HTTPS target, create child webview
    if let Ok(parsed_url) = validate_url(&initial_url) {
        match create_child_webview(&app, &tab_id, &parsed_url, &clamped_bounds, false) {
            Ok(_) => {
                let state = app.state::<BrowserState>();
                let mut surfaces = state.surfaces.lock().map_err(|e| e.to_string())?;
                if let Some(entry) = surfaces.get_mut(&tab_id) {
                    entry.lifecycle_state = SurfaceLifecycleState::Ready;
                }
            }
            Err(e) => {
                let state = app.state::<BrowserState>();
                let mut surfaces = state.surfaces.lock().map_err(|e| e.to_string())?;
                if let Some(entry) = surfaces.get_mut(&tab_id) {
                    entry.lifecycle_state = SurfaceLifecycleState::Error;
                    entry.error_message = Some(e.clone());
                }
                return Err(e);
            }
        }
    } else {
        // Internal scheme: stays in Ready/Hidden until an external navigation occurs
        let state = app.state::<BrowserState>();
        let mut surfaces = state.surfaces.lock().map_err(|e| e.to_string())?;
        if let Some(entry) = surfaces.get_mut(&tab_id) {
            entry.lifecycle_state = SurfaceLifecycleState::Ready;
        }
    }

    let _ = app.emit(
        "orion://browser-event",
        serde_json::json!({
            "type": "browser-surface-lifecycle",
            "detail": {
                "tabId": tab_id,
                "state": "READY"
            }
        }),
    );

    Ok(surface_id)
}

#[tauri::command]
pub async fn browser_create_surface(
    app: AppHandle,
    tab_id: String,
    surface_id: String,
    initial_url: String,
    bounds: BrowserBounds,
) -> Result<String, String> {
    browser_ensure_surface(app, tab_id, surface_id, initial_url, bounds).await
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
        let clamped = clamp_bounds(&bounds)?;
        let created = create_child_webview(&app, &tab_id, &parsed_url, &clamped, true)?;
        let _ = created.show();
        let _ = created.set_focus();
        created
    };

    // Update URL and lifecycle in state metadata
    {
        let state = app.state::<BrowserState>();
        let mut surfaces = state.surfaces.lock().map_err(|e| e.to_string())?;
        if let Some(entry) = surfaces.get_mut(&tab_id) {
            entry.url = parsed_url.to_string();
            entry.lifecycle_state = SurfaceLifecycleState::Visible;
        }
    }

    webview
        .navigate(parsed_url)
        .map_err(|e| format!("NATIVE_NAVIGATION_FAILED: Native navigation failed: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn browser_set_bounds(
    app: AppHandle,
    tab_id: String,
    bounds: BrowserBounds,
) -> Result<(), String> {
    let clamped = clamp_bounds(&bounds)?;

    {
        let state = app.state::<BrowserState>();
        let mut surfaces = state.surfaces.lock().map_err(|e| e.to_string())?;
        if let Some(entry) = surfaces.get_mut(&tab_id) {
            entry.bounds = clamped.clone();
        } else {
            surfaces.insert(
                tab_id.clone(),
                SurfaceMetadata {
                    tab_id: tab_id.clone(),
                    surface_id: format!("surface_{}", tab_id),
                    native_label: sanitize_label(&tab_id),
                    url: "about:blank".to_string(),
                    bounds: clamped.clone(),
                    visible: false,
                    zoom: 1.0,
                    lifecycle_state: SurfaceLifecycleState::Ready,
                    error_message: None,
                },
            );
        }
    }

    let native_label = sanitize_label(&tab_id);
    if let Some(webview) = app.get_webview(&native_label) {
        webview
            .set_position(LogicalPosition::new(clamped.x, clamped.y))
            .map_err(|e| format!("Failed to set webview position: {}", e))?;
        webview
            .set_size(LogicalSize::new(clamped.width, clamped.height))
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

    {
        let state = app.state::<BrowserState>();
        let mut surfaces = state.surfaces.lock().map_err(|e| e.to_string())?;
        if let Some(entry) = surfaces.get_mut(&tab_id) {
            entry.visible = true;
            entry.lifecycle_state = SurfaceLifecycleState::Visible;
        }
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

    {
        let state = app.state::<BrowserState>();
        let mut surfaces = state.surfaces.lock().map_err(|e| e.to_string())?;
        if let Some(entry) = surfaces.get_mut(&tab_id) {
            entry.visible = false;
            entry.lifecycle_state = SurfaceLifecycleState::Hidden;
        }
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

    let _ = app.emit(
        "orion://browser-event",
        serde_json::json!({
            "type": "browser-surface-lifecycle",
            "detail": {
                "tabId": tab_id,
                "state": "CLOSED"
            }
        }),
    );

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
        assert_eq!(sanitize_label("tab:123/test"), "orion-browser-tab_123_test");
        assert_eq!(sanitize_label("valid_tab_9"), "orion-browser-valid_tab_9");
    }

    #[test]
    fn test_validate_url_allowed_schemes() {
        let valid_https = validate_url("https://google.com").unwrap();
        assert_eq!(valid_https.scheme(), "https");
        assert_eq!(valid_https.host_str().unwrap(), "google.com");

        let valid_http = validate_url("http://example.com/path").unwrap();
        assert_eq!(valid_http.scheme(), "http");
    }

    #[test]
    fn test_validate_url_rejected_schemes() {
        assert!(validate_url("javascript:alert(1)").is_err());
        assert!(validate_url("file:///etc/passwd").is_err());
        assert!(validate_url("data:text/html,<h1>test</h1>").is_err());
        assert!(validate_url("blob:https://example.com/xyz").is_err());
        assert!(validate_url("custom-scheme://test").is_err());
    }

    #[test]
    fn test_clamp_bounds() {
        let normal = BrowserBounds { x: 10.4, y: 20.6, width: 800.2, height: 600.8 };
        let clamped = clamp_bounds(&normal).unwrap();
        assert_eq!(clamped.x, 10.0);
        assert_eq!(clamped.y, 21.0);
        assert_eq!(clamped.width, 800.0);
        assert_eq!(clamped.height, 601.0);

        let zero_width = BrowserBounds { x: 0.0, y: 0.0, width: 0.0, height: 100.0 };
        assert!(clamp_bounds(&zero_width).is_err());

        let nan_bounds = BrowserBounds { x: 0.0, y: f64::NAN, width: 100.0, height: 100.0 };
        assert!(clamp_bounds(&nan_bounds).is_err());
    }

    #[test]
    fn test_surface_lifecycle_serialization() {
        let meta = SurfaceMetadata {
            tab_id: "tab-1".to_string(),
            surface_id: "surf-1".to_string(),
            native_label: "orion-browser-tab-1".to_string(),
            url: "https://example.com".to_string(),
            bounds: BrowserBounds { x: 0.0, y: 0.0, width: 800.0, height: 600.0 },
            visible: true,
            zoom: 1.0,
            lifecycle_state: SurfaceLifecycleState::Visible,
            error_message: None,
        };
        let json = serde_json::to_string(&meta).unwrap();
        assert!(json.contains("\"lifecycle_state\":\"VISIBLE\""));
    }
}
