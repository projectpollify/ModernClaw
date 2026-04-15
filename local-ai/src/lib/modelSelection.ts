export function isRecommendedModelName(name: string | null | undefined) {
  const normalized = name?.trim().toLowerCase();
  return Boolean(normalized && (normalized.includes('gemma4') || normalized.includes('gemma-4')));
}

export function resolvePreferredModelName(
  preferred: string | null | undefined,
  modelNames: string[]
) {
  const normalizedNames = modelNames.filter(Boolean);
  if (normalizedNames.length === 0) {
    return preferred ?? null;
  }

  if (preferred && normalizedNames.includes(preferred)) {
    return preferred;
  }

  const preferredLower = preferred?.toLowerCase() ?? '';
  if (preferredLower) {
    const fuzzyMatch = normalizedNames.find((name) => name.toLowerCase().includes(preferredLower));
    if (fuzzyMatch) {
      return fuzzyMatch;
    }
  }

  const gemmaMatch = normalizedNames.find((name) => isRecommendedModelName(name));
  if (gemmaMatch) {
    return gemmaMatch;
  }

  return normalizedNames[0] ?? null;
}
