const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

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
            admin.password = 'adminpassword123';
            await admin.save();
            console.log('Password updated successfully!');
        } else {
            console.log('No admin found, creating new one...');
            const newAdmin = new User({
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@bhopalinn.com',
                password: 'adminpassword123',
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
