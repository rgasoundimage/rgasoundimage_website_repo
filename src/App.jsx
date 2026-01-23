import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Phone, Mail, MapPin, ChevronRight, Play, Building2, AudioLines, Layers, VolumeX, Volume2, Maximize } from "lucide-react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useEffect } from "react";
import { useRef } from "react";


// =============================
// Brand & Site Config
// =============================
const BRAND = {
  name: "RGA Sound Image",
  tagline: "Designing sound that speaks to every space. Since 1995.",
  heritage: "Elevating audio experiences since 1995",
  description:
    "RGA Sound Image is a pioneer in Dolby-certified sound solutions across Andhra Pradesh and Telangana. We specialize in audio-visual consultation and turnkey installations for cinemas, commercial environments, and professional spaces. As authorized distributors of Stonewater Audio and partners with renowned global brands like JBL and Yamaha, we craft immersive sound experiences tailored to each client’s needs.",
  primary: "#0B1C53", // deep navy
  secondary: "#0F2A7E", // accent
  whatsapp: "https://wa.me/917981035920?text=Hi%20RGA%20Sound%20Image,%20I%20would%20like%20a%20consultation%20for%20an%20AV%20project.", // add your number like 91XXXXXXXXXX
};

// =============================
// Logo (uses external image) – with slight left shift and 1:3 ratio
// =============================
const Logo = () => (
  <div className="-ml-4">{/* shift logo slightly left */}
    <img
      src="https://i.postimg.cc/RhzYmvfw/RGA-logo-No-background.png"
      alt="RGA Sound Image logo"
      className="h-32 w-11 object-contain select-none"
      draggable={false}
    />
  </div>
);

// =============================
// Layout
// =============================
const Shell = ({ children }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900" style={{"--brand": BRAND.primary}}>
      <header className="sticky top-0 z-30 border-b border-slate-200" style={{ backdropFilter: "blur(10px)", background: "rgba(255,255,255,0.75)"}}>
        <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-slate-900 hover:text-slate-900 visited:text-slate-900">
          <Logo />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-[1.5rem] tracking-tight">{BRAND.name}</span>
              <span className="text-[0.65rem] text-slate-500 tracking-[0.1em] uppercase">{BRAND.heritage}</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <NavLink to="/" label="Home" current={location.pathname === "/"} />
            <NavLink to="/about" label="About" current={location.pathname.startsWith("/about")} />
            <NavLink to="/products" label="Products" current={location.pathname.startsWith("/products")} />
            <NavLink to="/projects" label="Projects" current={location.pathname.startsWith("/projects")} />
            <NavLink to="/contact" label="Contact" current={location.pathname.startsWith("/contact")} />
          </nav>
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Open menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {/* Mobile menu dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-white border-slate-200">
            <nav className="px-4 py-6 flex flex-col gap-4 text-sm items-center text-center">
              <Link to="/" onClick={() => setMobileOpen(false)}>Home</Link>
              <Link to="/about" onClick={() => setMobileOpen(false)}>About</Link>
              <Link to="/products" onClick={() => setMobileOpen(false)}>Products</Link>
              <Link to="/projects" onClick={() => setMobileOpen(false)}>Projects</Link>
              <Link to="/contact" onClick={() => setMobileOpen(false)}>Contact</Link>
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

const NavLink = ({ to, label, current }) => (
  <Link to={to} className={`transition hover:text-slate-900 ${current ? "text-slate-900" : "text-slate-600"}`}>{label}</Link>
);

const Footer = () => (
  <><footer className="border-t mt-16 border-slate-200" >
  {/* Top footer row */}
  <div className="w-full px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-10 items-start">

    {/* LEFT — Quick Links */}
      <div className="max-w-xs">
        <p className="font-medium mb-3">Quick Links</p>
        <ul className="space-y-2 text-sm text-slate-600">
          <li><Link to="/about" className="hover:text-slate-900">About</Link></li>
          <li><Link to="/products" className="hover:text-slate-900">Products</Link></li>
          <li><Link to="/projects" className="hover:text-slate-900">Projects</Link></li>
          <li><Link to="/contact" className="hover:text-slate-900">Contact</Link></li>
        </ul>
      </div>


    {/* CENTER — Logo */}
    <div className="flex justify-center">
  <div className="scale-150">
    <Logo />
  </div>
</div>

    {/* RIGHT — Contact */}
      <div className="text-sm text-slate-600 space-y-2 md:text-right">
        {/* Heading — match Quick Links */}
        <p className="font-medium mb-3 text-base text-slate-900">
          Contact
        </p>

        {/* Content — keep existing size */}
        <p className="flex items-center gap-2 md:justify-end">
          <Phone size={16} /> +91 98490 01016; +91 79810 35920
        </p>
        <p className="flex items-center gap-2 md:justify-end">
          <Mail size={16} /> contact@rgasoundimage.com
        </p>
        <p className="flex items-center gap-2 md:justify-end">
          <MapPin size={16} /> Hyderabad, Telangana, India
        </p>
      </div>
  </div>

  {/* Bottom footer row */}
  <div className="text-center text-xs text-slate-500 pb-8">
    © {new Date().getFullYear()} RGA Sound Image. All rights reserved.
  </div>
</footer>
</>
);

