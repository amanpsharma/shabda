import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import useTheme from "../hooks/useTheme";
import { getLevel, getNextLevel, LEVELS } from "../hooks/useXP";
import { getEarned, ALL_ACHIEVEMENTS } from "../hooks/useAchievements";

function getStats() {
  try {
    return {
      streak: parseInt(localStorage.getItem("shabda.streak") || "0"),
      xp: parseInt(localStorage.getItem("shabda.xp") || "0"),
      visitLog: JSON.parse(localStorage.getItem("shabda.visitLog") || "[]"),
      saved: JSON.parse(localStorage.getItem("shabda.saved") || "[]"),
      quizHistory: JSON.parse(localStorage.getItem("shabda.quizHistory") || "[]"),
      diffMap: JSON.parse(localStorage.getItem("shabda.difficulty") || "{}"),
    };
  } catch { return { streak: 0, xp: 0, visitLog: [], saved: [], quizHistory: [], diffMap: {} }; }
}

function Heatmap({ visitLog }) {
  const cells = [];
  const visitSet = new Set(visitLog);
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    cells.push({ date: d.toDateString(), label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) });
  }
  return (
    <div className="heatmap" aria-label="365-day visit heatmap">
      {cells.map((c) => (
        <div
          key={c.date}
          className={`heatmap-cell${visitSet.has(c.date) ? " visited" : ""}`}
          title={c.label + (visitSet.has(c.date) ? " ✓" : "")}
        />
      ))}
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const [earned, setEarned] = useState([]);

  useEffect(() => {
    setStats(getStats());
    setEarned(getEarned());
  }, []);

  if (!stats) return null;

  const level = getLevel(stats.xp);
  const nextLevel = getNextLevel(stats.xp);
  const levelProgress = nextLevel ? Math.round(((stats.xp - level.min) / (nextLevel.min - level.min)) * 100) : 100;

  const totalQuizzes = stats.quizHistory.length;
  const avgAccuracy = totalQuizzes
    ? Math.round(stats.quizHistory.reduce((s, q) => s + (q.known / q.total) * 100, 0) / totalQuizzes)
    : 0;

  const hardWords = Object.values(stats.diffMap).filter((v) => v === "hard").length;
  const easyWords = Object.values(stats.diffMap).filter((v) => v === "easy").length;

  return (
    <>
      <Head>
        <title>My Stats — SHABDA</title>
        <meta name="description" content="Your personal Shabda vocabulary statistics and progress." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="container">
        <div className="page-header">
          <Link href="/" className="back-link">← Today</Link>
          <div className="logo"><span className="dev">श</span>Shabda</div>
          <button className="nav-icon theme-btn page-header-right" onClick={toggleTheme} aria-label={theme === "dark" ? "Light mode" : "Dark mode"}>
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>

        <h1 className="section-title" style={{ marginBottom: 20 }}>My Progress</h1>

        {/* Level card */}
        <div className="stats-level-card">
          <div className="stats-level-label">{level.hi}</div>
          <div className="stats-level-name">{level.name}</div>
          <div className="stats-xp">{stats.xp} XP</div>
          <div className="stats-xp-bar-wrap">
            <div className="stats-xp-bar" style={{ width: `${levelProgress}%` }} />
          </div>
          {nextLevel && (
            <p className="stats-xp-next">{nextLevel.min - stats.xp} XP to {nextLevel.name}</p>
          )}
        </div>

        {/* Stats grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-num">{stats.streak}</div>
            <div className="stat-label">Day streak</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats.visitLog.length}</div>
            <div className="stat-label">Days visited</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats.saved.length}</div>
            <div className="stat-label">Words saved</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{totalQuizzes}</div>
            <div className="stat-label">Quizzes done</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{totalQuizzes ? `${avgAccuracy}%` : "—"}</div>
            <div className="stat-label">Quiz accuracy</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{earned.length}/{ALL_ACHIEVEMENTS.length}</div>
            <div className="stat-label">Achievements</div>
          </div>
        </div>

        {/* Quiz difficulty breakdown */}
        {Object.keys(stats.diffMap).length > 0 && (
          <>
            <h2 className="section-title" style={{ marginTop: 40 }}>Word difficulty</h2>
            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
              <div className="stat-card"><div className="stat-num" style={{ color: "#2d7a3a" }}>{easyWords}</div><div className="stat-label">Easy</div></div>
              <div className="stat-card"><div className="stat-num" style={{ color: "#8a6a10" }}>{Object.values(stats.diffMap).filter((v) => v === "medium").length}</div><div className="stat-label">Medium</div></div>
              <div className="stat-card"><div className="stat-num" style={{ color: "#a02020" }}>{hardWords}</div><div className="stat-label">Hard</div></div>
            </div>
          </>
        )}

        {/* Heatmap */}
        <h2 className="section-title" style={{ marginTop: 40, marginBottom: 12 }}>365-day activity</h2>
        <Heatmap visitLog={stats.visitLog} />
        <p className="tagline" style={{ marginTop: 8, fontSize: 12 }}>Each cell = one day · filled = visited</p>

        {/* Recent quiz history */}
        {stats.quizHistory.length > 0 && (
          <>
            <h2 className="section-title" style={{ marginTop: 40, marginBottom: 8 }}>Recent quizzes</h2>
            <div className="quiz-history-list">
              {stats.quizHistory.slice(0, 10).map((q, i) => (
                <div key={i} className="quiz-history-row">
                  <span className="quiz-history-date">{q.date}</span>
                  <span className="quiz-history-score">{q.known}/{q.total}</span>
                  <span className={`quiz-history-pct ${q.pct >= 80 ? "good" : q.pct >= 50 ? "ok" : "low"}`}>{q.pct}%</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link href="/achievements" className="btn">🏆 View achievements</Link>
        </div>
      </div>
    </>
  );
}
