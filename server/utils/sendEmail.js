import nodemailer from 'nodemailer';

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify((error) => {
    if (error) {
      console.error("SMTP connection failed:", error.message);
    } else {
      console.log("SMTP server is ready.");
    }
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  const mailer = getTransporter();

  await mailer.sendMail({
    from: `"ChatFlow" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  await sendEmail({
    to,
    subject: 'Reset your ChatFlow password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a63f5;">Reset your password</h2>
        <p>We received a request to reset your ChatFlow password. Click the button below to choose a new one. This link expires in 30 minutes.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background:#1a63f5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
            Reset Password
          </a>
        </p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p style="color:#888;font-size:12px;">If the button doesn't work, copy and paste this link: <br/>${resetUrl}</p>
      </div>
    `,
  });
};
