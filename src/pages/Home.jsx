import { Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Building2, Layers, AudioLines } from "lucide-react";
import CtaBand from "../components/sections/CtaBand";
import ValueCard from "../components/cards/ValueCard";
import HeroMockup from "../components/sections/HeroMockup";



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
            { name: "devi-sudarshan", logo: "/clients/devi-sud-megaplex.png" },
            { name: "JIC", logo: "/clients/Jhic-logo.png" },
            /*{ name: "Government of Telangana", logo: "/clients/telangana.svg" },*/
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

  export default Home;