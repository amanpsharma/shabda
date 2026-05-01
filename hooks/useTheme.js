import { useCallback, useEffect, useState } from "react";

export default function useTheme() {
  const [theme, setThemeState] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem("shabda.theme");
    // First visit: honour OS preference; returning visitor: use saved choice
    const initial = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setThemeState(initial);
    document.documentElement.setAttribute("data-theme", initial);
    if (!saved) localStorage.setItem("shabda.theme", initial);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("shabda.theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
