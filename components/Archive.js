import { useState } from "react";
import { fetchWords } from "../lib/fetchWords";
import { EPOCH } from "../lib/constants";

const CATS = ["all", "noun", "adjective", "verb", "phrase"];
const PAGE = 7;

function computeArchiveEntries(words, count) {
  const entries = [];
  for (let i = 1; i <= count; i++) {
    const date = new Date(Date.now() - i * 86400000);
    const di = Math.floor((date.getTime() - EPOCH) / 86400000);
    const idx = di % words.length;
    entries.push({ word: words[idx], date: date.toISOString() });
  }
  return entries;
}

export default function Archive({ archive, onSelect, categoryFilter, onCategoryFilter }) {
  const [extended, setExtended] = useState(null); // null = not loaded, array = loaded
  const [loadingMore, setLoadingMore] = useState(false);

  const source = extended || archive;

  // Category counts across entire loaded set
  const counts = source.reduce((a, e) => {
    const c = e.word?.category;
    if (c) a[c] = (a[c] || 0) + 1;
    return a;
  }, {});

  const filtered =
    categoryFilter && categoryFilter !== "all"
      ? source.filter((a) => a.word?.category === categoryFilter)
      : source;

  async function loadMore() {
    setLoadingMore(true);
    try {
      const words = await fetchWords();
      setExtended(computeArchiveEntries(words, 30));
    } catch {}
    setLoadingMore(false);
  }

  return (
    <>
      <div className="section-title">Past words</div>

      <div className="cat-filter">
        {CATS.map((c) => (
          <button
            key={c}
            className={`cat-btn${categoryFilter === (c === "all" ? null : c) || (c === "all" && !categoryFilter) ? " active" : ""}`}
            onClick={() => onCategoryFilter(c === "all" ? null : c)}
            aria-pressed={c === "all" ? !categoryFilter : categoryFilter === c}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
            {c !== "all" && counts[c] ? <span className="cat-count"> ({counts[c]})</span> : null}
          </button>
        ))}
      </div>

      <div className="archive">
        {filtered.length === 0 ? (
          <p className="archive-empty">No words in this category this week.</p>
        ) : (
          filtered.map((a, i) => (
            <button
              key={a.date + i}
              className="arc-item"
              onClick={() => onSelect({ word: a.word, date: a.date })}
            >
              <div className="arc-date">
                {new Date(a.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              {a.word?.category && (
                <div className={`arc-cat arc-cat-${a.word.category}`}>{a.word.category}</div>
              )}
              <div className="arc-en">{a.word?.en?.word}</div>
              <div className="arc-hi">{a.word?.hi?.word}</div>
            </button>
          ))
        )}
      </div>

      {!extended && (
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button
            className="btn"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : "Load 30 days"}
          </button>
        </div>
      )}
    </>
  );
}
