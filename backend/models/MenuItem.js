const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    picture: { type: String, required: true },
    description: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
    isVeg: { type: Boolean, default: true },
    quantity: { type: String }, // e.g. "Full", "Half", "12 Pieces"
    cost: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
