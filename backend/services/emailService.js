const nodemailer = require('nodemailer');

/**
 * Send an email using nodemailer SMTP transporter or fallback to console log in development
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Text body
 * @param {string} [options.html] - Optional HTML body
 */
const sendEmail = async (options) => {
  let transporter;

  // Use SMTP settings if provided in env
  if (
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS
  ) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: parseInt(process.env.EMAIL_PORT, 10) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Development fallback
    console.log('\n======================================================');
    console.log('✉️  [MOCK EMAIL SENT]');
    console.log(`To:      ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: ${options.message}`);
    console.log('======================================================\n');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Subscription Platform <noreply@platform.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Error sending email via SMTP:', err.message);
    // Fall back to console printing on SMTP failure to avoid crashing registration flow
    console.log('\n⚠️ [SMTP FAILED - FALLBACK LOG]');
    console.log(`To:      ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: ${options.message}`);
    console.log('======================================================\n');
  }
};

module.exports = {
  sendEmail
};
