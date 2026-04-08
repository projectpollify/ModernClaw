import { invoke } from '@tauri-apps/api/core';
import type { CuratorPackage } from '@/types';

interface RawCuratorPackage {
  id: string;
  folder_name: string;
  title: string;
  summary?: string;
  source?: string;
  tags: string[];
  request_topic?: string;
  created_at?: string;
  status: string;
  path: string;
}

export interface MemoryFile {
  name: string;
  path: string;
  content: string;
  exists: boolean;
  modified_at?: string;
}

export interface DailyLog {
  date: string;
  path: string;
  content: string;
  exists: boolean;
}

export interface MemoryContext {
  soul?: string;
  user?: string;
  memory?: string;
  today_log?: string;
  knowledge_files: string[];
}

function mapCuratorPackage(pkg: RawCuratorPackage): CuratorPackage {
  return {
    id: pkg.id,
    folderName: pkg.folder_name,
    title: pkg.title,
    summary: pkg.summary,
    source: pkg.source,
    tags: pkg.tags,
    requestTopic: pkg.request_topic,
    createdAt: pkg.created_at,
    status: pkg.status,
    path: pkg.path,
  };
}

export const memoryApi = {
  async initialize(): Promise<void> {
    return invoke('memory_initialize');
  },

  async readFile(filename: string): Promise<MemoryFile> {
    return invoke('memory_read_file', { filename });
  },

  async writeFile(filename: string, content: string): Promise<void> {
    return invoke('memory_write_file', { filename, content });
  },

  async getTodayLog(): Promise<DailyLog> {
    return invoke('memory_get_today_log');
  },

  async appendLog(entry: string): Promise<void> {
    return invoke('memory_append_log', { entry });
  },

  async listDailyLogs(): Promise<string[]> {
    return invoke('memory_list_daily_logs');
  },

  async listKnowledge(): Promise<string[]> {
    return invoke('memory_list_knowledge');
  },

  async listCuratorStaged(): Promise<CuratorPackage[]> {
    const packages = await invoke<RawCuratorPackage[]>('memory_list_curator_staged');
    return packages.map(mapCuratorPackage);
  },

  async importCuratorPackage(folderName: string): Promise<string> {
    return invoke('memory_import_curator_package', { folderName });
  },

  async rejectCuratorPackage(folderName: string): Promise<void> {
    return invoke('memory_reject_curator_package', { folderName });
  },

  async loadContext(): Promise<MemoryContext> {
    return invoke('memory_load_context');
  },

  async getBasePath(): Promise<string> {
    return invoke('memory_get_base_path');
  },

  async openFolder(): Promise<void> {
    return invoke('memory_open_folder');
  },
};

