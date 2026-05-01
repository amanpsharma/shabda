export default function handler(req, res) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://shabda.app";
  const pages = ["/", "/search", "/quiz", "/saved"];
  const urls = pages
    .map((p) => `  <url><loc>${base}${p}</loc><changefreq>${p === "/" ? "daily" : "weekly"}</changefreq></url>`)
    .join("\n");

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.status(200).send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
  );
}
