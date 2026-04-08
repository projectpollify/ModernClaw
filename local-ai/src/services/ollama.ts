import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface Model {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format?: string;
    family?: string;
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  model: string;
  created_at: string;
  message: ChatMessage;
  done: boolean;
  total_duration?: number;
  eval_count?: number;
}

export interface OllamaStatus {
  running: boolean;
  version?: string;
  error?: string;
}

export const ollamaApi = {
  async checkStatus(): Promise<OllamaStatus> {
    return invoke('check_ollama_status');
  },

  async listModels(): Promise<Model[]> {
    return invoke('list_models');
  },

  async sendMessage(
    model: string,
    messages: ChatMessage[],
    conversationId: string,
    onChunk: (chunk: ChatResponse) => void
  ): Promise<void> {
    const unlisten = await listen<ChatResponse>(`chat-chunk-${conversationId}`, (event) => {
      onChunk(event.payload);
    });

    try {
      await invoke('chat_send', { model, messages, conversationId });
    } finally {
      unlisten();
    }
  },

  async pullModel(name: string): Promise<void> {
    return invoke('pull_model', { name });
  },

  async deleteModel(name: string): Promise<void> {
    return invoke('delete_model', { name });
  },
};
