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
    // Real cash count at handover: cash given to the owner and cash left in the drawer.
    // When countedCash is set, closingBalance = countedCash (the software's own figure is kept in systemBalance).
    handedOver: { type: String, default: '' },   // Encrypted
    countedCash: { type: String, default: '' },  // Encrypted
    systemBalance: { type: String, default: '' }, // Encrypted
    note: { type: String, default: '' },
    status: {
        type: String,
        enum: ['Pending', 'Submitted'],
        default: 'Submitted'
    }
}, { timestamps: true });

module.exports = mongoose.model('CashHandover', CashHandoverSchema);
