export function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

export function fuzzyMatch(input: string, candidate: string): boolean {
  const a = normalize(input);
  const b = normalize(candidate);
  if (!a || !b) return false;
  return b.includes(a) || a.includes(b);
}

export function findClosestMatch(
  input: string,
  candidates: string[]
): string | null {
  const a = normalize(input);
  if (!a) return null;
  return (
    candidates.find((c) => {
      const b = normalize(c);
      return b.includes(a) || a.includes(b);
    }) ?? null
  );
}
