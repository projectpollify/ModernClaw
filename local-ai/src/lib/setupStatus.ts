import type { MemoryFile } from '@/services/memory';
import type { Model, OllamaStatus } from '@/services/ollama';
import type { AppSettings } from '@/types/settings';
import type { VoiceInputStatus, VoiceOutputStatus } from '@/types/voice';

export type SetupItemState = 'ready' | 'attention' | 'checking' | 'optional';

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

interface BuildSetupChecklistArgs {
  settings: AppSettings;
  hasLoadedSettings: boolean;
  ollamaStatus: OllamaStatus | null;
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
  ollamaStatus,
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
}: BuildSetupChecklistArgs): { requiredItems: SetupChecklistItem[]; optionalItems: SetupChecklistItem[]; summary: SetupChecklistSummary } {
  const missingFiles = [
    !soul?.exists ? 'SOUL.md' : null,
    !user?.exists ? 'USER.md' : null,
    !memory?.exists ? 'MEMORY.md' : null,
  ].filter((value): value is string => Boolean(value));

  const requiredItems: SetupChecklistItem[] = [
    buildOllamaItem(ollamaStatus, modelError),
    buildModelItem(ollamaStatus, models, modelError),
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
  };
}

function buildOllamaItem(ollamaStatus: OllamaStatus | null, modelError: string | null): SetupChecklistItem {
  if (!ollamaStatus) {
    return {
      id: 'ollama',
      label: 'Ollama',
      detail: 'Checking whether Ollama is available on this machine.',
      state: 'checking',
    };
  }

  if (ollamaStatus.running) {
    return {
      id: 'ollama',
      label: 'Ollama',
      detail: ollamaStatus.version
        ? `Running and ready. Detected version ${ollamaStatus.version}.`
        : 'Running and ready for local model requests.',
      state: 'ready',
    };
  }

  return {
    id: 'ollama',
    label: 'Ollama',
    detail: 'ModernClaw needs Ollama running locally before chat can work.',
    state: 'attention',
    notes: [ollamaStatus.error ?? modelError ?? 'Install and start Ollama, then refresh setup checks.'],
  };
}

function buildModelItem(ollamaStatus: OllamaStatus | null, models: Model[], modelError: string | null): SetupChecklistItem {
  if (!ollamaStatus) {
    return {
      id: 'model',
      label: 'Model Installed',
      detail: 'Checking for installed local models.',
      state: 'checking',
    };
  }

  if (!ollamaStatus.running) {
    return {
      id: 'model',
      label: 'Model Installed',
      detail: 'Start Ollama before checking or downloading local models.',
      state: 'attention',
    };
  }

  if (models.length > 0) {
    return {
      id: 'model',
      label: 'Model Installed',
      detail: `${models.length} model${models.length === 1 ? '' : 's'} available. Current choices include ${models
        .slice(0, 3)
        .map((model) => model.name)
        .join(', ')}${models.length > 3 ? ', and more.' : '.'}`,
      state: 'ready',
    };
  }

  return {
    id: 'model',
    label: 'Model Installed',
    detail: 'Install at least one supported model before first chat.',
    state: 'attention',
    notes: modelError ? [modelError] : ['Use onboarding or Settings to download a supported Gemma 4 model.'],
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
