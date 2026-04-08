export interface ContentGuidance {
  label: string;
  recommendedMinChars: number;
  recommendedMaxChars: number;
  softLimitChars: number;
  helper: string;
}

const guidanceMap: Record<string, ContentGuidance> = {
  'SOUL.md': {
    label: 'SOUL.md',
    recommendedMinChars: 1200,
    recommendedMaxChars: 5000,
    softLimitChars: 8000,
    helper: 'Keep personality and behavior sharp. Long enough to define the assistant clearly, short enough to stay usable in prompt context.',
  },
  'USER.md': {
    label: 'USER.md',
    recommendedMinChars: 600,
    recommendedMaxChars: 2500,
    softLimitChars: 4000,
    helper: 'Capture stable identity, household, preferences, and durable context. Avoid journaling here.',
  },
  'MEMORY.md': {
    label: 'MEMORY.md',
    recommendedMinChars: 500,
    recommendedMaxChars: 3000,
    softLimitChars: 4500,
    helper: 'Use this for durable facts, priorities, and active projects. Keep it curated rather than exhaustive.',
  },
  'daily-log': {
    label: 'Daily Log Entry',
    recommendedMinChars: 120,
    recommendedMaxChars: 1200,
    softLimitChars: 2000,
    helper: 'A daily log should be a focused note about what changed today, not a full journal chapter.',
  },
  'profile-answer': {
    label: 'Profile Answer',
    recommendedMinChars: 80,
    recommendedMaxChars: 600,
    softLimitChars: 1000,
    helper: 'Answer in a compact, reusable way so it can become part of the long-term user profile.',
  },
  'knowledge-file': {
    label: 'Knowledge File',
    recommendedMinChars: 500,
    recommendedMaxChars: 4000,
    softLimitChars: 8000,
    helper: 'Keep each knowledge file focused on one topic or source. Split very large references into multiple files.',
  },
};

export function getContentGuidance(key: string): ContentGuidance {
  return guidanceMap[key] ?? guidanceMap['MEMORY.md'];
}

export function getLengthState(length: number, guidance: ContentGuidance) {
  if (length > guidance.softLimitChars) {
    return 'over';
  }

  if (length < guidance.recommendedMinChars) {
    return 'short';
  }

  if (length > guidance.recommendedMaxChars) {
    return 'long';
  }

  return 'good';
}

export function formatCharacterRange(guidance: ContentGuidance) {
  return `${formatCount(guidance.recommendedMinChars)}-${formatCount(guidance.recommendedMaxChars)} chars`;
}

export function formatSoftLimit(guidance: ContentGuidance) {
  return `${formatCount(guidance.softLimitChars)} chars`;
}

function formatCount(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}
