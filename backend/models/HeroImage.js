const mongoose = require('mongoose');

const HeroImageSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true
    },
    title: {
        type: String,
        default: 'Luxury Hotel'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('HeroImage', HeroImageSchema);
