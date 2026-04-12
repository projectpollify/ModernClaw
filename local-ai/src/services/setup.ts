import { invoke } from '@tauri-apps/api/core';

const OLLAMA_DOWNLOAD_URL = 'https://ollama.com/download';

export const setupApi = {
  async openExternal(target: string): Promise<void> {
    return invoke('setup_open_external', { target });
  },

  async openOllamaDownload(): Promise<void> {
    return invoke('setup_open_external', { target: OLLAMA_DOWNLOAD_URL });
  },

  async startOllama(): Promise<void> {
    return invoke('setup_start_ollama');
  },
};

export { OLLAMA_DOWNLOAD_URL };
