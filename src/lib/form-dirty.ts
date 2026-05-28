/** Sérialisation stable pour comparer brouillon vs snapshot à l'ouverture. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value);
}

export function isDirtyComparedToSnapshot(
  current: unknown,
  snapshot: string | null
): boolean {
  if (!snapshot) return false;
  return stableStringify(current) !== snapshot;
}
