const mongoose = require('mongoose');

const heroContentSchema = new mongoose.Schema({
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
        default: 'Luxury Stay'
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('HeroContent', heroContentSchema);
