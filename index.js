require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Transporter configuration for Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.error('Nodemailer configuration error:', error);
    } else {
        console.log('Server is ready to take our messages');
    }
});

// API Endpoint to send email
app.post('/api/send-email', async (req, res) => {
    const { to, senderName, subject, text, html } = req.body;

    // Basic validation
    if (!to || !subject || (!text && !html)) {
        return res.status(400).json({
            error: 'Missing required fields. Please provide "to", "subject", and either "text" or "html".'
        });
    }

    try {
        const fromName = senderName ? senderName.trim() : (process.env.EMAIL_FROM_NAME || 'Your App');
        const info = await transporter.sendMail({
            from: `"${fromName}" <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            text,
            html, // html body (optional)
        });

        console.log('Message sent: %s', info.messageId);
        res.status(200).json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to send email' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
