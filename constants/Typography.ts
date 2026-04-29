import type { TextStyle } from 'react-native';

export const FontFamily = {
  fraunces: 'Fraunces_400Regular',
  frauncesMedium: 'Fraunces_500Medium',
  fraunces600: 'Fraunces_600SemiBold',
  inter: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemibold: 'Inter_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

export const Type: Record<string, TextStyle> = {
  displayHero: {
    fontFamily: FontFamily.fraunces,
    fontSize: 64,
    lineHeight: 64 * 1.05,
    letterSpacing: -0.5,
  },
  displayHeroSmall: {
    fontFamily: FontFamily.fraunces,
    fontSize: 48,
    lineHeight: 48 * 1.1,
    letterSpacing: -0.25,
  },
  displayTitle: {
    fontFamily: FontFamily.frauncesMedium,
    fontSize: 32,
    lineHeight: 32 * 1.15,
  },
  textXl: {
    fontFamily: FontFamily.interSemibold,
    fontSize: 20,
    lineHeight: 20 * 1.3,
  },
  textLg: {
    fontFamily: FontFamily.interMedium,
    fontSize: 17,
    lineHeight: 17 * 1.35,
  },
  textMd: {
    fontFamily: FontFamily.inter,
    fontSize: 15,
    lineHeight: 15 * 1.4,
  },
  textSm: {
    fontFamily: FontFamily.inter,
    fontSize: 13,
    lineHeight: 13 * 1.4,
  },
  textXs: {
    fontFamily: FontFamily.interSemibold,
    fontSize: 11,
    lineHeight: 11 * 1.4,
    letterSpacing: 0.8,
  },
  monoLg: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 17,
    lineHeight: 17 * 1.35,
  },
  monoMd: {
    fontFamily: FontFamily.mono,
    fontSize: 15,
    lineHeight: 15 * 1.4,
  },
  monoSm: {
    fontFamily: FontFamily.mono,
    fontSize: 13,
    lineHeight: 13 * 1.4,
  },
};
