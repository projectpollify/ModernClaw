import { create } from 'zustand';
import type { Message } from '@/types';
import { generateTitleFromMessage } from '@/lib/generateTitle';
import { contextApi } from '@/services/context';
import { historyApi } from '@/services/history';
import { ollamaApi, type ChatMessage, type ChatResponse } from '@/services/ollama';
import { useConversationStore } from '@/stores/conversationStore';
import { useSettingsStore } from '@/stores/settingsStore';

interface ChatState {
  messages: Message[];
  messagesByConversation: Record<string, Message[]>;
  isLoading: boolean;
  isStreaming: boolean;
  currentModel: string | null;
  currentConversationId: string | null;
  streamingContent: string;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  setModel: (model: string) => void;
  newConversation: (conversationId: string) => void;
  loadConversation: (id: string, messages?: Message[]) => void;
  deleteConversationMessages: (id: string) => void;
  clearError: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  messagesByConversation: {},
  isLoading: false,
  isStreaming: false,
  currentModel: 'nchapman/dolphin3.0-qwen2.5:3b',
  currentConversationId: null,
  streamingContent: '',
  error: null,

  sendMessage: async (content: string) => {
    const { currentModel, messages, currentConversationId } = get();
    const appSettings = useSettingsStore.getState().settings;

    if (!currentModel) {
      set({ error: 'No model selected' });
      return;
    }

    const conversationStore = useConversationStore.getState();
    let conversationId = currentConversationId ?? conversationStore.currentId;

    if (!conversationId) {
      conversationId = await conversationStore.createConversation(currentModel);
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date(),
      conversationId,
    };

    const nextMessages = [...messages, userMessage];

    const syncConversationState = async (items: Message[]) => {
      const currentConversation = useConversationStore
        .getState()
        .conversations.find((conversation) => conversation.id === conversationId);
      const firstUserMessage = items.find((message) => message.role === 'user');

      await useConversationStore.getState().updateConversation(conversationId, {
        model: currentModel,
        messageCount: items.length,
        title:
          currentConversation?.title === 'New Chat' && firstUserMessage
            ? generateTitleFromMessage(firstUserMessage.content)
            : currentConversation?.title ?? 'New Chat',
        preview: firstUserMessage?.content.slice(0, 100),
      });
    };

    set((state) => ({
      messages: nextMessages,
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: nextMessages,
      },
      isLoading: true,
      isStreaming: false,
      currentConversationId: conversationId,
      streamingContent: '',
      error: null,
    }));

    const assistantMessageId = crypto.randomUUID();
    let finalizedAssistantMessage: Message | null = null;
    let fullContent = '';
    let didCompleteStream = false;

    const isConversationVisible = () => get().currentConversationId === conversationId;

    const finalizeAssistantMessage = (errorMessage: string | null = null) => {
      if (!fullContent.trim()) {
        if (isConversationVisible()) {
          set({
            isLoading: false,
            isStreaming: false,
            streamingContent: '',
            error: errorMessage ?? 'No response received from Ollama.',
          });
        }
        return;
      }

      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: fullContent,
        createdAt: new Date(),
        conversationId,
      };

      finalizedAssistantMessage = assistantMessage;

      set((state) => {
        const existingConversationMessages = state.messagesByConversation[conversationId] ?? nextMessages;
        const updatedConversationMessages = [...existingConversationMessages, assistantMessage];
        const nextState: Partial<ChatState> = {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: updatedConversationMessages,
          },
        };

        if (state.currentConversationId === conversationId) {
          nextState.messages = updatedConversationMessages;
          nextState.isLoading = false;
          nextState.isStreaming = false;
          nextState.streamingContent = '';
          nextState.error = errorMessage;
        }

        return nextState as ChatState;
      });
    };

    try {
      if (appSettings.saveConversationHistory) {
        await historyApi.createMessage(userMessage);
      }
      await syncConversationState(nextMessages);

      const conversationHistory: ChatMessage[] = messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));
      const { messages: contextMessages } = await contextApi.buildContext(
        conversationHistory,
        userMessage.content,
        appSettings.contextWindowSize
      );

      await ollamaApi.sendMessage(
        currentModel,
        contextMessages,
        conversationId,
        (chunk: ChatResponse) => {
          if (chunk.message?.content) {
            fullContent += chunk.message.content;
            if (appSettings.streamResponses && isConversationVisible()) {
              set({
                streamingContent: fullContent,
                isStreaming: true,
              });
            }
          }

          if (chunk.done) {
            didCompleteStream = true;
            finalizeAssistantMessage();
          }
        }
      );

      if (!didCompleteStream) {
        finalizeAssistantMessage('Response stream ended unexpectedly.');
      }

      if (finalizedAssistantMessage) {
        if (appSettings.saveConversationHistory) {
          await historyApi.createMessage(finalizedAssistantMessage);
        }
        await syncConversationState(get().messagesByConversation[conversationId] ?? []);
      }
    } catch (error) {
      if (fullContent.trim()) {
        finalizeAssistantMessage(`Response interrupted. Partial answer was saved. (${String(error)})`);

        if (finalizedAssistantMessage && appSettings.saveConversationHistory) {
          await historyApi.createMessage(finalizedAssistantMessage);
        }

        await syncConversationState(get().messagesByConversation[conversationId] ?? []);
        return;
      }

      if (isConversationVisible()) {
        set({
          isLoading: false,
          isStreaming: false,
          streamingContent: '',
          error: String(error),
        });
      }
    }
  },

  setModel: (model: string) => {
    set({ currentModel: model });
  },

  newConversation: (conversationId: string) => {
    set({
      messages: [],
      currentConversationId: conversationId,
      streamingContent: '',
      error: null,
      isLoading: false,
      isStreaming: false,
    });
  },

  loadConversation: (id: string, messages = get().messagesByConversation[id] ?? []) => {
    set({
      currentConversationId: id,
      messages,
      messagesByConversation: {
        ...get().messagesByConversation,
        [id]: messages,
      },
      streamingContent: '',
      error: null,
      isLoading: false,
      isStreaming: false,
    });
  },

  deleteConversationMessages: (id: string) =>
    set((state) => {
      const nextMessagesByConversation = { ...state.messagesByConversation };
      delete nextMessagesByConversation[id];

      return {
        messagesByConversation: nextMessagesByConversation,
        ...(state.currentConversationId === id
          ? {
              currentConversationId: null,
              messages: [],
              streamingContent: '',
              isLoading: false,
              isStreaming: false,
            }
          : {}),
      };
    }),

  clearError: () => set({ error: null }),

  clearMessages: () =>
    set({
      messages: [],
      messagesByConversation: {},
      currentConversationId: null,
      streamingContent: '',
      error: null,
      isLoading: false,
      isStreaming: false,
    }),
}));
