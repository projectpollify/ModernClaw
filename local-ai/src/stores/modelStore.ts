import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_FLOOR_MODEL } from '@/lib/voiceCatalog';
import { resolvePreferredModelName } from '@/lib/modelSelection';
import { agentApi } from '@/services/agents';
import { engineApi, type DirectEngineStatus, type Model } from '@/services/engine';
import { setupApi } from '@/services/setup';

interface ModelState {
  models: Model[];
  currentModel: string | null;
  engineStatus: DirectEngineStatus | null;
  isLoading: boolean;
  isSwitching: boolean;
  error: string | null;
  checkStatus: () => Promise<void>;
  loadModels: () => Promise<void>;
  setCurrentModel: (name: string | null) => void;
  selectModel: (name: string | null) => Promise<boolean>;
  deleteModel: (name: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      models: [],
      currentModel: DEFAULT_FLOOR_MODEL,
      engineStatus: null,
      isLoading: false,
      isSwitching: false,
      error: null,

      checkStatus: async () => {
        try {
          const status = await engineApi.checkStatus();
          set({ engineStatus: status, error: null });

          if (status.running || status.modelFound) {
            await get().loadModels();
          }
        } catch (error) {
          set({
            error: String(error),
            engineStatus: {
              running: false,
              baseUrl: 'http://127.0.0.1:8080',
              executableFound: false,
              modelFound: false,
              error: String(error),
            },
          });
        }
      },

      loadModels: async () => {
        set({ isLoading: true });

        try {
          const models = await engineApi.listModels();
          const currentModel = get().currentModel;
          const nextCurrentModel = resolvePreferredModelName(
            currentModel ?? DEFAULT_FLOOR_MODEL,
            models.map((model) => model.name)
          );

          set({
            models,
            currentModel: nextCurrentModel,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      setCurrentModel: (name) => {
        set({ currentModel: name });
      },

      selectModel: async (name) => {
        const previousModel = get().currentModel;
        if (!name) {
          return false;
        }

        set({
          currentModel: name,
          isSwitching: true,
          error: null,
        });

        try {
          const activeAgent = await agentApi.getActiveAgent();
          await agentApi.updateDefaultModel(activeAgent.agentId, name);

          if (get().engineStatus?.running && previousModel !== name) {
            await setupApi.startDirectEngine();
          }

          await get().refresh();
          set({ isSwitching: false });
          return true;
        } catch (error) {
          set({
            currentModel: previousModel,
            isSwitching: false,
            error: String(error),
          });
          return false;
        }
      },

      deleteModel: async (name) => {
        const target = get().models.find((model) => model.name === name);
        if (!target?.path) {
          set({ error: 'Only locally discovered GGUF files can be removed from this screen.' });
          return;
        }

        try {
          await setupApi.openExternal(target.path);
          set({
            error:
              'ModernClaw opened the model location so you can remove the GGUF manually. Automatic file deletion is disabled for safety.',
          });
        } catch {
          set({
            error: `Remove the file manually at ${target.path}. Automatic deletion is disabled for safety.`,
          });
        }
      },

      refresh: async () => {
        await get().checkStatus();
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'model-storage',
      partialize: (state) => ({ currentModel: state.currentModel }),
    }
  )
);
