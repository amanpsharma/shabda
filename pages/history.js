import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import useTheme from "../hooks/useTheme";
import WordModal from "../components/WordModal";
import { fetchWords } from "../lib/fetchWords";
import { EPOCH } from "../lib/constants";

const PAGE_SIZE = 30;

function computeHistory(words, count) {
  const entries = [];
  for (let i = 1; i <= count; i++) {
    const date = new Date(Date.now() - i * 86400000);
    const di = Math.floor((date.getTime() - EPOCH) / 86400000);
    entries.push({ word: words[di % words.length], date: date.toISOString() });
  }
  return entries;
}

export default function HistoryPage() {
  const [allWords, setAllWords] = useState([]);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchWords()
      .then((w) => {
        setAllWords(w);
        setHistory(computeHistory(w, PAGE_SIZE));
      })
      .catch(() => setError("Could not load history."))
      .finally(() => setLoading(false));
  }, []);

  function loadMore() {
    const nextPage = page + 1;
    setHistory(computeHistory(allWords, nextPage * PAGE_SIZE));
    setPage(nextPage);
  }

  return (
    <>
      <Head>
        <title>History — SHABDA</title>
        <meta
          name="description"
          content="Browse all past Shabda words in reverse chronological order — your vocabulary diary."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Word History — SHABDA" />
        <meta
          property="og:description"
          content="Browse all past Shabda words in reverse chronological order — your vocabulary diary."
        />
        <meta property="og:url" content="https://shabda.app/history" />
      </Head>

      <div className="container">
        <div className="page-header">
          <Link href="/" className="back-link">
            ← Today
          </Link>
          <div className="logo">
            <span className="dev">श</span>Shabda
          </div>
          <button
            className="nav-icon theme-btn page-header-right"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>

        <h1 className="section-title" style={{ marginBottom: 4 }}>
          Word History
        </h1>
        <p className="tagline" style={{ marginBottom: 20 }}>
          Every word, in order. Your vocabulary diary.
        </p>

        {loading && <p className="tagline">Loading…</p>}

        {error && (
          <div className="empty-state">
            <p className="empty-title">Could not load history</p>
            <p className="empty-sub">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="history-list">
              {history.map((entry, i) => (
                <button
                  key={entry.date + i}
                  className="history-item"
                  onClick={() =>
                    setModal({ word: entry.word, date: entry.date })
                  }
                >
                  <div className="history-date">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="history-words">
                    <span className="history-en">{entry.word?.en?.word}</span>
                    {entry.word?.category && (
                      <span
                        className={`arc-cat arc-cat-${entry.word.category}`}
                      >
                        {entry.word.category}
                      </span>
                    )}
                    <span className="history-hi">{entry.word?.hi?.word}</span>
                  </div>
                  <p className="history-meaning">{entry.word?.meaningEn}</p>
                </button>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button className="btn" onClick={loadMore}>
                Load {PAGE_SIZE} more days
              </button>
            </div>
          </>
        )}
      </div>

      <WordModal modal={modal} onClose={() => setModal(null)} />
    </>
  );
}
