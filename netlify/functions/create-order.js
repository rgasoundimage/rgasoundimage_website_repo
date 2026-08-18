// netlify/functions/create-order.js
// Creates a Razorpay order server-side. Amount must be in paise (INR smallest unit).
const Razorpay = require('razorpay');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { amount, currency = 'INR', receipt } = body;

  if (!amount || typeof amount !== 'number' || !Number.isInteger(amount) || amount < 100) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'amount must be an integer in paise, at least 100 (i.e. Rs. 1.00)' }),
    };
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Razorpay credentials are not configured on the server' }) };
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        // key_id is public by design (Razorpay's own checkout.js needs it client-side).
        // Returning it here means the frontend never hardcodes it, and swapping
        // test -> live is a server-side env var change only.
        key_id: process.env.RAZORPAY_KEY_ID,
      }),
    };
  } catch (err) {
    const description = err && err.error && err.error.description;
    const isAuthError = err.statusCode === 401 || /key|auth/i.test(description || '');
    return {
      statusCode: isAuthError ? 401 : 500,
      body: JSON.stringify({ error: description || 'Failed to create Razorpay order' }),
    };
  }
};
