const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/menu/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, 'menu-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// --- Category Routes ---

router.get('/categories', async (req, res) => {
    try {
        const categories = await MenuCategory.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/categories', upload.single('image'), async (req, res) => {
    try {
        const category = new MenuCategory({
            name: req.body.name,
            image: `/uploads/menu/${req.file.filename}`
        });
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        const category = await MenuCategory.findById(req.params.id);
        if (category.image && fs.existsSync(path.join(__dirname, '..', category.image))) {
            fs.unlinkSync(path.join(__dirname, '..', category.image));
        }
        await MenuCategory.findByIdAndDelete(req.params.id);
        // Also delete items in this category
        await MenuItem.deleteMany({ category: req.params.id });
        res.json({ message: 'Category and its items deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Menu Item Routes ---

router.get('/items', async (req, res) => {
    try {
        const items = await MenuItem.find().populate('category');
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/items', upload.single('picture'), async (req, res) => {
    try {
        const item = new MenuItem({
            name: req.body.name,
            picture: `/uploads/menu/${req.file.filename}`,
            description: req.body.description,
            category: req.body.category,
            isVeg: req.body.isVeg === 'true',
            quantity: req.body.quantity,
            cost: Number(req.body.cost)
        });
        await item.save();
        res.status(201).json(item);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/items/:id', upload.single('picture'), async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.file) {
            updateData.picture = `/uploads/menu/${req.file.filename}`;
        }
        updateData.isVeg = req.body.isVeg === 'true';
        updateData.cost = Number(req.body.cost);

        const item = await MenuItem.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(item);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/items/:id', async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (item.picture && fs.existsSync(path.join(__dirname, '..', item.picture))) {
            fs.unlinkSync(path.join(__dirname, '..', item.picture));
        }
        await MenuItem.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
