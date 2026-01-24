import { BrowserRouter, Routes, Route } from "react-router-dom";
import AnalyticsTracker from "./AnalyticsTracker";

import Header from "./layout/Header";
import Footer from "./layout/Footer";

import Home from "./pages/Home";
import About from "./pages/About";
import Products from "./pages/Products";
import Projects from "./pages/Projects";
import Contact from "./pages/Contact";

const Shell = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-white text-slate-900">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
     <AnalyticsTracker />
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
