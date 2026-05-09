const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const HeroImage = require('../models/HeroImage');
const fs = require('fs');
const { protect, admin } = require('../middleware/auth');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// @route   GET /api/hero-images
// @desc    Get all hero images
router.get('/', async (req, res) => {
    try {
        const images = await HeroImage.find().sort({ createdAt: -1 });
        res.json(images);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/hero-images
// @desc    Upload a new hero image
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload an image' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    
    const newImage = new HeroImage({
        imageUrl: imageUrl,
        title: req.body.title || 'Luxury Hotel'
    });

    try {
        const savedImage = await newImage.save();
        res.status(201).json(savedImage);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/hero-images/:id
// @desc    Delete a hero image
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const image = await HeroImage.findById(req.params.id);
        if (!image) return res.status(404).json({ message: 'Image not found' });

        // Delete file from filesystem
        const filePath = path.join(__dirname, '..', image.imageUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await HeroImage.findByIdAndDelete(req.params.id);
        res.json({ message: 'Image deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
