import { useCallback, useEffect } from "react";
import WordSection from "./WordSection";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  window.speechSynthesis.speak(u);
}

async function shareAsImage(word) {
  const W = 800, H = 420;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#f4efe2";
  ctx.fillRect(0, 0, W, H);

  // Accent bar
  ctx.fillStyle = "#b8341e";
  ctx.fillRect(0, 0, 8, H);

  // SHABDA watermark top-right
  ctx.fillStyle = "#b8341e";
  ctx.font = "bold 18px Georgia";
  ctx.textAlign = "right";
  ctx.fillText("SHABDA", W - 32, 44);

  // Category pill
  if (word.category) {
    ctx.font = "12px monospace";
    ctx.fillStyle = "#5c544d";
    ctx.textAlign = "left";
    ctx.fillText(word.category.toUpperCase(), 40, 44);
  }

  // English word
  ctx.fillStyle = "#1a1614";
  ctx.font = "bold 64px Georgia";
  ctx.textAlign = "left";
  ctx.fillText(word.en.word, 40, 130);

  // Phonetic
  ctx.font = "20px monospace";
  ctx.fillStyle = "#5c544d";
  ctx.fillText(word.en.phonetic, 40, 162);

  // Hindi word
  ctx.font = "bold 42px serif";
  ctx.fillStyle = "#b8341e";
  ctx.fillText(word.hi.word, 40, 218);

  // Divider
  ctx.strokeStyle = "#1a1614";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, 238); ctx.lineTo(W - 40, 238); ctx.stroke();

  // Meaning
  ctx.fillStyle = "#1a1614";
  ctx.font = "18px Georgia";
  const meaning = word.meaningEn.length > 80 ? word.meaningEn.slice(0, 80) + "…" : word.meaningEn;
  ctx.fillText(meaning, 40, 272);

  // Example
  ctx.fillStyle = "#5c544d";
  ctx.font = "italic 16px Georgia";
  const example = `"${word.exampleEn}"`;
  const maxW = W - 80;
  // Word-wrap example
  const words2 = example.split(" ");
  let line = "", y = 312;
  for (const w of words2) {
    const test = line + (line ? " " : "") + w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, 40, y); y += 24; line = w;
    } else { line = test; }
  }
  if (line) ctx.fillText(line, 40, y);

  // Footer
  ctx.fillStyle = "#5c544d";
  ctx.font = "13px monospace";
  ctx.textAlign = "left";
  ctx.fillText("shabda.app — one word a day", 40, H - 24);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export default function WordCard({ word, direction, setDirection, isSaved, onToggleSave, toast }) {
  // Tab key flips direction
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Tab" && !e.shiftKey && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        setDirection(direction === "hi-en" ? "en-hi" : "hi-en");
      }
      if (e.key === "s" || e.key === "S") {
        if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") return;
        onToggleSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [direction, setDirection, onToggleSave]);

  const isHiEn = direction === "hi-en";
  const primaryLang = isHiEn ? "en" : "hi";
  const secondaryLang = isHiEn ? "hi" : "en";
  const meaningPrimary = isHiEn ? word.meaningEn : word.meaningHi;
  const meaningSecondary = isHiEn ? word.meaningHi : word.meaningEn;
  const examplePrimary = isHiEn ? word.exampleEn : word.exampleHi;
  const exampleSecondary = isHiEn ? word.exampleHi : word.exampleEn;

  const handleShare = useCallback(async () => {
    const blob = await shareAsImage(word).catch(() => null);
    const text = `Today's word on Shabda — ${word.en.word} / ${word.hi.word}\n\n"${word.exampleEn}"\n"${word.exampleHi}"`;
    if (blob && navigator.share) {
      try {
        const file = new File([blob], "shabda-word.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: "Shabda", text, files: [file] });
          return;
        }
      } catch (_) {}
    }
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `shabda-${word.en.word.toLowerCase()}.png`;
      a.click(); URL.revokeObjectURL(url);
      toast("Image downloaded");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard");
    } catch { toast("Could not share"); }
  }, [word, toast]);

  const enableRemind = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast("Push notifications not supported in this browser");
      return;
    }
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm !== "granted") { toast("Permission denied"); return; }
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      localStorage.setItem("shabda.reminder", "1");
      toast("Daily reminder enabled — you'll get a push at 8am");
    } catch { toast("Could not set up reminder"); }
  }, [toast]);

  const handlePronounce = useCallback(() => {
    speak(word.en.word);
  }, [word.en.word]);

  const synonyms = word.synonyms?.filter(Boolean) || [];
  const antonyms = word.antonyms?.filter(Boolean) || [];

  return (
    <>
      <div className="toggle-row">
        <div className="toggle">
          <button
            className={direction === "hi-en" ? "active" : ""}
            onClick={() => setDirection("hi-en")}
            aria-pressed={direction === "hi-en"}
          >
            हिं → EN
          </button>
          <button
            className={direction === "en-hi" ? "active" : ""}
            onClick={() => setDirection("en-hi")}
            aria-pressed={direction === "en-hi"}
          >
            EN → हिं
          </button>
        </div>
      </div>

      <div className="card">
        <div className="stamp">Word of the day</div>

        <WordSection word={word} lang={primaryLang} />

        <div className="divider"><span>meaning</span></div>
        <p className="meaning">{meaningPrimary}</p>
        <p className="meaning-hi">{meaningSecondary}</p>

        {synonyms.length > 0 && (
          <div className="word-chips">
            <span className="chip-label">synonyms</span>
            {synonyms.map((s) => <span key={s} className="chip chip-syn">{s}</span>)}
          </div>
        )}
        {antonyms.length > 0 && (
          <div className="word-chips">
            <span className="chip-label">antonyms</span>
            {antonyms.map((a) => <span key={a} className="chip chip-ant">{a}</span>)}
          </div>
        )}

        <div className="divider"><span>secondary</span></div>
        <WordSection word={word} lang={secondaryLang} secondary />

        <div className="divider"><span>example</span></div>
        <p className={`example${isHiEn ? "" : " dev"}`}>{examplePrimary}</p>
        <p className="example dev">{exampleSecondary}</p>

        <div className="actions">
          <button
            className={`btn${isSaved ? " saved" : ""}`}
            onClick={onToggleSave}
            aria-label={isSaved ? "Remove from saved words" : "Save this word"}
          >
            <span className="ic">{isSaved ? "♥" : "♡"}</span>
            <span>{isSaved ? "Saved" : "Save"}</span>
          </button>
          <button
            className="btn"
            onClick={handlePronounce}
            aria-label={`Pronounce ${word.en.word}`}
          >
            <span className="ic">🔊</span>
            <span>Listen</span>
          </button>
          <button
            className="btn"
            onClick={handleShare}
            aria-label="Share or download word card"
          >
            <span className="ic">↗</span>
            <span>Share</span>
          </button>
          <button
            className="btn primary"
            onClick={enableRemind}
            aria-label="Enable daily reminder"
          >
            <span className="ic">🔔</span>
            <span>Remind me</span>
          </button>
        </div>
      </div>
    </>
  );
}
