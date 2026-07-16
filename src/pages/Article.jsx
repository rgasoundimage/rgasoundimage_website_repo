import { useParams } from "react-router-dom";
import { articles } from "../content/articles";
import SEO from "../components/SEO";
import {
  createArticleJsonLd,
  createBreadcrumbJsonLd,
} from "../config/seo";


export default function Article() {
  const { slug } = useParams();
  const article = articles[slug];

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold">Article not found</h1>
      </div>
    );
  }

  
  return (
    <>
  <SEO
    title={`${article.title} | RGA Sound Image`}
    description={article.intro}
    path={`/insights/${slug}`}
    type="article"
    jsonLd={[
      createBreadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Insights", path: "/insights" },
        { name: article.title, path: `/insights/${slug}` },
      ]),
      createArticleJsonLd({ slug, article }),
    ]}
  />

    <article className="max-w-3xl mx-auto px-6 py-16">

      <h1 className="text-4xl font-semibold mb-6">{article.title}</h1>

      {article.image && (
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-[360px] object-contain bg-slate-50 border border-slate-200 rounded-xl mb-10"
        />
      )}

      <p className="text-slate-600 mb-10">{article.intro}</p>

      {article.body ? (
        <ArticleBody blocks={article.body} />
      ) : (
        <>
          <section className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-12">
            <h2 className="font-semibold mb-3">In Simple Terms</h2>
            <p className="text-slate-700">{article.simple}</p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Design Considerations</h2>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              {article.considerations.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Practical Recommendations</h2>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              {article.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </section>

          <section className="border-t pt-10">
            <h2 className="text-2xl font-semibold mb-4">Technical Notes</h2>
            <ul className="text-sm text-slate-600 space-y-2">
              {article.technical.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </section>
        </>
      )}

    </article>
    </>
  );
}

function ListItem({ item }) {
  if (typeof item === "string") return <li>{item}</li>;
  return (
    <li>
      {item.bold && <strong className="text-slate-900">{item.bold} </strong>}
      {item.text}
    </li>
  );
}

function ArticleBody({ blocks }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <h2 key={i} className="text-2xl font-semibold mt-12 mb-4 first:mt-0">
                {block.text}
              </h2>
            );

          case "paragraph":
            return (
              <p key={i} className="text-slate-700 leading-relaxed mb-4">
                {block.bold && <strong className="text-slate-900">{block.bold} </strong>}
                {block.text}
              </p>
            );

          case "callout":
            return (
              <section key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
                <p className="text-slate-700">{block.text}</p>
              </section>
            );

          case "list":
            return (
              <ul key={i} className="list-disc pl-6 space-y-2 text-slate-700 mb-6">
                {block.items.map((item, j) => (
                  <ListItem key={j} item={item} />
                ))}
              </ul>
            );

          case "table":
            return (
              <div key={i} className="overflow-x-auto mb-8">
                <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r} className={r % 2 === 0 ? "bg-slate-50" : ""}>
                        {row.map((cell, c) => (
                          <td key={c} className="px-4 py-2 border-t border-slate-200 text-slate-700">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "note":
            return (
              <p key={i} className="text-xs text-slate-400 italic mt-8">
                {block.text}
              </p>
            );

          default:
            return null;
        }
      })}
    </>
  );
}
