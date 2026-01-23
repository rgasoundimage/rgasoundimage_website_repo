export default function Stat({ number, label }) {
    return (
      <div className="rounded-2xl bg-slate-50 p-6 text-center">
        <div className="text-3xl font-semibold">{number}</div>
        <div className="text-slate-600 text-sm mt-1">{label}</div>
      </div>
    );
  }