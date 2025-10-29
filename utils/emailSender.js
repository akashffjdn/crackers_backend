// crackers_backend/utils/emailSender.js
const nodemailer = require('nodemailer');
// Load environment variables. In production, these should ideally be set directly
// in the hosting environment, not just from a .env file.
require('dotenv').config();

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
    // Added FRONTEND_URL because it's used in the default template
    const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'FRONTEND_URL'];
    const missingVars = requiredEnvVars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
        console.error(`CRITICAL: Email service configuration missing environment variables: ${missingVars.join(', ')}. Cannot send emails.`);
        throw new Error(`Email service is not configured correctly on the server. Missing: ${missingVars.join(', ')}`);
    }

    // --- Basic HTML Email Template ---
    const generateHtmlContent = (subject, message, resetUrl) => {
      // This function generates the HTML content for the email.
      // It uses EMAIL_FROM_NAME and FRONTEND_URL from environment variables.
      // [Your existing HTML template code goes here - no changes needed]
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
                      background-color: #e53e3e; /* Example Color */
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
                  .content p {
                      margin-bottom: 18px;
                      font-size: 15px;
                      color: #444;
                  }
                  .button {
                      display: inline-block;
                      padding: 12px 30px;
                      background-color: #e53e3e; /* Example Color */
                      color: #ffffff !important;
                      text-decoration: none;
                      border-radius: 6px;
                      font-weight: 600;
                      letter-spacing: 0.3px;
                      transition: background-color 0.2s ease-in-out;
                  }
                  .button:hover {
                      background-color: #c53030; /* Darker Shade for Hover */
                  }
                  .link {
                      color: #e53e3e; /* Example Color */
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
                      color: #e53e3e; /* Example Color */
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
                      <p>${message.split('\n\n')[0]}</p> {/* First paragraph */}

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

                       {/* Include rest of the message, handling cases with/without resetUrl */}
                       <p>${message.split('\n\n').slice(1).join('<br>')}</p>


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

    // 1. Create a transporter
    let transporter;
    try {
        const port = parseInt(process.env.EMAIL_PORT, 10);
        const host = process.env.EMAIL_HOST;
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;

        // Configuration object for nodemailer
        const transportOptions = {
            host: host,
            port: port,
            secure: port === 465, // Use SSL for port 465
            auth: {
                user: user,
                pass: pass, // Use password or App Password
            },
             // --- Add for Debugging Deployed Environment ---
             // logger: true, // Log SMTP commands
             // debug: true, // Log connection status
             // --- End Debugging ---

             // Optional: Explicit TLS options if needed (usually not for standard services like Gmail on 587)
             // tls: {
             //     ciphers: 'SSLv3', // Example: Use only if you know you need specific ciphers
             //     rejectUnauthorized: process.env.NODE_ENV === 'production' // Set to false ONLY for local testing with self-signed certs
             // }
        };

        // --- Alternative: Use 'service' for known providers like Gmail ---
        // If using Gmail and encountering issues with host/port, try this:
        // Make sure EMAIL_PASS is an App Password if 2FA is enabled.
        /*
        if (host && host.toLowerCase().includes('smtp.gmail.com')) {
             console.log('Using Gmail service configuration');
             transportOptions = {
                 service: 'gmail',
                 auth: {
                     user: user,
                     pass: pass // MUST be an App Password if using 2FA
                 }
                 // logger: true, // Keep for debugging if needed
                 // debug: true,  // Keep for debugging if needed
             };
         }
        */

        transporter = nodemailer.createTransport(transportOptions);

    } catch (configError) {
        console.error('CRITICAL: Error creating nodemailer transporter:', configError);
        throw new Error('Failed to configure the email transporter.');
    }


    // 2. Define email options
    const mailOptions = {
        // Use configured 'From' name and address, fallback to user credential if needed
        from: `"${process.env.EMAIL_FROM_NAME || 'Akash Crackers Support'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.htmlMessage || generateHtmlContent(options.subject, options.message, options.resetUrl),
    };

    // 3. Send the email
    try {
        console.log(`Attempting to send email to ${options.email} via ${transporter.options.host || transporter.options.service}...`);

        // --- Optional: Verify connection before sending (good for debugging) ---
        // await transporter.verify();
        // console.log('Nodemailer transporter verified successfully.');
        // --- End Optional Verify ---

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully: Message ID %s', info.messageId);
        // You can log more details if needed: console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        return info;
    } catch (error) {
        // Log detailed error for server-side debugging
        console.error('----------------------------------------');
        console.error('NODEMAILER ERROR: Failed to send email');
        console.error(`Timestamp: ${new Date().toISOString()}`);
        console.error(`Recipient: ${options.email}`);
        console.error(`Host/Service: ${transporter.options.host || transporter.options.service}`);
        console.error(`Port: ${transporter.options.port}`);
        console.error(`Secure: ${transporter.options.secure}`);
        // Log specific Nodemailer error properties if they exist
        if (error.code) console.error('Error Code:', error.code); // e.g., EAUTH, ECONNREFUSED
        if (error.response) console.error('Error Response:', error.response); // SMTP server response
        if (error.responseCode) console.error('Error Response Code:', error.responseCode);
        if (error.command) console.error('Failed Command:', error.command); // e.g., AUTH LOGIN, DATA
        // Log general Error properties
        console.error('Error Message:', error.message);
        // Log network-related properties if available
        if (error.syscall) console.error('Syscall:', error.syscall);
        if (error.address) console.error('Address:', error.address);
        // Log the full stack trace for context
        console.error('Full Error Stack:', error);
        console.error('----------------------------------------');

        // Throw a generic error for the calling function (don't expose details)
        throw new Error('Email could not be sent due to a server configuration or network error. Check server logs for details.');
    }
};

module.exports = sendEmail;