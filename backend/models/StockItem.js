const mongoose = require('mongoose');

// Simple stock item: one current count per item, with a low-stock level.
const StockItemSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'Other', trim: true },
    unit: { type: String, default: 'pcs', trim: true },
    quantity: { type: Number, default: 0 },
    minQuantity: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    lastUpdatedBy: { type: String, default: '' },
    lastUpdatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('StockItem', StockItemSchema);
