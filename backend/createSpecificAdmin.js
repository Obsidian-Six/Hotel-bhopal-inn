const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();
if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 10) {
    console.error('Set ADMIN_PASSWORD (at least 10 characters) before running this script, e.g. ADMIN_PASSWORD=\'...\' node createSpecificAdmin.js');
    process.exit(1);
}


const createSpecificAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Delete any existing user with this email to be sure
        await User.deleteOne({ email: 'admin@bhopalinn.com' });

        const admin = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@bhopalinn.com',
            password: process.env.ADMIN_PASSWORD,
            role: 'admin'
        });

        await admin.save();
        console.log('Admin user admin@bhopalinn.com created successfully!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createSpecificAdmin();
