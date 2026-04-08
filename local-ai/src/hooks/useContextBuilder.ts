import { contextApi } from '@/services/context';
import type { ChatMessage } from '@/services/ollama';

export function useContextBuilder() {
  const buildContext = async (
    conversationHistory: ChatMessage[],
    userMessage: string,
    maxTokens?: number
  ) => contextApi.buildContext(conversationHistory, userMessage, maxTokens);

  return { buildContext };
}
