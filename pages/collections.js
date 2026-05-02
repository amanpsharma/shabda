import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import useTheme from "../hooks/useTheme";
import WordModal from "../components/WordModal";
import { fetchWords } from "../lib/fetchWords";
import { COLLECTIONS } from "../lib/collections";
import { unlockAchievement } from "../hooks/useAchievements";

export default function CollectionsPage() {
  const [allWords, setAllWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(null);
  const [modal, setModal] = useState(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchWords()
      .then((w) => setAllWords(w))
      .catch(() => setError("Could not load words. Check your connection."))
      .finally(() => setLoading(false));
  }, []);

  function openCollection(col) {
    setActive(col);
    unlockAchievement("explorer");
  }

  const activeWords = active ? allWords.filter(active.filter) : [];

  function startQuiz() {
    if (!activeWords.length) return;
    const indices = activeWords.map((w) => allWords.indexOf(w)).filter((i) => i >= 0);
    window.location.href = `/quiz?indices=${indices.join(",")}`;
  }

  return (
    <>
      <Head>
        <title>Collections — SHABDA</title>
        <meta name="description" content="Themed word collections to practise specific vocabulary sets." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Word Collections — SHABDA" />
        <meta property="og:description" content="Themed word collections to practise specific vocabulary sets." />
        <meta property="og:url" content="https://shabda.app/collections" />
      </Head>

      <div className="container">
        <div className="page-header">
          <Link href="/" className="back-link">← Today</Link>
          <div className="logo"><span className="dev">श</span>Shabda</div>
          <button className="nav-icon theme-btn page-header-right" onClick={toggleTheme} aria-label={theme === "dark" ? "Light mode" : "Dark mode"}>
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>

        <h1 className="section-title" style={{ marginBottom: 4 }}>Collections</h1>
        <p className="tagline" style={{ marginBottom: 24 }}>Themed sets to deepen your vocabulary.</p>

        {loading && <p className="tagline">Loading…</p>}
        {error && <div className="empty-state"><p className="empty-title">{error}</p></div>}

        {!loading && !error && !active && (
          <div className="col-grid">
            {COLLECTIONS.map((col) => {
              const count = allWords.filter(col.filter).length;
              if (!count) return null;
              return (
                <button key={col.id} className="col-card" onClick={() => openCollection(col)}>
                  <div className="col-emoji">{col.emoji}</div>
                  <div className="col-label">{col.label}</div>
                  <div className="col-desc">{col.desc}</div>
                  <div className="col-count">{count} word{count !== 1 ? "s" : ""}</div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && !error && active && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <button className="back-link" onClick={() => setActive(null)}>← Collections</button>
              <span className="section-title" style={{ margin: 0 }}>{active.emoji} {active.label}</span>
            </div>
            <p className="tagline" style={{ marginBottom: 16 }}>{active.desc} · {activeWords.length} words</p>

            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <button className="btn primary" onClick={startQuiz} disabled={!activeWords.length}>
                ▶ Quiz this set
              </button>
            </div>

            <div className="col-word-list">
              {activeWords.map((w) => (
                <button key={w._id} className="history-item" onClick={() => setModal({ word: w, date: null })}>
                  <div className="history-words">
                    <span className="history-en">{w.en.word}</span>
                    {w.category && <span className={`arc-cat arc-cat-${w.category}`}>{w.category}</span>}
                    <span className="history-hi">{w.hi.word}</span>
                  </div>
                  <p className="history-meaning">{w.meaningEn}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <WordModal modal={modal} onClose={() => setModal(null)} />
    </>
  );
}
