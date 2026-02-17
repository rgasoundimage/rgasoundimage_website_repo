const fs = require("fs");
const path = require("path");

// Adjust if needed
const BASE_URL = "https://www.rgasoundimage.com";

// Import article slugs manually (safe approach for Netlify)
const articleSlugs = [
  "fix-auditorium-echo",
  "dolby-atmos-vs-7-1"
];

// Static pages
const staticPages = [
  "",
  "/about",
  "/products",
  "/projects",
  "/contact",
  "/insights"
];

const articlePages = articleSlugs.map(
  slug => `/insights/${slug}`
);

const urls = [...staticPages, ...articlePages];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    url => `
  <url>
    <loc>${BASE_URL}${url}</loc>
    <changefreq>monthly</changefreq>
    <priority>${url.includes("/insights/") ? "0.8" : "0.6"}</priority>
  </url>`
  )
  .join("")}
</urlset>`;

fs.writeFileSync(
  path.resolve(__dirname, "../public/sitemap.xml"),
  sitemap
);

console.log("✅ Sitemap generated");