// =============================
// Pages
// =============================
const Home = () => {

  useEffect(() => {
    document.title =
      "RGA Sound Image | Professional Cinema & Commercial Audio Solutions ";
  }, []);

  return (
  <div>
    {/* Hero Section */}
    <section className="relative overflow-hidden">
      {/* Fixed background gradient (now behind the content) */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 80% at 30% 0%, #f1f5f9 0%, #ffffff 60%)',
        }}
      />

      {/* Main hero content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-14 pb-1">
        <div className="grid grid-cols-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
           
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
              Immersive audio-visual solutions for cinemas, commercial & professional spaces
            </h1>

            <p className="text-slate-600">
              From acoustic design to commissioning, we deliver turnkey projects that meet Dolby standards and brand expectations. Authorized distributor of Stonewater Audio; solution partners with Dolby and Harman.
            </p>

            <div className="flex flex-wrap gap-3 translate-y-12">
              <Link to="/products">
                <Button className="rounded-2xl">Explore Products</Button>
              </Link>
              <Link to="/projects">
                <Button variant="outline" className="rounded-2xl">
                  See Projects
                </Button>
              </Link>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-medium bg-slate-100 rounded-full px-3 py-1 w-fit mt-25">
  <AudioLines size={14} /> Dolby-Certified AV Integrators
</span>

          </motion.div>
        </div>
      </div>
    </section>

    <section className="w-full px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid md:grid-cols-3 gap-6">
        <ValueCard icon={<Building2 />} title="Turnkey Execution" text="Design, supply, installation, calibration, and AMC under one roof."/>
        <ValueCard icon={<Layers />} title="Certified Standards" text="Dolby specifications and best-practice acoustics for reliable performance."/>
        <ValueCard icon={<AudioLines />} title="Trusted Brands" text="Stonewater Audio, JBL Professional, Yamaha Commercial Audio, and more."/>
      </div>
    </section>

    <section className="bg-slate-50">
  <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
    
    {/* Header */}
    <div className="mb-8">
      <h2 className="text-2xl font-semibold">Our Clients</h2>
      <p className="text-sm text-slate-600 mt-1">
        Trusted by leading cinemas, corporates, institutions, and public venues.
      </p>
    </div>

    {/* Logo Grid */}
    <div className="bg-white rounded-2xl border p-8 py-6">
            <div
              className="
    grid
    gap-x-10 gap-y-6
    items-center
    [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]
  "
            >
        {[
          { name: "Skechers_Footwear", logo: "/clients/SKECHERS_logo.png" },
          { name: "Third_wave_coffee", logo: "/clients/TWC_logo.png" },
          { name: "Mukta_cinemas", logo: "/clients/mukta_cinemas.jpg" },
          { name: "ISB_Hyd", logo: "/clients/Indian_School_of_Business_Logo.png" },
          /*{ name: "ITC Hotels", logo: "/clients/itc.svg" },
          { name: "Infosys", logo: "/clients/infosys.svg" },
          { name: "Government of Telangana", logo: "/clients/telangana.svg" },*/
        ].map((client, i) => (
          <div
            key={i}
            className="flex items-center justify-center opacity-70 hover:opacity-100 transition"
          >
            <img
              src={client.logo}
              alt={client.name}
              className="
  w-full
  max-w-[140px]
  object-contain
  grayscale
  opacity-70
  hover:opacity-100
  transition
"
            />
          </div>
        ))}
      </div>
    </div>

  </div>
</section>

    <CtaBand />
  </div>
);
};

