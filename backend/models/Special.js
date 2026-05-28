const mongoose = require('mongoose');

const specialItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    picture: { type: String },
    isVeg: { type: Boolean, default: true },
    quantity: { type: String },
    price: { type: Number, required: true }
});

const specialSchema = new mongoose.Schema({
    heading: { type: String, required: true },
    image: { type: String, required: true },
    items: [specialItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Special', specialSchema);
