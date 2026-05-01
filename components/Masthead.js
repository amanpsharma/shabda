import Link from "next/link";

export default function Masthead({ dateStr, wordIndex, streak, theme, onToggleTheme }) {
  return (
    <div className="masthead">
      <div className="left">{dateStr}</div>
      <div className="logo">
        <span className="dev">श</span>Shabda
      </div>
      <div className="right">
        <Link href="/search" className="nav-icon" title="Search words" aria-label="Search">
          ⌕
        </Link>
        <Link href="/quiz" className="nav-icon" title="Quiz mode" aria-label="Quiz">
          ✎
        </Link>
        <button
          className="nav-icon theme-btn"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
        <span className="nav-sep">·</span>
        № {String(wordIndex + 1).padStart(3, "0")} ·{" "}
        <span className="streak">🔥 {streak}</span>
      </div>
    </div>
  );
}
