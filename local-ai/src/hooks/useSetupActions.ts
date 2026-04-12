import { useState } from 'react';
import { DEFAULT_FLOOR_MODEL } from '@/lib/voiceCatalog';
import { setupApi } from '@/services/setup';
import { useModelStore } from '@/stores/modelStore';

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function useSetupActions() {
  const checkStatus = useModelStore((state) => state.checkStatus);
  const downloadModel = useModelStore((state) => state.downloadModel);
  const loadModels = useModelStore((state) => state.loadModels);
  const downloadingModel = useModelStore((state) => state.downloadingModel);

  const [isOpeningDownload, setIsOpeningDownload] = useState(false);
  const [isStartingOllama, setIsStartingOllama] = useState(false);
  const [isInstallingRecommendedModel, setIsInstallingRecommendedModel] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const openOllamaDownload = async () => {
    setIsOpeningDownload(true);
    setActionError(null);

    try {
      await setupApi.openOllamaDownload();
    } catch (error) {
      setActionError(String(error));
    } finally {
      setIsOpeningDownload(false);
    }
  };

  const startOllama = async () => {
    setIsStartingOllama(true);
    setActionError(null);

    try {
      await setupApi.startOllama();

      for (let attempt = 0; attempt < 5; attempt += 1) {
        await delay(1200);
        await checkStatus();

        if (useModelStore.getState().ollamaStatus?.running) {
          return true;
        }
      }

      setActionError('Tried to start Ollama, but it is not responding yet. If this is a fresh install, open Ollama once and then refresh setup.');
      return false;
    } catch (error) {
      setActionError(String(error));
      return false;
    } finally {
      setIsStartingOllama(false);
    }
  };

  const installRecommendedModel = async () => {
    setIsInstallingRecommendedModel(true);
    setActionError(null);

    try {
      await downloadModel(DEFAULT_FLOOR_MODEL);
      await loadModels();

      const modelError = useModelStore.getState().error;
      if (modelError) {
        setActionError(modelError);
        return false;
      }

      return true;
    } catch (error) {
      setActionError(String(error));
      return false;
    } finally {
      setIsInstallingRecommendedModel(false);
    }
  };

  return {
    openOllamaDownload,
    startOllama,
    installRecommendedModel,
    isOpeningDownload,
    isStartingOllama,
    isInstallingRecommendedModel,
    isDownloadingAnyModel: Boolean(downloadingModel),
    actionError,
    clearActionError: () => setActionError(null),
  };
}
