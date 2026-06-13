export const SITE_URL = "https://www.rgasoundimage.com";

export const DEFAULT_SEO = {
  title: "RGA Sound Image | Professional Cinema & Commercial Audio Solutions",
  description:
    "RGA Sound Image designs, supplies, installs, and calibrates Dolby-certified cinema, commercial, professional, and home audio-visual systems across India.",
  image: "/RGAlogo.png",
};

export const pageSeo = {
  home: {
    path: "/",
    title: DEFAULT_SEO.title,
    description: DEFAULT_SEO.description,
  },
  about: {
    path: "/about",
    title:
      "About RGA Sound Image | Dolby-Certified Audio Experts in AP & Telangana",
    description:
      "Learn about RGA Sound Image, a professional AV integration team with over three decades of experience in cinema sound, commercial audio, Dolby calibration, and turnkey installations.",
  },
  products: {
    path: "/products",
    title:
      "Stonewater Audio, Cinema & Commercial AV Products | RGA Sound Image",
    description:
      "Explore Stonewater Audio, cinema systems, commercial speakers, amplifiers, DSP, microphones, projection, displays, cabling, and AV products for Hyderabad, Telangana, and Andhra Pradesh.",
  },
  projects: {
    path: "/projects",
    title: "Professional Audio Installation Projects | RGA Sound Image",
    description:
      "See selected cinema, auditorium, commercial AV, and home theatre projects delivered by RGA Sound Image, including design, installation, integration, and calibration.",
  },
  contact: {
    path: "/contact",
    title: "Contact RGA Sound Image | AV Solutions India",
    description:
      "Contact RGA Sound Image for cinema audio, commercial AV, home theatre, professional sound, calibration, and turnkey audio-visual project support.",
  },
  insights: {
    path: "/insights",
    title: "Cinema & Commercial AV Design Insights | RGA Sound Image",
    description:
      "Read practical guides on cinema sound, auditorium acoustics, commercial AV design, speaker selection, and professional audio installation planning.",
  },
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${SITE_URL}/#organization`,
  name: "RGA Sound Image",
  alternateName: "RGA Sound Image AV Integrators",
  url: SITE_URL,
  logo: `${SITE_URL}/RGAlogo.png`,
  image: `${SITE_URL}/RGAlogo.png`,
  description: DEFAULT_SEO.description,
  foundingDate: "1995",
  telephone: ["+917981035920", "+919849001016"],
  email: "contact@rgasoundimage.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Hyderabad",
    addressRegion: "Telangana",
    addressCountry: "IN",
  },
  areaServed: [
    "Hyderabad",
    "Warangal",
    "Nizamabad",
    "Karimnagar",
    "Telangana",
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Tirupati",
    "Nellore",
    "Kurnool",
    "Rajahmundry",
    "Kakinada",
    "Andhra Pradesh",
    "India",
  ],
  serviceType: [
    "Cinema audio installation",
    "Commercial AV integration",
    "Professional audio systems",
    "Home theatre installation",
    "Dolby calibration",
  ],
};

export function createStonewaterServiceJsonLd() {
  const serviceCities = [
    "Hyderabad",
    "Warangal",
    "Nizamabad",
    "Karimnagar",
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Tirupati",
    "Nellore",
    "Kurnool",
    "Rajahmundry",
    "Kakinada",
  ];

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Stonewater Audio distribution and AV integration",
    alternateName: [
      "Stone Water Audio",
      "Stone Water Hyderabad",
      "Stone Water Visakhapatnam",
      "Stone Water Vijayawada",
      "Stone Water Guntur",
      "Stone Water Warangal",
    ],
    provider: {
      "@id": `${SITE_URL}/#organization`,
    },
    brand: {
      "@type": "Brand",
      name: "Stonewater Audio",
    },
    serviceType: "Professional audio product supply and AV integration",
    areaServed: serviceCities.map((city) => ({
      "@type": "City",
      name: city,
    })),
    url: `${SITE_URL}/products`,
  };
}

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "RGA Sound Image",
  url: SITE_URL,
  publisher: {
    "@id": `${SITE_URL}/#organization`,
  },
};

export function createBreadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

export function createArticleJsonLd({ slug, article }) {
  const path = `/insights/${slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.intro,
    url: `${SITE_URL}${path}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}${path}`,
    },
    author: {
      "@type": "Organization",
      name: "RGA Sound Image",
      url: SITE_URL,
    },
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
  };
}
