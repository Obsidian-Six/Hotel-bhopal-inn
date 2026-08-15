const mongoose = require('mongoose');

const ElectricityReadingSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    dateStr: {
        type: String, // 'YYYY-MM-DD'
        required: true,
        unique: true
    },
    reading: {
        type: Number,
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    recordedBy: {
        type: String,
        default: 'Front Desk'
    }
}, { timestamps: true });

module.exports = mongoose.model('ElectricityReading', ElectricityReadingSchema);
