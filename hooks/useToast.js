import { useCallback, useRef, useState } from "react";

export default function useToast(duration = 2200) {
  const [toastMsg, setToastMsg] = useState("");
  const timer = useRef(null);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(""), duration);
  }, [duration]);

  return { toastMsg, toast };
}
