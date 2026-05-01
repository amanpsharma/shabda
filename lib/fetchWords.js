// Client-side word fetcher with in-memory + sessionStorage caching.
// All pages (quiz, search, saved) use this so /api/words is fetched at most once per session.

let memCache = null;

export async function fetchWords() {
  if (memCache) return memCache;
  try {
    const stored = sessionStorage.getItem("shabda.words");
    if (stored) {
      memCache = JSON.parse(stored);
      return memCache;
    }
  } catch {}
  const res = await fetch("/api/words");
  if (!res.ok) throw new Error("Failed to load words");
  const words = await res.json();
  memCache = words;
  try {
    sessionStorage.setItem("shabda.words", JSON.stringify(words));
  } catch {}
  return words;
}

export function bustWordsCache() {
  memCache = null;
  try {
    sessionStorage.removeItem("shabda.words");
  } catch {}
}
