import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// In-memory rate limiter — 5 submissions per IP per 60 seconds (per warm instance)
const rateMap = new Map();
const RATE_LIMIT = 5;
const WINDOW_MS = 60_000;

function isRateLimited(event) {
  const ip =
    (event.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    event.headers["client-ip"] ||
    "unknown";
  const now = Date.now();
  const hits = (rateMap.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= RATE_LIMIT) return true;
  rateMap.set(ip, [...hits, now]);
  return false;
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  if (isRateLimited(event)) {
    return {
      statusCode: 429,
      headers: { "Retry-After": "60" },
      body: JSON.stringify({ error: "Too many requests. Please try again later." }),
    };
  }

  try {
    const { name, email, phone, city, state, message, _honey } = JSON.parse(event.body);

    // Honeypot: bots fill hidden fields, humans don't
    if (_honey) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // Basic validation
    if (!name || !email || !phone || !city || !state || !message) {
      return {
        statusCode: 400,
        body: "Missing required fields",
      };
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) {
      return {
        statusCode: 400,
        body: "Invalid email",
      };
    }

    // Persist first — an enquiry that's saved but failed to email is
    // recoverable from the DB; one that emailed but never saved isn't.
    const { error: dbError } = await supabase.from("contact_submissions").insert({
      name: String(name).trim().slice(0, 255),
      email: String(email).trim().slice(0, 320),
      phone: String(phone).trim().slice(0, 32),
      city: String(city).trim().slice(0, 255),
      state: String(state).trim().slice(0, 255),
      message: String(message).trim(),
      source_page: event.headers.referer || null,
      user_agent: event.headers["user-agent"] || null,
    });

    if (dbError) {
      console.error("contact insert failed:", dbError);
      return {
        statusCode: 500,
        body: "Could not save submission",
      };
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"RGA Website Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `New Contact Form Enquiry – ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>City:</strong> ${escapeHtml(city)}</p>
        <p><strong>State:</strong> ${escapeHtml(state)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
      `,
    };

    // Best-effort — the submission is already saved, so a flaky SMTP
    // connection shouldn't turn into a failure the visitor sees.
    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error("Contact email error (submission was still saved):", emailError);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Contact submission error:", error);

    return {
      statusCode: 500,
      body: "Failed to process submission",
    };
  }
}
