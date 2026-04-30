export const ML_PER_UNIT = {
  ml: 1,
  cup: 236.588,
  tbsp: 14.7868,
  tsp: 4.92892,
  'fl oz': 29.5735,
} as const;

export type VolumeUnit = keyof typeof ML_PER_UNIT;

export function modifierToMl(modifier: string): number | null {
  const lc = modifier.toLowerCase();
  // Order matters: longer matches first (e.g., "tablespoon" before "ml")
  if (lc.includes('fluid ounce') || lc.includes('fl oz') || lc.includes('fl. oz')) {
    return ML_PER_UNIT['fl oz'];
  }
  if (lc.includes('tablespoon') || /\btbsp\b/.test(lc)) {
    return ML_PER_UNIT.tbsp;
  }
  if (lc.includes('teaspoon') || /\btsp\b/.test(lc)) {
    return ML_PER_UNIT.tsp;
  }
  if (/\bcup\b/.test(lc)) {
    return ML_PER_UNIT.cup;
  }
  if (/\bml\b/.test(lc)) {
    return ML_PER_UNIT.ml;
  }
  return null;
}
