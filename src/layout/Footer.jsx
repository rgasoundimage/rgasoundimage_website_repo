
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import Logo from "../components/common/Logo";

export default function Footer() {
    return (
    <footer className="border-t mt-16 border-slate-200" >
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
);
}