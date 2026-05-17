import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";
import "./index.css";

export function render(url) {
  const helmetContext = {};
  const appHtml = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <App enableAnalytics={false} enableChatbot={false} />
      </StaticRouter>
    </HelmetProvider>
  );

  const { helmet } = helmetContext;

  return {
    appHtml,
    head: [
      helmet?.title?.toString() || "",
      helmet?.meta?.toString() || "",
      helmet?.link?.toString() || "",
      helmet?.script?.toString() || "",
    ].join("\n"),
  };
}
