const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

// While your Resend account is unverified for a custom domain, Resend only allows
// sending TO your own account email, and FROM their shared testing address
// (onboarding@resend.dev). Once you verify a domain at resend.com/domains, change
// RESEND_FROM in .env to an address on that domain and this works for anyone.
async function sendVerificationCode(toEmail, fullName, code) {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM || 'FitForge <onboarding@resend.dev>',
    to: toEmail,
    subject: 'Your FitForge verification code',
    text: `Hi ${fullName},\n\nYour FitForge verification code is: ${code}\n\nThis code expires in 15 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family:sans-serif; max-width:420px; margin:0 auto;">
        <h2 style="color:#E8AC3D;">FITFORGE</h2>
        <p>Hi ${fullName},</p>
        <p>Your verification code is:</p>
        <div style="font-size:32px; font-weight:bold; letter-spacing:6px; background:#1E2226; color:#E8AC3D; padding:16px; text-align:center; border-radius:10px;">${code}</div>
        <p style="color:#666; font-size:13px; margin-top:16px;">This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  });

  if (error) {
    console.error(`[mailer] Resend rejected the email to ${toEmail}:`, error);
    throw new Error(error.message || 'Email provider rejected the message.');
  }

  console.log(`[mailer] Sent to ${toEmail} — Resend id: ${data?.id}`);
}

module.exports = { sendVerificationCode };
