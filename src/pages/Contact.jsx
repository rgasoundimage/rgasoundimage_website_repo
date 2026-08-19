import { useState } from "react";
import ReactGA from "react-ga4";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import SEO from "../components/SEO";
import { createBreadcrumbJsonLd, pageSeo } from "../config/seo";
import { INDIAN_STATES } from "../data/indianStates";

export default function Contact() {
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "success" | "error"
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    ReactGA.event({ category: "Form", action: "contact_form_submit" });

    const form = e.target;
    const payload = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      city: form.city.value,
      state: form.state.value,
      message: form.message.value,
      _honey: form._honey.value,
    };

    try {
      const res = await fetch("/.netlify/functions/sendcontact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setStatus("error");
        const errBody = await res.json().catch(() => ({}));
        setErrorMessage(
          errBody.error ||
            (res.status === 429
              ? "Too many submissions. Please wait a minute and try again."
              : "Something went wrong on our end. Please try again or call us directly.")
        );
        return;
      }

      // Success — confirm to user before opening WhatsApp
      form.reset();
      setStatus("success");

      const whatsappText = encodeURIComponent(
        `Hi RGA Sound Image,\n\nName: ${payload.name}\nEmail: ${payload.email}\nPhone: ${payload.phone}\nCity: ${payload.city}\nState: ${payload.state}\n\nMessage:\n${payload.message}`
      );
      window.open(`https://wa.me/917981035920?text=${whatsappText}`, "_blank");
    } catch {
      setStatus("error");
      setErrorMessage(
        "Could not reach the server. Please check your connection and try again."
      );
    }
  };

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-16">
      <SEO
        {...pageSeo.contact}
        jsonLd={createBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />

      <h1 className="text-3xl md:text-4xl font-semibold mb-6 text-center max-w-2xl mx-auto">
        Contact
      </h1>

      <div className="flex justify-center">
        <Card className="rounded-2xl w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
          </CardHeader>

          <CardContent>
            {status === "success" ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-lg font-medium text-slate-900">Message sent!</p>
                <p className="text-sm text-slate-600">
                  We have received your enquiry. WhatsApp is opening so you can follow up directly with our team.
                </p>
                <button
                  className="mt-4 text-sm text-slate-500 underline"
                  onClick={() => setStatus("idle")}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Honeypot — hidden from humans, traps bots that fill every field */}
                <input
                  name="_honey"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ display: "none" }}
                />
                <Input
                  name="name"
                  placeholder="Your name"
                  required
                  disabled={status === "loading"}
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  disabled={status === "loading"}
                />
                <Input
                  name="phone"
                  placeholder="Phone"
                  required
                  disabled={status === "loading"}
                />
                <Input
                  name="city"
                  placeholder="City"
                  required
                  disabled={status === "loading"}
                />
                <Select
                  name="state"
                  required
                  disabled={status === "loading"}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select state
                  </option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </Select>
                <Textarea
                  name="message"
                  placeholder="Tell us about your project"
                  rows={5}
                  required
                  disabled={status === "loading"}
                />

                {status === "error" && (
                  <p className="text-sm text-red-600" role="alert">
                    {errorMessage}
                  </p>
                )}

                <Button
                  type="submit"
                  className="rounded-2xl"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Sending..." : "Submit"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
