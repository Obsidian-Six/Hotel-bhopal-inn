const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    source: {
        type: String,
        default: 'Via Google'
    },
    rating: {
        type: Number,
        default: 5
    },
    isVisible: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
