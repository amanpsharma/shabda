import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import useTheme from "../hooks/useTheme";
import { fetchWords } from "../lib/fetchWords";
import { addXP } from "../hooks/useXP";
import { unlockAchievement } from "../hooks/useAchievements";

const CATS = [
  { label: "All",       value: null       },
  { label: "Noun",      value: "noun"     },
  { label: "Adjective", value: "adjective"},
  { label: "Verb",      value: "verb"     },
  { label: "Phrase",    value: "phrase"   },
];

const DIFF_KEY = "shabda.difficulty";

function getDifficulty() {
  try { return JSON.parse(localStorage.getItem(DIFF_KEY) || "{}"); } catch { return {}; }
}
function saveDifficulty(map) {
  try { localStorage.setItem(DIFF_KEY, JSON.stringify(map)); } catch {}
}

// Weight hard/unknown words higher so they appear more often
function buildDeck(words, diffMap) {
  const deck = [];
  for (const w of words) {
    const d = diffMap[w._id] || "unknown";
    const repeat = d === "hard" ? 3 : d === "unknown" ? 2 : 1;
    for (let i = 0; i < repeat; i++) deck.push(w);
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export default function QuizPage() {
  const [allWords, setAllWords] = useState([]);
  const [deck, setDeck] = useState([]);
  const [poolSize, setPoolSize] = useState(0);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState({ known: 0, unknown: 0 });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [catFilter, setCatFilter] = useState(null);
  const [diffMap, setDiffMap] = useState({});
  const initDone = useRef(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setDiffMap(getDifficulty());
    fetchWords()
      .then((w) => setAllWords(w))
      .catch(() => setError("Could not load words. Check your connection."))
      .finally(() => setLoading(false));
  }, []);

  // Single effect handles both ?ids param and category filter
  useEffect(() => {
    if (!allWords.length) return;
    const map = getDifficulty();

    const params = new URLSearchParams(window.location.search);
    const indices = params.get("indices");
    if (indices && !initDone.current) {
      initDone.current = true;
      const pool = indices.split(",").map((i) => allWords[parseInt(i)]).filter(Boolean);
      if (pool.length) {
        setDeck(buildDeck(pool, map)); setPoolSize(pool.length);
        setCurrent(0); setFlipped(false); setScore({ known: 0, unknown: 0 }); setDone(false); return;
      }
    }

    const pool = catFilter ? allWords.filter((w) => w.category === catFilter) : allWords;
    setDeck(buildDeck(pool, map)); setPoolSize(pool.length);
    setCurrent(0); setFlipped(false); setScore({ known: 0, unknown: 0 }); setDone(false);
  }, [allWords, catFilter]);

  const word = deck[current];
  const counts = allWords.reduce((a, w) => { a[w.category] = (a[w.category] || 0) + 1; return a; }, {});

  const answer = useCallback((knew, diff) => {
    if (word) {
      const next = { ...getDifficulty(), [word._id]: diff };
      saveDifficulty(next);
      setDiffMap(next);
    }
    setScore((s) => ({ ...s, [knew ? "known" : "unknown"]: s[knew ? "known" : "unknown"] + 1 }));
    if (current + 1 >= deck.length) { setDone(true); }
    else { setCurrent((c) => c + 1); setFlipped(false); }
  }, [current, deck.length, word]);

  function restart() {
    const pool = catFilter ? allWords.filter((w) => w.category === catFilter) : allWords;
    setDeck(buildDeck(pool, getDifficulty())); setPoolSize(pool.length);
    setCurrent(0); setFlipped(false); setScore({ known: 0, unknown: 0 }); setDone(false);
  }

  const progress = deck.length ? Math.round((current / deck.length) * 100) : 0;

  return (
    <>
      <Head>
        <title>Quiz — SHABDA</title>
        <meta name="description" content="Test yourself on Hindi-English vocabulary with Shabda's flashcard quiz." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Vocabulary Quiz — SHABDA" />
        <meta property="og:description" content="Test yourself on Hindi-English vocabulary with Shabda's flashcard quiz." />
        <meta property="og:url" content="https://shabda.app/quiz" />
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
        ) : error ? (
          <div className="empty-state">
            <div className="empty-icon">⚠</div>
            <p className="empty-title">Could not load words</p>
            <p className="empty-sub">{error}</p>
            <button className="btn primary" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : done ? (
          <QuizDone score={score} total={deck.length} onRestart={restart} diffMap={diffMap} catFilter={catFilter} />
        ) : (
          <>
            <div className="cat-filter" style={{ marginBottom: 20 }}>
              {CATS.map(({ label, value }) => {
                const count = value ? (counts[value] || 0) : allWords.length;
                return (
                  <button key={label} className={`cat-btn${catFilter === value ? " active" : ""}`} onClick={() => setCatFilter(value)} aria-pressed={catFilter === value}>
                    {label}{count > 0 ? <span className="cat-count"> ({count})</span> : null}
                  </button>
                );
              })}
            </div>

            {!word ? (
              <div className="empty-state">
                <p className="empty-title">No words in this category</p>
                <button className="btn primary" onClick={() => setCatFilter(null)}>Show all</button>
              </div>
            ) : (
              <>
                <div className="quiz-meta">
                  <span className="quiz-counter">
                    {current + 1} / {poolSize} <span className="quiz-counter-sub">words</span>
                  </span>
                  <div className="quiz-progress-bar"><div className="quiz-progress-fill" style={{ width: `${progress}%` }} /></div>
                  <span className="quiz-score">✓ {score.known} · ✗ {score.unknown}</span>
                </div>

                {diffMap[word._id] && (
                  <div className="diff-badge-row">
                    <span className={`diff-badge diff-${diffMap[word._id]}`}>{diffMap[word._id]}</span>
                  </div>
                )}

                <div
                  className={`quiz-card${flipped ? " flipped" : ""}`}
                  onClick={() => !flipped && setFlipped(true)}
                  role="button" tabIndex={0}
                  aria-label={flipped ? `English: ${word.en.word}` : `Hindi: ${word.hi.word}. Press to reveal.`}
                  onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !flipped) { e.preventDefault(); setFlipped(true); } }}
                >
                  <div className="quiz-card-inner">
                    <div className="quiz-card-front">
                      <div className="pos">{word.hi.pos}</div>
                      <div className="word-hi" style={{ fontSize: "clamp(36px,8vw,64px)" }}>{word.hi.word}</div>
                      <div className="romanized">{word.hi.romanized}</div>
                      <p className="quiz-hint">Tap to reveal the English word</p>
                    </div>
                    <div className="quiz-card-back">
                      <div className="pos">{word.en.pos}</div>
                      <div className="word-en" style={{ fontSize: "clamp(32px,7vw,56px)" }}>{word.en.word}</div>
                      <div className="phonetic">{word.en.phonetic}</div>
                      <div className="divider"><span>meaning</span></div>
                      <p className="meaning" style={{ fontSize: 16 }}>{word.meaningEn}</p>
                    </div>
                  </div>
                </div>

                {flipped && (
                  <div className="quiz-actions">
                    <button className="btn quiz-btn-unknown" onClick={() => answer(false, "hard")} aria-label="Didn't know — mark as hard">
                      ✗ Hard
                    </button>
                    <button className="btn" onClick={() => answer(true, "medium")} aria-label="Knew it with some effort — mark as medium">
                      ~ Medium
                    </button>
                    <button className="btn quiz-btn-known" onClick={() => answer(true, "easy")} aria-label="Knew it easily — mark as easy">
                      ✓ Easy
                    </button>
                  </div>
                )}
                {!flipped && <p className="tagline" style={{ marginTop: 16 }}>Do you know this word in English?</p>}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

function saveQuizResult(known, total, category) {
  try {
    const history = JSON.parse(localStorage.getItem("shabda.quizHistory") || "[]");
    history.unshift({ date: new Date().toDateString(), known, total, category: category || "all", pct: Math.round((known / total) * 100) });
    localStorage.setItem("shabda.quizHistory", JSON.stringify(history.slice(0, 100)));
  } catch {}
}

function QuizDone({ score, total, onRestart, diffMap, catFilter }) {
  const pct = Math.round((score.known / total) * 100);
  const hardCount = Object.values(diffMap).filter((v) => v === "hard").length;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    saveQuizResult(score.known, total, catFilter);
    addXP(20);
    unlockAchievement("first-quiz");
    if (pct === 100) unlockAchievement("quiz-ace");
    const xp = parseInt(localStorage.getItem("shabda.xp") || "0");
    if (xp >= 50)  unlockAchievement("level-up");
    if (xp >= 100) unlockAchievement("century");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function copyChallenge() {
    const url = `${window.location.origin}/quiz`;
    navigator.clipboard.writeText(url)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
      .catch(() => {});
  }

  return (
    <div className="empty-state" style={{ paddingTop: 40 }}>
      <div className="empty-icon" style={{ fontSize: 56 }}>{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "📖"}</div>
      <p className="empty-title">Quiz complete!</p>
      <p className="empty-sub">You knew <strong>{score.known}</strong> of <strong>{total}</strong> words ({pct}%).</p>
      {hardCount > 0 && <p className="empty-sub" style={{ marginTop: 8 }}>🔴 {hardCount} word{hardCount !== 1 ? "s" : ""} marked hard — they'll appear more next time.</p>}
      {pct < 80 && <p className="empty-sub" style={{ marginTop: 8 }}>Keep practising — you'll get there.</p>}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
        <button className="btn primary" onClick={onRestart}>Try again</button>
        <button className="btn" onClick={copyChallenge}>{copied ? "✓ Copied!" : "🔗 Challenge a friend"}</button>
        <Link href="/" className="btn">← Home</Link>
      </div>
    </div>
  );
}
