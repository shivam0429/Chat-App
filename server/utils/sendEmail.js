export const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'ChatFlow',
          email: process.env.EMAIL_USER,
        },
        to: [
          {
            email: to,
          },
        ],
        subject,
        htmlContent: html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('BREVO API ERROR:', result);
      throw new Error(result.message || 'Failed to send email');
    }

    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('EMAIL SEND ERROR:', error.message);
    throw error;
  }
};

export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  return sendEmail({
    to,
    subject: 'Reset your ChatFlow password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a63f5;">Reset your password</h2>

        <p>
          We received a request to reset your ChatFlow password.
          Click the button below to choose a new one.
          This link expires in 30 minutes.
        </p>

        <p style="margin: 24px 0;">
          <a
            href="${resetUrl}"
            style="background:#1a63f5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;"
          >
            Reset Password
          </a>
        </p>

        <p>If you didn't request this, you can safely ignore this email.</p>

        <p style="color:#888;font-size:12px;">
          If the button doesn't work, copy and paste this link:
          <br />${resetUrl}
        </p>
      </div>
    `,
  });
};