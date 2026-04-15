use crate::types::{ChatMessage, ContextStats, MemoryContext};

const MIN_SYSTEM_PROMPT_BUDGET: usize = 256;
const MAX_SYSTEM_PROMPT_BUDGET: usize = 640;
const SOUL_SECTION_BUDGET: usize = 220;
const USER_SECTION_BUDGET: usize = 140;
const MEMORY_SECTION_BUDGET: usize = 160;
const TODAY_SECTION_BUDGET: usize = 100;

fn estimate_tokens(text: &str) -> usize {
    text.chars().count() / 4
}

fn push_section(parts: &mut Vec<String>, heading: Option<&str>, content: &str) {
    let trimmed = content.trim();
    if trimmed.is_empty() {
        return;
    }

    match heading {
        Some(title) => parts.push(format!("## {}\n\n{}", title, trimmed)),
        None => parts.push(trimmed.to_string()),
    }
}

fn truncate_to_token_budget(content: &str, token_budget: usize) -> String {
    let trimmed = content.trim();
    if trimmed.is_empty() || token_budget == 0 {
        return String::new();
    }

    let char_budget = token_budget.saturating_mul(4);
    let total_chars = trimmed.chars().count();
    if total_chars <= char_budget {
        return trimmed.to_string();
    }

    let mut truncated: String = trimmed.chars().take(char_budget.saturating_sub(24)).collect();
    truncated.push_str("\n\n[truncated for token efficiency]");
    truncated
}

fn section_text(heading: Option<&str>, content: &str, token_budget: usize) -> Option<String> {
    let compact = truncate_to_token_budget(content, token_budget);
    if compact.is_empty() {
        return None;
    }

    let mut parts = Vec::new();
    push_section(&mut parts, heading, &compact);
    parts.into_iter().next()
}

fn system_prompt_budget(max_context_tokens: usize) -> usize {
    (max_context_tokens / 16).clamp(MIN_SYSTEM_PROMPT_BUDGET, MAX_SYSTEM_PROMPT_BUDGET)
}

fn build_system_prompt(context: &MemoryContext, max_context_tokens: usize) -> String {
    let mut parts = Vec::new();
    let mut remaining_budget = system_prompt_budget(max_context_tokens);

    if let Some(soul) = &context.soul {
        let budget = remaining_budget.min(SOUL_SECTION_BUDGET);
        if let Some(section) = section_text(None, soul, budget) {
            remaining_budget = remaining_budget.saturating_sub(estimate_tokens(&section));
            parts.push(section);
        }
    }

    if let Some(user) = &context.user {
        let budget = remaining_budget.min(USER_SECTION_BUDGET);
        if let Some(section) = section_text(Some("About the User"), user, budget) {
            remaining_budget = remaining_budget.saturating_sub(estimate_tokens(&section));
            parts.push(section);
        }
    }

    if let Some(memory) = &context.memory {
        let budget = remaining_budget.min(MEMORY_SECTION_BUDGET);
        if let Some(section) = section_text(Some("Long-Term Memory"), memory, budget) {
            remaining_budget = remaining_budget.saturating_sub(estimate_tokens(&section));
            parts.push(section);
        }
    }

    if let Some(today_log) = &context.today_log {
        let budget = remaining_budget.min(TODAY_SECTION_BUDGET);
        if let Some(section) = section_text(Some("Today's Context"), today_log, budget) {
            parts.push(section);
        }
    }

    // Knowledge files can be large and are not yet retrieved selectively, so we
    // keep them out of the default system prompt to avoid burning context on
    // every turn before the user asks for anything specific.
    let _ = &context.knowledge_files;

    parts.join("\n\n---\n\n")
}

pub struct ContextBuilder {
    max_context_tokens: usize,
    reserved_for_response: usize,
}

impl ContextBuilder {
    pub fn new(max_context_tokens: usize) -> Self {
        let max_context_tokens = max_context_tokens.max(512);

        Self {
            max_context_tokens,
            reserved_for_response: max_context_tokens / 4,
        }
    }

    pub fn build(
        &self,
        memory_context: &MemoryContext,
        conversation_history: &[ChatMessage],
        user_message: &ChatMessage,
    ) -> Vec<ChatMessage> {
        self.build_with_stats(memory_context, conversation_history, user_message)
            .0
    }

    pub fn build_with_stats(
        &self,
        memory_context: &MemoryContext,
        conversation_history: &[ChatMessage],
        user_message: &ChatMessage,
    ) -> (Vec<ChatMessage>, ContextStats) {
        let mut messages = Vec::new();
        let available_tokens = self
            .max_context_tokens
            .saturating_sub(self.reserved_for_response);

        let system_prompt = build_system_prompt(memory_context, self.max_context_tokens);
        let system_tokens = estimate_tokens(&system_prompt);

        if !system_prompt.is_empty() {
            messages.push(ChatMessage {
                role: "system".to_string(),
                content: system_prompt,
                images: Vec::new(),
            });
        }

        let user_message_tokens = estimate_tokens(&user_message.content);
        let remaining_for_history = available_tokens
            .saturating_sub(system_tokens)
            .saturating_sub(user_message_tokens)
            .saturating_sub(100);

        let mut history_messages = Vec::new();
        let mut history_tokens = 0;

        for message in conversation_history.iter().rev() {
            let message_tokens = estimate_tokens(&message.content);
            if history_tokens + message_tokens > remaining_for_history {
                break;
            }

            history_tokens += message_tokens;
            history_messages.push(message.clone());
        }

        history_messages.reverse();
        let included_history_count = history_messages.len();
        messages.extend(history_messages);
        messages.push(user_message.clone());

        let total_tokens = system_tokens + history_tokens + user_message_tokens;
        let usage_percent = if self.max_context_tokens == 0 {
            0.0
        } else {
            (total_tokens as f32 / self.max_context_tokens as f32) * 100.0
        };

        let stats = ContextStats {
            system_tokens,
            history_tokens: history_tokens + user_message_tokens,
            total_tokens,
            max_tokens: self.max_context_tokens,
            messages_included: included_history_count + 1,
            messages_truncated: conversation_history.len().saturating_sub(included_history_count),
            usage_percent,
        };

        (messages, stats)
    }
}
