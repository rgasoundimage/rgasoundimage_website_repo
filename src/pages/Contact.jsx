import { useEffect } from "react";
import ReactGA from "react-ga4";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// ⬇️ SAME HANDLER, WITH GA ADDED
const handleWhatsAppAfterSubmit = async (e) => {
  e.preventDefault();

  // 🔹 GA4 event
  ReactGA.event({
    category: "Form",
    action: "contact_form_submit",
  });

  const form = e.target;

  const payload = {
    name: form.name.value,
    email: form.email.value,
    phone: form.phone.value,
    message: form.message.value,
  };

  // 🔹 Send email via Netlify Function (Gmail SMTP)
  await fetch("/.netlify/functions/sendcontact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // 🔹 WhatsApp redirect
  const whatsappText = encodeURIComponent(
    `Hi RGA Sound Image,

Name: ${payload.name}
Email: ${payload.email}
Phone: ${payload.phone}

Message:
${payload.message}`
  );

  window.open(
    `https://wa.me/917981035920?text=${whatsappText}`,
    "_blank"
  );

  form.reset();
};


export default function Contact() {
  useEffect(() => {
    document.title = "Contact RGA Sound Image | AV Solutions India";
  }, []);

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl md:text-4xl font-semibold mb-6 text-center max-w-2xl mx-auto">
        Contact
      </h1>

      <div className="flex justify-center">
        <Card className="rounded-2xl w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleWhatsAppAfterSubmit}>
              <Input name="name" placeholder="Your name" required />
              <Input name="email" type="email" placeholder="Email" required />
              <Input name="phone" placeholder="Phone" />
              <Textarea
                name="message"
                placeholder="Tell us about your project"
                rows={5}
                required
              />

              <Button type="submit" className="rounded-2xl">
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

