const mongoose = require('mongoose');

const CashHandoverSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    shiftEndTime: {
        type: String,
        required: true
    },
    staffName: {
        type: String,
        required: true
    },
    handoverTo: {
        type: String,
        required: true
    },
    openingBalance: {
        type: String, // Encrypted
        required: true
    },
    totalCashIncome: {
        type: String, // Encrypted
        required: true
    },
    totalCashExpense: {
        type: String, // Encrypted
        required: true
    },
    closingBalance: {
        type: String, // Encrypted
        required: true
    },
    netDayTotal: {
        type: String, // Encrypted
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Submitted'],
        default: 'Submitted'
    }
}, { timestamps: true });

module.exports = mongoose.model('CashHandover', CashHandoverSchema);
