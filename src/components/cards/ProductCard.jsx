
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

export default function ProductCard({ title, items }) {
    return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2"><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="text-sm text-slate-700">
        <ul className="space-y-1">
          {items.map((it, i)=> (
            <li key={i} className="flex items-start gap-2"><Check size={16} className="mt-0.5"/>{it}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
    );
}