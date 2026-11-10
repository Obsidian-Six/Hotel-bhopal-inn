const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();
if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 10) {
    console.error('Set ADMIN_PASSWORD (at least 10 characters) before running this script, e.g. ADMIN_PASSWORD=\'...\' node resetAdmin.js');
    process.exit(1);
}


const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Try to find the one I intended
        let admin = await User.findOne({ email: 'admin@bhopalinn.com' });
        
        if (!admin) {
            // Try to find any admin
            admin = await User.findOne({ role: 'admin' });
        }

        if (admin) {
            console.log('Updating password for admin:', admin.email);
            admin.password = process.env.ADMIN_PASSWORD;
            await admin.save();
            console.log('Password updated successfully!');
        } else {
            console.log('No admin found, creating new one...');
            const newAdmin = new User({
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@bhopalinn.com',
                password: process.env.ADMIN_PASSWORD,
                role: 'admin'
            });
            await newAdmin.save();
            console.log('Admin user created successfully!');
        }
        process.exit();
    } catch (err) {
        console.error('Error resetting admin:', err);
        process.exit(1);
    }
};

resetAdmin();
