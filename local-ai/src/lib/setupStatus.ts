import { DEFAULT_FLOOR_MODEL, formatWorkspaceModelName, LIGHTWEIGHT_FLOOR_MODEL } from '@/lib/voiceCatalog';
import type { DirectEngineStatus, Model } from '@/services/engine';
import type { MemoryFile } from '@/services/memory';
import type { AppSettings } from '@/types/settings';
import type { VoiceInputStatus, VoiceOutputStatus } from '@/types/voice';

export type SetupItemState = 'ready' | 'attention' | 'checking' | 'optional';
export type SetupNextStepId = 'checking' | 'engine' | 'model' | 'memory' | 'ready';

export interface SetupChecklistItem {
  id: string;
  label: string;
  detail: string;
  state: SetupItemState;
  optional?: boolean;
  notes?: string[];
}

export interface SetupChecklistSummary {
  requiredReady: number;
  requiredTotal: number;
  optionalReady: number;
  optionalTotal: number;
}

export interface SetupNextStep {
  id: SetupNextStepId;
  title: string;
  detail: string;
}

interface BuildSetupChecklistArgs {
  settings: AppSettings;
  hasLoadedSettings: boolean;
  engineStatus: DirectEngineStatus | null;
  models: Model[];
  modelError: string | null;
  memoryBasePath: string | null;
  soul: MemoryFile | null;
  user: MemoryFile | null;
  memory: MemoryFile | null;
  memoryLoading: boolean;
  memoryError: string | null;
  outputStatus: VoiceOutputStatus | null;
  inputStatus: VoiceInputStatus | null;
  isCheckingOutput: boolean;
  isCheckingInput: boolean;
  voiceError: string | null;
}

export function buildSetupChecklist({
  settings,
  hasLoadedSettings,
  engineStatus,
  models,
  modelError,
  memoryBasePath,
  soul,
  user,
  memory,
  memoryLoading,
  memoryError,
  outputStatus,
  inputStatus,
  isCheckingOutput,
  isCheckingInput,
  voiceError,
}: BuildSetupChecklistArgs) {
  const missingFiles = [
    !soul?.exists ? 'SOUL.md' : null,
    !user?.exists ? 'USER.md' : null,
    !memory?.exists ? 'MEMORY.md' : null,
  ].filter((value): value is string => Boolean(value));

  const requiredItems: SetupChecklistItem[] = [
    buildEngineItem(engineStatus),
    buildModelItem(engineStatus, settings, models, modelError),
    buildMemoryItem(memoryBasePath, missingFiles, memoryLoading, memoryError),
  ];

  const optionalItems: SetupChecklistItem[] = [
    buildVoiceOutputItem(settings, hasLoadedSettings, outputStatus, isCheckingOutput, voiceError),
    buildVoiceInputItem(settings, hasLoadedSettings, inputStatus, isCheckingInput, voiceError),
  ];

  const summary: SetupChecklistSummary = {
    requiredReady: requiredItems.filter((item) => item.state === 'ready').length,
    requiredTotal: requiredItems.length,
    optionalReady: optionalItems.filter((item) => item.state === 'ready').length,
    optionalTotal: optionalItems.length,
  };

  return {
    requiredItems,
    optionalItems,
    summary,
    nextStep: buildNextStep({
      settings,
      engineStatus,
      models,
      memoryBasePath,
      missingFiles,
      memoryLoading,
      summary,
    }),
  };
}

function hasManagedGemmaSelection(settings: AppSettings) {
  return [DEFAULT_FLOOR_MODEL, LIGHTWEIGHT_FLOOR_MODEL].includes(settings.defaultModel ?? '');
}

function selectedManagedGemmaLabel(settings: AppSettings) {
  if (settings.defaultModel === DEFAULT_FLOOR_MODEL) {
    return 'Gemma 4 E4B';
  }

  if (settings.defaultModel === LIGHTWEIGHT_FLOOR_MODEL) {
    return 'Gemma 4 E2B';
  }

  return null;
}

