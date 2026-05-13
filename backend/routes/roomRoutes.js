const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const DailyInventory = require('../models/DailyInventory');
const multer = require('multer');
const path = require('path');

// Multer Config for Room Images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Get all rooms
router.get('/', async (req, res) => {
    try {
        const rooms = await Room.find({ isActive: true });
        
        // Get today's overrides in UTC
        const today = new Date();
        today.setUTCHours(0,0,0,0);
        
        const overrides = await DailyInventory.find({
            date: today,
            price: { $ne: null }
        });

        const roomsWithTodayPrice = rooms.map(room => {
            const roomObj = room.toObject();
            const override = overrides.find(o => o.roomCategory.toString() === room._id.toString());
            if (override) {
                roomObj.details.startingPrice = override.price;
            }
            return roomObj;
        });

        res.json(roomsWithTodayPrice);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get room by category
router.get('/:category', async (req, res) => {
    try {
        const room = await Room.findOne({ category: req.params.category, isActive: true });
        if (!room) return res.status(404).json({ message: 'Room not found' });
        
        const roomObj = room.toObject();
        
        // Get today's override in UTC
        const today = new Date();
        today.setUTCHours(0,0,0,0);
        
        const override = await DailyInventory.findOne({
            roomCategory: room._id,
            date: today,
            price: { $ne: null }
        });

        if (override) {
            roomObj.details.startingPrice = override.price;
        }

        res.json(roomObj);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create/Update Room (Admin)
router.post('/', upload.array('images', 10), async (req, res) => {
    try {
        const { category, title, description, amenities, details, tags } = req.body;
        
        console.log('--- Room Save Request ---');
        console.log('Category:', category);
        console.log('Files received:', req.files ? req.files.length : 0);

        // Parse JSON strings from form-data with fallback
        let parsedAmenities = [];
        try {
            parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : (amenities || []);
        } catch (e) {
            console.error('Error parsing amenities:', e.message);
            parsedAmenities = amenities ? [amenities] : [];
        }

        let parsedDetails = {};
        try {
            parsedDetails = typeof details === 'string' ? JSON.parse(details) : (details || {});
        } catch (e) {
            console.error('Error parsing details:', e.message);
        }

        let parsedTags = [];
        try {
            parsedTags = typeof tags === 'string' ? JSON.parse(tags) : (tags || []);
        } catch (e) {
            console.error('Error parsing tags:', e.message);
            parsedTags = tags ? [tags] : [];
        }

        const imageUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        let room = await Room.findOne({ category });

        if (room) {
            console.log('Updating existing room:', room.category);
            // Update fields if provided
            if (title) room.title = title;
            if (description) room.description = description;
            room.amenities = parsedAmenities;
            room.details = { ...room.details.toObject(), ...parsedDetails };
            room.tags = parsedTags;
            
            if (imageUrls.length > 0) {
                if (req.body.replaceImages === 'true') {
                    room.images = imageUrls;
                } else {
                    room.images = [...room.images, ...imageUrls];
                }
            }
            await room.save();
            console.log('Room updated successfully');
        } else {
            console.log('Creating new room category:', category);
            room = new Room({
                category,
                title,
                description,
                images: imageUrls,
                amenities: parsedAmenities,
                details: parsedDetails,
                tags: parsedTags
            });
            await room.save();
            console.log('New room created successfully');
        }

        res.status(201).json(room);
    } catch (err) {
        console.error('SAVE ROOM ERROR DETAILS:', err);
        res.status(400).json({ 
            message: 'Error saving room to database', 
            error: err.message 
        });
    }
});

// Delete Room (Admin)
router.delete('/:category', async (req, res) => {
    try {
        const result = await Room.deleteOne({ category: req.params.category });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Room category not found' });
        }
        res.json({ message: 'Room category deleted successfully' });
    } catch (err) {
        console.error('DELETE ROOM ERROR:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
