const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'User no longer exists. Please log out and log in again.' });
            }
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

const superAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized. Exclusive Super Admin access required.' });
    }
};

// Read-only access for the Daily Ops app: a GET request carrying the secret
// X-Integration-Key header (DAILY_OPS_KEY in .env) is let through; anything
// else must be a logged-in staff/admin user as before.
const staffOrIntegration = (req, res, next) => {
    const key = process.env.DAILY_OPS_KEY || '';
    const sent = req.headers['x-integration-key'];
    if (req.method === 'GET' && key.length >= 24 && typeof sent === 'string' && sent.length === key.length
        && crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(key))) {
        req.user = { _id: null, role: 'integration' };
        return next();
    }
    return protect(req, res, () => admin(req, res, next));
};

module.exports = { protect, admin, superAdmin, staffOrIntegration };
