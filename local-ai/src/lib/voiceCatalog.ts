export interface CuratedVoiceOption {
  id: string;
  label: string;
  filename: string;
  description: string;
}

export const CURATED_PIPER_VOICES: CuratedVoiceOption[] = [
  {
    id: 'amy-medium',
    label: 'Amy (Female)',
    filename: 'en_US-amy-medium.onnx',
    description: 'Softer female voice option for longer listening sessions.',
  },
  {
    id: 'joe-medium',
    label: 'Joe (Male)',
    filename: 'en_US-joe-medium.onnx',
    description: 'Clear male voice option with a slightly firmer tone.',
  },
] as const;

export const DEFAULT_PIPER_VOICE_ID = 'amy-medium';
export const DEFAULT_WHISPER_MODEL_FILENAME = 'ggml-base.en.bin';
export const DEFAULT_FLOOR_MODEL = 'google/gemma-4-e4b';
export const LEGACY_FLOOR_MODEL = 'nchapman/dolphin3.0-qwen2.5:3b';
export const LEGACY_FALLBACK_MODEL = 'dolphin3:8b';

export interface CuratedFloorModel {
  name: string;
  label: string;
  laneLabel: string;
  size: string;
  description: string;
  recommended: boolean;
}

export const CURATED_FLOOR_MODELS: readonly CuratedFloorModel[] = [
  {
    name: DEFAULT_FLOOR_MODEL,
    label: 'Gemma 4 4B',
    laneLabel: 'Primary lane',
    size: '5.3GB',
    description: 'Primary Gemma 4 setup for ModernClaw. Use this lane for the strongest supported local workspace experience.',
    recommended: true,
  },
] as const;

export function getCuratedVoiceById(id: string) {
  return CURATED_PIPER_VOICES.find((voice) => voice.id === id) ?? CURATED_PIPER_VOICES[0];
}

export function getCuratedFloorModelByName(name: string | null | undefined) {
  if (!name) {
    return null;
  }

  return CURATED_FLOOR_MODELS.find((model) => model.name === name) ?? null;
}

export function formatWorkspaceModelName(name: string | null | undefined) {
  const curated = getCuratedFloorModelByName(name);
  return curated ? curated.label : name ?? '';
}
