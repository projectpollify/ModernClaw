import { create } from 'zustand';
import type { Conversation } from '@/types';
import { historyApi } from '@/services/history';
import { useChatStore } from '@/stores/chatStore';
import { useSettingsStore } from '@/stores/settingsStore';

interface ConversationState {
  conversations: Conversation[];
  currentId: string | null;
  loadConversations: () => Promise<void>;
  createConversation: (model: string) => Promise<string>;
  selectConversation: (id: string | null) => Promise<void>;
  restoreLatestConversation: () => Promise<void>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  getCurrentConversation: () => Conversation | undefined;
  getRecentConversations: (limit?: number) => Conversation[];
  clearConversations: () => void;
}

export const useConversationStore = create<ConversationState>()((set, get) => ({
  conversations: [],
  currentId: null,

  loadConversations: async () => {
    if (!useSettingsStore.getState().settings.saveConversationHistory) {
      set({ conversations: [], currentId: null });
      return;
    }

    const conversations = await historyApi.listConversations();
    set({ conversations });
  },

  createConversation: async (model: string) => {
    const id = crypto.randomUUID();
    const now = new Date();

    const conversation: Conversation = {
      id,
      title: 'New Chat',
      createdAt: now,
      updatedAt: now,
      model,
      messageCount: 0,
    };

    if (useSettingsStore.getState().settings.saveConversationHistory) {
      await historyApi.createConversation(conversation);
    }

    set((state) => ({
      conversations: [conversation, ...state.conversations],
      currentId: id,
    }));

    return id;
  },

  selectConversation: async (id) => {
    if (!id) {
      set({ currentId: null });
      useChatStore.getState().clearMessages();
      return;
    }

    const shouldPersistHistory = useSettingsStore.getState().settings.saveConversationHistory;
    const messages = shouldPersistHistory
      ? await historyApi.getMessages(id)
      : useChatStore.getState().messagesByConversation[id] ?? [];

    set({ currentId: id });
    useChatStore.getState().loadConversation(id, messages);
  },

  restoreLatestConversation: async () => {
    const latestConversation = get().getRecentConversations(1)[0];

    if (!latestConversation) {
      await get().selectConversation(null);
      return;
    }

    await get().selectConversation(latestConversation.id);
  },

  updateConversation: async (id, updates) => {
    const updatedConversation = get().conversations.find((conversation) => conversation.id === id);

    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation.id === id
          ? { ...conversation, ...updates, updatedAt: new Date() }
          : conversation
      ),
    }));

    if (!updatedConversation) {
      return;
    }

    if (useSettingsStore.getState().settings.saveConversationHistory) {
      await historyApi.updateConversation(id, {
        title: updates.title,
        preview: updates.preview,
        messageCount: updates.messageCount,
      });
    }
  },

  deleteConversation: async (id) => {
    if (useSettingsStore.getState().settings.saveConversationHistory) {
      await historyApi.deleteConversation(id);
    }

    const wasCurrent = get().currentId === id;

    set((state) => ({
      conversations: state.conversations.filter((conversation) => conversation.id !== id),
      currentId: state.currentId === id ? null : state.currentId,
    }));

    useChatStore.getState().deleteConversationMessages(id);

    if (wasCurrent) {
      useChatStore.getState().clearMessages();
    }
  },

  renameConversation: async (id, title) => {
    await get().updateConversation(id, { title });
  },

  getCurrentConversation: () => {
    const { conversations, currentId } = get();
    return conversations.find((conversation) => conversation.id === currentId);
  },

  getRecentConversations: (limit = 50) => {
    return [...get().conversations]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  },

  clearConversations: () => {
    set({ conversations: [], currentId: null });
    useChatStore.getState().clearMessages();
  },
}));
