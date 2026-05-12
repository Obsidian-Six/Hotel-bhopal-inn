const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    image: { type: String, required: true },
    caption: { type: String },
    link: { type: String, default: 'https://www.instagram.com/hoteltenontenstays/' }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
