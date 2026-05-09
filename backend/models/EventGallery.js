const mongoose = require('mongoose');

const eventGallerySchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    title: { type: String },
    category: { 
        type: String, 
        enum: ['Interior & Exterior', 'Banquet Hall', 'Board Meeting Room', 'Catering', 'Social Events', 'Wedding', 'Other', 'Corporate', 'Birthday', 'Social', 'Product Launch'],
        default: 'Other'
    }
}, { timestamps: true });

module.exports = mongoose.model('EventGallery', eventGallerySchema);
