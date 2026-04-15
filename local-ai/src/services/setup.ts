import { invoke } from '@tauri-apps/api/core';

const DIRECT_ENGINE_DOWNLOAD_URL = 'https://github.com/ggerganov/llama.cpp/releases';

export const setupApi = {
  async openExternal(target: string): Promise<void> {
    return invoke('setup_open_external', { target });
  },

  async openDirectEngineDownload(): Promise<void> {
    return invoke('setup_open_external', { target: DIRECT_ENGINE_DOWNLOAD_URL });
  },

  async startDirectEngine(): Promise<void> {
    return invoke('setup_start_direct_engine');
  },

  async stopDirectEngine(): Promise<void> {
    return invoke('setup_stop_direct_engine');
  },
};

export { DIRECT_ENGINE_DOWNLOAD_URL };
