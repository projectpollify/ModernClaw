export interface VoiceOutputStatus {
  available: boolean;
  piperFound: boolean;
  modelFound: boolean;
  executablePath?: string | null;
  modelPath?: string | null;
  notes: string[];
}

export interface VoiceInputStatus {
  available: boolean;
  whisperFound: boolean;
  modelFound: boolean;
  executablePath?: string | null;
  modelPath?: string | null;
  notes: string[];
}
