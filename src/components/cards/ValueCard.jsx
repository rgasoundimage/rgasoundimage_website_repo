import { Card, CardContent } from "@/components/ui/card";

export default function ValueCard({ icon, title, text }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-100">{icon}</div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-slate-600 mt-1">{text}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
