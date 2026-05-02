import { useState, useEffect } from "react";

const ACH_KEY = "shabda.achievements";
const ACH_NEW_KEY = "shabda.newAchievements";

export const ALL_ACHIEVEMENTS = [
  { id: "first-visit",   emoji: "🌱", label: "First Step",          desc: "Visit Shabda for the first time" },
  { id: "first-save",    emoji: "❤️", label: "Collector",            desc: "Save your first word" },
  { id: "first-quiz",    emoji: "📝", label: "Quiz Taker",           desc: "Complete your first quiz" },
  { id: "first-share",   emoji: "↗️", label: "Sharer",               desc: "Share a word with someone" },
  { id: "streak-3",      emoji: "🔥", label: "3-Day Streak",         desc: "Visit 3 days in a row" },
  { id: "streak-7",      emoji: "⚡", label: "Week Warrior",         desc: "Visit 7 days in a row" },
  { id: "streak-30",     emoji: "🌙", label: "Month Master",         desc: "Visit 30 days in a row" },
  { id: "saved-10",      emoji: "📚", label: "Word Hoard",           desc: "Save 10 or more words" },
  { id: "saved-25",      emoji: "🏆", label: "Vocabulary Builder",   desc: "Save 25 or more words" },
  { id: "quiz-ace",      emoji: "🎯", label: "Perfect Score",        desc: "Score 100% on a quiz" },
  { id: "night-owl",     emoji: "🦉", label: "Night Owl",            desc: "Study after 10pm" },
  { id: "explorer",      emoji: "🔍", label: "Explorer",             desc: "Use the search feature" },
  { id: "level-up",      emoji: "⬆️", label: "Level Up",            desc: "Reach Vidyarthi level (50 XP)" },
  { id: "century",       emoji: "💯", label: "Century",              desc: "Earn 100 XP" },
  { id: "contributor",   emoji: "✍️", label: "Contributor",         desc: "Submit an example sentence" },
];

export function getEarned() {
  try { return JSON.parse(localStorage.getItem(ACH_KEY) || "[]"); } catch { return []; }
}

export function unlockAchievement(id) {
  try {
    const earned = getEarned();
    if (earned.includes(id)) return false;
    earned.push(id);
    localStorage.setItem(ACH_KEY, JSON.stringify(earned));
    const newOnes = JSON.parse(localStorage.getItem(ACH_NEW_KEY) || "[]");
    newOnes.push(id);
    localStorage.setItem(ACH_NEW_KEY, JSON.stringify(newOnes));
    return true;
  } catch { return false; }
}

export function clearNewAchievements() {
  try { localStorage.removeItem(ACH_NEW_KEY); } catch {}
}

export default function useAchievements() {
  const [earned, setEarned] = useState([]);
  const [newOnes, setNewOnes] = useState([]);

  useEffect(() => {
    setEarned(getEarned());
    const n = JSON.parse(localStorage.getItem(ACH_NEW_KEY) || "[]");
    setNewOnes(n);
    clearNewAchievements();
  }, []);

  function unlock(id) {
    const isNew = unlockAchievement(id);
    if (isNew) {
      setEarned(getEarned());
      setNewOnes((prev) => [...prev, id]);
    }
    return isNew;
  }

  return { earned, newOnes, unlock, all: ALL_ACHIEVEMENTS };
}
