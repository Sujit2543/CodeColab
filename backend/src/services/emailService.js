const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// ── HTML email template ────────────────────────────────────────
function buildHtml(username, resetUrl) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0c10;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0c10;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
        style="background:#0d1117;border:1px solid #21262d;border-radius:12px;overflow:hidden;max-width:520px;width:100%;">
        <tr>
          <td style="padding:24px 32px;border-bottom:1px solid #21262d;">
            <span style="font-size:20px;">💻</span>
            <span style="padding-left:10px;font-size:18px;font-weight:700;color:#e6edf3;">CodeCollab</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e6edf3;">Reset your password</h2>
            <p style="margin:0 0 24px;font-size:14px;color:#7d8590;line-height:1.6;">
              Hey <strong style="color:#e6edf3;">${username}</strong>, click the button below to reset your CodeCollab password.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:linear-gradient(135deg,#1f6feb,#388bfd);border-radius:8px;padding:14px 32px;">
                  <a href="${resetUrl}" style="color:#fff;text-decoration:none;font-size:15px;font-weight:700;">
                    Reset Password →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 6px;font-size:12px;color:#7d8590;">Or copy this link:</p>
            <p style="margin:0 0 24px;font-size:11px;color:#388bfd;word-break:break-all;">${resetUrl}</p>
            <div style="background:#161b22;border:1px solid #21262d;border-left:3px solid #d29922;border-radius:6px;padding:14px;">
              <p style="margin:0;font-size:12px;color:#7d8590;line-height:1.6;">
                ⚠️ This link expires in <strong style="color:#e6edf3;">1 hour</strong>.
                If you didn't request this, ignore this email.
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #21262d;font-size:11px;color:#484f58;text-align:center;">
            CodeCollab · Real-Time Collaborative Development Platform
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Send via Resend API (preferred — works for all email providers) ──
async function sendViaResend({ to, username, resetUrl }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not set');

  const { Resend } = require('resend');
  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: 'CodeCollab <onboarding@resend.dev>',
    to,
    subject: '🔐 Reset your CodeCollab password',
    html: buildHtml(username, resetUrl),
    text: `Reset your CodeCollab password\n\nHey ${username},\n\nReset link (expires 1 hour):\n${resetUrl}\n\nIgnore if you didn't request this.`,
  });

  if (error) throw new Error(error.message);
  logger.info('Email sent via Resend', { id: data?.id, to });
  return data;
}

// ── Send via Gmail SMTP (fallback) ────────────────────────────
async function sendViaGmail({ to, username, resetUrl }) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) throw new Error('EMAIL_USER / EMAIL_PASS not set');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  await transporter.verify();

  const info = await transporter.sendMail({
    from: `"CodeCollab" <${user}>`,
    to,
    subject: '🔐 Reset your CodeCollab password',
    html: buildHtml(username, resetUrl),
    text: `Reset your CodeCollab password\n\nHey ${username},\n\nReset link (expires 1 hour):\n${resetUrl}\n\nIgnore if you didn't request this.`,
  });

  logger.info('Email sent via Gmail', { messageId: info.messageId, to });
  return info;
}

// ── Main export — tries Resend first, falls back to Gmail ─────
async function sendPasswordResetEmail({ to, username, resetUrl }) {
  // Try Resend first if API key is configured
  if (process.env.RESEND_API_KEY) {
    try {
      return await sendViaResend({ to, username, resetUrl });
    } catch (err) {
      logger.warn('Resend failed, falling back to Gmail', { error: err.message });
    }
  }

  // Fallback to Gmail SMTP
  return await sendViaGmail({ to, username, resetUrl });
}

module.exports = { sendPasswordResetEmail };
