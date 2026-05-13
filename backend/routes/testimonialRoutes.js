const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');

// @route   GET /api/testimonials
// @desc    Get all testimonials
router.get('/', async (req, res) => {
    try {
        const query = {};
        if (req.query.visible === 'true') {
            query.isVisible = true;
        }
        const testimonials = await Testimonial.find(query).sort({ createdAt: -1 });
        res.json(testimonials);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/testimonials
// @desc    Create a testimonial
router.post('/', async (req, res) => {
    const { name, city, text, source, rating, isVisible } = req.body;
    
    if (!name || !city || !text) {
        return res.status(400).json({ message: 'Name, City and Text are required' });
    }

    const testimonial = new Testimonial({
        name,
        city,
        text,
        source: source || 'Via Google',
        rating: rating || 5,
        isVisible: isVisible !== undefined ? isVisible : false
    });

    try {
        const newTestimonial = await testimonial.save();
        res.status(201).json(newTestimonial);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   PUT /api/testimonials/:id
// @desc    Update a testimonial
router.put('/:id', async (req, res) => {
    const { name, city, text, source, rating } = req.body;

    try {
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }

        if (name) testimonial.name = name;
        if (city) testimonial.city = city;
        if (text) testimonial.text = text;
        if (source) testimonial.source = source;
        if (rating !== undefined) testimonial.rating = rating;

        const updatedTestimonial = await testimonial.save();
        res.json(updatedTestimonial);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/testimonials/:id
// @desc    Delete a testimonial
router.delete('/:id', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        const deleted = await Testimonial.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }
        res.json({ message: 'Testimonial deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   PATCH /api/testimonials/:id/toggle
// @desc    Toggle visibility
router.patch('/:id/toggle', async (req, res) => {
    try {
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }
        testimonial.isVisible = !testimonial.isVisible;
        await testimonial.save();
        res.json(testimonial);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
