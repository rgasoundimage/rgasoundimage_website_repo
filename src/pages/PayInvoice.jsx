import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load the payment gateway. Please try again."));
    document.body.appendChild(script);
  });
}

export default function PayInvoice() {
  const [invoiceRef, setInvoiceRef] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadRazorpayScript().catch((err) => setMessage(err.message));
  }, []);

  const rupees = parseFloat(amount);
  const canPay = invoiceRef.trim().length > 0 && rupees > 0 && status !== "loading";

  const handlePay = async () => {
    setMessage("");
    setStatus("loading");

    const amountInPaise = Math.round(rupees * 100);

    try {
      const orderRes = await fetch("/.netlify/functions/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountInPaise, currency: "INR", receipt: invoiceRef.trim() }),
      });

      if (!orderRes.ok) {
        const errBody = await orderRes.json().catch(() => ({}));
        throw new Error(errBody.error || "Could not start payment.");
      }

      const order = await orderRes.json();

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: "RGA Sound Image",
        description: `Invoice ${invoiceRef.trim()}`,
        theme: { color: "#0b1f3a" },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/.netlify/functions/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const result = await verifyRes.json();
            if (verifyRes.ok && result.verified) {
              setStatus("success");
              setMessage(`Payment received for invoice ${invoiceRef.trim()}. Thank you.`);
            } else {
              setStatus("error");
              setMessage("Payment could not be verified. Please contact us before assuming it went through.");
            }
          } catch {
            setStatus("error");
            setMessage("Payment may have gone through, but we could not confirm it. Please contact us to check.");
          }
        },
        modal: {
          ondismiss: () => {
            setStatus("idle");
            setMessage("Payment cancelled.");
          },
        },
      });

      rzp.on("payment.failed", (response) => {
        const desc = response?.error?.description || "please try again.";
        setStatus("error");
        setMessage(`Payment failed: ${desc}`);
      });

      rzp.open();
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Something went wrong starting the payment.");
    }
  };

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-16">
      <Helmet>
        <title>Pay Invoice | RGA Sound Image</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <h1 className="text-3xl md:text-4xl font-semibold mb-6 text-center max-w-2xl mx-auto">
        Pay Invoice
      </h1>

      <div className="flex justify-center">
        <Card className="rounded-2xl w-full max-w-md">
          <CardHeader>
            <CardTitle>Complete your payment</CardTitle>
          </CardHeader>

          <CardContent>
            {status === "success" ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-lg font-medium text-slate-900">Payment received!</p>
                <p className="text-sm text-slate-600">{message}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="invoice-ref" className="block text-sm font-medium text-slate-700 mb-1">
                    Invoice number
                  </label>
                  <Input
                    id="invoice-ref"
                    placeholder="e.g. RGA-2026-0142"
                    value={invoiceRef}
                    onChange={(e) => setInvoiceRef(e.target.value)}
                    disabled={status === "loading"}
                  />
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">
                    Amount due (₹)
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="e.g. 25000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={status === "loading"}
                  />
                </div>

                {message && (
                  <p className={`text-sm ${status === "error" ? "text-red-600" : "text-slate-600"}`} role="status">
                    {message}
                  </p>
                )}

                <Button
                  type="button"
                  className={`w-full rounded-2xl transition ${
                    canPay ? "ring-2 ring-offset-2 ring-slate-900" : "opacity-50 cursor-not-allowed"
                  }`}
                  disabled={!canPay}
                  onClick={handlePay}
                >
                  {status === "loading" ? "Starting payment..." : "Pay Invoice"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
