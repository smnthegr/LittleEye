import type { PlaceSuggestion } from '../services/place-search';

/** Lightweight session cache, separate from the address directory/provider code. */
export function createPlaceSearchCache() {
  return {
    entries: new Map<string, { expires: number; results: PlaceSuggestion[] }>(),
    generation: 0,
    clear() { this.entries.clear(); this.generation++; },
  };
}

export const placeSearchCache = createPlaceSearchCache();
export function clearPlaceSearchCache() { placeSearchCache.clear(); }
