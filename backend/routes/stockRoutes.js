const express = require('express');
const router = express.Router();
const StockItem = require('../models/StockItem');
const StockMovement = require('../models/StockMovement');
const { protect, admin, superAdmin, staffOrIntegration } = require('../middleware/auth');

const who = (req) => (req.user && `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim()) || 'Staff';
const emit = (req) => { const io = req.app.get('socketio'); if (io) io.emit('stock_updated'); };

// Starter list taken from the hotel's stock Excel (water, beverages, linen).
const STARTER = [
    ['Water 500ml', 'Water', 'bottles', 48, 10], ['Water 1 Litre', 'Water', 'bottles', 24, 6], ['Sparkling Water', 'Water', 'bottles', 12, 4],
    ['Coke 330ml', 'Beverages', 'cans', 24, 5], ['Diet Coke 330ml', 'Beverages', 'cans', 12, 5], ['Sprite 330ml', 'Beverages', 'cans', 12, 5],
    ['Pepsi 330ml', 'Beverages', 'cans', 12, 5], ['Fanta Orange 330ml', 'Beverages', 'cans', 12, 5], ['Orange Juice 250ml', 'Beverages', 'packs', 12, 4],
    ['Apple Juice 250ml', 'Beverages', 'packs', 12, 4], ['Mango Juice 250ml', 'Beverages', 'packs', 8, 4], ['Red Bull 250ml', 'Beverages', 'cans', 6, 2],
    ['Coffee (Sachet)', 'Beverages', 'sachets', 30, 10], ['Tea Bags', 'Beverages', 'bags', 50, 15], ['Hot Chocolate Mix', 'Beverages', 'sachets', 20, 5],
    ['Pillow Cases (Standard)', 'Linen', 'pcs', 60, 10], ['Pillow Cases (King)', 'Linen', 'pcs', 20, 5], ['Single Bed Sheets', 'Linen', 'pcs', 40, 8],
    ['Double Bed Sheets', 'Linen', 'pcs', 50, 10], ['King Bed Sheets', 'Linen', 'pcs', 30, 6], ['Duvet Covers (Double)', 'Linen', 'pcs', 50, 10],
    ['Bath Towels', 'Linen', 'pcs', 80, 15], ['Hand Towels', 'Linen', 'pcs', 80, 15], ['Face Cloths', 'Linen', 'pcs', 80, 15],
    ['Bath Mats', 'Linen', 'pcs', 40, 8], ['Blankets', 'Linen', 'pcs', 40, 8]
];

// GET all active items (staff, super admin, or Daily Ops read-only key)
router.get('/', staffOrIntegration, async (req, res) => {
    try {
        const items = await StockItem.find({ active: true }).sort({ category: 1, name: 1 }).lean();
        res.json(items);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Load the starter list (only when there are no items yet)
router.post('/seed', protect, admin, async (req, res) => {
    try {
        if (await StockItem.countDocuments({}) > 0) return res.status(400).json({ message: 'Stock list already has items' });
        const by = who(req);
        await StockItem.insertMany(STARTER.map(([name, category, unit, quantity, minQuantity]) => ({ name, category, unit, quantity, minQuantity, lastUpdatedBy: by })));
        emit(req);
        res.status(201).json({ added: STARTER.length });
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// Add a new item
router.post('/', protect, admin, async (req, res) => {
    try {
        const { name, category, unit, quantity, minQuantity } = req.body;
        if (!name || !String(name).trim()) return res.status(400).json({ message: 'Item name is required' });
        const exists = await StockItem.findOne({ name: new RegExp('^' + String(name).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'), active: true });
        if (exists) return res.status(400).json({ message: 'An item with this name already exists' });
        const item = await StockItem.create({
            name: String(name).trim(), category: (category || 'Other').trim(), unit: (unit || 'pcs').trim(),
            quantity: Math.max(0, Number(quantity) || 0), minQuantity: Math.max(0, Number(minQuantity) || 0), lastUpdatedBy: who(req)
        });
        await StockMovement.create({ item: item._id, type: 'count', quantity: item.quantity, before: 0, after: item.quantity, note: 'Item added', by: who(req) });
        emit(req);
        res.status(201).json(item);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// Edit name / category / unit / low-stock level
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const item = await StockItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        const { name, category, unit, minQuantity } = req.body;
        if (name !== undefined && String(name).trim()) item.name = String(name).trim();
        if (category !== undefined) item.category = String(category).trim() || 'Other';
        if (unit !== undefined) item.unit = String(unit).trim() || 'pcs';
        if (minQuantity !== undefined) item.minQuantity = Math.max(0, Number(minQuantity) || 0);
        await item.save();
        emit(req);
        res.json(item);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// Record a change: received (+), used (-), damaged (-) or a physical count (= exact number)
router.post('/:id/move', protect, admin, async (req, res) => {
    try {
        const { type, quantity, note } = req.body;
        const qty = Number(quantity);
        if (!['received', 'used', 'damaged', 'count'].includes(type)) return res.status(400).json({ message: 'Choose received, used, damaged or count' });
        if (!Number.isFinite(qty) || qty < 0 || (type !== 'count' && qty === 0)) return res.status(400).json({ message: 'Enter a valid number' });
        const item = await StockItem.findById(req.params.id);
        if (!item || !item.active) return res.status(404).json({ message: 'Item not found' });
        const before = item.quantity;
        let after = before;
        if (type === 'received') after = before + qty;
        else if (type === 'used' || type === 'damaged') after = Math.max(0, before - qty);
        else after = qty;
        item.quantity = after;
        item.lastUpdatedBy = who(req);
        item.lastUpdatedAt = new Date();
        await item.save();
        await StockMovement.create({ item: item._id, type, quantity: qty, before, after, note: String(note || '').slice(0, 300), by: who(req) });
        emit(req);
        res.json(item);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// Recent history for one item
router.get('/:id/history', protect, admin, async (req, res) => {
    try {
        const rows = await StockMovement.find({ item: req.params.id }).sort({ date: -1 }).limit(50).lean();
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Remove an item from the list (kept in history) — super admin only
router.delete('/:id', protect, superAdmin, async (req, res) => {
    try {
        await StockItem.findByIdAndUpdate(req.params.id, { active: false });
        emit(req);
        res.json({ ok: true });
    } catch (err) { res.status(400).json({ message: err.message }); }
});

module.exports = router;
