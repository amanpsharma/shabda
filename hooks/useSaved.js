import { useCallback, useEffect, useState } from "react";
import { addXP } from "./useXP";
import { unlockAchievement } from "./useAchievements";

export default function useSaved(wordIndex, toast) {
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem("shabda.saved") || "[]")); }
    catch { setSaved([]); }
  }, []);

  const toggleSave = useCallback(() => {
    const key = String(wordIndex);
    setSaved((prev) => {
      const alreadySaved = prev.includes(key);
      const next = alreadySaved ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem("shabda.saved", JSON.stringify(next));
      toast(alreadySaved ? "Removed from saved" : "Saved");

      if (!alreadySaved) {
        addXP(5);
        unlockAchievement("first-save");
        if (next.length >= 10) unlockAchievement("saved-10");
        if (next.length >= 25) unlockAchievement("saved-25");

        // Check XP milestones
        const xp = parseInt(localStorage.getItem("shabda.xp") || "0");
        if (xp >= 50)  unlockAchievement("level-up");
        if (xp >= 100) unlockAchievement("century");
      }

      return next;
    });
  }, [wordIndex, toast]);

  return {
    isSaved: saved.includes(String(wordIndex)),
    toggleSave,
    savedCount: saved.length,
  };
}
