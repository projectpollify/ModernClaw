use std::sync::Arc;

use tauri::{AppHandle, Emitter, State};
use tokio::sync::Mutex;

use super::memory::MemoryState;
use crate::services::agent_repo::AgentRepository;
use crate::services::context::ContextBuilder;
use crate::services::memory::MemoryService;
use crate::services::ollama::OllamaService;
use crate::types::{BuildContextResponse, ChatMessage, ChatResponse, Model, OllamaStatus};
use crate::DatabaseState;

pub struct AppState {
    pub ollama: Arc<Mutex<OllamaService>>,
}

#[tauri::command]
pub async fn check_ollama_status(state: State<'_, AppState>) -> Result<OllamaStatus, String> {
    let ollama = state.ollama.lock().await;
    Ok(ollama.check_status().await)
}

#[tauri::command]
pub async fn list_models(state: State<'_, AppState>) -> Result<Vec<Model>, String> {
    let ollama = state.ollama.lock().await;
    ollama.list_models().await
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
    let agent_repo = AgentRepository::new(&db_state.db);
    let workspace_path = agent_repo.resolve_active_workspace_path(&memory_state.root_path)?;
    let memory_service = MemoryService::new(&workspace_path);
    let memory_context = memory_service.load_context()?;

    let context_builder = ContextBuilder::new(maxTokens.unwrap_or(4096));
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
    let ollama = state.ollama.lock().await;

    ollama
        .chat_stream(&model, messages, None, |chunk: ChatResponse| {
            let _ = app.emit(&format!("chat-chunk-{}", conversationId), &chunk);
        })
        .await
}

#[tauri::command]
pub async fn pull_model(state: State<'_, AppState>, name: String) -> Result<(), String> {
    let ollama = state.ollama.lock().await;
    ollama.pull_model(&name).await
}

#[tauri::command]
pub async fn delete_model(state: State<'_, AppState>, name: String) -> Result<(), String> {
    let ollama = state.ollama.lock().await;
    ollama.delete_model(&name).await
}
