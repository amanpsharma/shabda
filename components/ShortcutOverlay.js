import { useEffect } from "react";

const SHORTCUTS = [
  { key: "Tab", desc: "Flip Hi → EN / EN → Hi direction" },
  { key: "S", desc: "Save / unsave today's word" },
  { key: "Esc", desc: "Close modal or overlay" },
  { key: "Space / Enter", desc: "Flip quiz card" },
  { key: "?", desc: "Show this shortcut guide" },
];

export default function ShortcutOverlay({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-bg show"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div className="modal shortcut-modal">
        <button className="close" onClick={onClose} aria-label="Close">✕</button>
        <div className="modal-date">KEYBOARD SHORTCUTS</div>
        <table className="shortcut-table">
          <tbody>
            {SHORTCUTS.map(({ key, desc }) => (
              <tr key={key}>
                <td><kbd className="kbd">{key}</kbd></td>
                <td>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
