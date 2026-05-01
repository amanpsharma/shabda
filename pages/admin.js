import Head from "next/head";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { bustWordsCache } from "../lib/fetchWords";

const CATS = ["noun", "verb", "adjective", "phrase"];

const EMPTY = {
  en: { word: "", phonetic: "", pos: "" },
  hi: { word: "", romanized: "", pos: "" },
  meaningEn: "",
  meaningHi: "",
  exampleEn: "",
  exampleHi: "",
  synonyms: "",
  antonyms: "",
  category: "adjective",
  order: 0,
};

function authHeaders(token) {
  return { "Content-Type": "application/json", "x-admin-token": token };
}

// Wraps fetch; if server returns 401, calls onUnauth so the admin is sent back to login
async function authFetch(url, opts, onUnauth) {
  const res = await fetch(url, opts);
  if (res.status === 401) {
    onUnauth();
    return null;
  }
  return res;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [token, setToken] = useState("");

  const [words, setWords] = useState([]);
  const [wordSearch, setWordSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Push form
  const [pushTitle, setPushTitle] = useState("Shabda — Daily Word");
  const [pushBody, setPushBody] = useState("");
  const [pushing, setPushing] = useState(false);
  const [pushMsg, setPushMsg] = useState("");

  const pwdRef = useRef(null);

  useEffect(() => {
    const t = sessionStorage.getItem("shabda.adminToken");
    if (t) {
      setToken(t);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) pwdRef.current?.focus();
  }, [authed]);

  function forceLogout() {
    sessionStorage.removeItem("shabda.adminToken");
    setAuthed(false);
    setToken("");
  }

  const loadWords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/words");
      const data = await res.json();
      setWords(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) loadWords();
  }, [authed, loadWords]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginErr("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      if (res.status === 429) {
        setLoginErr("Too many attempts. Try again in 15 minutes.");
        return;
      }
      if (!res.ok) {
        setLoginErr("Wrong password.");
        return;
      }
      const { token: t } = await res.json();
      sessionStorage.setItem("shabda.adminToken", t);
      setToken(t);
      setAuthed(true);
    } catch {
      setLoginErr("Server error. Please try again.");
    }
  }

  function startEdit(w) {
    setEditing(w);
    setAdding(false);
    setForm({
      en: { ...w.en },
      hi: { ...w.hi },
      meaningEn: w.meaningEn,
      meaningHi: w.meaningHi,
      exampleEn: w.exampleEn,
      exampleHi: w.exampleHi,
      synonyms: (w.synonyms || []).join(", "),
      antonyms: (w.antonyms || []).join(", "),
      category: w.category || "adjective",
      order: w.order || 0,
    });
    setMsg("");
  }

  function startAdd() {
    setEditing(null);
    setAdding(true);
    setForm(EMPTY);
    setMsg("");
  }
  function cancelForm() {
    setEditing(null);
    setAdding(false);
  }

  function setF(path, val) {
    setForm((f) => {
      const next = JSON.parse(JSON.stringify(f));
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = val;
      return next;
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const url = editing ? `/api/words/${editing._id}` : "/api/words";
    const method = editing ? "PUT" : "POST";
    const payload = {
      ...form,
      synonyms: form.synonyms
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      antonyms: form.antonyms
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      const res = await authFetch(
        url,
        { method, headers: authHeaders(token), body: JSON.stringify(payload) },
        forceLogout,
      );
      if (!res) {
        setSaving(false);
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg("Error: " + (d.message || `Server error (${res.status})`));
        setSaving(false);
        return;
      }
      bustWordsCache();
      setMsg(editing ? "Word updated." : "Word added.");
      cancelForm();
      loadWords();
    } catch {
      setMsg("Network error. Please try again.");
    }
    setSaving(false);
  }

  async function handleDelete(w) {
    if (!confirm(`Delete "${w.en.word}"?`)) return;
    try {
      const res = await authFetch(
        `/api/words/${w._id}`,
        { method: "DELETE", headers: authHeaders(token) },
        forceLogout,
      );
      if (!res) return;
      if (!res.ok) {
        alert("Delete failed");
        return;
      }
      bustWordsCache();
      loadWords();
    } catch {
      alert("Network error");
    }
  }

  async function handleSendPush(e) {
    e.preventDefault();
    setPushing(true);
    setPushMsg("");
    try {
      const res = await authFetch(
        "/api/send-push",
        {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ title: pushTitle, body: pushBody }),
        },
        forceLogout,
      );
      if (!res) {
        setPushing(false);
        return;
      }
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPushMsg("Error: " + (d.message || `Server error (${res.status})`));
      } else {
        setPushMsg(
          `Sent to ${d.sent} subscriber${d.sent !== 1 ? "s" : ""}. Failed: ${d.failed}.`,
        );
      }
    } catch {
      setPushMsg("Network error.");
    }
    setPushing(false);
  }

  const filteredWords = wordSearch.trim()
    ? words.filter(
        (w) =>
          w.en.word.toLowerCase().includes(wordSearch.toLowerCase()) ||
          w.hi.word.includes(wordSearch) ||
          (w.category || "").includes(wordSearch.toLowerCase()),
      )
    : words;

  if (!authed) {
    return (
      <>
        <Head>
          <title>Admin — SHABDA</title>
        </Head>
        <div
          className="container"
          style={{ maxWidth: 380, paddingTop: "4rem" }}
        >
          <div className="logo" style={{ marginBottom: "2rem" }}>
            <span className="dev">श</span>Shabda Admin
          </div>
          <form onSubmit={handleLogin} className="admin-login-form">
            <input
              ref={pwdRef}
              className="admin-input"
              type="password"
              placeholder="Admin password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              aria-label="Admin password"
            />
            {loginErr && (
              <p className="admin-error" role="alert">
                {loginErr}
              </p>
            )}
            <button
              className="btn primary"
              type="submit"
              style={{ width: "100%", marginTop: "1rem" }}
            >
              Enter
            </button>
          </form>
          <p style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <Link href="/" className="back-link">
              ← Back to Shabda
            </Link>
          </p>
        </div>
      </>
    );
  }

  const wordForm = (editing || adding) && (
    <div className="admin-form-wrap">
      <h2 className="admin-section-title">
        {editing ? `Edit: ${editing.en.word}` : "Add new word"}
      </h2>
      <form onSubmit={handleSave} className="admin-form">
        <div className="admin-row">
          <div className="admin-col">
            <label>English word</label>
            <input
              className="admin-input"
              value={form.en.word}
              onChange={(e) => setF("en.word", e.target.value)}
              required
            />
            <label>Phonetic</label>
            <input
              className="admin-input"
              value={form.en.phonetic}
              onChange={(e) => setF("en.phonetic", e.target.value)}
              required
            />
            <label>POS (en)</label>
            <input
              className="admin-input"
              value={form.en.pos}
              onChange={(e) => setF("en.pos", e.target.value)}
              required
            />
          </div>
          <div className="admin-col">
            <label>Hindi word</label>
            <input
              className="admin-input"
              value={form.hi.word}
              onChange={(e) => setF("hi.word", e.target.value)}
              required
            />
            <label>Romanized</label>
            <input
              className="admin-input"
              value={form.hi.romanized}
              onChange={(e) => setF("hi.romanized", e.target.value)}
              required
            />
            <label>POS (hi)</label>
            <input
              className="admin-input"
              value={form.hi.pos}
              onChange={(e) => setF("hi.pos", e.target.value)}
              required
            />
          </div>
        </div>
        <label>Category</label>
        <select
          className="admin-input"
          value={form.category}
          onChange={(e) => setF("category", e.target.value)}
        >
          {CATS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label>Meaning (English)</label>
        <textarea
          className="admin-input admin-ta"
          value={form.meaningEn}
          onChange={(e) => setF("meaningEn", e.target.value)}
          required
        />
        <label>Meaning (Hindi)</label>
        <textarea
          className="admin-input admin-ta"
          value={form.meaningHi}
          onChange={(e) => setF("meaningHi", e.target.value)}
          required
        />
        <label>Example (English)</label>
        <textarea
          className="admin-input admin-ta"
          value={form.exampleEn}
          onChange={(e) => setF("exampleEn", e.target.value)}
          required
        />
        <label>Example (Hindi)</label>
        <textarea
          className="admin-input admin-ta"
          value={form.exampleHi}
          onChange={(e) => setF("exampleHi", e.target.value)}
          required
        />
        <label>
          Synonyms{" "}
          <span
            style={{ fontWeight: 400, fontSize: 12, color: "var(--ink-soft)" }}
          >
            (comma-separated)
          </span>
        </label>
        <input
          className="admin-input"
          value={form.synonyms}
          onChange={(e) => setF("synonyms", e.target.value)}
          placeholder="happy, joyful, elated"
        />
        <label>
          Antonyms{" "}
          <span
            style={{ fontWeight: 400, fontSize: 12, color: "var(--ink-soft)" }}
          >
            (comma-separated)
          </span>
        </label>
        <input
          className="admin-input"
          value={form.antonyms}
          onChange={(e) => setF("antonyms", e.target.value)}
          placeholder="sad, unhappy, gloomy"
        />
        <label>Order</label>
        <input
          className="admin-input"
          type="number"
          value={form.order}
          onChange={(e) => setF("order", Number(e.target.value))}
        />
        {msg && (
          <p className="admin-msg" role="alert">
            {msg}
          </p>
        )}
        <div className="admin-actions">
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button className="btn" type="button" onClick={cancelForm}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <Head>
        <title>Admin — SHABDA</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="container admin-container">
        <div className="page-header">
          <Link href="/" className="back-link">
            ← Today
          </Link>
          <div className="logo">
            <span className="dev">श</span>Admin
          </div>
          <button
            className="btn"
            onClick={() => {
              sessionStorage.removeItem("shabda.adminToken");
              setAuthed(false);
              setToken("");
            }}
          >
            Logout
          </button>
        </div>

        {/* Push notification panel */}
        <div className="admin-form-wrap" style={{ marginBottom: 24 }}>
          <h2 className="admin-section-title">Send push notification</h2>
          <form onSubmit={handleSendPush} className="admin-form">
            <label>Title</label>
            <input
              className="admin-input"
              value={pushTitle}
              onChange={(e) => setPushTitle(e.target.value)}
              required
            />
            <label>Body</label>
            <input
              className="admin-input"
              value={pushBody}
              onChange={(e) => setPushBody(e.target.value)}
              placeholder="Your daily word is ready…"
              required
            />
            {pushMsg && (
              <p className="admin-msg" role="alert">
                {pushMsg}
              </p>
            )}
            <div className="admin-actions">
              <button className="btn primary" type="submit" disabled={pushing}>
                {pushing ? "Sending…" : "Send to all subscribers"}
              </button>
            </div>
          </form>
        </div>

        {/* Word management */}
        {!editing && !adding && (
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
              flexWrap: "wrap",
            }}
          >
            <input
              className="admin-input"
              style={{ maxWidth: 280 }}
              type="search"
              placeholder="Filter words…"
              value={wordSearch}
              onChange={(e) => setWordSearch(e.target.value)}
              aria-label="Filter word list"
            />
            <button className="btn primary" onClick={startAdd}>
              + Add word
            </button>
          </div>
        )}

        {wordForm}
        {msg && !editing && !adding && (
          <p className="admin-msg" role="alert">
            {msg}
          </p>
        )}

        {loading ? (
          <p className="tagline">Loading…</p>
        ) : (
          <>
            <p
              style={{
                fontSize: 13,
                color: "var(--ink-soft)",
                marginBottom: 8,
              }}
            >
              {filteredWords.length} of {words.length} words
            </p>
            <div className="admin-word-list">
              {filteredWords.map((w) => (
                <div key={w._id} className="admin-word-row">
                  <div className="admin-word-info">
                    <span className="admin-word-en">{w.en.word}</span>
                    {w.category && (
                      <span className={`arc-cat arc-cat-${w.category}`}>
                        {w.category}
                      </span>
                    )}
                    <span className="admin-word-hi">{w.hi.word}</span>
                    <span className="admin-word-meaning">{w.meaningEn}</span>
                  </div>
                  <div className="admin-word-btns">
                    <button className="btn" onClick={() => startEdit(w)}>
                      Edit
                    </button>
                    <button
                      className="btn"
                      style={{ color: "var(--accent)" }}
                      onClick={() => handleDelete(w)}
                      aria-label={`Delete ${w.en.word}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
