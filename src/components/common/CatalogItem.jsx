import { FileText } from "lucide-react";

export default function CatalogItem({ title, href, size }) {
  return (
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
}
