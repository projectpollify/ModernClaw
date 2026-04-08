import { invoke } from '@tauri-apps/api/core';
import type { VoiceInputStatus, VoiceOutputStatus } from '@/types/voice';

interface VoiceOutputConfig {
  piperExecutablePath?: string | null;
  piperModelPath?: string | null;
}

interface VoiceInputConfig {
  whisperExecutablePath?: string | null;
  whisperModelPath?: string | null;
  whisperLanguage?: string | null;
}

export const voiceApi = {
  async checkOutputStatus(config: VoiceOutputConfig): Promise<VoiceOutputStatus> {
    return invoke<VoiceOutputStatus>('voice_check_status', {
      piperPath: config.piperExecutablePath ?? null,
      modelPath: config.piperModelPath ?? null,
    });
  },

  async speak(text: string, config: VoiceOutputConfig): Promise<Uint8Array> {
    const audioBytes = await invoke<number[]>('voice_speak', {
      text,
      piperPath: config.piperExecutablePath ?? null,
      modelPath: config.piperModelPath ?? null,
    });

    return Uint8Array.from(audioBytes);
  },

  async checkInputStatus(config: VoiceInputConfig): Promise<VoiceInputStatus> {
    return invoke<VoiceInputStatus>('voice_check_input_status', {
      whisperPath: config.whisperExecutablePath ?? null,
      modelPath: config.whisperModelPath ?? null,
    });
  },

  async transcribe(audioData: Uint8Array, config: VoiceInputConfig): Promise<string> {
    return invoke<string>('voice_transcribe', {
      audioData: Array.from(audioData),
      whisperPath: config.whisperExecutablePath ?? null,
      modelPath: config.whisperModelPath ?? null,
      language: config.whisperLanguage ?? null,
    });
  },
};
