const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('EMAIL_USER and EMAIL_PASS must be set in environment variables');
  }

  return nodemailer.createTransport({
    service: 'gmail',          // use named service — handles host/port/tls automatically
    auth: { user, pass },
    debug: false,
    logger: false,
  });
}

async function sendPasswordResetEmail({ to, username, resetUrl }) {
  const transporter = createTransporter();

  // Verify SMTP connection before sending
  await transporter.verify();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your CodeCollab password</title>
</head>
<body style="margin:0;padding:0;background:#0a0c10;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0c10;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#0d1117;border:1px solid #21262d;border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid #21262d;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:24px;line-height:1;">💻</td>
                  <td style="padding-left:12px;font-size:18px;font-weight:700;color:#e6edf3;">
                    CodeCollab
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e6edf3;">
                Reset your password
              </h2>
              <p style="margin:0 0 24px;font-size:14px;color:#7d8590;line-height:1.6;">
                Hey <strong style="color:#e6edf3;">${username}</strong>, we received a request to reset
                your CodeCollab password. Click the button below to create a new one.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#1f6feb,#388bfd);
                    border-radius:8px;padding:14px 32px;">
                    <a href="${resetUrl}"
                      style="color:#fff;text-decoration:none;font-size:15px;font-weight:700;
                      letter-spacing:0.02em;white-space:nowrap;">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <p style="margin:0 0 6px;font-size:12px;color:#7d8590;">
                If the button doesn't work, copy this link into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:11px;color:#388bfd;word-break:break-all;">
                ${resetUrl}
              </p>

              <!-- Warning box -->
              <div style="background:#161b22;border:1px solid #21262d;border-left:3px solid #d29922;
                border-radius:6px;padding:14px;">
                <p style="margin:0;font-size:12px;color:#7d8590;line-height:1.6;">
                  ⚠️ This link expires in <strong style="color:#e6edf3;">1 hour</strong>.
                  If you didn't request a password reset, ignore this email — your account is safe.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #21262d;
              font-size:11px;color:#484f58;text-align:center;">
              CodeCollab · Real-Time Collaborative Development Platform<br>
              This is an automated message, please do not reply.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const info = await transporter.sendMail({
    from: `"CodeCollab" <${process.env.EMAIL_USER}>`,
    to,
    subject: '🔐 Reset your CodeCollab password',
    html,
    text: `Reset your CodeCollab password\n\nHey ${username},\n\nClick this link to reset your password (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
  });

  logger.info('Password reset email sent', { messageId: info.messageId, to });
  return info;
}

module.exports = { sendPasswordResetEmail };
