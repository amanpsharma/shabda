export default function Toast({ msg }) {
  return (
    <div
      className={`toast${msg ? " show" : ""}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {msg}
    </div>
  );
}
