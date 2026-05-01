import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useTheme from "../hooks/useTheme";
import WordModal from "../components/WordModal";
import { fetchWords } from "../lib/fetchWords";

// Common Devanagari characters for the soft keyboard
const HINDI_KEYS = [
  ["अ","आ","इ","ई","उ","ऊ","ए","ऐ","ओ","औ","अं","अः"],
  ["क","ख","ग","घ","च","छ","ज","झ","ट","ठ","ड","ढ"],
  ["त","थ","द","ध","न","प","फ","ब","भ","म","य","र"],
  ["ल","व","श","ष","स","ह","क्ष","त्र","ज्ञ","ं","ा","्"],
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [allWords, setAllWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [catFilter, setCatFilter] = useState(null);
  const [showHindiKb, setShowHindiKb] = useState(false);
  const inputRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchWords()
      .then((w) => setAllWords(w))
      .catch(() => setError("Could not load words. Check your connection."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { inputRef.current?.focus(); }, [loading]);

  const q = query.trim().toLowerCase();
  const catWords = catFilter ? allWords.filter((w) => w.category === catFilter) : allWords;
  const results = q
    ? catWords.filter((w) =>
        w.en.word.toLowerCase().includes(q) ||
        w.hi.word.includes(query.trim()) ||
        w.meaningEn.toLowerCase().includes(q) ||
        w.hi.romanized.toLowerCase().includes(q)
      )
    : catFilter ? catWords : [];

  const counts = allWords.reduce((a, w) => { a[w.category] = (a[w.category] || 0) + 1; return a; }, {});

  function appendChar(ch) {
    setQuery((q) => q + ch);
    inputRef.current?.focus();
  }

  return (
    <>
      <Head>
        <title>Search — SHABDA</title>
        <meta name="description" content="Search all Hindi-English words in the Shabda library by English, Hindi, or meaning." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Search Words — SHABDA" />
        <meta property="og:description" content="Search all Hindi-English words in the Shabda library by English, Hindi, or meaning." />
        <meta property="og:url" content="https://shabda.app/search" />
      </Head>

      <div className="container">
        <div className="page-header">
          <Link href="/" className="back-link">← Today</Link>
          <div className="logo"><span className="dev">श</span>Shabda</div>
          <button className="nav-icon theme-btn page-header-right" onClick={toggleTheme} aria-label={theme === "dark" ? "Light mode" : "Dark mode"}>
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>

        <div className="cat-filter">
          {[["All", null], ["Noun", "noun"], ["Adjective", "adjective"], ["Verb", "verb"]].map(([label, val]) => (
            <button key={label} className={`cat-btn${catFilter === val ? " active" : ""}`} onClick={() => setCatFilter(val)} aria-pressed={catFilter === val}>
              {label}{val && counts[val] ? <span className="cat-count"> ({counts[val]})</span> : null}
            </button>
          ))}
        </div>

        <div className="search-bar">
          <input
            ref={inputRef}
            className="search-input"
            type="search"
            placeholder="Type in English or हिंदी…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck="false"
            aria-label="Search words"
          />
          <button
            className={`search-kb-btn${showHindiKb ? " active" : ""}`}
            onClick={() => setShowHindiKb((v) => !v)}
            title="Hindi keyboard"
            aria-label="Toggle Hindi keyboard"
            aria-pressed={showHindiKb}
          >
            क
          </button>
          {query && <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear search">✕</button>}
        </div>

        {showHindiKb && (
          <div className="hindi-kb" aria-label="Hindi soft keyboard">
            {HINDI_KEYS.map((row, ri) => (
              <div key={ri} className="hindi-kb-row">
                {row.map((ch) => (
                  <button key={ch} className="hindi-kb-key" onClick={() => appendChar(ch)} aria-label={`Type ${ch}`}>{ch}</button>
                ))}
              </div>
            ))}
            <button className="hindi-kb-clear" onClick={() => setQuery((q) => q.slice(0, -1))} aria-label="Backspace">⌫</button>
          </div>
        )}

        {loading && <p className="tagline">Loading…</p>}

        {error && (
          <div className="empty-state">
            <div className="empty-icon">⚠</div>
            <p className="empty-title">Could not load words</p>
            <p className="empty-sub">{error}</p>
            <button className="btn primary" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        {!loading && !error && !q && !catFilter && (
          <p className="tagline">{allWords.length} words in the library. Type or pick a category.</p>
        )}

        {!loading && !error && (q || catFilter) && results.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">⌕</div>
            <p className="empty-title">No results{q ? ` for "${query}"` : ""}</p>
            <p className="empty-sub">Try another spelling, use the Hindi keyboard, or pick a different category.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="search-results">
            {results.map((w) => (
              <button key={w._id || w.en.word} className="search-result-item" onClick={() => setModal({ word: w, date: null })}>
                <div className="search-en">
                  {w.en.word}
                  {w.category && <span className={`arc-cat arc-cat-${w.category}`}>{w.category}</span>}
                </div>
                <div className="search-sub">
                  <span className="phonetic">{w.en.phonetic}</span>
                  <span className="search-hi">{w.hi.word}</span>
                </div>
                <p className="search-meaning">{w.meaningEn}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <WordModal modal={modal} onClose={() => setModal(null)} />
    </>
  );
}
