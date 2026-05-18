const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    guestDetails: {
        title: { type: String, default: '' },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String },
        idProof: { type: String, default: '' },
        adults: { type: Number, default: 1 },
        children: { type: Number, default: 0 },
        specialRequests: { type: String, default: '' }
    },
    roomCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    roomUnit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RoomUnit',
        default: null
    },
    checkInDate: {
        type: Date,
        required: true
    },
    checkOutDate: {
        type: Date,
        required: true
    },
    actualCheckInTime: { type: Date },
    actualCheckOutTime: { type: Date },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled'],
        default: 'Pending'
    },
    financials: {
        roomTariff: { type: Number, default: 0 },
        extraCharges: [{
            description: String,
            amount: Number,
            date: { type: Date, default: Date.now },
            source: { type: String, default: 'Other' }
        }],
        totalAmount: { type: Number, default: 0 },
        amountPaid: { type: Number, default: 0 },
        balance: { type: Number, default: 0 },
        paymentHistory: [{
            amount: Number,
            mode: { type: String, enum: ['Cash', 'UPI', 'Card', 'Online'] },
            staff: { type: String, default: 'System' },
            timestamp: { type: Date, default: Date.now }
        }],
        paymentMode: { type: String, default: 'Pending' }
    },
    source: {
        type: String,
        enum: ['Website', 'Walk-in', 'Booking.com', 'MakeMyTrip', 'Other', 'Offline', 'OTA'],
        default: 'Website'
    },
    otaReferenceId: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
