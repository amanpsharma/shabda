import { useEffect, useState } from "react";
import { addXP } from "./useXP";
import { unlockAchievement } from "./useAchievements";

const MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365];

export default function useStreak() {
  const [streak, setStreak] = useState(0);
  const [milestone, setMilestone] = useState(null);
  const [visitLog, setVisitLog] = useState([]);

  useEffect(() => {
    const today = new Date().toDateString();
    const last = localStorage.getItem("shabda.lastVisit");
    let s = parseInt(localStorage.getItem("shabda.streak") || "0");

    let log = [];
    try { log = JSON.parse(localStorage.getItem("shabda.visitLog") || "[]"); } catch {}

    if (last !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      s = last === yesterday ? s + 1 : 1;
      localStorage.setItem("shabda.lastVisit", today);
      localStorage.setItem("shabda.streak", String(s));

      // Award XP for daily visit
      addXP(10);

      // Unlock streak achievements
      if (s >= 3)  unlockAchievement("streak-3");
      if (s >= 7)  unlockAchievement("streak-7");
      if (s >= 30) unlockAchievement("streak-30");

      // Night owl achievement
      const hour = new Date().getHours();
      if (hour >= 22 || hour < 4) unlockAchievement("night-owl");

      if (MILESTONES.includes(s)) setMilestone(s);
    }

    // First visit achievement
    unlockAchievement("first-visit");

    if (!log.includes(today)) {
      log = [today, ...log].slice(0, 365);
      localStorage.setItem("shabda.visitLog", JSON.stringify(log));
    }

    setStreak(s);
    setVisitLog(log);
  }, []);

  return { streak, milestone, visitLog };
}
