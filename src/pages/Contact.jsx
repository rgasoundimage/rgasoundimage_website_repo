import { useEffect } from "react";
import ReactGA from "react-ga4";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// ⬇️ SAME HANDLER, WITH GA ADDED
const handleWhatsAppAfterSubmit = (e) => {
  e.preventDefault(); // stop default browser navigation

  // 🔹 GA4: Contact form submit
  ReactGA.event({
    category: "Form",
    action: "contact_form_submit",
  });

  const form = e.target;

  const name = form.name.value;
  const email = form.email.value;
  const phone = form.phone.value;
  const message = form.message.value;

  const whatsappText = encodeURIComponent(
    `Hi RGA Sound Image,

Name: ${name}
Email: ${email}
Phone: ${phone}

Message:
${message}`
  );

  const whatsappUrl = `https://wa.me/917981035920?text=${whatsappText}`;

  // Open WhatsApp first
  window.open(whatsappUrl, "_blank");

  // THEN submit the form to Formspree
  form.submit();
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
            <form
              action="https://formspree.io/f/xnjjbqlz"
              method="POST"
              className="space-y-4"
              onSubmit={handleWhatsAppAfterSubmit}
            >
              <Input name="name" placeholder="Your name" required />
              <Input name="email" type="email" placeholder="Email" required />
              <Input name="phone" placeholder="Phone" />
              <Textarea
                name="message"
                placeholder="Tell us about your project"
                rows={5}
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

