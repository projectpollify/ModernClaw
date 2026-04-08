import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_FLOOR_MODEL } from '@/lib/voiceCatalog';
import { ollamaApi, type Model, type OllamaStatus } from '@/services/ollama';

interface ModelState {
  models: Model[];
  currentModel: string | null;
  ollamaStatus: OllamaStatus | null;
  isLoading: boolean;
  downloadingModel: string | null;
  error: string | null;
  checkStatus: () => Promise<void>;
  loadModels: () => Promise<void>;
  setCurrentModel: (name: string | null) => void;
  downloadModel: (name: string) => Promise<void>;
  deleteModel: (name: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      models: [],
      currentModel: DEFAULT_FLOOR_MODEL,
      ollamaStatus: null,
      isLoading: false,
      downloadingModel: null,
      error: null,

      checkStatus: async () => {
        try {
          const status = await ollamaApi.checkStatus();
          set({ ollamaStatus: status, error: null });

          if (status.running) {
            await get().loadModels();
          }
        } catch (error) {
          set({ error: String(error), ollamaStatus: { running: false, error: String(error) } });
        }
      },

      loadModels: async () => {
        set({ isLoading: true });

        try {
          const models = await ollamaApi.listModels();
          const currentModel = get().currentModel;
          const modelNames = new Set(models.map((model) => model.name));
          const nextCurrentModel = modelNames.has(DEFAULT_FLOOR_MODEL)
            ? DEFAULT_FLOOR_MODEL
            : currentModel && modelNames.has(currentModel)
              ? currentModel
              : models[0]?.name ?? null;

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

      downloadModel: async (name) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
          return;
        }

        set({ downloadingModel: trimmedName, error: null });

        try {
          await ollamaApi.pullModel(trimmedName);
          await get().loadModels();
          set((state) => ({
            currentModel: state.currentModel ?? trimmedName,
          }));
        } catch (error) {
          set({ error: String(error) });
        } finally {
          set({ downloadingModel: null });
        }
      },

      deleteModel: async (name) => {
        try {
          await ollamaApi.deleteModel(name);
          await get().loadModels();

          if (get().currentModel === name) {
            const remaining = get().models.filter((model) => model.name !== name);
            set({ currentModel: remaining[0]?.name ?? null });
          }
        } catch (error) {
          set({ error: String(error) });
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