const About = () => {
  useEffect(() => {
    document.title =
      "About RGA Sound Image | Professional Audio Experts in India";
  }, []);

  return (
  <section className="w-full px-4 sm:px-6 lg:px-8 py-16 space-y-8">
    <h1 className="text-3xl md:text-4xl font-semibold">About {BRAND.name}</h1>
    <p className="text-slate-700 leading-7">{BRAND.description}</p>
    <div className="grid md:grid-cols-3 gap-6">
      <Stat number="100+" label="Projects Delivered"/>
      <Stat number="30+ yrs" label="Domain Experience"/>
      <Stat number="AP & TS" label="Regional Coverage"/>
    </div>
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader><CardTitle>What we do</CardTitle></CardHeader>
        <CardContent className="text-slate-700 space-y-2">
          <li>Consultation & acoustic design</li>
          <li>Supply, installation & integration</li>
          <li>Calibration (Dolby/Room EQ) & commissioning</li>
          <li>Annual maintenance contracts (AMC)</li>
        </CardContent>
      </Card>
      <Card className="rounded-2xl shadow-sm">
        <CardHeader><CardTitle>Verticals</CardTitle></CardHeader>
        <CardContent className="text-slate-700 space-y-2">
          <li>Cinema & preview theatres</li>
          <li>Corporate & education</li>
          <li>Hospitality & retail</li>
          <li>Houses of worship & public spaces</li>
        </CardContent>
      </Card>
    </div>
  </section>
);
};


const Products = () => {

  useEffect(() => {
    document.title =
      "Cinema, Commercial & Professional Audio Products | RGA Sound Image";
  }, []);

  return (
  <section className="w-full px-4 sm:px-6 lg:px-8 py-16">
    <div className="mb-10 max-w-4xl space-y-5">
  <h1 className="text-3xl md:text-4xl font-semibold">Products</h1>

  <p className="text-slate-700">
    Curated portfolio from Stonewater Audio (authorized distributor AP and Telangana), JBL Professional,
    Yamaha Commercial Audio, Onkyo and more.
  </p>

  {/* Catalogs */}
  <div className="space-y-3">
    <p className="font-medium text-slate-900">Our Catalogs:</p>

    <div className="flex flex-wrap gap-4">
      {/* Cinema Catalog */}
      <CatalogItem
        title="Cinema Systems"
        href="/RGA-Cinema-Catalog.pdf"
        size="PDF · 12 MB"
      />

      {/* Commercial Catalog */}
      <CatalogItem
        title="Commercial AV"
        href="/RGA_Speaker_catalogue.pdf"
        size="PDF · 3 MB"
      />
    </div>
  </div>

  {/* Get in touch line */}
  <p className="text-slate-600 text-sm">
    Get in touch for detailed datasheets and design support.
  </p>
</div>


    <div className="grid md:grid-cols-3 gap-6">
      <ProductCard
        title="Cinema Systems"
        items={["Screen channels", "Surrounds", "Subwoofers", "Processing & amps"]}
      />
      <ProductCard
        title="Commercial Speakers"
        items={["Ceiling & pendant", "Surface-mount", "Column arrays", "Sub-satellite kits"]}
      />
      <ProductCard
        title="Electronics & Control"
        items={["DSP & matrices", "Power amplifiers", "Mixers", "AV over IP"]}
      />
      <ProductCard
        title="Microphones & UCC"
        items={["Beamforming mics", "Wireless systems", "Conferencing", "Lecture capture"]}
      />
      <ProductCard
        title="Displays & Projection"
        items={["LED walls", "Commercial displays", "Projectors", "Screens"]}
      />
      <ProductCard
        title="Cables & Accessories"
        items={["Audio cabling", "Speaker hardware", "Racks & power", "Mounts"]}
      />
    </div>
    <div className="mt-10">
      <Card className="rounded-2xl">
        <CardContent className="p-6 flex flex-wrap items-center gap-4 text-sm text-slate-700">
          <span className="font-medium">Featured brands:</span>
          <Badge>Stonewater Audio</Badge>
          <Badge>JBL</Badge>
          <Badge>Crown</Badge>
          <Badge>Dolby</Badge>
          <Badge>Onkyo</Badge>
          <Badge>Yamaha</Badge>
          <Badge>Kasper</Badge>
          <Badge>18 Sounds</Badge>
          <Badge>Fonestar</Badge>
        </CardContent>
      </Card>
    </div>
  </section>
 );
};

