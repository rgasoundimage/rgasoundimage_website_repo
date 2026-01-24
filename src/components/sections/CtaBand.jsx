import { BRAND } from "../../config/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import ReactGA from "react-ga4";

export default function CtaBand() {
  // 🔹 GA4 click handlers
  const handleConsultationClick = () => {
    ReactGA.event({
      category: "CTA",
      action: "Get Consultation Click",
    });
  };

  const handleWhatsappClick = () => {
    ReactGA.event({
      category: "CTA",
      action: "WhatsApp Chat Click",
    });
  };

  return (
    <section className="py-16">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <Card className="rounded-2xl">
          <CardContent className="p-8 md:p-10 grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-2xl font-semibold">
                Ready to design your space?
              </h3>
              <p className="text-slate-600 mt-2">
                Tell us about your cinema, boardroom, auditorium, or venue.
                We’ll recommend the right system and deliver end-to-end.
              </p>
            </div>

            <div className="flex gap-3 md:justify-end">
              {/* Get a Consultation */}
              <Link to="/contact" onClick={handleConsultationClick}>
                <Button className="rounded-2xl">
                  Get a Consultation
                </Button>
              </Link>

              {/* WhatsApp */}
              <a
                href={BRAND.whatsapp}
                target="_blank"
                rel="noreferrer"
                onClick={handleWhatsappClick}
              >
                <Button variant="outline" className="rounded-2xl">
                  Chat on WhatsApp
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
