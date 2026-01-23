import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND } from "../config/brand";
import Stat from "../components/common/Stat";



const About = () => {
    useEffect(() => {
      document.title =
        "About RGA Sound Image | Professional Audio Experts in India";
    }, []);
  
    return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <h1 className="text-3xl md:text-4xl font-semibold">About {BRAND.name}</h1>
      <p className="text-slate-700 leading-7">{BRAND.description}</p>
      <div className="grid md:grid-cols-3 gap-6">
        <Stat number="100+" label="Projects Delivered"/>
        <Stat number="30+ yrs" label="Domain Experience"/>
        <Stat number="AP & TS" label="Regional Coverage"/>
      </div>
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle>What we do</CardTitle></CardHeader>
          <CardContent className="text-slate-700 space-y-2">
            <li>Consultation & acoustic design</li>
            <li>Supply, installation & integration</li>
            <li>Calibration (Dolby/Room EQ) & commissioning</li>
            <li>Annual maintenance contracts (AMC)</li>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle>Verticals</CardTitle></CardHeader>
          <CardContent className="text-slate-700 space-y-2">
            <li>Cinema & preview theatres</li>
            <li>Corporate & education</li>
            <li>Hospitality & retail</li>
            <li>Houses of worship & public spaces</li>
          </CardContent>
        </Card>
      </div>
    </section>
  );
  };

  export default About;
