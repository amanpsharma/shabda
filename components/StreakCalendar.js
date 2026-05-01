// Shows last 28 days as a grid; visited days are filled with accent colour.
export default function StreakCalendar({ visitLog, streak }) {
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(Date.now() - (27 - i) * 86400000);
    return { dateStr: d.toDateString(), label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) };
  });

  const visited = new Set(visitLog);

  return (
    <div className="streak-cal-wrap">
      <div className="streak-cal-label">
        <span>🔥 {streak}-day streak</span>
        <span className="streak-cal-sub">Last 28 days</span>
      </div>
      <div className="streak-cal">
        {days.map(({ dateStr, label }) => (
          <div
            key={dateStr}
            className={`streak-dot${visited.has(dateStr) ? " visited" : ""}`}
            title={label}
            aria-label={`${label}: ${visited.has(dateStr) ? "visited" : "missed"}`}
          />
        ))}
      </div>
    </div>
  );
}