function buildNextStep({
  settings,
  engineStatus,
  models,
  memoryBasePath,
  missingFiles,
  memoryLoading,
  summary,
}: {
  settings: AppSettings;
  engineStatus: DirectEngineStatus | null;
  models: Model[];
  memoryBasePath: string | null;
  missingFiles: string[];
  memoryLoading: boolean;
  summary: SetupChecklistSummary;
}): SetupNextStep {
  const resolvedModelPath = settings.directEngineModelPath || engineStatus?.modelPath || '';
  const hasManagedModel = hasManagedGemmaSelection(settings);

  if (!engineStatus || (memoryLoading && !memoryBasePath)) {
    return {
      id: 'checking',
      title: 'Checking this machine',
      detail: 'ModernClaw is confirming the direct engine, configured model, and workspace files.',
    };
  }

  if (!engineStatus.executableFound || !engineStatus.running) {
    return {
      id: 'engine',
      title: 'Configure and start Direct Engine',
      detail: 'ModernClaw auto-detects llama-server.exe on this machine. Start the engine to bring chat online on 127.0.0.1:8080.',
    };
  }

  if ((!resolvedModelPath || !engineStatus.modelFound) && !hasManagedModel && models.length === 0) {
    return {
      id: 'model',
      title: 'Choose a Gemma 4 model',
      detail: 'Pick the 4B or 2B Gemma 4 lane. A manual GGUF path is only needed for advanced overrides.',
    };
  }

  if (!memoryBasePath || missingFiles.length > 0) {
    return {
      id: 'memory',
      title: 'Initialize the workspace files',
      detail: 'Create SOUL.md, USER.md, and MEMORY.md so the workspace prompt files are ready.',
    };
  }

  if (summary.requiredReady === summary.requiredTotal) {
    return {
      id: 'ready',
      title: 'Core setup is ready',
      detail: 'The direct engine is up, a model is configured, and the workspace files are in place.',
    };
  }

  return {
    id: 'checking',
    title: 'Refreshing setup state',
    detail: 'ModernClaw is reconciling the latest machine state.',
  };
}

function buildEngineItem(engineStatus: DirectEngineStatus | null): SetupChecklistItem {
  if (!engineStatus) {
    return {
      id: 'engine',
      label: 'Direct Engine',
      detail: 'Checking whether llama-server is reachable on this machine.',
      state: 'checking',
    };
  }

  if (engineStatus.running) {
    return {
      id: 'engine',
      label: 'Direct Engine',
      detail: `Running and ready at ${engineStatus.baseUrl}.`,
      state: 'ready',
      notes: [engineStatus.executablePath ? `Executable: ${engineStatus.executablePath}` : 'Executable path not configured.'],
    };
  }

  const notes = [];
  if (!engineStatus.executableFound) {
    notes.push('Install llama.cpp so ModernClaw can launch llama-server.exe on this machine.');
  } else if (engineStatus.executablePath) {
    notes.push(`Detected executable: ${engineStatus.executablePath}`);
  }

  if (engineStatus.error) {
    notes.push(engineStatus.error);
  }

  return {
    id: 'engine',
    label: 'Direct Engine',
    detail: 'ModernClaw needs llama-server running locally before chat can work.',
    state: 'attention',
    notes,
  };
}

function buildModelItem(
  engineStatus: DirectEngineStatus | null,
  settings: AppSettings,
  models: Model[],
  modelError: string | null
): SetupChecklistItem {
  const resolvedModelPath = settings.directEngineModelPath || engineStatus?.modelPath || '';
  const managedModelLabel = selectedManagedGemmaLabel(settings);

  if (!engineStatus) {
    return {
      id: 'model',
      label: 'Configured Model',
      detail: 'Checking for configured GGUF models.',
      state: 'checking',
    };
  }

  if (managedModelLabel && !settings.directEngineModelPath) {
    return {
      id: 'model',
      label: 'Selected Model',
      detail: `${managedModelLabel} is selected as the workspace model. ModernClaw can pull it directly through llama.cpp on first start.`,
      state: 'ready',
      notes: ['Advanced GGUF overrides stay optional and can be added later in Settings if you need a custom file.'],
    };
  }

  if (resolvedModelPath && engineStatus.modelFound && models.length > 0) {
    return {
      id: 'model',
      label: 'Selected Model',
      detail: `${models.length} model${models.length === 1 ? '' : 's'} discovered. Current choices include ${models
        .slice(0, 3)
        .map((model) => formatWorkspaceModelName(model.name) || model.name)
        .join(', ')}${models.length > 3 ? ', and more.' : '.'}`,
      state: 'ready',
      notes: [`Model path: ${resolvedModelPath}`],
    };
  }

  const notes = [];
  if (!resolvedModelPath) {
    notes.push('Choose the Gemma 4 E4B or E2B workspace model, or add an advanced GGUF override in Settings.');
  } else if (!engineStatus.modelFound) {
    notes.push(`Configured model was not found at ${resolvedModelPath}.`);
  }

  if (modelError) {
    notes.push(modelError);
  }

  return {
    id: 'model',
    label: 'Selected Model',
    detail: 'ModernClaw needs either a supported Gemma 4 workspace model or an advanced GGUF override before first chat.',
    state: 'attention',
    notes,
  };
}

