const mongoose = require('mongoose');

const RoomUnitSchema = new mongoose.Schema({
    roomNumber: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    status: {
        type: String,
        enum: ['Available', 'Occupied', 'Dirty', 'Maintenance'],
        default: 'Available'
    }
}, { timestamps: true });

module.exports = mongoose.model('RoomUnit', RoomUnitSchema);
