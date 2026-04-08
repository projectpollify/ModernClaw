import { getEffectiveVoiceSettings } from '@/lib/voiceSettings';
import { prepareTextForSpeech } from '@/lib/speechText';
import { create } from 'zustand';
import { voiceApi } from '@/services/voice';
import { useAgentStore } from '@/stores/agentStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { VoiceInputStatus, VoiceOutputStatus } from '@/types/voice';

let activeAudio: HTMLAudioElement | null = null;
let activeAudioUrl: string | null = null;
let playbackToken = 0;

function releaseAudio() {
  if (activeAudio) {
    activeAudio.onended = null;
    activeAudio.onerror = null;
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }

  if (activeAudioUrl) {
    URL.revokeObjectURL(activeAudioUrl);
    activeAudioUrl = null;
  }
}

interface VoiceState {
  outputStatus: VoiceOutputStatus | null;
  inputStatus: VoiceInputStatus | null;
  isCheckingOutput: boolean;
  isCheckingInput: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  isTranscribing: boolean;
  speakingMessageId: string | null;
  error: string | null;
  checkOutputStatus: () => Promise<void>;
  checkInputStatus: () => Promise<void>;
  speakMessage: (messageId: string, text: string) => Promise<void>;
  pauseSpeaking: () => void;
  resumeSpeaking: () => Promise<void>;
  stopSpeaking: () => void;
  transcribeAudio: (audioData: Uint8Array) => Promise<string | null>;
  setError: (message: string | null) => void;
  clearError: () => void;
}

export const useVoiceStore = create<VoiceState>()((set, get) => ({
  outputStatus: null,
  inputStatus: null,
  isCheckingOutput: false,
  isCheckingInput: false,
  isSpeaking: false,
  isPaused: false,
  isTranscribing: false,
  speakingMessageId: null,
  error: null,

  checkOutputStatus: async () => {
    const settings = useSettingsStore.getState().settings;
    const activeAgent = useAgentStore.getState().activeAgent;
    const effectiveVoiceSettings = getEffectiveVoiceSettings(settings, activeAgent);

    set({ isCheckingOutput: true, error: null });

    try {
      const outputStatus = await voiceApi.checkOutputStatus({
        piperExecutablePath: effectiveVoiceSettings.piperExecutablePath,
        piperModelPath: effectiveVoiceSettings.piperModelPath,
      });

      set({ outputStatus, isCheckingOutput: false });
    } catch (error) {
      set({
        outputStatus: null,
        isCheckingOutput: false,
        error: String(error),
      });
    }
  },

  checkInputStatus: async () => {
    const settings = useSettingsStore.getState().settings;
    const activeAgent = useAgentStore.getState().activeAgent;
    const effectiveVoiceSettings = getEffectiveVoiceSettings(settings, activeAgent);

    set({ isCheckingInput: true, error: null });

    try {
      const inputStatus = await voiceApi.checkInputStatus({
        whisperExecutablePath: effectiveVoiceSettings.whisperExecutablePath,
        whisperModelPath: effectiveVoiceSettings.whisperModelPath,
      });

      set({ inputStatus, isCheckingInput: false });
    } catch (error) {
      set({
        inputStatus: null,
        isCheckingInput: false,
        error: String(error),
      });
    }
  },

  speakMessage: async (messageId, text) => {
    const state = get();
    const settings = useSettingsStore.getState().settings;
    const activeAgent = useAgentStore.getState().activeAgent;
    const effectiveVoiceSettings = getEffectiveVoiceSettings(settings, activeAgent);

    if (state.speakingMessageId === messageId) {
      if (state.isSpeaking && !state.isPaused) {
        state.pauseSpeaking();
        return;
      }

      if (state.isSpeaking && state.isPaused) {
        await state.resumeSpeaking();
        return;
      }
    }

    if (!effectiveVoiceSettings.enableVoiceOutput) {
      set({ error: 'Voice output is disabled in Settings.' });
      return;
    }

    const normalizedText = prepareTextForSpeech(text);

    playbackToken += 1;
    const currentToken = playbackToken;
    releaseAudio();

    set({
      isSpeaking: true,
      isPaused: false,
      speakingMessageId: messageId,
      error: null,
    });

    try {
      const audioBytes = await voiceApi.speak(normalizedText, {
        piperExecutablePath: effectiveVoiceSettings.piperExecutablePath,
        piperModelPath: effectiveVoiceSettings.piperModelPath,
      });

      if (currentToken !== playbackToken) {
        return;
      }

      const audioBuffer = new Uint8Array(audioBytes.length);
      audioBuffer.set(audioBytes);
      const blob = new Blob([audioBuffer.buffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      activeAudio = audio;
      activeAudioUrl = url;

      audio.onended = () => {
        if (currentToken !== playbackToken) {
          return;
        }
        releaseAudio();
        set({
          isSpeaking: false,
          isPaused: false,
          speakingMessageId: null,
        });
      };

      audio.onerror = () => {
        if (currentToken !== playbackToken) {
          return;
        }
        releaseAudio();
        set({
          isSpeaking: false,
          isPaused: false,
          speakingMessageId: null,
          error: 'Voice playback failed in the app audio layer.',
        });
      };

      await audio.play();
    } catch (error) {
      if (currentToken === playbackToken) {
        releaseAudio();
        set({
          isSpeaking: false,
          isPaused: false,
          speakingMessageId: null,
          error: String(error),
        });
      }
    }
  },

  pauseSpeaking: () => {
    if (!activeAudio) {
      return;
    }

    activeAudio.pause();
    set({
      isSpeaking: true,
      isPaused: true,
    });
  },

  resumeSpeaking: async () => {
    if (!activeAudio) {
      return;
    }

    try {
      await activeAudio.play();
      set({
        isSpeaking: true,
        isPaused: false,
      });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  stopSpeaking: () => {
    playbackToken += 1;
    releaseAudio();
    set({
      isSpeaking: false,
      isPaused: false,
      speakingMessageId: null,
    });
  },

  transcribeAudio: async (audioData) => {
    const settings = useSettingsStore.getState().settings;
    const activeAgent = useAgentStore.getState().activeAgent;
    const effectiveVoiceSettings = getEffectiveVoiceSettings(settings, activeAgent);

    if (!effectiveVoiceSettings.enableVoiceInput) {
      set({ error: 'Voice input is disabled in Settings.' });
      return null;
    }

    set({
      isTranscribing: true,
      error: null,
    });

    try {
      const transcript = await voiceApi.transcribe(audioData, {
        whisperExecutablePath: effectiveVoiceSettings.whisperExecutablePath,
        whisperModelPath: effectiveVoiceSettings.whisperModelPath,
        whisperLanguage: effectiveVoiceSettings.whisperLanguage,
      });

      set({ isTranscribing: false });
      return transcript;
    } catch (error) {
      set({
        isTranscribing: false,
        error: String(error),
      });
      return null;
    }
  },

  setError: (message) => set({ error: message }),
  clearError: () => set({ error: null }),
}));
