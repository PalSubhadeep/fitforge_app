const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendVerificationCode(toEmail, fullName, code) {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
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

  console.log(`[mailer] Sent to ${toEmail} — messageId: ${info.messageId} — accepted: ${JSON.stringify(info.accepted)} — rejected: ${JSON.stringify(info.rejected)}`);
}

module.exports = { sendVerificationCode };
