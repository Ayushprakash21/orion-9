//! Orion-9 Tauri Desktop Application Library
pub mod browser;

use browser::BrowserState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(BrowserState::default())
        .invoke_handler(tauri::generate_handler![
            browser::browser_create_surface,
            browser::browser_navigate,
            browser::browser_set_bounds,
            browser::browser_show_surface,
            browser::browser_hide_surface,
            browser::browser_close_surface,
            browser::browser_go_back,
            browser::browser_go_forward,
            browser::browser_reload,
            browser::browser_stop,
            browser::browser_set_zoom,
            browser::browser_find_in_page,
            browser::browser_stop_find,
            browser::browser_runtime_capabilities,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Orion-9 desktop application");
}
