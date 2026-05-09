const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');

// Mock Booking.com Webhook Endpoint
// In a real scenario, this would be secured by authentication/IP whitelisting from Booking.com
router.post('/booking-com/webhook', async (req, res) => {
    try {
        console.log("Received Webhook from Booking.com:", req.body);
        
        // This is a mocked payload structure based on typical OTA webhooks
        // e.g. { "guestName": "John Doe", "checkIn": "2024-05-10", "checkOut": "2024-05-12", "roomType": "Standard Deluxe", "totalPrice": 5000 }
        
        const { guestName, checkIn, checkOut, roomType, totalPrice } = req.body;

        if (!guestName || !checkIn || !checkOut || !roomType) {
            return res.status(400).json({ message: "Invalid payload" });
        }

        // Find the room category by matching the title (since OTA won't send our MongoDB ID)
        const room = await Room.findOne({ title: { $regex: new RegExp(roomType, "i") } });
        
        if (!room) {
            console.error("Room type from OTA not mapped to local DB:", roomType);
            return res.status(400).json({ message: "Unmapped Room Type" });
        }

        const [firstName, ...lastNameParts] = guestName.split(' ');
        const lastName = lastNameParts.join(' ') || 'N/A';

        const newBooking = new Booking({
            guestDetails: {
                firstName: firstName,
                lastName: lastName,
                phone: req.body.guestPhone || "N/A",
                email: req.body.guestEmail || ""
            },
            roomCategory: room._id,
            checkInDate: new Date(checkIn),
            checkOutDate: new Date(checkOut),
            status: 'Confirmed', // OTA bookings are usually confirmed instantly
            financials: {
                totalAmount: totalPrice || 0,
                amountPaid: 0,
                balance: totalPrice || 0,
                paymentMode: 'Pending'
            },
            source: 'Booking.com'
        });

        await newBooking.save();
        
        console.log("Successfully processed Booking.com reservation.");
        res.status(200).json({ message: "Webhook processed successfully", bookingId: newBooking._id });
    } catch (err) {
        console.error("Error processing OTA Webhook:", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
