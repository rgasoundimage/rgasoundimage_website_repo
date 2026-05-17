const fs = require("fs");
const path = require("path");
const { routes } = require("./site-routes.cjs");

const BASE_URL = "https://www.rgasoundimage.com";

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    ({ path: routePath, priority }) => `
  <url>
    <loc>${BASE_URL}${routePath === "/" ? "" : routePath}</loc>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join("")}
</urlset>`;

fs.writeFileSync(
  path.resolve(__dirname, "../public/sitemap.xml"),
  sitemap
);

console.log("✅ Sitemap generated");
