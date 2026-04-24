import { useCallback, useRef, useState } from 'react';
import { searchFoods } from '@/services/usda';
import { searchFoodsByName } from '@/services/openFoodFacts';
import { SearchResult } from '@/types';

interface UseFoodSearchReturn {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  setQuery: (q: string) => void;
  clear: () => void;
}

const DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 2;

export function useFoodSearch(): UseFoodSearchReturn {
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [usdaSettled, offSettled] = await Promise.allSettled([
        searchFoods(trimmed),
        searchFoodsByName(trimmed),
      ]);

      const combined: SearchResult[] = [];
      if (usdaSettled.status === 'fulfilled') combined.push(...usdaSettled.value);
      if (offSettled.status === 'fulfilled') combined.push(...offSettled.value);

      setResults(combined);

      if (combined.length === 0) {
        setError('No results found. Try a different search term.');
      }
    } catch (err) {
      console.error('[useFoodSearch] runSearch error:', err);
      setError('Search failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      if (q.trim().length < MIN_QUERY_LENGTH) {
        setResults([]);
        setError(null);
        return;
      }

      debounceTimer.current = setTimeout(() => runSearch(q), DEBOUNCE_MS);
    },
    [runSearch],
  );

  const clear = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setQueryState('');
    setResults([]);
    setError(null);
  }, []);

  return { query, results, loading, error, setQuery, clear };
}
