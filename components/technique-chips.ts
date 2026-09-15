const LOOKS_LIKE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Labels for technique pills: free-text notes plus resolved names. Never raw UUIDs. */
export function techniqueChipLabels(
  freeText: string | null | undefined,
  resolvedNames: string[],
): string[] {
  const labels: string[] = [];
  const text = freeText?.trim() ?? '';
  if (text && !LOOKS_LIKE_ID.test(text)) {
    labels.push(text);
  }

  const seen = new Set(labels.map((label) => label.toLowerCase()));
  for (const name of resolvedNames) {
    const trimmed = name.trim();
    if (!trimmed || LOOKS_LIKE_ID.test(trimmed)) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    if (text && text.toLowerCase().includes(key)) continue;
    seen.add(key);
    labels.push(trimmed);
  }

  return labels;
}
