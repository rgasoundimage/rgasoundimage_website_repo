import { useParams } from "react-router-dom";
import { articles } from "../content/articles";
import { Helmet } from "react-helmet-async";


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
  <Helmet>
    <title>{article.title} | RGA Sound Image</title>
    <meta
      name="description"
      content={article.intro}
    />
    <meta property="og:title" content={article.title} />
    <meta property="og:description" content={article.intro} />
  </Helmet>

    <article className="max-w-3xl mx-auto px-6 py-16">

      <h1 className="text-4xl font-semibold mb-6">{article.title}</h1>

      <p className="text-slate-600 mb-10">{article.intro}</p>

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

    </article>
    </>
  );
}
