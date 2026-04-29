import { Easing } from 'react-native-reanimated';

export const Duration = {
  fast: 150,
  base: 200,
  medium: 300,
  slow: 600,
} as const;

export const Easings = {
  easeOut: Easing.out(Easing.ease),
  easeIn: Easing.in(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
} as const;

export const Springs = {
  arc: { stiffness: 180, damping: 20, mass: 1 },
  bar: { stiffness: 160, damping: 22, mass: 1 },
  wave: { stiffness: 140, damping: 18, mass: 1 },
} as const;

export const PressScale = {
  scaleTo: 0.94,
  pressDuration: 80,
  releaseDuration: 150,
} as const;
