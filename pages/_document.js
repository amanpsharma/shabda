import { Html, Head, Main, NextScript } from "next/document";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://shabda.app";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="application-name" content="Shabda" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Shabda" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#b8341e" />

        {/* Default OG tags — individual pages override these */}
        <meta property="og:site_name" content="Shabda" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />

        <link rel="canonical" href={SITE_URL} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="sitemap" type="application/xml" href="/api/sitemap" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
