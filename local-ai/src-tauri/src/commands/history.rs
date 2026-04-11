use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::services::agent_repo::AgentRepository;
use crate::services::{conversation_repo::ConversationRepository, message_repo::MessageRepository};
use crate::types::{Conversation, Message, MessageAttachment, MessageFeedbackSummary};
use crate::DatabaseState;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageDto {
    pub id: String,
    pub conversation_id: String,
    pub role: String,
    pub content: String,
    #[serde(default)]
    pub attachments: Vec<MessageAttachment>,
    pub tokens_used: Option<i32>,
    pub feedback: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl From<MessageDto> for Message {
    fn from(value: MessageDto) -> Self {
        Self {
            id: value.id,
            conversation_id: value.conversation_id,
            role: value.role,
            content: value.content,
            attachments: value.attachments,
            tokens_used: value.tokens_used,
            feedback: value.feedback,
            created_at: value.created_at,
        }
    }
}

impl From<Message> for MessageDto {
    fn from(value: Message) -> Self {
        Self {
            id: value.id,
            conversation_id: value.conversation_id,
            role: value.role,
            content: value.content,
            attachments: value.attachments,
            tokens_used: value.tokens_used,
            feedback: value.feedback,
            created_at: value.created_at,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConversationDto {
    pub id: String,
    #[serde(default)]
    pub agent_id: Option<String>,
    pub title: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub model: String,
    pub message_count: i32,
    pub preview: Option<String>,
}

impl From<Conversation> for ConversationDto {
    fn from(value: Conversation) -> Self {
        Self {
            id: value.id,
            agent_id: Some(value.agent_id),
            title: value.title,
            created_at: value.created_at,
            updated_at: value.updated_at,
            model: value.model,
            message_count: value.message_count,
            preview: value.preview,
        }
    }
}

#[tauri::command]
pub async fn conversation_create(
    state: State<'_, DatabaseState>,
    conversation: ConversationDto,
) -> Result<(), String> {
    let agent_repo = AgentRepository::new(&state.db);
    let active_agent_id = agent_repo.get_active_agent_id()?;
    let repo = ConversationRepository::new(&state.db);

    repo.create(&Conversation {
        id: conversation.id,
        agent_id: conversation.agent_id.unwrap_or(active_agent_id),
        title: conversation.title,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        model: conversation.model,
        message_count: conversation.message_count,
        preview: conversation.preview,
    })
}

#[tauri::command]
pub async fn conversation_list(
    state: State<'_, DatabaseState>,
    limit: Option<i32>,
) -> Result<Vec<ConversationDto>, String> {
    let agent_repo = AgentRepository::new(&state.db);
    let active_agent_id = agent_repo.get_active_agent_id()?;
    let repo = ConversationRepository::new(&state.db);
    Ok(repo
        .list_for_agent(&active_agent_id, limit)?
        .into_iter()
        .map(Into::into)
        .collect())
}

#[tauri::command]
pub async fn conversation_get(
    state: State<'_, DatabaseState>,
    id: String,
) -> Result<Option<ConversationDto>, String> {
    let repo = ConversationRepository::new(&state.db);
    Ok(repo.get(&id)?.map(Into::into))
}

#[tauri::command]
#[allow(non_snake_case)]
pub async fn conversation_update(
    state: State<'_, DatabaseState>,
    id: String,
    title: Option<String>,
    preview: Option<String>,
    messageCount: Option<i32>,
) -> Result<(), String> {
    let repo = ConversationRepository::new(&state.db);
    repo.update(&id, title.as_deref(), preview.as_deref(), messageCount)
}

#[tauri::command]
pub async fn conversation_delete(
    state: State<'_, DatabaseState>,
    id: String,
) -> Result<(), String> {
    let repo = ConversationRepository::new(&state.db);
    repo.delete(&id)
}

#[tauri::command]
pub async fn conversation_search(
    state: State<'_, DatabaseState>,
    query: String,
    limit: Option<i32>,
) -> Result<Vec<ConversationDto>, String> {
    let agent_repo = AgentRepository::new(&state.db);
    let active_agent_id = agent_repo.get_active_agent_id()?;
    let repo = ConversationRepository::new(&state.db);
    Ok(repo
        .search_for_agent(&active_agent_id, &query, limit)?
        .into_iter()
        .map(Into::into)
        .collect())
}

#[tauri::command]
pub async fn message_create(
    state: State<'_, DatabaseState>,
    message: MessageDto,
) -> Result<(), String> {
    let repo = MessageRepository::new(&state.db);
    repo.create(&message.into())
}

#[tauri::command]
#[allow(non_snake_case)]
pub async fn messages_get(
    state: State<'_, DatabaseState>,
    conversationId: String,
) -> Result<Vec<MessageDto>, String> {
    let repo = MessageRepository::new(&state.db);
    Ok(repo
        .get_for_conversation(&conversationId)?
        .into_iter()
        .map(Into::into)
        .collect())
}

#[tauri::command]
#[allow(non_snake_case)]
pub async fn message_set_feedback(
    state: State<'_, DatabaseState>,
    messageId: String,
    feedback: Option<String>,
) -> Result<(), String> {
    if let Some(value) = feedback.as_deref() {
        if value != "up" && value != "down" {
            return Err("Unsupported feedback value".into());
        }
    }

    let repo = MessageRepository::new(&state.db);
    repo.update_feedback(&messageId, feedback.as_deref())
}

#[tauri::command]
pub async fn message_feedback_summary(
    state: State<'_, DatabaseState>,
) -> Result<MessageFeedbackSummary, String> {
    let agent_repo = AgentRepository::new(&state.db);
    let active_agent_id = agent_repo.get_active_agent_id()?;
    let repo = MessageRepository::new(&state.db);
    repo.feedback_summary_for_agent(&active_agent_id)
}
