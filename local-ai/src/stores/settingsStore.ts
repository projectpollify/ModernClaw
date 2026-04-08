import { create } from 'zustand';
import { getDefaultVoicePaths } from '@/lib/voicePaths';
import { memoryApi } from '@/services/memory';
import { settingsApi } from '@/services/settings';
import { DEFAULT_SETTINGS, normalizeDefaultModel, type AppSettings } from '@/types/settings';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<boolean>;
  resetSettings: () => Promise<boolean>;
  clearError: () => void;
}

function parseSettingValue(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  error: null,
  hasLoaded: false,

  loadSettings: async () => {
    set({ isLoading: true, error: null });

    try {
      await memoryApi.initialize();
      const [stored, memoryPath] = await Promise.all([settingsApi.getAll(), memoryApi.getBasePath()]);
      const parsed = Object.fromEntries(
        Object.entries(stored).map(([key, value]) => [key, parseSettingValue(value)])
      );
      const resolvedMemoryPath = typeof parsed.memoryPath === 'string' && parsed.memoryPath ? parsed.memoryPath : memoryPath;
      const resolvedVoicePreset =
        typeof parsed.piperVoicePreset === 'string' && parsed.piperVoicePreset
          ? parsed.piperVoicePreset
          : DEFAULT_SETTINGS.piperVoicePreset;
      const resolvedDefaultModel = normalizeDefaultModel(
        typeof parsed.defaultModel === 'string' || parsed.defaultModel === null ? parsed.defaultModel : DEFAULT_SETTINGS.defaultModel
      );
      const voiceDefaults = getDefaultVoicePaths(resolvedMemoryPath, resolvedVoicePreset);

      set({
        settings: {
          ...DEFAULT_SETTINGS,
          ...parsed,
          defaultModel: resolvedDefaultModel,
          memoryPath: resolvedMemoryPath,
          piperVoicePreset: resolvedVoicePreset,
          piperExecutablePath:
            typeof parsed.piperExecutablePath === 'string' && parsed.piperExecutablePath
              ? parsed.piperExecutablePath
              : voiceDefaults.piperExecutablePath,
          piperModelPath:
            typeof parsed.piperModelPath === 'string' && parsed.piperModelPath
              ? parsed.piperModelPath
              : voiceDefaults.piperModelPath,
          whisperExecutablePath:
            typeof parsed.whisperExecutablePath === 'string' && parsed.whisperExecutablePath
              ? parsed.whisperExecutablePath
              : voiceDefaults.whisperExecutablePath,
          whisperModelPath:
            typeof parsed.whisperModelPath === 'string' && parsed.whisperModelPath
              ? parsed.whisperModelPath
              : voiceDefaults.whisperModelPath,
        },
        isLoading: false,
        hasLoaded: true,
      });
    } catch (error) {
      set({
        settings: DEFAULT_SETTINGS,
        isLoading: false,
        error: String(error),
        hasLoaded: true,
      });
    }
  },

  updateSetting: async (key, value) => {
    const previous = get().settings;

    set({
      settings: {
        ...previous,
        [key]: value,
      },
      error: null,
    });

    try {
      await settingsApi.set(key, JSON.stringify(value));
      return true;
    } catch (error) {
      set({ settings: previous, error: String(error) });
      return false;
    }
  },

  resetSettings: async () => {
    try {
      await settingsApi.reset();
      await memoryApi.initialize();
      const memoryPath = await memoryApi.getBasePath();
      const voiceDefaults = getDefaultVoicePaths(memoryPath, DEFAULT_SETTINGS.piperVoicePreset);

      set({
        settings: {
          ...DEFAULT_SETTINGS,
          memoryPath,
          piperVoicePreset: DEFAULT_SETTINGS.piperVoicePreset,
          piperExecutablePath: voiceDefaults.piperExecutablePath,
          piperModelPath: voiceDefaults.piperModelPath,
          whisperExecutablePath: voiceDefaults.whisperExecutablePath,
          whisperModelPath: voiceDefaults.whisperModelPath,
        },
        error: null,
      });
      return true;
    } catch (error) {
      set({ error: String(error) });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
