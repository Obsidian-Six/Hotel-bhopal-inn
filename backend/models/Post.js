const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    image: { type: String, required: true },
    caption: { type: String },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
