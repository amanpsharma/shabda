import { useEffect, useState } from "react";

export default function OnboardingTip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("shabda.onboarded")) setVisible(true);
    } catch {}
  }, []);

  function dismiss() {
    try { localStorage.setItem("shabda.onboarded", "1"); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="onboard-tip" role="status" aria-live="polite">
      <div className="onboard-inner">
        <p className="onboard-text">
          <strong>Tab</strong> flips the direction &nbsp;·&nbsp;
          <strong>♡</strong> saves a word &nbsp;·&nbsp;
          <strong>?</strong> shows all shortcuts &nbsp;·&nbsp;
          <strong>🔥</strong> is your streak
        </p>
        <button className="onboard-close" onClick={dismiss} aria-label="Dismiss tip">Got it</button>
      </div>
    </div>
  );
}
