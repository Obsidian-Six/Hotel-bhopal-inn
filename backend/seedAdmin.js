const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();
if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 10) {
    console.error('Set ADMIN_PASSWORD (at least 10 characters) before running this script, e.g. ADMIN_PASSWORD=\'...\' node seedAdmin.js');
    process.exit(1);
}


const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for seeding...');

        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log('Admin already exists:', adminExists.email);
            process.exit();
        }

        const admin = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@bhopalinn.com',
            password: process.env.ADMIN_PASSWORD,
            role: 'admin'
        });

        await admin.save();
        console.log('Admin user created successfully!');
        console.log('Email: admin@bhopalinn.com');
        console.log('Password: (the ADMIN_PASSWORD you set in .env)');
        process.exit();
    } catch (err) {
        console.error('Error seeding admin:', err);
        process.exit(1);
    }
};

seedAdmin();
