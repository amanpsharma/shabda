import { useCallback, useEffect, useState } from "react";

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
      return next;
    });
  }, [wordIndex, toast]);

  return {
    isSaved: saved.includes(String(wordIndex)),
    toggleSave,
    savedCount: saved.length,
  };
}
