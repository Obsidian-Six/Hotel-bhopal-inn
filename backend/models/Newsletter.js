const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    email: { type: String, required: true },
    subscribedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Newsletter', newsletterSchema);
