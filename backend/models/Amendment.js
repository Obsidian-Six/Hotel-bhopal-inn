const mongoose = require('mongoose');

const AmendmentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    guestName: {
        type: String,
        required: true
    },
    roomInfo: {
        type: String,
        default: ''
    },
    balanceDue: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending Admin Action', 'Admin Responded', 'Resolved', 'Closed'],
        default: 'Pending Admin Action'
    },
    superAdminNote: {
        type: String,
        required: true
    },
    messages: [{
        sender: {
            type: String,
            enum: ['SuperAdmin', 'StaffAdmin', 'System'],
            required: true
        },
        senderName: {
            type: String,
            required: true
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdBy: {
        type: String,
        default: 'Super Admin'
    },
    resolvedBy: {
        type: String,
        default: null
    },
    resolvedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Amendment', AmendmentSchema);
