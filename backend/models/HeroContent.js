const mongoose = require('mongoose');

const HeroContentSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['image', 'video'],
        default: 'image'
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

module.exports = mongoose.model('HeroContent', HeroContentSchema);
