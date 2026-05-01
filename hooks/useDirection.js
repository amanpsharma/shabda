import { useCallback, useEffect, useState } from "react";

export default function useDirection() {
  const [direction, setDirectionState] = useState("hi-en");

  useEffect(() => {
    setDirectionState(localStorage.getItem("shabda.direction") || "hi-en");
  }, []);

  const setDirection = useCallback((dir) => {
    setDirectionState(dir);
    localStorage.setItem("shabda.direction", dir);
  }, []);

  return { direction, setDirection };
}
