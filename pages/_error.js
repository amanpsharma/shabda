import Head from "next/head";
import Link from "next/link";

export default function ErrorPage({ statusCode }) {
  const is404 = statusCode === 404;
  return (
    <>
      <Head>
        <title>{is404 ? "Not Found" : "Error"} — SHABDA</title>
      </Head>
      <div className="container" style={{ textAlign: "center", paddingTop: "5rem" }}>
        <div className="logo" style={{ marginBottom: "1.5rem" }}>
          <span className="dev">श</span>Shabda
        </div>
        <p className="section-title" style={{ marginBottom: "0.5rem" }}>
          {statusCode ? `${statusCode} error` : "Client error"}
        </p>
        <p className="tagline" style={{ marginBottom: "2rem" }}>
          {is404
            ? "This page does not exist."
            : "Something went wrong on our end. Please try again."}
        </p>
        <Link href="/" className="btn primary">← Back to today's word</Link>
      </div>
    </>
  );
}

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
