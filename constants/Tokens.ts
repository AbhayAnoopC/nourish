export type ColorScheme = 'light' | 'dark';

export interface TokenSet {
  bg: {
    primary: string;
    surface: string;
    surfaceMuted: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  accent: {
    primary: string;
    muted: string;
    pressed: string;
  };
  border: {
    hairline: string;
  };
  macro: {
    protein: string;
    carbs: string;
    fat: string;
  };
  status: {
    success: string;
    warning: string;
    danger: string;
  };
}

const light: TokenSet = {
  bg: {
    primary: '#FAFAF7',
    surface: '#FFFFFF',
    surfaceMuted: '#F4F2ED',
  },
  text: {
    primary: '#1A1A1A',
    secondary: '#6B6B66',
    tertiary: '#9C9A95',
  },
  accent: {
    primary: '#B8553A',
    muted: '#F4E5DD',
    pressed: '#9D4730',
  },
  border: {
    hairline: '#EFEDE8',
  },
  macro: {
    protein: '#7A4A3F',
    carbs: '#C49B5C',
    fat: '#8B7355',
  },
  status: {
    success: '#5B7A5E',
    warning: '#C48B3F',
    danger: '#A03A2E',
  },
};

const dark: TokenSet = {
  bg: {
    primary: '#14110E',
    surface: '#1F1A16',
    surfaceMuted: '#2A2420',
  },
  text: {
    primary: '#F0EDE8',
    secondary: '#9C958C',
    tertiary: '#6B655E',
  },
  accent: {
    primary: '#D26F50',
    muted: '#3A2A22',
    pressed: '#B8553A',
  },
  border: {
    hairline: '#2A2420',
  },
  macro: {
    protein: '#8C5C50',
    carbs: '#D2AC72',
    fat: '#9D866A',
  },
  status: {
    success: '#6F8E72',
    warning: '#D49E54',
    danger: '#B45044',
  },
};

export const Tokens: Record<ColorScheme, TokenSet> = { light, dark };
