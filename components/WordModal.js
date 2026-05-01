import { useEffect, useRef } from "react";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

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
  const dateLabel = new Date(date)
    .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    .toUpperCase();

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
        {date && <div className="modal-date">{dateLabel}</div>}
        <div className="modal-word-en">
          <div className="word-en">{w.en.word}</div>
          <div className="phonetic">{w.en.phonetic}</div>
        </div>
        <div className="modal-word-hi">
          <div className="word-hi">{w.hi.word}</div>
          <div className="romanized">{w.hi.romanized}</div>
        </div>
        <div className="divider"><span>meaning</span></div>
        <p className="meaning">{w.meaningEn}</p>
        <p className="meaning-hi">{w.meaningHi}</p>
        <div className="divider"><span>example</span></div>
        <p className="example">{w.exampleEn}</p>
        <p className="example dev">{w.exampleHi}</p>
      </div>
    </div>
  );
}
