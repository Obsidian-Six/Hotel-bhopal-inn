const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    emailAddress: { type: String, required: true },
    eventType: { type: String, required: true },
    preferredDate: { type: Date, required: true },
    noOfGuests: { type: Number, required: true },
    mealRequirement: { type: String, required: true },
    specialRequirements: { type: String },
    status: { type: String, default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);
