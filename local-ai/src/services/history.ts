import { invoke } from '@tauri-apps/api/core';
import type { Conversation, Message, MessageFeedbackSummary } from '@/types';

function toConversationDto(conversation: Conversation) {
  return {
    id: conversation.id,
    agentId: conversation.agentId,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    model: conversation.model,
    messageCount: conversation.messageCount,
    preview: conversation.preview,
  };
}

function fromConversationDto(dto: any): Conversation {
  return {
    id: dto.id,
    agentId: dto.agentId ?? undefined,
    title: dto.title,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    model: dto.model,
    messageCount: dto.messageCount,
    preview: dto.preview ?? undefined,
  };
}

function toMessageDto(message: Message) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    role: message.role,
    content: message.content,
    attachments: message.attachments ?? [],
    tokensUsed: message.tokensUsed,
    feedback: message.feedback,
    feedbackNote: message.feedbackNote,
    createdAt: message.createdAt,
  };
}

function fromMessageDto(dto: any): Message {
  return {
    id: dto.id,
    conversationId: dto.conversationId,
    role: dto.role,
    content: dto.content,
    attachments: dto.attachments ?? [],
    tokensUsed: dto.tokensUsed ?? undefined,
    feedback: dto.feedback ?? undefined,
    feedbackNote: dto.feedbackNote ?? undefined,
    createdAt: new Date(dto.createdAt),
  };
}

export const historyApi = {
  async createConversation(conversation: Conversation): Promise<void> {
    return invoke('conversation_create', {
      conversation: toConversationDto(conversation),
    });
  },

  async listConversations(limit?: number): Promise<Conversation[]> {
    const conversations = await invoke<any[]>('conversation_list', { limit });
    return conversations.map(fromConversationDto);
  },

  async getConversation(id: string): Promise<Conversation | null> {
    const conversation = await invoke<any | null>('conversation_get', { id });
    return conversation ? fromConversationDto(conversation) : null;
  },

  async updateConversation(
    id: string,
    updates: { title?: string; preview?: string; messageCount?: number }
  ): Promise<void> {
    return invoke('conversation_update', {
      id,
      title: updates.title,
      preview: updates.preview,
      messageCount: updates.messageCount,
    });
  },

  async deleteConversation(id: string): Promise<void> {
    return invoke('conversation_delete', { id });
  },

  async searchConversations(query: string, limit?: number): Promise<Conversation[]> {
    const conversations = await invoke<any[]>('conversation_search', { query, limit });
    return conversations.map(fromConversationDto);
  },

  async createMessage(message: Message): Promise<void> {
    return invoke('message_create', {
      message: toMessageDto(message),
    });
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const messages = await invoke<any[]>('messages_get', {
      conversationId,
    });
    return messages.map(fromMessageDto);
  },

  async setMessageFeedback(messageId: string, feedback?: 'up' | 'down', feedbackNote?: string): Promise<void> {
    return invoke('message_set_feedback', {
      messageId,
      feedback: feedback ?? null,
      feedbackNote: feedbackNote ?? null,
    });
  },

  async getMessageFeedbackSummary(): Promise<MessageFeedbackSummary> {
    return invoke<MessageFeedbackSummary>('message_feedback_summary');
  },
};
