import { useState } from 'react';
import { setupApi } from '@/services/setup';
import { useMemoryStore } from '@/stores/memoryStore';
import { useModelStore } from '@/stores/modelStore';
import { useSettingsStore } from '@/stores/settingsStore';

type ActionNoticeTone = 'success' | 'info';

export function useSetupActions() {
  const checkStatus = useModelStore((state) => state.checkStatus);
  const loadModels = useModelStore((state) => state.loadModels);
  const initializeMemory = useMemoryStore((state) => state.initialize);
  const memoryBasePath = useMemoryStore((state) => state.basePath);
  const settings = useSettingsStore((state) => state.settings);

  const [isOpeningDownload, setIsOpeningDownload] = useState(false);
  const [isStartingDirectEngine, setIsStartingDirectEngine] = useState(false);
  const [isStoppingDirectEngine, setIsStoppingDirectEngine] = useState(false);
  const [isInitializingWorkspace, setIsInitializingWorkspace] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ tone: ActionNoticeTone; message: string } | null>(null);

  const resetFeedback = () => {
    setActionError(null);
    setActionNotice(null);
  };

  const refreshEngineState = async () => {
    await checkStatus();
    await loadModels();
  };

  const openDirectEngineDownload = async () => {
    setIsOpeningDownload(true);
    resetFeedback();

    try {
      await setupApi.openDirectEngineDownload();
      setActionNotice({
        tone: 'info',
        message: 'Opened the llama.cpp releases page. Once llama-server.exe is installed, ModernClaw can usually detect it automatically.',
      });
    } catch (error) {
      setActionError(String(error));
    } finally {
      setIsOpeningDownload(false);
    }
  };

  const startDirectEngine = async () => {
    setIsStartingDirectEngine(true);
    resetFeedback();

    try {
      await setupApi.startDirectEngine();
      await refreshEngineState();
      setActionNotice({
        tone: 'success',
        message: 'Direct Engine is responding on 127.0.0.1:8080. If this was the first Gemma launch, llama.cpp has also cached the selected model locally.',
      });
      return true;
    } catch (error) {
      setActionError(String(error));
      return false;
    } finally {
      setIsStartingDirectEngine(false);
    }
  };

  const stopDirectEngine = async () => {
    setIsStoppingDirectEngine(true);
    resetFeedback();

    try {
      await setupApi.stopDirectEngine();
      await refreshEngineState();
      setActionNotice({
        tone: 'info',
        message: 'Requested a stop for llama-server.exe.',
      });
      return true;
    } catch (error) {
      setActionError(String(error));
      return false;
    } finally {
      setIsStoppingDirectEngine(false);
    }
  };

  const openConfiguredModel = async () => {
    const target = settings.directEngineModelPath?.trim();
    if (!target) {
      setActionError('Set a GGUF model path in Settings before trying to open it.');
      return false;
    }

    resetFeedback();
    try {
      await setupApi.openExternal(target);
      setActionNotice({
        tone: 'info',
        message: 'Opened the configured GGUF model location.',
      });
      return true;
    } catch (error) {
      setActionError(String(error));
      return false;
    }
  };

  const initializeWorkspace = async () => {
    setIsInitializingWorkspace(true);
    resetFeedback();

    try {
      await initializeMemory();

      const memoryError = useMemoryStore.getState().error;
      if (memoryError) {
        setActionError(memoryError);
        return false;
      }

      const nextBasePath = useMemoryStore.getState().basePath ?? memoryBasePath;
      setActionNotice({
        tone: 'success',
        message: nextBasePath
          ? `Workspace files are ready at ${nextBasePath}.`
          : 'Workspace files are ready.',
      });
      return true;
    } catch (error) {
      setActionError(String(error));
      return false;
    } finally {
      setIsInitializingWorkspace(false);
    }
  };

  return {
    openDirectEngineDownload,
    startDirectEngine,
    stopDirectEngine,
    openConfiguredModel,
    initializeWorkspace,
    isOpeningDownload,
    isStartingDirectEngine,
    isStoppingDirectEngine,
    isInitializingWorkspace,
    actionError,
    actionNotice,
    clearActionError: () => setActionError(null),
    clearActionNotice: () => setActionNotice(null),
  };
}
