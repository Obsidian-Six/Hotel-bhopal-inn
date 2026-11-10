const mongoose = require('mongoose');

// Every change to a stock count, so you can see who changed what and when.
const StockMovementSchema = new mongoose.Schema({
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'StockItem', required: true, index: true },
    type: { type: String, enum: ['received', 'used', 'damaged', 'count'], required: true },
    quantity: { type: Number, required: true },
    before: { type: Number, default: 0 },
    after: { type: Number, default: 0 },
    note: { type: String, default: '' },
    by: { type: String, default: '' },
    date: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('StockMovement', StockMovementSchema);
