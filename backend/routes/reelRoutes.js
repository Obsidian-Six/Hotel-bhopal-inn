const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Reel = require('../models/Reel');
const fs = require('fs');

// Multer Storage for Videos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/videos/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, 'reel-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /mp4|webm|ogg|mov/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Videos Only!');
        }
    }
});

// @route   GET /api/reels
router.get('/', async (req, res) => {
    try {
        const reels = await Reel.find().sort({ createdAt: -1 });
        res.json(reels);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/reels
router.post('/', upload.single('video'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Please upload a video' });

    try {
        const newReel = new Reel({
            title: req.body.title || 'Hotel Reel',
            videoUrl: `/uploads/videos/${req.file.filename}`
        });
        await newReel.save();
        res.json(newReel);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   PUT /api/reels/:id
router.put('/:id', async (req, res) => {
    try {
        const reel = await Reel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(reel);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/reels/:id
router.delete('/:id', async (req, res) => {
    try {
        const reel = await Reel.findById(req.params.id);
        if (!reel) return res.status(404).json({ message: 'Reel not found' });

        const filePath = path.join(__dirname, '..', reel.videoUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await Reel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Reel deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
