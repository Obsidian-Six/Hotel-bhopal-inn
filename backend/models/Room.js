const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        default: []
    },
    amenities: {
        type: [String],
        default: []
    },
    details: {
        noOfRooms: { type: Number, default: 0 },
        maxOccupancy: { type: String, default: '' },
        bedType: { type: String, default: '' },
        view: { type: String, default: '' },
        startingPrice: { type: Number, default: 0 },
        cutPrice: { type: Number, default: 0 },
        extraPersonCharge: { type: Number, default: 0 }
    },
    tags: {
        type: [String],
        default: []
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
