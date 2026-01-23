import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, FileText } from "lucide-react";
import CatalogItem from "../components/common/CatalogItem";
import ProductCard from "../components/cards/ProductCard";
import Badge from "../components/common/Badge";



const Products = () => {

    useEffect(() => {
      document.title =
        "Cinema, Commercial & Professional Audio Products | RGA Sound Image";
    }, []);
  
    return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10 max-w-4xl space-y-5">
    <h1 className="text-3xl md:text-4xl font-semibold">Products</h1>
  
    <p className="text-slate-700">
      Curated portfolio from Stonewater Audio (authorized distributor AP and Telangana), JBL Professional,
      Yamaha Commercial Audio, Onkyo and more.
    </p>
  
    {/* Catalogs */}
    <div className="space-y-3">
      <p className="font-medium text-slate-900">Our Catalogs:</p>
  
      <div className="flex flex-wrap gap-4">
        {/* Cinema Catalog */}
        <CatalogItem
          title="Cinema Systems"
          href="/RGA-Cinema-Catalog.pdf"
          size="PDF · 12 MB"
        />
  
        {/* Commercial Catalog */}
        <CatalogItem
          title="Commercial AV"
          href="/RGA_Speaker_catalogue.pdf"
          size="PDF · 3 MB"
        />
      </div>
    </div>
  
    {/* Get in touch line */}
    <p className="text-slate-600 text-sm">
      Get in touch for detailed datasheets and design support.
    </p>
  </div>
  
  
      <div className="grid md:grid-cols-3 gap-6">
        <ProductCard
          title="Cinema Systems"
          items={["Screen channels", "Surrounds", "Subwoofers", "Processing & amps"]}
        />
        <ProductCard
          title="Commercial Speakers"
          items={["Ceiling & pendant", "Surface-mount", "Column arrays", "Sub-satellite kits"]}
        />
        <ProductCard
          title="Electronics & Control"
          items={["DSP & matrices", "Power amplifiers", "Mixers", "AV over IP"]}
        />
        <ProductCard
          title="Microphones & UCC"
          items={["Beamforming mics", "Wireless systems", "Conferencing", "Lecture capture"]}
        />
        <ProductCard
          title="Displays & Projection"
          items={["LED walls", "Commercial displays", "Projectors", "Screens"]}
        />
        <ProductCard
          title="Cables & Accessories"
          items={["Audio cabling", "Speaker hardware", "Racks & power", "Mounts"]}
        />
      </div>
      <div className="mt-10">
        <Card className="rounded-2xl">
          <CardContent className="p-6 flex flex-wrap items-center gap-4 text-sm text-slate-700">
            <span className="font-medium">Featured brands:</span>
            <Badge>Stonewater Audio</Badge>
            <Badge>JBL</Badge>
            <Badge>Crown</Badge>
            <Badge>Dolby</Badge>
            <Badge>Onkyo</Badge>
            <Badge>Yamaha</Badge>
            <Badge>Kasper</Badge>
            <Badge>18 Sounds</Badge>
            <Badge>Fonestar</Badge>
          </CardContent>
        </Card>
      </div>
    </section>
   );
  };

  export default Products;
