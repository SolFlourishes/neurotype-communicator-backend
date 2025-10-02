const nodemailer = require('nodemailer');

// Create a transporter object using Brevo's SMTP details
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // Use 'false' for port 587
  auth: {
    user: process.env.BREVO_USER, // Your Brevo account email
    pass: process.env.BREVO_API_KEY, // The API key you just generated
  },
});

module.exports = transporter;