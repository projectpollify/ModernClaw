use std::sync::Arc;

use tauri::{AppHandle, Emitter, State};
use tokio::sync::Mutex;

use super::memory::MemoryState;
use crate::services::agent_repo::AgentRepository;
use crate::services::context::ContextBuilder;
use crate::services::direct_engine::DirectEngineService;
use crate::services::memory::MemoryService;
use crate::types::{BuildContextResponse, ChatMessage, DirectEngineSettings, DirectEngineStatus, Model};
use crate::DatabaseState;

pub struct AppState {
    pub direct_engine: Arc<Mutex<DirectEngineService>>,
}

const DEFAULT_CONTEXT_WINDOW_SIZE: usize = 32_768;

fn decode_setting_string(value: Option<String>) -> Option<String> {
    value.and_then(|raw| serde_json::from_str::<String>(&raw).ok().or(Some(raw)))
}

fn decode_setting_usize(value: Option<String>) -> Option<usize> {
    value.and_then(|raw| serde_json::from_str::<usize>(&raw).ok().or_else(|| raw.parse::<usize>().ok()))
}

fn load_direct_engine_settings(db_state: &DatabaseState) -> Result<DirectEngineSettings, String> {
    let executable_path = decode_setting_string(db_state.db.get_setting("directEngineExecutablePath")?);
    let model_path = decode_setting_string(db_state.db.get_setting("directEngineModelPath")?);
    let default_model = decode_setting_string(db_state.db.get_setting("defaultModel")?);
    let context_window_size = decode_setting_usize(db_state.db.get_setting("contextWindowSize")?);

    Ok(DirectEngineSettings {
        executable_path,
        model_path,
        default_model,
        context_window_size,
    })
}

#[tauri::command]
pub async fn check_direct_engine_status(
    state: State<'_, AppState>,
    db_state: State<'_, DatabaseState>,
) -> Result<DirectEngineStatus, String> {
    let direct_engine = state.direct_engine.lock().await;
    let settings = load_direct_engine_settings(&db_state)?;
    Ok(direct_engine.check_status(Some(&settings)).await)
}

#[tauri::command]
pub async fn list_models(
    state: State<'_, AppState>,
    db_state: State<'_, DatabaseState>,
) -> Result<Vec<Model>, String> {
    let direct_engine = state.direct_engine.lock().await;
    let settings = load_direct_engine_settings(&db_state)?;
    direct_engine.list_models(Some(&settings)).await
}

#[tauri::command]
#[allow(non_snake_case)]
pub async fn build_context(
    db_state: State<'_, DatabaseState>,
    memory_state: State<'_, MemoryState>,
    maxTokens: Option<usize>,
    conversationHistory: Vec<ChatMessage>,
    userMessage: ChatMessage,
) -> Result<BuildContextResponse, String> {
    let settings = load_direct_engine_settings(&db_state)?;
    let agent_repo = AgentRepository::new(&db_state.db);
    let workspace_path = agent_repo.resolve_active_workspace_path(&memory_state.root_path)?;
    let memory_service = MemoryService::new(&workspace_path);
    let memory_context = memory_service.load_context()?;

    let context_builder = ContextBuilder::new(
        maxTokens
            .or(settings.context_window_size)
            .unwrap_or(DEFAULT_CONTEXT_WINDOW_SIZE),
    );
    let (messages, stats) =
        context_builder.build_with_stats(&memory_context, &conversationHistory, &userMessage);

    Ok(BuildContextResponse { messages, stats })
}

#[tauri::command]
#[allow(non_snake_case)]
pub async fn chat_send(
    app: AppHandle,
    state: State<'_, AppState>,
    model: String,
    messages: Vec<ChatMessage>,
    conversationId: String,
) -> Result<(), String> {
    let direct_engine = state.direct_engine.lock().await;
    let response = direct_engine.chat(&model, messages).await?;
    let _ = app.emit(&format!("chat-chunk-{}", conversationId), &response);
    Ok(())
}