const CatalogItem = ({ title, href, size }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    title="Download catalog"
    className="group inline-flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50 transition"
  >
    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition">
      <FileText size={18} className="text-slate-700" />
    </div>

    <div className="leading-tight">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="text-xs text-slate-500">{size}</p>
    </div>
  </a>
);

const Projects = () => {

  useEffect(() => {
    document.title =
      " Professional Audio Installation Projects | RGA Sound Image";
  }, []);

  return (
  <section className="w-full px-4 sm:px-6 lg:px-8 py-16">
    <div className="mb-8 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-semibold mb-2">Projects</h1>
      <p className="text-slate-700">
        Selected turnkey deployments delivered by our team. Each project includes consultation,
        integration, and on-site calibration.
      </p>
    </div>
    <div className="grid md:grid-cols-3 gap-6">
      {[       
        {
          title: "Multiplex – Hyderabad",
          tag: "Cinema",
          desc: "Chainwide standards rollout and commissioning support.",
        },
        {
          title: "Home Theatre – Hyderabad",
          tag: "Home Cinema",
          desc: "5.1 Home theatre system with screen, speaker and subwoofer alignment.",
          video: "/videos/Hometheatre-Hyderabad.mp4",
        }, 
        {
          title: "Auditorium – Telangana",
          tag: "Pro AV",
          desc: "Sub-satellite arrays for speech & music, matrix routing.",
        },
      ].map((p, i) => (
        <ProjectCard key={i} {...p} />
      ))}
    </div>
  </section>
);
};

const handleWhatsAppAfterSubmit = (e) => {
  e.preventDefault(); // stop default browser navigation

  const form = e.target;

  const name = form.name.value;
  const email = form.email.value;
  const phone = form.phone.value;
  const message = form.message.value;

  const whatsappText = encodeURIComponent(
    `Hi RGA Sound Image,

Name: ${name}
Email: ${email}
Phone: ${phone}

Message:
${message}`
  );

  const whatsappUrl = `https://wa.me/917981035920?text=${whatsappText}`;

  // Open WhatsApp first (browser allows this)
  window.open(whatsappUrl, "_blank");

  // THEN submit the form to Formspree
  form.submit();
};


