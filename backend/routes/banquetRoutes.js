const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Banquet = require('../models/Banquet');
const fs = require('fs');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, 'banquet-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// @route   GET /api/banquet
// @desc    Get banquet details
router.get('/', async (req, res) => {
    try {
        let banquet = await Banquet.findOne();
        if (!banquet) {
            banquet = new Banquet();
            await banquet.save();
        }
        res.json(banquet);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   PUT /api/banquet
// @desc    Update banquet details
router.put('/', async (req, res) => {
    try {
        let banquet = await Banquet.findOne();
        if (!banquet) banquet = new Banquet();
        
        Object.assign(banquet, req.body);
        await banquet.save();
        res.json(banquet);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   POST /api/banquet/hero
// @desc    Upload hero image
router.post('/hero', upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Please upload an image' });

    try {
        let banquet = await Banquet.findOne();
        if (!banquet) banquet = new Banquet();

        banquet.heroImages.push(`/uploads/${req.file.filename}`);
        await banquet.save();
        res.json(banquet);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/banquet/hero/:filename
// @desc    Delete hero image
router.delete('/hero/:filename', async (req, res) => {
    try {
        let banquet = await Banquet.findOne();
        if (!banquet) return res.status(404).json({ message: 'Banquet not found' });

        const photoUrl = `/uploads/${req.params.filename}`;
        banquet.heroImages = banquet.heroImages.filter(p => p !== photoUrl);
        
        const filePath = path.join(__dirname, '..', photoUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await banquet.save();
        res.json(banquet);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/banquet/overview
// @desc    Add overview photo
router.post('/overview', upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Please upload an image' });

    try {
        let banquet = await Banquet.findOne();
        if (!banquet) banquet = new Banquet();

        banquet.overviewPhotos.push(`/uploads/${req.file.filename}`);
        await banquet.save();
        res.json(banquet);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/banquet/overview/:filename
// @desc    Delete overview photo
router.delete('/overview/:filename', async (req, res) => {
    try {
        let banquet = await Banquet.findOne();
        if (!banquet) return res.status(404).json({ message: 'Banquet not found' });

        const photoUrl = `/uploads/${req.params.filename}`;
        banquet.overviewPhotos = banquet.overviewPhotos.filter(p => p !== photoUrl);
        
        const filePath = path.join(__dirname, '..', photoUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await banquet.save();
        res.json(banquet);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
