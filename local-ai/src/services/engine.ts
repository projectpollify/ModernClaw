import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface Model {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  path?: string | null;
  source: string;
  served: boolean;
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
  images?: string[];
}

export interface ChatResponse {
  model: string;
  created_at: string;
  message: ChatMessage;
  done: boolean;
  total_duration?: number;
  eval_count?: number;
  prompt_eval_count?: number;
  finish_reason?: string;
}

export interface DirectEngineStatus {
  running: boolean;
  baseUrl: string;
  executablePath?: string | null;
  executableFound: boolean;
  modelPath?: string | null;
  modelFound: boolean;
  error?: string | null;
}

export const engineApi = {
  async checkStatus(): Promise<DirectEngineStatus> {
    return invoke('check_direct_engine_status');
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
};
