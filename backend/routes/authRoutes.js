const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

// Register User
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({ firstName, lastName, email, password, phone });
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

        res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            token
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@hotelbhopalinn.com';
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@BhopalInn2026#';

// Function to automatically seed and ensure Super Admin account exists
const seedSuperAdmin = async () => {
    try {
        let superAdmin = await User.findOne({ email: SUPERADMIN_EMAIL.toLowerCase() });
        if (!superAdmin) {
            superAdmin = new User({
                firstName: 'Super',
                lastName: 'Admin',
                email: SUPERADMIN_EMAIL.toLowerCase(),
                password: SUPERADMIN_PASSWORD,
                phone: '916267276957',
                role: 'superadmin'
            });
            await superAdmin.save();
            console.log(`[AUTH] Super Admin account created: ${SUPERADMIN_EMAIL}`);
        } else if (superAdmin.role !== 'superadmin') {
            superAdmin.role = 'superadmin';
            await superAdmin.save();
            console.log(`[AUTH] Super Admin role updated for: ${SUPERADMIN_EMAIL}`);
        }
    } catch (err) {
        console.error('[AUTH] Super Admin seeding error:', err.message);
    }
};

// Seed on startup
seedSuperAdmin();

// Dedicated Super Admin Login Route
router.post('/super-admin-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid Super Admin credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Super Admin credentials' });
        }

        if (user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Access denied. You do not have Super Admin privileges.' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

        res.json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isSuperAdmin: true,
            token
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

        res.json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isSuperAdmin: user.role === 'superadmin',
            token
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Login
router.post('/google', async (req, res) => {
    try {
        const { token: googleToken } = req.body;
        
        const ticket = await client.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, given_name, family_name, sub: googleId } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            // Create user if not exists
            user = new User({
                firstName: given_name,
                lastName: family_name || '',
                email: email,
                password: Math.random().toString(36).slice(-10), // Random password for google users
                isGoogleUser: true,
                googleId: googleId
            });
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

        res.json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            token
        });
    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(500).json({ message: 'Google authentication failed' });
    }
});

module.exports = router;
