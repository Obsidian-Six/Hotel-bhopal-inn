const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Offer = require('../models/Offer');

// Set up Multer for image uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, 'offer-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB Limit
}).single('image');

// @route   GET /api/offers
// @desc    Get all offers
router.get('/', async (req, res) => {
    try {
        const offers = await Offer.find().sort({ createdAt: -1 });
        res.json(offers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   GET /api/offers/active
// @desc    Get all active offers
router.get('/active', async (req, res) => {
    try {
        const offers = await Offer.find({ isActive: true }).sort({ createdAt: -1 });
        res.json(offers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/offers
// @desc    Add a new offer
router.post('/', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        
        try {
            const { title, description, validity, terms, isActive } = req.body;
            
            const newOffer = new Offer({
                title,
                description,
                validity,
                terms,
                isActive: isActive === 'true' || isActive === true,
                imageUrl: req.file ? `/uploads/${req.file.filename}` : ''
            });

            const savedOffer = await newOffer.save();
            res.status(201).json(savedOffer);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });
});

// @route   PUT /api/offers/:id
// @desc    Update an offer
router.put('/:id', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        
        try {
            const { title, description, validity, terms, isActive } = req.body;
            
            const updateData = {
                title,
                description,
                validity,
                terms,
                isActive: isActive === 'true' || isActive === true
            };

            if (req.file) {
                updateData.imageUrl = `/uploads/${req.file.filename}`;
            }

            const updatedOffer = await Offer.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true }
            );

            if (!updatedOffer) {
                return res.status(404).json({ message: 'Offer not found' });
            }

            res.json(updatedOffer);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });
});

// @route   DELETE /api/offers/:id
// @desc    Delete an offer
router.delete('/:id', async (req, res) => {
    try {
        const offer = await Offer.findByIdAndDelete(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }
        // Ideally, we'd also delete the image file from the server here, 
        // but skipping for simplicity as per existing pattern
        res.json({ message: 'Offer deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
