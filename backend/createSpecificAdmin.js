const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createSpecificAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Delete any existing user with this email to be sure
        await User.deleteOne({ email: 'admin@bhopalinn.com' });

        const admin = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@bhopalinn.com',
            password: 'adminpassword123',
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
