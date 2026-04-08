import { getCuratedVoiceById } from '@/lib/voiceCatalog';
import { getDefaultVoicePaths } from '@/lib/voicePaths';
import type { Agent } from '@/types';
import type { AppSettings } from '@/types/settings';

export interface EffectiveVoiceSettings {
  enableVoiceOutput: boolean;
  piperVoicePreset: string;
  piperExecutablePath: string;
  piperModelPath: string;
  enableVoiceInput: boolean;
  whisperExecutablePath: string;
  whisperModelPath: string;
  whisperLanguage: string;
}

function isLegacyAgentLocalToolPath(path: string | null | undefined, activeAgent: Agent | null | undefined) {
  if (!path || !activeAgent?.workspacePath) {
    return false;
  }

  const normalizedPath = path.replace(/[\\/]+/g, '\\').toLowerCase();
  const normalizedWorkspace = activeAgent.workspacePath.replace(/[\\/]+/g, '\\').toLowerCase();
  return normalizedPath.startsWith(`${normalizedWorkspace}\\tools\\`);
}

export function getEffectiveVoiceSettings(
  settings: AppSettings,
  activeAgent: Agent | null | undefined
): EffectiveVoiceSettings {
  const effectivePiperVoicePreset = getCuratedVoiceById(
    activeAgent?.piperVoicePreset ?? settings.piperVoicePreset
  ).id;
  const defaults = getDefaultVoicePaths(settings.memoryPath || '', effectivePiperVoicePreset);

  const effectivePiperModelPath =
    activeAgent?.piperModelPath && !isLegacyAgentLocalToolPath(activeAgent.piperModelPath, activeAgent)
      ? activeAgent.piperModelPath
      : defaults.piperModelPath;

  const effectiveWhisperModelPath =
    activeAgent?.whisperModelPath && !isLegacyAgentLocalToolPath(activeAgent.whisperModelPath, activeAgent)
      ? activeAgent.whisperModelPath
      : settings.whisperModelPath || defaults.whisperModelPath;

  return {
    enableVoiceOutput: activeAgent?.enableVoiceOutput ?? settings.enableVoiceOutput,
    piperVoicePreset: effectivePiperVoicePreset,
    piperExecutablePath: settings.piperExecutablePath || defaults.piperExecutablePath,
    piperModelPath: effectivePiperModelPath,
    enableVoiceInput: activeAgent?.enableVoiceInput ?? settings.enableVoiceInput,
    whisperExecutablePath: settings.whisperExecutablePath || defaults.whisperExecutablePath,
    whisperModelPath: effectiveWhisperModelPath,
    whisperLanguage: activeAgent?.whisperLanguage ?? settings.whisperLanguage,
  };
}
