import { invoke } from '@tauri-apps/api/core';

export const settingsApi = {
  async getAll(): Promise<Record<string, string>> {
    return invoke('settings_get_all');
  },

  async get(key: string): Promise<string | null> {
    return invoke<string | null>('setting_get', { key });
  },

  async set(key: string, value: string): Promise<void> {
    return invoke('setting_set', { key, value });
  },

  async reset(): Promise<void> {
    return invoke('settings_reset');
  },
};
