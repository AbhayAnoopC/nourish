export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const BORDER_RADIUS = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const MAX_WATER_ML = 5000;
export const DEFAULT_WATER_TARGET_ML = 2000;
export const WATER_INCREMENT_ML = 250;
export const MAX_VOICE_RECORDING_SECONDS = 30;
export const MAX_IMAGE_SIZE_BYTES = 1_048_576; // 1MB