function buildMemoryItem(
  memoryBasePath: string | null,
  missingFiles: string[],
  memoryLoading: boolean,
  memoryError: string | null
): SetupChecklistItem {
  if (memoryLoading && !memoryBasePath) {
    return {
      id: 'memory',
      label: 'Workspace Files',
      detail: 'Initializing local memory files.',
      state: 'checking',
    };
  }

  if (memoryBasePath && missingFiles.length === 0) {
    return {
      id: 'memory',
      label: 'Workspace Files',
      detail: `Workspace folder is ready at ${memoryBasePath}.`,
      state: 'ready',
    };
  }

  const notes = memoryError
    ? [memoryError]
    : missingFiles.length > 0
      ? [`Missing file${missingFiles.length === 1 ? '' : 's'}: ${missingFiles.join(', ')}`]
      : ['Initialize the workspace memory files before first use.'];

  return {
    id: 'memory',
    label: 'Workspace Files',
    detail: 'ModernClaw needs SOUL.md, USER.md, and MEMORY.md in the active workspace.',
    state: 'attention',
    notes,
  };
}

function buildVoiceOutputItem(
  settings: AppSettings,
  hasLoadedSettings: boolean,
  outputStatus: VoiceOutputStatus | null,
  isCheckingOutput: boolean,
  voiceError: string | null
): SetupChecklistItem {
  if (!hasLoadedSettings) {
    return {
      id: 'voice-output',
      label: 'Voice Output',
      detail: 'Loading voice settings.',
      state: 'checking',
      optional: true,
    };
  }

  if (!settings.enableVoiceOutput) {
    return {
      id: 'voice-output',
      label: 'Voice Output',
      detail: 'Optional feature. Turn it on later if you want spoken replies.',
      state: 'optional',
      optional: true,
    };
  }

  if (isCheckingOutput || !outputStatus) {
    return {
      id: 'voice-output',
      label: 'Voice Output',
      detail: 'Checking Piper and the selected voice model.',
      state: 'checking',
      optional: true,
    };
  }

  if (outputStatus.available) {
    return {
      id: 'voice-output',
      label: 'Voice Output',
      detail: 'Piper is ready to speak assistant replies on this machine.',
      state: 'ready',
      optional: true,
      notes: outputStatus.notes,
    };
  }

  return {
    id: 'voice-output',
    label: 'Voice Output',
    detail: 'Voice output is enabled, but Piper or the selected voice model is not ready yet.',
    state: 'attention',
    optional: true,
    notes: voiceError ? [voiceError] : outputStatus.notes,
  };
}

function buildVoiceInputItem(
  settings: AppSettings,
  hasLoadedSettings: boolean,
  inputStatus: VoiceInputStatus | null,
  isCheckingInput: boolean,
  voiceError: string | null
): SetupChecklistItem {
  if (!hasLoadedSettings) {
    return {
      id: 'voice-input',
      label: 'Voice Input',
      detail: 'Loading microphone transcription settings.',
      state: 'checking',
      optional: true,
    };
  }

  if (!settings.enableVoiceInput) {
    return {
      id: 'voice-input',
      label: 'Voice Input',
      detail: 'Optional feature. Turn it on later if you want microphone transcription.',
      state: 'optional',
      optional: true,
    };
  }

  if (isCheckingInput || !inputStatus) {
    return {
      id: 'voice-input',
      label: 'Voice Input',
      detail: 'Checking Whisper and the selected transcription model.',
      state: 'checking',
      optional: true,
    };
  }

  if (inputStatus.available) {
    return {
      id: 'voice-input',
      label: 'Voice Input',
      detail: 'Whisper is ready to transcribe microphone input on this machine.',
      state: 'ready',
      optional: true,
      notes: inputStatus.notes,
    };
  }

  return {
    id: 'voice-input',
    label: 'Voice Input',
    detail: 'Voice input is enabled, but Whisper or the selected model is not ready yet.',
    state: 'attention',
    optional: true,
    notes: voiceError ? [voiceError] : inputStatus.notes,
  };
}
