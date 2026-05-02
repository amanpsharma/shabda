import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import useTheme from "../hooks/useTheme";
import { ALL_ACHIEVEMENTS, getEarned } from "../hooks/useAchievements";

export default function AchievementsPage() {
  const [earned, setEarned] = useState([]);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => { setEarned(getEarned()); }, []);

  const unlockedCount = earned.length;
  const totalCount = ALL_ACHIEVEMENTS.length;
  const pct = Math.round((unlockedCount / totalCount) * 100);

  return (
    <>
      <Head>
        <title>Achievements — SHABDA</title>
        <meta name="description" content="Track your Shabda achievements and vocabulary milestones." />
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

        <h1 className="section-title" style={{ marginBottom: 4 }}>Achievements</h1>
        <p className="tagline" style={{ marginBottom: 8 }}>
          {unlockedCount} of {totalCount} unlocked
        </p>

        {/* Progress bar */}
        <div className="ach-progress-wrap">
          <div className="ach-progress-bar" style={{ width: `${pct}%` }} />
        </div>

        <div className="ach-grid">
          {ALL_ACHIEVEMENTS.map((ach) => {
            const isUnlocked = earned.includes(ach.id);
            return (
              <div key={ach.id} className={`ach-card${isUnlocked ? " unlocked" : ""}`}>
                <div className="ach-emoji">{isUnlocked ? ach.emoji : "🔒"}</div>
                <div className="ach-label">{ach.label}</div>
                <div className="ach-desc">{isUnlocked ? ach.desc : "Keep going to unlock this"}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
