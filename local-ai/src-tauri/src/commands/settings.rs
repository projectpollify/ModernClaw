use std::collections::HashMap;

use tauri::State;

use crate::DatabaseState;

#[tauri::command]
pub async fn settings_get_all(
    state: State<'_, DatabaseState>,
) -> Result<HashMap<String, String>, String> {
    let rows = state.db.list_settings()?;
    Ok(rows.into_iter().collect())
}

#[tauri::command]
pub async fn setting_set(
    state: State<'_, DatabaseState>,
    key: String,
    value: String,
) -> Result<(), String> {
    state.db.set_setting(&key, &value)
}

#[tauri::command]
pub async fn setting_get(
    state: State<'_, DatabaseState>,
    key: String,
) -> Result<Option<String>, String> {
    state.db.get_setting(&key)
}

#[tauri::command]
pub async fn settings_reset(state: State<'_, DatabaseState>) -> Result<(), String> {
    state.db.clear_settings()
}
