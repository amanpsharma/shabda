import { useEffect, useRef } from "react";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  window.speechSynthesis.speak(u);
}

export default function WordModal({ modal, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!modal) return;

    const first = modalRef.current?.querySelector(FOCUSABLE);
    first?.focus();

    function onKey(e) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const focusable = [...(modalRef.current?.querySelectorAll(FOCUSABLE) || [])];
      if (!focusable.length) return;
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === focusable[0]) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); focusable[0].focus(); }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, onClose]);

  if (!modal) return null;

  const { word: w, date } = modal;
  const dateLabel = date
    ? new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase()
    : null;

  return (
    <div
      className="modal-bg show"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Word: ${w.en.word}`}
    >
      <div className="modal" ref={modalRef}>
        <button className="close" onClick={onClose} aria-label="Close modal">✕</button>
        {dateLabel && <div className="modal-date">{dateLabel}</div>}
        <div className="modal-word-en">
          <div className="word-en">{w.en.word}</div>
          <div className="phonetic">{w.en.phonetic}</div>
        </div>
        <div className="modal-word-hi">
          <div className="word-hi">{w.hi.word}</div>
          <div className="romanized">{w.hi.romanized}</div>
        </div>
        {w.category && (
          <div style={{ margin: "8px 0" }}>
            <span className={`arc-cat arc-cat-${w.category}`}>{w.category}</span>
            {w.difficulty && <span className={`word-diff-badge diff-${w.difficulty}`} style={{ position: "static", display: "inline-block", marginLeft: 8, fontSize: 11 }}>{w.difficulty}</span>}
          </div>
        )}
        <div className="divider"><span>meaning</span></div>
        <p className="meaning">{w.meaningEn}</p>
        <p className="meaning-hi">{w.meaningHi}</p>
        <div className="divider"><span>example</span></div>
        <p className="example">{w.exampleEn}</p>
        <p className="example dev">{w.exampleHi}</p>
        <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-sm" onClick={() => speak(w.en.word)} aria-label={`Pronounce ${w.en.word}`}>
            🔊 Listen
          </button>
          {w.synonyms?.filter(Boolean).length > 0 && (
            <div className="word-chips" style={{ justifyContent: "center" }}>
              <span className="chip-label">syn</span>
              {w.synonyms.filter(Boolean).map((s) => <span key={s} className="chip chip-syn">{s}</span>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
