import { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { createBreadcrumbJsonLd, pageSeo } from "../config/seo";


const categories = [
  "All",
  "Cinema",
  "Commercial AV",
  "Acoustics",
  "Buying Guides",
];

const featuredArticle = {
    title: "How to Design Cinema Sound for Indian Auditoriums",
    category: "Cinema",
    description:
      "Key acoustic and speaker placement principles required to achieve clear dialogue and uniform coverage in medium and large theatres.",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop",
  };  

  const articles = [
    {
      title: "The Stonewater SR200: The Commercial Amplifier That Solves the Subwoofer Problem",
      category: "Commercial AV",
      description: "How a built-in passive subwoofer output and active crossover let a 2.1 amplifier outperform higher-wattage stereo systems in cafés, gyms and restaurants.",
      readTime: "8 min read",
      slug: "stonewater-sr200",
      status: "published",
    },
    {
      title: "Dolby Atmos vs 7.1 — What Actually Matters",
      category: "Cinema",
      description: "Understanding practical differences in real theatre installations, not marketing specs.",
      readTime: "5 min read",
      slug: "dolby-atmos-vs-7-1",
      status: "published",
    },
    {
      title: "Fixing Echo in Large Auditoriums",
      category: "Acoustics",
      description: "Common causes of speech echo and how acoustic treatment should be planned.",
      readTime: "4 min read",
      slug: "fix-auditorium-echo",
      status: "published",
    },
    {
      title: "Why Great-Looking Restaurants Still Sound Bad",
      category: "Commercial AV",
      description: "Why noise is the top diner complaint, and the real speaker, amplifier and zoning setups that fix it — from a single café to a multi-zone venue.",
      readTime: "10 min read",
      slug: "why-restaurants-sound-bad",
      status: "published",
    },
    {
      title: "Auditorium Sound System Cost in India",
      category: "Buying Guides",
      description: "Realistic budget ranges based on seating capacity and performance expectations.",
      readTime: "Coming soon",
      status: "coming-soon",
    },
  ];
  

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredArticles =
  activeCategory === "All"
    ? articles
    : articles.filter((a) => a.category === activeCategory);

    return (
        <div className="max-w-6xl mx-auto px-6 py-16">
            <SEO
                {...pageSeo.insights}
                jsonLd={createBreadcrumbJsonLd([
                    { name: "Home", path: "/" },
                    { name: "Insights", path: "/insights" },
                ])}
            />

            {/* HERO */}
            <section className="mb-12">
                <h1 className="text-4xl font-semibold tracking-tight mb-4">
                    Insights on Cinema & Commercial AV Design
                </h1>
                <p className="text-slate-600 max-w-2xl leading-relaxed">
                    Practical guides, system design knowledge, and real-world learnings from decades of AV integration across theatres, auditoriums and commercial spaces.
                </p>
            </section>

            {/* CATEGORY FILTER */}
            <section className="mb-16">
                <div className="flex flex-wrap gap-3">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm transition 
                ${activeCategory === cat
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </section>

            {/* FEATURED ARTICLE */}
            <section className="mb-20">
                <div className="grid md:grid-cols-2 gap-8 items-center">

                    <img
                        src={featuredArticle.image}
                        alt={featuredArticle.title}
                        className="w-full h-[320px] object-cover rounded-xl"
                    />

                    <div>
                        <p className="text-sm text-slate-500 mb-2">
                            {featuredArticle.category}
                        </p>

                        <h2 className="text-3xl font-semibold tracking-tight mb-4">
                            {featuredArticle.title}
                        </h2>

                        <p className="text-slate-600 mb-6 leading-relaxed">
                            {featuredArticle.description}
                        </p>

                        <div className="flex items-center">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                                Coming soon
                            </span>
                        </div>
                    </div>

                </div>
            </section>

            {/* ARTICLE GRID */}
            <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArticles.map((article) => {
                    const content = (
                        <>
                            <p className="text-xs text-slate-500 mb-2">{article.category}</p>

                            <h3 className={`text-lg font-semibold mb-3 ${article.status === "published" ? "group-hover:underline" : ""}`}>
                                {article.title}
                            </h3>

                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                {article.description}
                            </p>

                            <span className="text-sm text-slate-500">{article.readTime}</span>
                        </>
                    );

                    if (article.status === "published") {
                        return (
                            <Link
                                key={article.slug}
                                to={`/insights/${article.slug}`}
                                className="group border border-slate-200 rounded-xl p-6 hover:border-slate-400 transition"
                            >
                                {content}
                            </Link>
                        );
                    }

                    return (
                        <article
                            key={article.title}
                            className="border border-slate-200 rounded-xl p-6 bg-slate-50"
                        >
                            {content}
                        </article>
                    );
                })}
            </section>


    </div>
  );
}
