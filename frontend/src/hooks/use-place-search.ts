import { useCallback, useEffect, useRef, useState } from 'react';
import { searchPlaces, type PlaceSuggestion } from '@/services/place-search';

export function usePlaceSearch(query: string, active: boolean) {
  const [result, setResult] = useState<{ query: string; suggestions: PlaceSuggestion[]; status: 'ready' | 'error' }>();
  const generation = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancel = useCallback(() => {
    generation.current++;
    pending.current?.abort();
    if (timer.current) clearTimeout(timer.current);
    setResult(undefined);
  }, []);
  useEffect(() => {
    const version = ++generation.current;
    const controller = new AbortController();
    pending.current = controller;
    if (!active || query.trim().length < 3 || query.trim().length > 250) return () => controller.abort();
    const debounce = setTimeout(() => {
      if (generation.current !== version || controller.signal.aborted) return;
      searchPlaces(query, controller.signal).then(results => {
        if (generation.current !== version || controller.signal.aborted) return;
        setResult({ query, suggestions: results, status: 'ready' });
      }).catch(() => {
        if (generation.current === version && !controller.signal.aborted) setResult({ query, suggestions: [], status: 'error' });
      });
    }, 550);
    timer.current = debounce;
    return () => { controller.abort(); clearTimeout(debounce); };
  }, [active, query]);
  const searching = active && query.trim().length >= 3 && query.trim().length <= 250;
  return { suggestions: searching && result?.query === query ? result.suggestions : [],
    status: !searching ? 'idle' : result?.query === query ? result.status : 'loading', cancel };
}
