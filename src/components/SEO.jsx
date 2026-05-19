import { Helmet } from "react-helmet-async";
import { DEFAULT_SEO, SITE_URL } from "../config/seo";

export default function SEO({
  title = DEFAULT_SEO.title,
  description = DEFAULT_SEO.description,
  path = "/",
  image = DEFAULT_SEO.image,
  type = "website",
  jsonLd,
}) {
  const canonicalPath = path === "/" ? "" : path;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="RGA Sound Image" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {jsonLd &&
        (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((schema, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
    </Helmet>
  );
}
