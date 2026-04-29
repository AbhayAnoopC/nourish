import { useColorScheme } from '@/components/useColorScheme';
import { Tokens } from '@/constants/Tokens';
import type { TokenSet } from '@/constants/Tokens';

export function useTokens(): TokenSet {
  const scheme = useColorScheme();
  return Tokens[scheme];
}
