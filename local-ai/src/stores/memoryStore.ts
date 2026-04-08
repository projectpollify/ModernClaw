import { create } from 'zustand';
import { memoryApi, type MemoryContext, type MemoryFile } from '@/services/memory';
import type { CuratorPackage } from '@/types';

interface MemoryState {
  soul: MemoryFile | null;
  user: MemoryFile | null;
  memory: MemoryFile | null;
  context: MemoryContext | null;
  dailyLogs: string[];
  selectedLog: string | null;
  knowledgeFiles: string[];
  curatorStagedPackages: CuratorPackage[];
  basePath: string | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  loadFile: (filename: string) => Promise<MemoryFile>;
  saveFile: (filename: string, content: string) => Promise<void>;
  appendDailyLog: (entry: string) => Promise<void>;
  loadContext: () => Promise<void>;
  refreshDailyLogs: () => Promise<void>;
  refreshKnowledge: () => Promise<void>;
  refreshCurator: () => Promise<void>;
  importCuratorPackage: (folderName: string) => Promise<string>;
  rejectCuratorPackage: (folderName: string) => Promise<void>;
  selectLog: (date: string | null) => void;
  clearError: () => void;
}

export const useMemoryStore = create<MemoryState>()((set, get) => ({
  soul: null,
  user: null,
  memory: null,
  context: null,
  dailyLogs: [],
  selectedLog: null,
  knowledgeFiles: [],
  curatorStagedPackages: [],
  basePath: null,
  isLoading: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });

    try {
      await memoryApi.initialize();

      const [soul, user, memory, context, dailyLogs, knowledgeFiles, curatorStagedPackages, basePath] = await Promise.all([
        memoryApi.readFile('SOUL.md'),
        memoryApi.readFile('USER.md'),
        memoryApi.readFile('MEMORY.md'),
        memoryApi.loadContext(),
        memoryApi.listDailyLogs(),
        memoryApi.listKnowledge(),
        memoryApi.listCuratorStaged(),
        memoryApi.getBasePath(),
      ]);

      set({
        soul,
        user,
        memory,
        context,
        dailyLogs,
        knowledgeFiles,
        curatorStagedPackages,
        basePath,
        selectedLog: dailyLogs[0] ?? null,
        isLoading: false,
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  loadFile: async (filename: string) => {
    const file = await memoryApi.readFile(filename);

    if (filename === 'SOUL.md') {
      set({ soul: file });
    } else if (filename === 'USER.md') {
      set({ user: file });
    } else if (filename === 'MEMORY.md') {
      set({ memory: file });
    }

    return file;
  },

  saveFile: async (filename: string, content: string) => {
    await memoryApi.writeFile(filename, content);

    if (filename === 'SOUL.md' || filename === 'USER.md' || filename === 'MEMORY.md') {
      await get().loadFile(filename);
    }

    if (filename.startsWith('knowledge/')) {
      await get().refreshKnowledge();
    }

    if (filename.startsWith('curator/')) {
      await get().refreshCurator();
    }

    await get().loadContext();
  },

  appendDailyLog: async (entry: string) => {
    await memoryApi.appendLog(entry);

    const [dailyLogs, context] = await Promise.all([memoryApi.listDailyLogs(), memoryApi.loadContext()]);

    set({
      dailyLogs,
      context,
      selectedLog: dailyLogs[0] ?? null,
    });
  },

  loadContext: async () => {
    const context = await memoryApi.loadContext();
    set({ context });
  },

  refreshDailyLogs: async () => {
    const dailyLogs = await memoryApi.listDailyLogs();
    set((state) => ({
      dailyLogs,
      selectedLog: state.selectedLog && dailyLogs.includes(state.selectedLog)
        ? state.selectedLog
        : dailyLogs[0] ?? null,
    }));
  },

  refreshKnowledge: async () => {
    const knowledgeFiles = await memoryApi.listKnowledge();
    set({ knowledgeFiles });
  },

  refreshCurator: async () => {
    const curatorStagedPackages = await memoryApi.listCuratorStaged();
    set({ curatorStagedPackages });
  },

  importCuratorPackage: async (folderName: string) => {
    const filename = await memoryApi.importCuratorPackage(folderName);
    const [curatorStagedPackages, knowledgeFiles, context] = await Promise.all([
      memoryApi.listCuratorStaged(),
      memoryApi.listKnowledge(),
      memoryApi.loadContext(),
    ]);

    set({ curatorStagedPackages, knowledgeFiles, context });
    return filename;
  },

  rejectCuratorPackage: async (folderName: string) => {
    await memoryApi.rejectCuratorPackage(folderName);
    const curatorStagedPackages = await memoryApi.listCuratorStaged();
    set({ curatorStagedPackages });
  },

  selectLog: (date) => set({ selectedLog: date }),

  clearError: () => set({ error: null }),
}));
