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
import About from "./pages/About";
import Products from "./pages/Products";
import Contact from "./pages/Contact";
import Projects from "./pages/Projects";





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
