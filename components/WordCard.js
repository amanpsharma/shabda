import { useCallback, useEffect, useState } from "react";
import WordSection from "./WordSection";
import { addXP } from "../hooks/useXP";
import { unlockAchievement } from "../hooks/useAchievements";

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

async function makeStoryCanvas(word) {
  const W = 540, H = 960;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background gradient
  ctx.fillStyle = "#f4efe2";
  ctx.fillRect(0, 0, W, H);

  // Top accent band
  ctx.fillStyle = "#b8341e";
  ctx.fillRect(0, 0, W, 8);

  // Bottom accent band
  ctx.fillStyle = "#b8341e";
  ctx.fillRect(0, H - 8, W, 8);

  // Decorative circle
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.38, 180, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(184,52,30,0.06)";
  ctx.fill();

  // SHABDA label
  ctx.font = "bold 18px monospace";
  ctx.fillStyle = "#b8341e";
  ctx.textAlign = "center";
  ctx.fillText("SHABDA", W / 2, 52);

  // Date
  ctx.font = "12px monospace";
  ctx.fillStyle = "#9e9188";
  ctx.fillText(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase(), W / 2, 74);

  // Category
  if (word.category) {
    ctx.font = "11px monospace";
    ctx.fillStyle = "#b8341e";
    ctx.fillText(word.category.toUpperCase(), W / 2, 104);
  }

  // Hindi word
  ctx.font = "bold 72px serif";
  ctx.fillStyle = "#b8341e";
  ctx.textAlign = "center";
  ctx.fillText(word.hi.word, W / 2, 320);

  // Romanized
  ctx.font = "italic 22px Georgia";
  ctx.fillStyle = "#5c544d";
  ctx.fillText(word.hi.romanized, W / 2, 360);

  // Divider
  ctx.strokeStyle = "#1a1614";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(80, 390); ctx.lineTo(W - 80, 390); ctx.stroke();

  // English word
  ctx.font = "bold 52px Georgia";
  ctx.fillStyle = "#1a1614";
  ctx.fillText(word.en.word, W / 2, 450);

  // Phonetic
  ctx.font = "16px monospace";
  ctx.fillStyle = "#9e9188";
  ctx.fillText(word.en.phonetic, W / 2, 480);

  // Meaning (word-wrap)
  ctx.font = "18px Georgia";
  ctx.fillStyle = "#1a1614";
  const words = word.meaningEn.split(" ");
  let line = "", y = 540;
  for (const w of words) {
    const test = line + (line ? " " : "") + w;
    if (ctx.measureText(test).width > W - 80 && line) {
      ctx.fillText(line, W / 2, y); y += 28; line = w;
    } else { line = test; }
  }
  if (line) ctx.fillText(line, W / 2, y);

  // Footer
  ctx.font = "13px monospace";
  ctx.fillStyle = "#9e9188";
  ctx.fillText("shabda.app — one word a day", W / 2, H - 32);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function makeLandscapeCanvas(word) {
  const W = 800, H = 420;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f4efe2";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#b8341e";
  ctx.fillRect(0, 0, 8, H);
  ctx.fillStyle = "#b8341e";
  ctx.font = "bold 18px Georgia";
  ctx.textAlign = "right";
  ctx.fillText("SHABDA", W - 32, 44);

  if (word.category) {
    ctx.font = "12px monospace"; ctx.fillStyle = "#5c544d"; ctx.textAlign = "left";
    ctx.fillText(word.category.toUpperCase(), 40, 44);
  }

  ctx.fillStyle = "#1a1614"; ctx.font = "bold 64px Georgia"; ctx.textAlign = "left";
  ctx.fillText(word.en.word, 40, 130);
  ctx.font = "20px monospace"; ctx.fillStyle = "#5c544d";
  ctx.fillText(word.en.phonetic, 40, 162);
  ctx.font = "bold 42px serif"; ctx.fillStyle = "#b8341e";
  ctx.fillText(word.hi.word, 40, 218);

  ctx.strokeStyle = "#1a1614"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, 238); ctx.lineTo(W - 40, 238); ctx.stroke();

  ctx.fillStyle = "#1a1614"; ctx.font = "18px Georgia";
  const meaning = word.meaningEn.length > 80 ? word.meaningEn.slice(0, 80) + "…" : word.meaningEn;
  ctx.fillText(meaning, 40, 272);

  ctx.fillStyle = "#5c544d"; ctx.font = "italic 16px Georgia";
  const ex = `"${word.exampleEn}"`;
  const maxW = W - 80;
  const ws = ex.split(" "); let line = "", ey = 312;
  for (const w of ws) {
    const test = line + (line ? " " : "") + w;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, 40, ey); ey += 24; line = w; }
    else { line = test; }
  }
  if (line) ctx.fillText(line, 40, ey);

  ctx.fillStyle = "#5c544d"; ctx.font = "13px monospace"; ctx.textAlign = "left";
  ctx.fillText("shabda.app — one word a day", 40, H - 24);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export default function WordCard({ word, direction, setDirection, isSaved, onToggleSave, toast }) {
  const [showEtymology, setShowEtymology] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showDidYouKnow, setShowDidYouKnow] = useState(false);
  const [showExampleForm, setShowExampleForm] = useState(false);
  const [exampleText, setExampleText] = useState("");
  const [exampleLang, setExampleLang] = useState("en");
  const [exampleState, setExampleState] = useState("idle");

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Tab" && !e.shiftKey && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        setDirection(direction === "hi-en" ? "en-hi" : "hi-en");
      }
      if ((e.key === "s" || e.key === "S") &&
          document.activeElement.tagName !== "INPUT" &&
          document.activeElement.tagName !== "TEXTAREA") {
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
    const blob = await makeLandscapeCanvas(word).catch(() => null);
    const text = `Today's word on Shabda — ${word.en.word} / ${word.hi.word}\n\n"${word.exampleEn}"\n\nshabda.app`;
    addXP(5);
    unlockAchievement("first-share");
    if (blob && navigator.share) {
      try {
        const file = new File([blob], "shabda-word.png", { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
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
    try { await navigator.clipboard.writeText(text); toast("Copied to clipboard"); }
    catch { toast("Could not share"); }
  }, [word, toast]);

  const handleStoryShare = useCallback(async () => {
    const blob = await makeStoryCanvas(word).catch(() => null);
    addXP(5);
    unlockAchievement("first-share");
    if (blob && navigator.share) {
      try {
        const file = new File([blob], "shabda-story.png", { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title: "Shabda", files: [file] });
          return;
        }
      } catch (_) {}
    }
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `shabda-story-${word.en.word.toLowerCase()}.png`;
      a.click(); URL.revokeObjectURL(url);
      toast("Story card downloaded");
    }
  }, [word, toast]);

  const handleTweet = useCallback(() => {
    const text = `Today's word on Shabda: ${word.en.word} (${word.hi.word})\n"${word.meaningEn}"\n\n#Shabda #LearnHindi #WordOfTheDay\nshabda.app`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    addXP(5);
    unlockAchievement("first-share");
  }, [word]);

  const handleChallengeLink = useCallback(() => {
    const url = `${window.location.origin}/quiz?challenge=1&word=${encodeURIComponent(word.en.word)}`;
    navigator.clipboard.writeText(url).then(() => toast("Challenge link copied!")).catch(() => toast("Could not copy link"));
  }, [word, toast]);

  const enableRemind = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast("Push notifications not supported in this browser"); return;
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
      toast("Daily reminder enabled!");
    } catch { toast("Could not set up reminder"); }
  }, [toast]);

  async function handleExampleSubmit(e) {
    e.preventDefault();
    setExampleState("loading");
    try {
      const res = await fetch("/api/examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: word._id, wordEn: word.en.word, text: exampleText, lang: exampleLang }),
      });
      if (res.ok) {
        setExampleState("ok");
        setExampleText("");
        toast("Example submitted — thank you!");
        unlockAchievement("contributor");
      } else {
        const d = await res.json().catch(() => ({}));
        toast(d.message || "Could not submit");
        setExampleState("idle");
      }
    } catch { toast("Network error"); setExampleState("idle"); }
  }

  const synonyms = word.synonyms?.filter(Boolean) || [];
  const antonyms = word.antonyms?.filter(Boolean) || [];
  const hasEtymology = !!word.etymology;
  const hasMnemonic = !!word.mnemonic;
  const hasDidYouKnow = !!word.didYouKnow;

  return (
    <>
      <div className="toggle-row">
        <div className="toggle">
          <button className={direction === "hi-en" ? "active" : ""} onClick={() => setDirection("hi-en")} aria-pressed={direction === "hi-en"}>
            हिं → EN
          </button>
          <button className={direction === "en-hi" ? "active" : ""} onClick={() => setDirection("en-hi")} aria-pressed={direction === "en-hi"}>
            EN → हिं
          </button>
        </div>
      </div>

      <div className="card">
        <div className="stamp">Word of the day</div>
        {word.difficulty && <span className={`word-diff-badge diff-${word.difficulty}`}>{word.difficulty}</span>}

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

        {/* Collapsible extra info */}
        {hasEtymology && (
          <div className="card-extra">
            <button className="card-extra-toggle" onClick={() => setShowEtymology((v) => !v)}>
              <span>📜 Etymology</span><span className="card-extra-chevron">{showEtymology ? "▲" : "▼"}</span>
            </button>
            {showEtymology && <p className="card-extra-body">{word.etymology}</p>}
          </div>
        )}
        {hasMnemonic && (
          <div className="card-extra">
            <button className="card-extra-toggle" onClick={() => setShowMnemonic((v) => !v)}>
              <span>💡 Memory trick</span><span className="card-extra-chevron">{showMnemonic ? "▲" : "▼"}</span>
            </button>
            {showMnemonic && <p className="card-extra-body">{word.mnemonic}</p>}
          </div>
        )}
        {hasDidYouKnow && (
          <div className="card-extra">
            <button className="card-extra-toggle" onClick={() => setShowDidYouKnow((v) => !v)}>
              <span>✨ Did you know?</span><span className="card-extra-chevron">{showDidYouKnow ? "▲" : "▼"}</span>
            </button>
            {showDidYouKnow && <p className="card-extra-body">{word.didYouKnow}</p>}
          </div>
        )}

        {/* Primary actions */}
        <div className="actions">
          <button className={`btn${isSaved ? " saved" : ""}`} onClick={onToggleSave} aria-label={isSaved ? "Remove from saved" : "Save this word"}>
            <span className="ic">{isSaved ? "♥" : "♡"}</span><span>{isSaved ? "Saved" : "Save"}</span>
          </button>
          <button className="btn" onClick={() => speak(word.en.word)} aria-label={`Pronounce ${word.en.word}`}>
            <span className="ic">🔊</span><span>Listen</span>
          </button>
          <button className="btn" onClick={handleShare} aria-label="Share word card">
            <span className="ic">↗</span><span>Share</span>
          </button>
          <button className="btn primary" onClick={enableRemind} aria-label="Enable daily reminder">
            <span className="ic">🔔</span><span>Remind</span>
          </button>
        </div>

        {/* Secondary share actions */}
        <div className="actions actions-secondary">
          <button className="btn btn-sm" onClick={handleStoryShare} aria-label="Share as story card (9:16)">
            📱 Story
          </button>
          <button className="btn btn-sm" onClick={handleTweet} aria-label="Share on Twitter / X">
            🐦 Tweet
          </button>
          <button className="btn btn-sm" onClick={handleChallengeLink} aria-label="Copy challenge link">
            🔗 Challenge
          </button>
          <button className="btn btn-sm" onClick={() => setShowExampleForm((v) => !v)} aria-label="Submit your own example sentence">
            ✍️ Add example
          </button>
        </div>

        {/* Example submission form */}
        {showExampleForm && (
          <div className="example-form-wrap">
            {exampleState === "ok" ? (
              <p className="example-form-ok">Submitted — thank you!</p>
            ) : (
              <form onSubmit={handleExampleSubmit} className="example-form">
                <p className="example-form-label">Use <strong>{word.en.word}</strong> in a sentence</p>
                <div className="example-form-lang">
                  <button type="button" className={`cat-btn${exampleLang === "en" ? " active" : ""}`} onClick={() => setExampleLang("en")}>English</button>
                  <button type="button" className={`cat-btn${exampleLang === "hi" ? " active" : ""}`} onClick={() => setExampleLang("hi")}>Hindi</button>
                </div>
                <textarea
                  className="admin-input admin-ta"
                  value={exampleText}
                  onChange={(e) => setExampleText(e.target.value)}
                  placeholder={exampleLang === "hi" ? "अपना उदाहरण लिखें…" : "Write your example sentence…"}
                  maxLength={280}
                  rows={3}
                  required
                />
                <div className="example-form-footer">
                  <span className="example-char-count">{exampleText.length}/280</span>
                  <button className="btn primary" type="submit" disabled={exampleState === "loading"}>
                    {exampleState === "loading" ? "Submitting…" : "Submit"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </>
  );
}
