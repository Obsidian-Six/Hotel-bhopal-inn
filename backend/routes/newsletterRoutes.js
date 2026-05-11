const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Newsletter = require('../models/Newsletter');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// @route   POST /api/newsletter
// @desc    Subscribe to newsletter
router.post('/', async (req, res) => {
    try {
        const { firstName, email } = req.body;

        if (!firstName || !email) {
            return res.status(400).json({ message: 'First name and email are required.' });
        }

        const newSubscriber = new Newsletter({ firstName, email });
        const savedSubscriber = await newSubscriber.save();

        // Send email notification to sanivaraam@gmail.com
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: `New Newsletter Subscriber: ${firstName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; background-color: #fcfcfc;">
                    <h2 style="color: #0A192F; font-family: serif; border-bottom: 2px solid #BFA37E; padding-bottom: 10px; margin-top: 0;">New Newsletter Signup</h2>
                    <p style="font-size: 16px; color: #333;">A new visitor has subscribed to the Hotel Bhopal Inn newsletter.</p>
                    <div style="background-color: #fff; padding: 15px; border-left: 4px solid #BFA37E; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>First Name:</strong> ${firstName}</p>
                        <p style="margin: 0;"><strong>Email Address:</strong> ${email}</p>
                    </div>
                    <p style="font-size: 12px; color: #777; font-style: italic; margin-top: 30px;">This is an automated notification from your website's server.</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Newsletter email successfully sent to ${process.env.ADMIN_EMAIL}`);
        } catch (mailErr) {
            console.error('Newsletter notification email sending failed:', mailErr);
        }

        res.status(201).json({ success: true, subscriber: savedSubscriber });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
