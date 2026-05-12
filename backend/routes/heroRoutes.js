const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const HeroContent = require('../models/HeroContent');
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

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images and videos are allowed'), false);
        }
    }
});

// @route   GET /api/hero-images
// @desc    Get all hero content (images/videos)
router.get('/', async (req, res) => {
    try {
        const content = await HeroContent.find().sort({ createdAt: -1 });
        res.json(content);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/hero-images
// @desc    Upload a new hero content (image or video)
router.post('/', protect, admin, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload a file' });
    }

    const url = `/uploads/${req.file.filename}`;
    
    const newContent = new HeroContent({
        url: url,
        type: isVideo ? 'video' : 'image',
        title: req.body.title || 'Luxury Hotel'
    });

    try {
        const savedContent = await newContent.save();
        res.status(201).json(savedContent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/hero-images/:id
// @desc    Delete a hero content
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const content = await HeroContent.findById(req.params.id);
        if (!content) return res.status(404).json({ message: 'Content not found' });

        // Delete file from filesystem
        const filePath = path.join(__dirname, '..', content.url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await HeroContent.findByIdAndDelete(req.params.id);
        res.json({ message: 'Content deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
