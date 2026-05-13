const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    picture: { type: String, required: true },
    description: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    isVeg: { type: Boolean, default: true },
    quantity: { type: String },
    cost: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