const Contact = () => {

  useEffect(() => {
    document.title =
      "Contact RGA Sound Image | AV Solutions India";
  }, []);

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl md:text-4xl font-semibold mb-6 text-center max-w-2xl mx-auto">
        Contact
      </h1>

      <div className="flex justify-center">
    <Card className="rounded-2xl w-full max-w-2xl">
        <CardHeader><CardTitle>Send us a message</CardTitle></CardHeader>
          <CardContent>
            <form
              action="https://formspree.io/f/xnjjbqlz"
              method="POST"
              className="space-y-4"
              onSubmit={handleWhatsAppAfterSubmit}
            >
              <Input name="name" placeholder="Your name" required />
              <Input name="email" type="email" placeholder="Email" required />
              <Input name="phone" placeholder="Phone" />
              <Textarea
                name="message"
                placeholder="Tell us about your project"
                rows={5}
              />

              <Button type="submit" className="rounded-2xl">
                Submit
              </Button>
            </form>
          </CardContent>
      </Card>
      {/*<Card className="rounded-2xl">
        <CardHeader><CardTitle>Reach us</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-slate-700">
          <p className="flex items-center gap-2"><Phone size={16}/> +917981035920; +919849001016</p>
          <p className="flex items-center gap-2"><Mail size={16}/> contact@rgasoundimage.com</p>
          <p className="flex items-center gap-2"><MapPin size={16}/> Hyderabad, Telangana, India</p>
          <div className="rounded-xl overflow-hidden">
            <iframe title="map" className="w-full h-60" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2459.8367227786457!2d78.49255064261227!3d17.42343644082144!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb99f5a9129611%3A0x361ae86bd1feb2aa!2sA%2C%20GN160%2C%206-6-431%2C%20behind%20Necklace%20Pride%2C%20Gandhi%20Nagar%2C%20Bhoiguda%2C%20Secunderabad%2C%20Telangana%20500080!5e0!3m2!1sen!2sin!4v1762631746829!5m2!1sen!2sin"></iframe>
          </div>
        </CardContent>
      </Card>*/}
    </div>
  </section>
);
};

// =============================
// Reusable bits
// =============================
const ValueCard = ({ icon, title, text }) => (
  <Card className="rounded-2xl shadow-sm">
    <CardContent className="p-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-slate-100">{icon}</div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-slate-600 mt-1">{text}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ProductCard = ({ title, items }) => (
  <Card className="rounded-2xl shadow-sm">
    <CardHeader className="pb-2"><CardTitle>{title}</CardTitle></CardHeader>
    <CardContent className="text-sm text-slate-700">
      <ul className="space-y-1">
        {items.map((it, i)=> (
          <li key={i} className="flex items-start gap-2"><Check size={16} className="mt-0.5"/>{it}</li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const Badge = ({ children }) => (
  <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs">{children}</span>
);

const ProjectCard = ({ title, tag, desc, video }) => {
  const videoRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showUI, setShowUI] = useState(false);
  const [isFakeFullscreen, setIsFakeFullscreen] = useState(false);

  const revealUI = () => {
    setShowUI(true);
    clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setShowUI(false);
    }, 2000);
  };

  useEffect(() => {
    return () => clearTimeout(hideTimeoutRef.current);
  }, []);

  const handleFullscreen = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;

    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if (videoRef.current.webkitRequestFullscreen) {
      videoRef.current.webkitRequestFullscreen();
    }
  };

  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 768px)").matches;

  return (
    <Card className="rounded-2xl overflow-hidden transition hover:shadow-md">
      {/* Video Area */}
      <div
        className="relative aspect-video bg-black overflow-hidden cursor-pointer group"
        onMouseEnter={() => setShowUI(true)}
        onMouseLeave={() => setShowUI(false)}
        onClick={() => {
          if (!videoRef.current) return;
          revealUI();
          videoRef.current.paused
            ? videoRef.current.play()
            : videoRef.current.pause();
        }}
      >
        {video ? (
          <>
            {/* Video */}
            <video
              ref={videoRef}
              src={video}
              className="w-full h-full object-cover"
              preload="metadata"
              playsInline
              muted={muted}
              onTimeUpdate={() => {
                if (!videoRef.current) return;
                const percent =
                  (videoRef.current.currentTime /
                    videoRef.current.duration) *
                  100;
                setProgress(percent || 0);
              }}
            />

            {/* Play Indicator */}
            <div
              className={`
                pointer-events-none
                absolute inset-0 flex items-center justify-center
                transition-opacity duration-300
                ${videoRef.current?.paused && !showUI
                  ? "opacity-100"
                  : "opacity-0"
                }
              `}
            >
              <Play size={44} className="text-white/90 drop-shadow" />
            </div>

            {/* Scrubber */}
            <div
              className={`
                absolute bottom-0 left-0 right-0 h-1.5
                bg-white/20
                transition-opacity duration-300
                ${showUI ? "opacity-100" : "opacity-0"}
              `}
              onClick={(e) => {
                e.stopPropagation();
                if (!videoRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                videoRef.current.currentTime =
                  (clickX / rect.width) *
                  videoRef.current.duration;
              }}
            >
              <div
                className="h-full bg-white transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Mute Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMuted(!muted);
                revealUI();
              }}
              className={`
                absolute bottom-3 right-3 z-20
                bg-black/60 text-white p-2 rounded-full
                transition-opacity duration-300
                ${showUI ? "opacity-100" : "opacity-0"}
              `}
              aria-label="Toggle mute"
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                revealUI();

                if (isMobile) {
                  setIsFakeFullscreen(true);
                } else {
                  handleFullscreen(e);
                }
              }}
              className={`
    absolute bottom-3 left-3 z-20
    bg-black/60 text-white p-2 rounded-full
    transition-opacity duration-300
    ${showUI ? "opacity-100" : "opacity-0"}
  `}
              aria-label="Fullscreen"
            >
              <Maximize size={18} />
            </button>

          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <Play />
          </div>
        )}
      </div>

      {/* Text Content */}
      <CardContent className="p-5 space-y-1">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {tag}
        </p>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-slate-600">{desc}</p>
      </CardContent>
      {isFakeFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center px-4">
          <button
            onClick={() => setIsFakeFullscreen(false)}
            className="absolute top-4 right-4 z-10 bg-black/60 text-white p-2 rounded-full"
            aria-label="Close video"
          >
            ✕
          </button>
          <div className="w-full max-w-5xl aspect-video">
            <video
              src={video}
              className="w-full h-full object-contain"
              controls
              autoPlay
              playsInline
            />
          </div>
        </div>
      )}
    </Card>
  );
};

