// crackers_backend/utils/emailSender.js
const nodemailer = require('nodemailer');
require('dotenv').config(); // Ensure env vars are loaded

/**
 * Sends an email using nodemailer based on provided options.
 * @param {object} options - Email options.
 * @param {string} options.email - Recipient's email address.
 * @param {string} options.subject - Email subject line.
 * @param {string} options.message - Plain text content of the email.
 * @param {string} [options.resetUrl] - Optional URL for password reset link (used in HTML template).
 * @param {string} [options.htmlMessage] - Optional pre-formatted HTML message. If provided, overrides the default template.
 */
const sendEmail = async (options) => {
    // Validate required environment variables for email configuration
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('CRITICAL: Email service configuration missing in .env file. Cannot send emails.');
        // Throwing an error ensures the calling function knows the email wasn't sent
        throw new Error('Email service is not configured on the server.');
    }

    // 1. Create a transporter using environment variables
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10), // Ensure port is a number
        // Use `secure: true` for port 465 (SSL), `secure: false` for port 587 (TLS/STARTTLS)
        secure: process.env.EMAIL_PORT === '465',
        auth: {
            user: process.env.EMAIL_USER, // Your Gmail address
            pass: process.env.EMAIL_PASS, // Your Gmail App Password
        },
        // Optional: Add TLS options if needed, but usually not required for Gmail with port 465/587
        // tls: {
        //     ciphers:'SSLv3' // Example, adjust if necessary based on provider requirements
        //     rejectUnauthorized: false // Use ONLY for local testing with self-signed certs
        // }
    });

    // --- Basic HTML Email Template ---
    const generateHtmlContent = (subject, message, resetUrl) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
      <style>
          body {
              margin: 0;
              padding: 0;
              background-color: #f4f6f8;
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #333;
              line-height: 1.6;
          }
          .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
              border: 1px solid #e5e7eb;
          }
          .header {
              background-color: #e53e3e;
              color: #ffffff;
              text-align: center;
              padding: 25px 20px;
          }
          .header h1 {
              margin: 0;
              font-size: 26px;
              font-weight: 600;
              letter-spacing: 0.5px;
          }
          .content {
              padding: 30px 25px;
          }
          .content h2 {
              color: #111827;
              font-size: 20px;
              margin-bottom: 15px;
          }
          .content p {
              margin-bottom: 18px;
              font-size: 15px;
              color: #444;
          }
          .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #e53e3e;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              letter-spacing: 0.3px;
              transition: background-color 0.2s ease-in-out;
          }
          .button:hover {
              background-color: #c53030;
          }
          .link {
              color: #e53e3e;
              word-break: break-all;
              text-decoration: none;
          }
          .footer {
              background-color: #f9fafb;
              text-align: center;
              padding: 20px 10px;
              font-size: 13px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
          }
          .footer a {
              color: #e53e3e;
              text-decoration: none;
              font-weight: 500;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>${process.env.EMAIL_FROM_NAME || 'Sparkle Crackers'}</h1>
          </div>
          <div class="content">
              <p>Hello,</p>
              <p>${message.split('\n\n')[0]}</p>

              ${
                resetUrl
                  ? `
              <p>Please click the button below to complete the process. This link is valid for 10 minutes.</p>
              <p style="text-align: center;">
                  <a href="${resetUrl}" class="button" target="_blank">Reset Your Password</a>
              </p>
              <p>If the button doesn't work, you can use this link:</p>
              <p><a href="${resetUrl}" class="link" target="_blank">${resetUrl}</a></p>
              `
                  : ''
              }

              <p>${message.split('\n\n').slice(2).join('<br>')}</p>

              <p>If you did not request this, please ignore this email.</p>
              <p>Thanks,<br>The ${
                process.env.EMAIL_FROM_NAME || 'Sparkle Crackers'
              } Team</p>
          </div>
          <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${
    process.env.EMAIL_FROM_NAME || 'Sparkle Crackers'
  }. All rights reserved.</p>
              ${
                process.env.FRONTEND_URL
                  ? `<p><a href="${process.env.FRONTEND_URL}" target="_blank">Visit our website</a></p>`
                  : ''
              }
          </div>
      </div>
  </body>
  </html>
  `;
};

    // --- End HTML Template ---


    // 2. Define email options, including HTML content
    const mailOptions = {
        // Use configured 'From' name and address, fallback to user credential if needed
        from: `"${process.env.EMAIL_FROM_NAME || 'Akash Crackers Support'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
        to: options.email, // Recipient address from function arguments
        subject: options.subject, // Subject from function arguments
        text: options.message, // Plain text version from function arguments
        // Use provided HTML or generate from template if resetUrl exists
        html: options.htmlMessage || generateHtmlContent(options.subject, options.message, options.resetUrl), // Added HTML template usage
    };

    // 3. Send the email using the transporter
    try {
        console.log(`Attempting to send email to ${options.email} via ${process.env.EMAIL_HOST}...`);
        // Send mail returns a promise
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully: %s', info.messageId);
        // You can log more details if needed: console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        return info; // Return info object on success (includes messageId, etc.)
    } catch (error) {
        // Log detailed error for server-side debugging
        console.error("Error occurred while sending email:", error);
        // Throw a new, clearer error for the calling function to handle
        // Avoid exposing detailed error information to the client if possible
        throw new Error('Email could not be sent due to a server configuration or network error.');
    }
};

// Export the function for use in controllers
// Renamed the export to be more generic if you plan to send other types of emails
module.exports = sendEmail;

// You would call this from your authController like this:
/*
const sendEmail = require('../utils/emailSender'); // Import the updated function

const forgotPassword = async (req, res) => {
    // ... (find user, generate token) ...

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `You requested a password reset...`; // Keep plain text concise

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Request',
            message: message, // Pass the plain text message
            resetUrl: resetUrl // Pass the reset URL separately for the template
        });
        res.status(200).json({ message: 'Reset link sent.' });
    } catch (error) {
        // ... (error handling, clear user reset token fields) ...
        res.status(500).json({ message: error.message || 'Error sending email.' });
    }
};
*/