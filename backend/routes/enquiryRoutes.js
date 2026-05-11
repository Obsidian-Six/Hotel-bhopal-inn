const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Enquiry = require('../models/Enquiry');

// Transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// @route   POST /api/enquiries
// @desc    Submit a new enquiry
router.post('/', async (req, res) => {
    try {
        const { 
            fullName, 
            mobileNumber, 
            emailAddress, 
            eventType, 
            preferredDate, 
            noOfGuests, 
            mealRequirement, 
            specialRequirements 
        } = req.body;

        const newEnquiry = new Enquiry({
            fullName,
            mobileNumber,
            emailAddress,
            eventType,
            preferredDate,
            noOfGuests,
            mealRequirement,
            specialRequirements
        });

        const savedEnquiry = await newEnquiry.save();

        // Email to Admin
        const adminMailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: `New Banquet Enquiry from ${fullName}`,
            html: `
                <h3>New Banquet Hall Enquiry</h3>
                <p><strong>Name:</strong> ${fullName}</p>
                <p><strong>Mobile:</strong> ${mobileNumber}</p>
                <p><strong>Email:</strong> ${emailAddress}</p>
                <p><strong>Event Type:</strong> ${eventType}</p>
                <p><strong>Date:</strong> ${new Date(preferredDate).toLocaleDateString()}</p>
                <p><strong>Guests:</strong> ${noOfGuests}</p>
                <p><strong>Meal Requirement:</strong> ${mealRequirement}</p>
                <p><strong>Special Requirements:</strong> ${specialRequirements || 'None'}</p>
            `
        };

        // Auto-reply to Enquirer
        const userMailOptions = {
            from: process.env.EMAIL_USER,
            to: emailAddress,
            subject: 'Thank you for your Enquiry - Hotel Bhopal Inn',
            html: `
                <h3>Hello ${fullName},</h3>
                <p>Thank you for reaching out to us regarding your upcoming event. We have received your enquiry for a ${eventType} on ${new Date(preferredDate).toLocaleDateString()}.</p>
                <p>Our team will review the details and get back to you shortly with a customized proposal.</p>
                <br/>
                <p>Best Regards,</p>
                <p><strong>Events Team</strong><br/>Hotel Bhopal Inn</p>
            `
        };

        // Send email
        try {
            await transporter.sendMail(adminMailOptions);
            await transporter.sendMail(userMailOptions);
            console.log('Enquiry notification emails sent successfully.');
        } catch (emailErr) {
            console.error('Email sending failed:', emailErr);
        }

        res.status(201).json(savedEnquiry);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
