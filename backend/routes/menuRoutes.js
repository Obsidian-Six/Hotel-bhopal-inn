const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/categories', upload.single('image'), async (req, res) => {
    const category = new Category({
        name: req.body.name,
        image: `/uploads/${req.file.filename}`
    });
    try {
        const saved = await category.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        const cat = await Category.findById(req.params.id);
        if (cat && fs.existsSync(path.join(__dirname, '..', cat.image))) {
            fs.unlinkSync(path.join(__dirname, '..', cat.image));
        }
        await MenuItem.deleteMany({ category: req.params.id });
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category and its items deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Items
router.get('/items', async (req, res) => {
    try {
        const items = await MenuItem.find().populate('category');
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/items', upload.single('picture'), async (req, res) => {
    const item = new MenuItem({
        ...req.body,
        picture: `/uploads/${req.file.filename}`
    });
    try {
        const saved = await item.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/items/:id', upload.single('picture'), async (req, res) => {
    try {
        const update = { ...req.body };
        if (req.file) {
            update.picture = `/uploads/${req.file.filename}`;
        }
        const updated = await MenuItem.findByIdAndUpdate(req.params.id, update, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/items/:id', async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (item && fs.existsSync(path.join(__dirname, '..', item.picture))) {
            fs.unlinkSync(path.join(__dirname, '..', item.picture));
        }
        await MenuItem.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
