export type CustomAmountUnit = 'g' | 'ml' | 'oz';

const GRAMS_PER_OZ = 28.349523125;

export function parseCustomAmount(
  value: number,
  unit: CustomAmountUnit,
  gramsPerMl?: number,
): number {
  let grams: number;
  switch (unit) {
    case 'g':
      grams = value;
      break;
    case 'oz':
      grams = value * GRAMS_PER_OZ;
      break;
    case 'ml':
      if (gramsPerMl === undefined) {
        throw new Error(
          'parseCustomAmount: density (gramsPerMl) is required when converting ml',
        );
      }
      grams = value * gramsPerMl;
      break;
  }
  return Math.round(grams * 10) / 10;
}
