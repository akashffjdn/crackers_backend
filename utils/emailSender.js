// crackers_backend/utils/emailSender.js
const nodemailer = require('nodemailer');
require('dotenv').config(); // Ensure env vars are loaded

const sendPasswordResetEmail = async (options) => {
    // Validate required environment variables
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('CRITICAL: Email service configuration missing in .env file. Cannot send emails.');
        throw new Error('Email service not configured on the server.');
    }

    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10), // Ensure port is a number
        secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports like 587
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        // Optional: Add TLS options if needed for certain providers (e.g., local testing)
        // tls: {
        //     rejectUnauthorized: false // Use only for local testing if necessary
        // }
    });

    // 2. Define email options
    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Akash Crackers Support'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: `<p>${options.message.replace(/\n/g, '<br>')}</p>` // Optional HTML version
    };

    // 3. Send the email
    try {
        console.log(`Attempting to send email to ${options.email} via ${process.env.EMAIL_HOST}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully: %s', info.messageId);
        return info; // Indicate success
    } catch (error) {
        console.error("Error occurred while sending email:", error);
        throw new Error('Email could not be sent due to a server error.'); // Re-throw for controller to handle
    }
};

module.exports = sendPasswordResetEmail;