import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BRAND } from "../config/brand";
import Logo from "../components/common/Logo";

export default function Header() {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <header
          className="sticky top-0 z-30 border-b border-slate-200"
          style={{
            backdropFilter: "blur(10px)",
            background: "rgba(255,255,255,0.75)",
          }}
        >
          <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-3 text-slate-900 hover:text-slate-900 visited:text-slate-900"
            >
              <Logo />
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-[1.5rem] tracking-tight">
                  {BRAND.name}
                </span>
                <span className="text-[0.65rem] text-slate-500 tracking-[0.1em] uppercase">
                  {BRAND.heritage}
                </span>
              </div>
            </Link>
    
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <NavLink to="/" label="Home" current={location.pathname === "/"} />
              <NavLink
                to="/about"
                label="About"
                current={location.pathname.startsWith("/about")}
              />
              <NavLink
                to="/products"
                label="Products"
                current={location.pathname.startsWith("/products")}
              />
              <NavLink
                to="/projects"
                label="Projects"
                current={location.pathname.startsWith("/projects")}
              />
              <NavLink
                to="/contact"
                label="Contact"
                current={location.pathname.startsWith("/contact")}
              />
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
    
          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden border-t bg-white border-slate-200">
              <nav className="px-4 py-6 flex flex-col gap-4 text-sm items-center text-center">
                <Link to="/" onClick={() => setMobileOpen(false)}>
                  Home
                </Link>
                <Link to="/about" onClick={() => setMobileOpen(false)}>
                  About
                </Link>
                <Link to="/products" onClick={() => setMobileOpen(false)}>
                  Products
                </Link>
                <Link to="/projects" onClick={() => setMobileOpen(false)}>
                  Projects
                </Link>
                <Link to="/contact" onClick={() => setMobileOpen(false)}>
                  Contact
                </Link>
              </nav>
            </div>
          )}
        </header>
      );
    }
    
    function NavLink({ to, label, current }) {
      return (
        <Link
          to={to}
          className={`transition hover:text-slate-900 ${
            current ? "text-slate-900" : "text-slate-600"
          }`}
        >
          {label}
        </Link>
      );
    }