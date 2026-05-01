import Head from "next/head";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";

import useToast from "../hooks/useToast";
import useDirection from "../hooks/useDirection";
import useSaved from "../hooks/useSaved";
import useStreak from "../hooks/useStreak";
import useTheme from "../hooks/useTheme";

import Masthead from "../components/Masthead";
import WordCard from "../components/WordCard";
import Archive from "../components/Archive";
import WordModal from "../components/WordModal";
import Toast from "../components/Toast";
import StreakCalendar from "../components/StreakCalendar";
import ShortcutOverlay from "../components/ShortcutOverlay";
import OnboardingTip from "../components/OnboardingTip";
import { ErrorScreen } from "../components/ErrorBoundary";

export async function getServerSideProps() {
  try {
    const { fetchTodayData } = await import("../lib/getWordData");
    return { props: { ...(await fetchTodayData()), error: null } };
  } catch (err) {
    return {
      props: {
        word: null,
        wordIndex: 0,
        archive: [],
        dateStr: "",
        error: err.message || "Failed to load",
      },
    };
  }
}

export default function Home({ word, wordIndex, archive, dateStr, error }) {
  const { toastMsg, toast } = useToast();
  const { direction, setDirection } = useDirection();
  const { isSaved, toggleSave, savedCount } = useSaved(wordIndex, toast);
  const { streak, milestone, visitLog } = useStreak();
  const { theme, toggleTheme } = useTheme();
  const [modal, setModal] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState("idle"); // idle | loading | ok | err
  const emailRef = useRef(null);

  // Confetti + toast on streak milestones
  useEffect(() => {
    if (!milestone) return;
    const labels = {
      3: "3-day",
      7: "7-day",
      14: "14-day",
      30: "30-day",
      60: "60-day",
      100: "100-day",
      200: "200-day",
      365: "365-day",
    };
    toast(`🔥 ${labels[milestone]} streak! Keep it up!`);
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  }, [milestone, toast]);

  // "?" opens shortcut overlay
  useEffect(() => {
    function onKey(e) {
      if (
        e.key === "?" &&
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "TEXTAREA"
      ) {
        setShowShortcuts((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleSubscribe(e) {
    e.preventDefault();
    setSubState("loading");
    try {
      const res = await fetch("/api/subscribe-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubState("ok");
        setEmail("");
        toast("Subscribed! Daily words coming your way.");
      } else {
        const d = await res.json().catch(() => ({}));
        setSubState("err");
        toast(d.message || "Could not subscribe.");
      }
    } catch {
      setSubState("err");
      toast("Network error. Please try again.");
    }
  }

  if (error)
    return (
      <ErrorScreen message={error} onRetry={() => window.location.reload()} />
    );
  if (!word)
    return (
      <ErrorScreen message="No words found. Run npm run seed to populate the database." />
    );

  return (
    <>
      <Head>
        <title>SHABDA — Daily Hindi-English word</title>
        <meta
          name="description"
          content="One word a day. Hindi and English. With meaning, example, and a small ritual to keep at it."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="SHABDA — Daily Hindi-English word" />
        <meta
          property="og:description"
          content="One word a day. Hindi and English. With meaning, example, and a small ritual to keep at it."
        />
        <meta property="og:url" content="https://shabda.app" />
        <meta
          name="twitter:title"
          content="SHABDA — Daily Hindi-English word"
        />
        <meta
          name="twitter:description"
          content="One word a day. Hindi and English. With meaning, example, and a small ritual to keep at it."
        />
      </Head>

      <div className="container">
        <Masthead
          dateStr={dateStr}
          wordIndex={wordIndex}
          streak={streak}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <p className="tagline">
          One word a day. Hindi and English. A small daily ritual.
        </p>

        <StreakCalendar streak={streak} visitLog={visitLog} />

        <WordCard
          word={word}
          direction={direction}
          setDirection={setDirection}
          isSaved={isSaved}
          onToggleSave={toggleSave}
          toast={toast}
        />

        <Archive
          archive={archive}
          onSelect={setModal}
          categoryFilter={categoryFilter}
          onCategoryFilter={setCategoryFilter}
        />

        <div className="subscribe-wrap">
          <p className="subscribe-label">Get today's word by email</p>
          {subState === "ok" ? (
            <p className="subscribe-ok">You're subscribed!</p>
          ) : (
            <form className="subscribe-form" onSubmit={handleSubscribe}>
              <input
                ref={emailRef}
                className="subscribe-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address for daily word digest"
                required
              />
              <button
                className="btn primary subscribe-btn"
                type="submit"
                disabled={subState === "loading"}
              >
                {subState === "loading" ? "…" : "Subscribe"}
              </button>
            </form>
          )}
        </div>

        <footer>
          <p>
            Crafted for daily learners ·{" "}
            <button
              className="shortcut-hint"
              onClick={() => setShowShortcuts(true)}
            >
              ? shortcuts
            </button>
          </p>
          <div className="footer-links">
            <Link href="/saved" className="saved-link">
              ♥ Saved
              {savedCount > 0 && (
                <span className="saved-badge">{savedCount}</span>
              )}
            </Link>
            <Link href="/history" className="saved-link">
              ⏱ History
            </Link>
          </div>
        </footer>
      </div>

      <WordModal modal={modal} onClose={() => setModal(null)} />
      <Toast msg={toastMsg} />
      <ShortcutOverlay
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
      <OnboardingTip />
    </>
  );
}
