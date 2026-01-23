import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Phone, Mail, MapPin, ChevronRight, Play, Building2, AudioLines, Layers, VolumeX, Volume2, Maximize } from "lucide-react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { Menu, X } from "lucide-react";
import { useEffect } from "react";
import { useRef } from "react";
import Header from "./layout/Header";
import { useState } from "react";
import Footer from "./layout/Footer";
import CtaBand from "./components/sections/CtaBand";
import { BRAND } from "./config/brand";
import { Button } from "@/components/ui/button";
import Home from "./pages/Home";




// =============================
// Layout
// =============================
const Shell = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-white text-slate-900">
  <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);
     



// =============================
// Pages
// =============================


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
