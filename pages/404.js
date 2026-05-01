import Head from "next/head";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Page not found — SHABDA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="container" style={{ textAlign: "center", paddingTop: "5rem" }}>
        <div className="logo" style={{ justifyContent: "center", marginBottom: "1.5rem" }}>
          <span className="dev">श</span>Shabda
        </div>
        <div style={{ fontSize: "5rem", lineHeight: 1, marginBottom: "1rem", color: "var(--ink-soft)" }}>404</div>
        <p className="tagline" style={{ marginBottom: "2rem" }}>
          This page doesn't exist. Maybe the word you're looking for is on the home page.
        </p>
        <Link href="/" className="btn primary">← Today's word</Link>
      </div>
    </>
  );
}
