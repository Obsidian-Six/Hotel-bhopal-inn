const mongoose = require('mongoose');

const DailyInventorySchema = new mongoose.Schema({
    roomCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    price: {
        type: Number,
        default: null // Null means use base price from Room category
    },
    roomsToSell: {
        type: Number,
        default: null // Null means use physical units count or default noOfRooms
    },
    status: {
        type: String,
        enum: ['Bookable', 'Closed'],
        default: 'Bookable'
    },
    bookingsCount: {
        type: Number,
        default: 0
    },
    blockedCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Ensure we don't have duplicate records for the same room category and date
DailyInventorySchema.index({ roomCategory: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyInventory', DailyInventorySchema);
