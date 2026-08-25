const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const EventGallery = require('../models/EventGallery');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
    try {
        const images = await EventGallery.find().sort({ createdAt: -1 });
        res.json(images);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const { optimizeImage } = require('../utils/imageOptimizer');

router.post('/', upload.array('images', 10), async (req, res) => {
    try {
        const { title, category } = req.body;
        const uploadedImages = [];

        for (const file of req.files) {
            await optimizeImage(file.path);
            const newImage = new EventGallery({
                title: title || category,
                category,
                imageUrl: `/uploads/${file.filename}`
            });
            const savedImage = await newImage.save();
            uploadedImages.push(savedImage);
        }

        res.status(201).json(uploadedImages);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        const image = await EventGallery.findById(req.params.id);
        if (!image) return res.status(404).json({ message: 'Image not found' });

        const filePath = path.join(__dirname, '..', image.imageUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await EventGallery.findByIdAndDelete(req.params.id);
        res.json({ message: 'Image deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        const image = await EventGallery.findById(req.params.id);
        if (!image) return res.status(404).json({ message: 'Image not found' });

        if (req.body.title) image.title = req.body.title;
        if (req.body.category) image.category = req.body.category;

        const updatedImage = await image.save();
        res.json(updatedImage);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
