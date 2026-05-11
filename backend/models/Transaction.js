const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['Income', 'Expense'],
        required: true
    },
    category: {
        type: String,
        required: true 
    },
    amount: {
        type: String, // Stored as encrypted string
        required: true
    },
    description: {
        type: String // Stored as encrypted string
    },
    paymentMode: {
        type: String,
        enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Online'],
        required: true
    },
    recordedBy: {
        type: String,
        default: 'Admin'
    },
    approved: {
        type: Boolean,
        default: true // Income is auto-approved, Expense requires manager
    },
    approvedBy: {
        type: String,
        default: null
    },
    isVoided: {
        type: Boolean,
        default: false
    },
    voidReason: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
