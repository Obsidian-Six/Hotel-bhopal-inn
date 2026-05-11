const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const listAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admins = await User.find({ role: 'admin' });
        console.log('Admin users in DB:');
        admins.forEach(u => {
            console.log(`- Email: ${u.email}`);
        });
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listAdmins();
