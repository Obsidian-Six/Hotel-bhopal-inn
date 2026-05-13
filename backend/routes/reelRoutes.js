const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Reel = require('../models/Reel');
const fs = require('fs');

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
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only videos are allowed'), false);
        }
    }
});

router.get('/', async (req, res) => {
    try {
        const reels = await Reel.find().sort({ createdAt: -1 });
        res.json(reels);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', upload.single('video'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Please upload a video' });
    
    const newReel = new Reel({
        title: req.body.title || 'Hotel Reel',
        videoUrl: `/uploads/${req.file.filename}`
    });

    try {
        const savedReel = await newReel.save();
        res.status(201).json(savedReel);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedReel = await Reel.findByIdAndUpdate(
            req.params.id, 
            { title: req.body.title }, 
            { new: true }
        );
        res.json(updatedReel);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

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
