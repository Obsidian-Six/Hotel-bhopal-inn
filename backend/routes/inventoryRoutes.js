const express = require('express');
const router = express.Router();
const RoomUnit = require('../models/RoomUnit');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const DailyInventory = require('../models/DailyInventory');

// Get extranet calendar data
router.get('/calendar', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const query = {};
        if (startDate && endDate) {
            query.$or = [
                { checkInDate: { $lte: new Date(endDate) }, checkOutDate: { $gte: new Date(startDate) } }
            ];
        }
        
        // Exclude cancelled bookings from occupancy
        query.status = { $ne: 'Cancelled' };

        const bookings = await Booking.find(query).populate('roomCategory').populate('roomUnit');
        const allRoomUnits = await RoomUnit.find().populate('category');

        res.json({
            bookings,
            allRoomUnits
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Extranet Calendar API (Matches Booking.com style)
router.get('/extranet-calendar', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        const end = new Date(endDate);
        end.setHours(23,59,59,999);

        // Fetch all active room categories
        const rooms = await Room.find({ isActive: true });
        
        // Fetch DailyInventory overrides
        const dailyInventory = await DailyInventory.find({
            date: { $gte: start, $lte: end }
        });

        // Fetch Bookings to calculate "Net booked"
        const bookings = await Booking.find({
            status: { $ne: 'Cancelled' },
            $or: [
                { checkInDate: { $lte: end }, checkOutDate: { $gt: start } }
            ]
        });

        // We will send this raw data to the frontend, and the frontend will process it into the matrix.
        res.json({
            rooms,
            dailyInventory,
            bookings
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Bulk Edit API
router.post('/bulk-edit', async (req, res) => {
    try {
        const { fromDate, toDate, daysOfWeek, roomCategory, roomsToSell, price, status } = req.body;
        
        if (!fromDate || !toDate || !roomCategory || !daysOfWeek) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const start = new Date(fromDate);
        const end = new Date(toDate);
        
        // Loop through each date in range
        let currentDate = new Date(start);
        
        const updates = [];

        while (currentDate <= end) {
            // Use UTC methods for day of week to be consistent
            const dayMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
            const currentDayStr = dayMap[currentDate.getUTCDay()];

            if (daysOfWeek.includes(currentDayStr)) {
                // Prepare the update operation for bulkWrite
                const updateFields = {};
                
                // Allow explicit null to clear overrides
                if (price === null) {
                    updateFields.price = null;
                } else if (price !== undefined && price !== '') {
                    updateFields.price = Number(price);
                }

                if (roomsToSell === null) {
                    updateFields.roomsToSell = null;
                } else if (roomsToSell !== undefined && roomsToSell !== '') {
                    updateFields.roomsToSell = Number(roomsToSell);
                }

                if (req.body.blockedCount !== undefined && req.body.blockedCount !== '') {
                    updateFields.blockedCount = Number(req.body.blockedCount);
                } else if (req.body.blockedCount === null) {
                    updateFields.blockedCount = 0;
                }

                if (status) updateFields.status = status;

                // Only push if there's something to update
                if (Object.keys(updateFields).length > 0) {
                    // Force date to UTC midnight
                    const utcDate = new Date(currentDate);
                    utcDate.setUTCHours(0, 0, 0, 0);

                    updates.push({
                        updateOne: {
                            filter: { 
                                roomCategory: roomCategory, 
                                date: utcDate 
                            },
                            update: { $set: updateFields },
                            upsert: true
                        }
                    });
                }
            }
            // Move to next day in UTC
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }

        if (updates.length > 0) {
            const result = await DailyInventory.bulkWrite(updates);
            console.log(`Bulk update successful for room ${roomCategory}. Records modified: ${result.nModified}`);
            req.app.get('socketio').emit('inventory_updated', { roomCategory });
        } else {
            console.log(`No updates to perform for room ${roomCategory}`);
        }

        res.json({ message: 'Bulk update successful', count: updates.length });
    } catch (err) {
        console.error("Bulk Edit Error details:", err);
        res.status(500).json({ message: err.message });
    }
});

// Calculate price for a date range
router.post('/calculate-price', async (req, res) => {
    try {
        const { roomCategory, checkInDate, checkOutDate } = req.body;
        
        if (!roomCategory || !checkInDate || !checkOutDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const room = await Room.findById(roomCategory);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);

        // Fetch overrides using UTC boundaries
        const overrides = await DailyInventory.find({
            roomCategory: roomCategory,
            date: { $gte: start, $lt: end } // Dates are stored as UTC midnight
        });

        const unitCount = await RoomUnit.countDocuments({ category: roomCategory });
        
        let totalPrice = 0;
        let currentDate = new Date(start);
        let isAvailable = true;
        let minAvailable = Infinity;

        // Loop through each night using UTC
        while (currentDate < end) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const override = overrides.find(o => new Date(o.date).toISOString().split('T')[0] === dateStr);
            
            if (override && override.price !== null) {
                totalPrice += override.price;
            } else {
                totalPrice += room.details.startingPrice;
            }

            // Availability Check
            // Priority: 1. DailyInventory.roomsToSell, 2. Room.details.noOfRooms, 3. Physical RoomUnit count
            let capacity = 10; // Extreme fallback
            if (override?.roomsToSell !== null && override?.roomsToSell !== undefined) {
                capacity = override.roomsToSell;
            } else if (room.details?.noOfRooms > 0) {
                capacity = room.details.noOfRooms;
            } else {
                capacity = unitCount || 10;
            }

            const blocked = override?.blockedCount || 0;
            
            // Dynamic Booking Calculation (Sync with Booking collection)
            const bookedCount = await Booking.countDocuments({
                roomCategory: roomCategory,
                status: { $ne: 'Cancelled' },
                checkInDate: { $lte: currentDate },
                checkOutDate: { $gt: currentDate }
            });
            
            const booked = Math.max(override?.bookingsCount || 0, bookedCount);
            
            const available = capacity - booked - blocked;
            
            if (available < minAvailable) minAvailable = available;
            if (available <= 0 || (override && override.status === 'Closed')) {
                isAvailable = false;
            }
            
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }

        res.json({ 
            totalPrice, 
            nights: Math.round((end - start) / (1000 * 60 * 60 * 24)),
            isAvailable,
            minAvailable: minAvailable === Infinity ? (room.details?.noOfRooms || unitCount || 10) : minAvailable
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Room Unit Management endpoints
router.post('/units', async (req, res) => {
    try {
        const { roomNumber, category, status } = req.body;
        const newUnit = new RoomUnit({ roomNumber, category, status });
        await newUnit.save();
        res.status(201).json(newUnit);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/units', async (req, res) => {
    try {
        const units = await RoomUnit.find().populate('category');
        res.json(units);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/units/available', async (req, res) => {
    try {
        const units = await RoomUnit.find({ status: 'Available' }).populate('category');
        res.json(units);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/units/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const unit = await RoomUnit.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        ).populate('category');
        
        if (!unit) return res.status(404).json({ message: 'Room unit not found' });

        const io = req.app.get('socketio');
        if (io) {
            io.emit('room_unit_updated', { unitId: unit._id, status: unit.status, roomNumber: unit.roomNumber });
        }

        res.json(unit);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/units/:id', async (req, res) => {
    try {
        await RoomUnit.findByIdAndDelete(req.params.id);
        res.json({ message: 'Room unit deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
