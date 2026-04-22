import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND } from "../config/brand";
import Stat from "../components/common/Stat";

const About = () => {
  useEffect(() => {
    document.title =
      "About RGA Sound Image – Dolby-Certified Audio Experts in Andhra Pradesh & Telangana";
  }, []);

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-16 space-y-12">

      {/* Header */}
      <div className="space-y-4 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-semibold">
          About {BRAND.name}
        </h1>

        <p className="text-slate-700 leading-7">
          RGA Sound Image is a pioneer in Dolby-certified professional audio
          solutions across Andhra Pradesh and Telangana. With over three decades
          of expertise, we specialize in cinema sound systems, commercial audio
          installations, and turnkey AV integrations.
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Stat number="100+" label="Projects Delivered" />
        <Stat number="30+ yrs" label="Domain Experience" />
        <Stat number="Nationwide" label="Operational Reach" />
      </div>

      {/*
      {/* Leadership Section
      <div className="space-y-8 mt-12">
        <h2 className="text-2xl font-semibold">
          Leadership
        </h2>

        <div className="grid md:grid-cols-2 gap-10">

          {/* Founder Profile 
          <div className="flex flex-col sm:flex-row gap-6 items-start">

            <div className="w-40 h-40 bg-slate-200 rounded-2xl shrink-0"></div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                Nagarjuna Bachu
              </h3>
              <p className="text-sm text-slate-500">
                Founder
              </p>
              <p className="text-slate-700 leading-6">
                Founder bio will go here.
              </p>
            </div>

          </div>

          {/* Head of Product Profile 
          <div className="flex flex-col sm:flex-row gap-6 items-start">

            <div className="w-40 h-40 bg-slate-200 rounded-2xl shrink-0"></div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                Anoop Bachu
              </h3>
              <p className="text-sm text-slate-500">
                Head of Product, Operations & Digital Strategy
              </p>
              <p className="text-slate-700 leading-6">
                Leadership bio will go here.
              </p>
            </div>

          </div>

        </div>
      </div>
      */}

      {/* What We Do + Verticals */}
      <div className="grid md:grid-cols-2 gap-6">

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>What We Do</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-slate-700 space-y-2">
              <li>Consultation & acoustic design</li>
              <li>Supply, installation & integration</li>
              <li>Dolby calibration & room EQ commissioning</li>
              <li>Annual maintenance contracts (AMC)</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Industries We Serve</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-slate-700 space-y-2">
              <li>Cinema & preview theatres</li>
              <li>Corporate & educational institutions</li>
              <li>Hospitality & retail spaces</li>
              <li>Houses of worship & public venues</li>
            </ul>
          </CardContent>
        </Card>

      </div>

      {/* Authority Section */}
      <div className="bg-slate-50 p-8 rounded-2xl">
        <h2 className="text-2xl font-semibold mb-4">
          Authorized Distributor & Global Brand Partner
        </h2>
        <p className="text-slate-700 leading-7 max-w-4xl">
          RGA Sound Image is an authorized distributor of Stonewater Audio
          and partners with globally recognized brands including JBL and Yamaha.
          We bring certified, high-performance audio systems to cinemas,
          commercial environments, and professional venues across India.
        </p>
      </div>

      {/* Mission Section */}
      <div className="max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold">
          Our Mission
        </h2>
        <p className="text-slate-700 leading-7">
          Our mission is to elevate audio experiences by combining technical
          precision, premium equipment, and expert calibration to deliver
          immersive, reliable, and future-ready sound environments.
        </p>
      </div>

    </section>
  );
};

export default About;
