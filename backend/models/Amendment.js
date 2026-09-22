const mongoose = require('mongoose');

const AmendmentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: false
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: false
    },
    entryType: {
        type: String,
        enum: ['Booking', 'Transaction'],
        default: 'Booking'
    },
    guestName: {
        type: String,
        required: true
    },
    roomInfo: {
        type: String,
        default: ''
    },
    requestReason: {
        type: String,
        required: true // Message entered by admin explaining what was entered wrong
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    requestedByName: {
        type: String,
        default: 'Staff Admin'
    },
    requestedRole: {
        type: String,
        default: 'admin'
    },
    entrySnapshot: {
        guestDetails: {
            firstName: String,
            lastName: String,
            email: String,
            phone: String
        },
        roomCategory: String,
        roomNumber: String,
        checkInDate: Date,
        checkOutDate: Date,
        totalAmount: Number,
        amountPaid: Number,
        balance: Number,
        paymentMode: String,
        status: String,
        // Transaction snapshot fields
        description: String,
        category: String,
        type: String,
        recordedBy: String,
        approvedBy: String
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
        default: 'Pending'
    },
    canEdit: {
        type: Boolean,
        default: false
    },
    canDelete: {
        type: Boolean,
        default: false
    },
    superAdminAction: {
        actionBy: { type: String, default: null },
        actionAt: { type: Date, default: null },
        note: { type: String, default: '' }
    },
    completedAt: {
        type: Date,
        default: null
    },
    completedAction: {
        type: String, // 'Edited' or 'Deleted'
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Amendment', AmendmentSchema);
