import nodemailer from "nodemailer";

export async function handler(event) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
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
        <p><strong>Enquiry Type:</strong> ${enquiryType}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
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
