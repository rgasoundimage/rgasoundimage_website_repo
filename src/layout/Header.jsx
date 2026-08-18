import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { BRAND } from "../config/brand";
import Logo from "../components/common/Logo";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/products", label: "Products" },
  { to: "/projects", label: "Projects" },
  { to: "/contact", label: "Contact" },
  { to: "/insights", label: "Insights" },
  { to: "/pay-invoice", label: "Pay Invoice" },
];

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
      if (!menuOpen) return;

      const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setMenuOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

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

            {/* Menu button + dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                className="p-2 rounded-lg hover:bg-slate-100"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
              >
                <HamburgerIcon open={menuOpen} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <Motion.nav
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-40 text-sm"
                  >
                    {NAV_LINKS.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </Motion.nav>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
      );
    }

    function HamburgerIcon({ open }) {
      return (
        <div className="relative w-5 h-4">
          <span
            className={`absolute left-0 top-0 w-5 h-0.5 bg-slate-900 rounded-full transition-transform duration-300 ease-in-out ${
              open ? "translate-y-[7px]" : ""
            }`}
          />
          <span
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-5 h-0.5 bg-slate-900 rounded-full transition-opacity duration-200 ease-in-out ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute left-0 bottom-0 w-5 h-0.5 bg-slate-900 rounded-full transition-transform duration-300 ease-in-out ${
              open ? "-translate-y-[7px]" : ""
            }`}
          />
        </div>
      );
    }
