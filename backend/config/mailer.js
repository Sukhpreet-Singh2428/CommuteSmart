const nodemailer = require('nodemailer');

// Graceful fallback: if credentials are missing, don't crash the server
const hasCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASS;

let transporter;

if (hasCredentials) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify((error) => {
    if (error) console.error('⚠️ Mailer verification failed:', error.message);
    else console.log('✅ Mailer ready (' + process.env.EMAIL_USER + ')');
  });
} else {
  console.warn('⚠️ EMAIL_USER / EMAIL_PASS not set — OTP emails will not be sent.');
  // Create a stub transporter that rejects with a clear message
  transporter = {
    sendMail: () => Promise.reject(new Error('Email credentials not configured. Set EMAIL_USER and EMAIL_PASS in .env')),
  };
}

module.exports = transporter;
