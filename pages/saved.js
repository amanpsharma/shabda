import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchWords } from "../lib/fetchWords";
import useTheme from "../hooks/useTheme";

export default function SavedWords() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const savedIndices = (() => {
      try { return JSON.parse(localStorage.getItem("shabda.saved") || "[]"); }
      catch { return []; }
    })();

    if (!savedIndices.length) { setLoading(false); return; }

    fetchWords()
      .then((all) => {
        setWords(
          savedIndices
            .map((idx) => ({ word: all[parseInt(idx)], index: String(idx) }))
            .filter((item) => item.word)
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function remove(index) {
    setWords((prev) => prev.filter((w) => w.index !== index));
    const next = words.filter((w) => w.index !== index).map((w) => w.index);
    localStorage.setItem("shabda.saved", JSON.stringify(next));
  }

  const quizIndices = words.map((w) => w.index).filter((i) => i !== undefined).join(",");

  return (
    <>
      <Head>
        <title>Saved Words — SHABDA</title>
        <meta name="description" content="Your saved Hindi-English words from Shabda. Review and quiz yourself on your personal collection." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container">
        <div className="page-header">
          <Link href="/" className="back-link">← Today</Link>
          <div className="logo"><span className="dev">श</span>Shabda</div>
          <button className="nav-icon theme-btn page-header-right" onClick={toggleTheme} aria-label={theme === "dark" ? "Light mode" : "Dark mode"}>
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>

        {loading ? (
          <p className="tagline">Loading…</p>
        ) : words.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">♡</div>
            <p className="empty-title">No saved words yet</p>
            <p className="empty-sub">Tap ♡ on any word to save it here.</p>
            <Link href="/" className="btn primary" style={{ display: "inline-flex", marginTop: 20 }}>
              Go to today's word →
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 4 }}>
              <p className="tagline" style={{ margin: 0 }}>
                {words.length} word{words.length !== 1 ? "s" : ""} saved
              </p>
              {quizIndices && (
                <Link
                  href={`/quiz?indices=${quizIndices}`}
                  className="btn primary"
                  aria-label="Quiz yourself on your saved words"
                >
                  ✎ Quiz saved words
                </Link>
              )}
            </div>

            <div className="saved-grid">
              {words.map(({ word: w, index }) => (
                <div key={index} className="saved-card">
                  <div className="saved-card-top">
                    <span className="pos">{w.en.pos}</span>
                    <button
                      className="remove-btn"
                      onClick={() => remove(index)}
                      aria-label={`Remove ${w.en.word} from saved`}
                    >♥</button>
                  </div>
                  {w.category && (
                    <div style={{ marginBottom: 6 }}>
                      <span className={`arc-cat arc-cat-${w.category}`}>{w.category}</span>
                    </div>
                  )}
                  <div className="word-en" style={{ fontSize: 28 }}>{w.en.word}</div>
                  <div className="phonetic">{w.en.phonetic}</div>
                  <div className="word-hi" style={{ fontSize: 24, marginTop: 8 }}>{w.hi.word}</div>
                  <div className="romanized">{w.hi.romanized}</div>
                  <div className="divider"><span>meaning</span></div>
                  <p className="meaning" style={{ fontSize: 15 }}>{w.meaningEn}</p>
                  <p className="meaning-hi" style={{ fontSize: 14 }}>{w.meaningHi}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <footer>
          <p>Crafted for daily learners</p>
        </footer>
      </div>
    </>
  );
}
