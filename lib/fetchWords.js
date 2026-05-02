// Client-side word fetcher with in-memory caching.
// The module-level cache prevents duplicate /api/words calls within a single
// tab session. It resets on page refresh, so data is always fresh on each visit.

let memCache = null;

export async function fetchWords() {
  if (memCache) return memCache;
  const res = await fetch("/api/words");
  if (!res.ok) throw new Error("Failed to load words");
  const words = await res.json();
  memCache = words;
  return words;
}

export function bustWordsCache() {
  memCache = null;
}
