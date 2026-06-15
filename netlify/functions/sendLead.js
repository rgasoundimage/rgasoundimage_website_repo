import nodemailer from "nodemailer";

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
  // Only allow POST
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
    const { enquiryType, name, email, phone } = JSON.parse(event.body);

    // Basic validation
    if (!name || !email || !phone) {
      return {
        statusCode: 400,
        body: "Missing required fields",
      };
    }

    // Create Gmail transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: `"RGA Website Bot" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // sends to yourself
      subject: `New Website Lead – ${enquiryType}`,
      html: `
        <h2>New Lead from Website Chatbot</h2>
        <p><strong>Enquiry Type:</strong> ${escapeHtml(enquiryType)}</p>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Email send error:", error);

    return {
      statusCode: 500,
      body: "Failed to send email",
    };
  }
}