const Stat = ({ number, label }) => (
  <div className="rounded-2xl bg-slate-50 p-6 text-center">
    <div className="text-3xl font-semibold">{number}</div>
    <div className="text-slate-600 text-sm mt-1">{label}</div>
  </div>
);

const CtaBand = () => (
  <section className="py-16">
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <Card className="rounded-2xl">
        <CardContent className="p-8 md:p-10 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h3 className="text-2xl font-semibold">Ready to design your space?</h3>
            <p className="text-slate-600 mt-2">Tell us about your cinema, boardroom, auditorium, or venue. We’ll recommend the right system and deliver end-to-end.</p>
          </div>
          <div className="flex gap-3 md:justify-end">
            <Link to="/contact"><Button className="rounded-2xl">Get a Consultation</Button></Link>
            <a href={BRAND.whatsapp} target="_blank" rel="noreferrer"><Button variant="outline" className="rounded-2xl">Chat on WhatsApp</Button></a>
          </div>
        </CardContent>
      </Card>
    </div>
  </section>
);

const HeroMockup = () => (
  <div className="relative rounded-3xl shadow-lg overflow-hidden">
    <div className="aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-200" />
    <div className="absolute inset-x-6 bottom-6 bg-white rounded-2xl shadow p-4 grid gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-100"><AudioLines size={18}/></div>
        <div className="text-sm">
          <p className="font-medium">Dolby-grade system design</p>
          <p className="text-slate-600">Accurate coverage, level, and voicing.</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-100"><Layers size={18}/></div>
        <div className="text-sm">
          <p className="font-medium">Turnkey integration</p>
          <p className="text-slate-600">From drawings to commissioning.</p>
        </div>
      </div>
    </div>
  </div>
);

// =============================
// App Entrypoint
// =============================
export default function App() {

  return(
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
