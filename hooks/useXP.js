import { useState, useEffect } from "react";

export const LEVELS = [
  { name: "Shishya",    hi: "शिष्य",       min: 0,   max: 49  },
  { name: "Vidyarthi",  hi: "विद्यार्थी", min: 50,  max: 149 },
  { name: "Pandit",     hi: "पंडित",       min: 150, max: 349 },
  { name: "Acharya",    hi: "आचार्य",      min: 350, max: 699 },
  { name: "Guru",       hi: "गुरु",        min: 700, max: Infinity },
];

export function getLevel(xp) {
  return LEVELS.find((l) => xp >= l.min && xp <= l.max) || LEVELS[0];
}

export function getNextLevel(xp) {
  const idx = LEVELS.findIndex((l) => xp >= l.min && xp <= l.max);
  return idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export function addXP(amount) {
  try {
    const current = parseInt(localStorage.getItem("shabda.xp") || "0");
    const next = current + amount;
    localStorage.setItem("shabda.xp", String(next));
    return next;
  } catch { return 0; }
}

export function getXP() {
  try { return parseInt(localStorage.getItem("shabda.xp") || "0"); } catch { return 0; }
}

export default function useXP() {
  const [xp, setXp] = useState(0);

  useEffect(() => { setXp(getXP()); }, []);

  function award(amount) {
    const newXp = addXP(amount);
    setXp(newXp);
    return newXp;
  }

  const level = getLevel(xp);
  const nextLevel = getNextLevel(xp);
  const progress = nextLevel
    ? Math.round(((xp - level.min) / (nextLevel.min - level.min)) * 100)
    : 100;

  return { xp, level, nextLevel, progress, award };
}
