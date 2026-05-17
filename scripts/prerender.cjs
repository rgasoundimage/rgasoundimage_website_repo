const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { routes } = require("./site-routes.cjs");

const clientDir = path.resolve(__dirname, "../dist");
const serverEntry = path.resolve(__dirname, "../dist/server/entry-server.js");
const templatePath = path.join(clientDir, "index.html");

async function prerender() {
  const template = fs.readFileSync(templatePath, "utf8");
  const { render } = await import(pathToFileURL(serverEntry).href);

  routes.forEach(({ path: routePath }) => {
    const { appHtml, head } = render(routePath);
    const html = template
      .replace(/<title>.*?<\/title>\s*/s, "")
      .replace("</head>", `${head}\n</head>`)
      .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

    const routeDir =
      routePath === "/"
        ? clientDir
        : path.join(clientDir, routePath.replace(/^\//, ""));

    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(path.join(routeDir, "index.html"), html);
  });

  console.log(`Prerendered ${routes.length} routes`);
}

prerender().catch((error) => {
  console.error(error);
  process.exit(1);
});
