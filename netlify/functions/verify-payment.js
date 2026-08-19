// netlify/functions/verify-payment.js
// Verifies the HMAC-SHA256 signature Razorpay returns after a successful checkout.
// Only treat a payment as confirmed if this returns verified: true.
import crypto from 'crypto';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return {
      statusCode: 400,
      body: JSON.stringify({ verified: false, error: 'Missing razorpay_order_id, razorpay_payment_id, or razorpay_signature' }),
    };
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Razorpay credentials are not configured on the server' }) };
  }

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expected);
  const gotBuf = Buffer.from(razorpay_signature);

  const isValid =
    expectedBuf.length === gotBuf.length && crypto.timingSafeEqual(expectedBuf, gotBuf);

  if (!isValid) {
    return {
      statusCode: 400,
      body: JSON.stringify({ verified: false, error: 'Signature mismatch — do not treat this payment as confirmed' }),
    };
  }

  // Signature is valid. This is the point where you'd mark an invoice as paid
  // in whatever system tracks that (no database exists in this repo yet, so
  // that step is intentionally left out — see README).
  return {
    statusCode: 200,
    body: JSON.stringify({ verified: true, order_id: razorpay_order_id, payment_id: razorpay_payment_id }),
  };
};
