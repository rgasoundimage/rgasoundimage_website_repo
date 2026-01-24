import { AudioLines, Layers } from "lucide-react";

export default function HeroMockup() {
  return (
    <div className="relative rounded-3xl shadow-lg overflow-hidden">
      <div className="aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-200" />

      <div className="absolute inset-x-6 bottom-6 bg-white rounded-2xl shadow p-4 grid gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100">
            <AudioLines size={18} />
          </div>
          <div className="text-sm">
            <p className="font-medium">Dolby-grade system design</p>
            <p className="text-slate-600">
              Accurate coverage, level, and voicing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100">
            <Layers size={18} />
          </div>
          <div className="text-sm">
            <p className="font-medium">Turnkey integration</p>
            <p className="text-slate-600">
              From drawings to commissioning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
