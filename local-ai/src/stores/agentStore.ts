import { create } from 'zustand';
import { agentApi } from '@/services/agents';
import type { Agent, AgentVoiceSettings } from '@/types';

interface AgentState {
  activeAgent: Agent | null;
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  loadAgents: () => Promise<void>;
  updateActiveAgentDefaultModel: (defaultModel: string | null) => Promise<void>;
  updateActiveAgentVoiceSettings: (voiceSettings: AgentVoiceSettings) => Promise<void>;
  clearError: () => void;
}

export const useAgentStore = create<AgentState>()((set, get) => ({
  activeAgent: null,
  isLoading: false,
  hasLoaded: false,
  error: null,

  loadAgents: async () => {
    set({ isLoading: true, error: null });

    try {
      const activeAgent = await agentApi.getActiveAgent();

      set({
        activeAgent,
        isLoading: false,
        hasLoaded: true,
      });
    } catch (error) {
      set({
        isLoading: false,
        hasLoaded: true,
        error: String(error),
      });
    }
  },

  updateActiveAgentDefaultModel: async (defaultModel) => {
    const activeAgent = get().activeAgent;
    if (!activeAgent) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await agentApi.updateDefaultModel(activeAgent.agentId, defaultModel);
      const refreshedActiveAgent = await agentApi.getActiveAgent();

      set({
        activeAgent: refreshedActiveAgent,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: String(error),
      });
      throw error;
    }
  },

  updateActiveAgentVoiceSettings: async (voiceSettings) => {
    const activeAgent = get().activeAgent;
    if (!activeAgent) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await agentApi.updateVoiceSettings(activeAgent.agentId, voiceSettings);
      const refreshedActiveAgent = await agentApi.getActiveAgent();

      set({
        activeAgent: refreshedActiveAgent,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: String(error),
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
