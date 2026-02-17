import { useState } from "react";
import { Link } from "react-router-dom";


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
    readTime: "6 min read",
    slug: "cinema-sound-design-india",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop",
  };  

  const articles = [
    {
      title: "Dolby Atmos vs 7.1 — What Actually Matters",
      category: "Cinema",
      description: "Understanding practical differences in real theatre installations, not marketing specs.",
      readTime: "5 min read",
      slug: "dolby-atmos-vs-7-1",
    },
    {
      title: "Fixing Echo in Large Auditoriums",
      category: "Acoustics",
      description: "Common causes of speech echo and how acoustic treatment should be planned.",
      readTime: "4 min read",
      slug: "fix-auditorium-echo",
    },
    {
      title: "Choosing Speakers for Restaurants",
      category: "Commercial AV",
      description: "How coverage and mounting height affect customer comfort and ambience.",
      readTime: "3 min read",
      slug: "restaurant-speaker-guide",
    },
    {
      title: "Auditorium Sound System Cost in India",
      category: "Buying Guides",
      description: "Realistic budget ranges based on seating capacity and performance expectations.",
      readTime: "6 min read",
      slug: "auditorium-sound-cost-india",
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

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">
                                {featuredArticle.readTime}
                            </span>

                            <Link
                                to={`/insights/${featuredArticle.slug}`}
                                className="text-slate-900 font-medium hover:underline"
                            >
                                Read Article →
                            </Link>

                        </div>
                    </div>

                </div>
            </section>

            {/* ARTICLE GRID */}
            <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArticles.map((article) => (
                    <Link
                        key={article.slug}
                        to={`/insights/${article.slug}`}
                        className="group border border-slate-200 rounded-xl p-6 hover:border-slate-400 transition"
                    >
                        <p className="text-xs text-slate-500 mb-2">{article.category}</p>

                        <h3 className="text-lg font-semibold mb-3 group-hover:underline">
                            {article.title}
                        </h3>

                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                            {article.description}
                        </p>

                        <span className="text-sm text-slate-500">{article.readTime}</span>
                    </Link>
                ))}
            </section>


    </div>
  );
}
