export function normalizeFoodName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(name: string): string[] {
  const normalized = normalizeFoodName(name);
  if (normalized === '') return [];
  return normalized.split(' ').filter((t) => t.length >= 2);
}

export function isExactMatch(matchKey: string, foodName: string): boolean {
  return normalizeFoodName(matchKey) === normalizeFoodName(foodName);
}

export function isFuzzyMatch(matchKey: string, foodName: string): boolean {
  const matchTokens = tokenize(matchKey);
  if (matchTokens.length === 0) return false;
  const nameTokens = new Set(tokenize(foodName));
  if (nameTokens.size === 0) return false;
  return matchTokens.every((t) => nameTokens.has(t));
}
