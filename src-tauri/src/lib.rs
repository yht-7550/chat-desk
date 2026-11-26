//! ChatDesk 外壳的 Rust 侧。
//!
//! 这里刻意保持得很薄：窗口、菜单、托盘等能力都交给前端通过
//! `@tauri-apps/api` 调用，Rust 只负责装配插件和暴露少量前端够不到的指令。

/// 切换开发者工具。
///
/// 该能力只在 debug 构建里存在（tauri 的 `devtools` 能力默认随 debug 开启），
/// release 下调用会返回错误，前端也只在开发模式展示入口。
#[tauri::command]
fn toggle_devtools(webview: tauri::Webview) -> Result<(), String> {
    #[cfg(debug_assertions)]
    {
        if webview.is_devtools_open() {
            webview.close_devtools();
        } else {
            webview.open_devtools();
        }
        Ok(())
    }
    #[cfg(not(debug_assertions))]
    {
        let _ = webview;
        Err("开发者工具仅在开发构建中可用".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![toggle_devtools])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
