// Sends email through Brevo's REST API (https://api.brevo.com/v3/smtp/email) over
// plain HTTPS, instead of a raw SMTP socket. Raw SMTP (nodemailer + Gmail) stalled
// indefinitely when deployed on Railway — the client would time out and the
// signup/resend requests would fail with a network error even though the server
// itself was healthy. An HTTPS POST doesn't have that problem.
//
// Setup:
// 1. Create a free Brevo account: https://app.brevo.com
// 2. Settings → SMTP & API → API Keys → generate a key → put it in BREVO_API_KEY.
// 3. Senders, Domains & Dedicated IPs → Senders → add and verify the address you
//    want to send from (click the confirmation link Brevo emails you) → put that
//    address in SMTP_FROM (and BREVO_SENDER_NAME if you want a display name).
// Once the sender is verified, you can send to ANY recipient — no domain needed.
require('dotenv').config();

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

async function sendVerificationCode(toEmail, fullName, code) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not set — cannot send verification email.');
  }
  const senderEmail = process.env.SMTP_FROM || process.env.BREVO_SENDER_EMAIL;
  if (!senderEmail) {
    throw new Error('SMTP_FROM (verified Brevo sender email) is not set.');
  }

  const payload = {
    sender: { name: process.env.BREVO_SENDER_NAME || 'FitForge', email: senderEmail },
    to: [{ email: toEmail, name: fullName }],
    subject: 'Your FitForge verification code',
    textContent: `Hi ${fullName},\n\nYour FitForge verification code is: ${code}\n\nThis code expires in 15 minutes. If you didn't request this, you can ignore this email.`,
    htmlContent: `
      <div style="font-family:sans-serif; max-width:420px; margin:0 auto;">
        <h2 style="color:#E8AC3D;">FITFORGE</h2>
        <p>Hi ${fullName},</p>
        <p>Your verification code is:</p>
        <div style="font-size:32px; font-weight:bold; letter-spacing:6px; background:#1E2226; color:#E8AC3D; padding:16px; text-align:center; border-radius:10px;">${code}</div>
        <p style="color:#666; font-size:13px; margin-top:16px;">This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  };

  // Brevo's own docs recommend a request-level timeout on top of fetch's default,
  // since a hung upstream is exactly the failure mode we're moving away from.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let res;
  try {
    res = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Timed out contacting Brevo after 10s.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data && data.message ? data.message : `Brevo request failed with status ${res.status}`;
    throw new Error(`[mailer] Brevo error: ${message}`);
  }

  console.log(`[mailer] Sent to ${toEmail} via Brevo — messageId: ${data.messageId}`);
}

module.exports = { sendVerificationCode };
