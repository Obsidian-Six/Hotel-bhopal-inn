const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const RoomUnit = require('../models/RoomUnit');
const DailyInventory = require('../models/DailyInventory');

const { protect } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'bhopalinn@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_Sm55QJ8wava9dI',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'uzFnCvUKNpK9mjM0mkAOjJrF',
});

// GET: Today's Summary Stats for Front Desk
router.get('/front-desk/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const checkIns = await Booking.countDocuments({
            checkInDate: { $gte: today, $lt: tomorrow },
            status: { $ne: 'Cancelled' }
        });

        const checkOuts = await Booking.countDocuments({
            checkOutDate: { $gte: today, $lt: tomorrow },
            status: { $ne: 'Cancelled' }
        });

        const inHouse = await Booking.countDocuments({
            status: 'Checked-In'
        });

        const totalRooms = await RoomUnit.countDocuments();
        const available = totalRooms - inHouse - (await RoomUnit.countDocuments({ status: 'Maintenance' }));

        res.json({
            checkIns,
            checkOuts,
            inHouse,
            available
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST: Create New Booking (Website / App)
router.post('/', async (req, res) => {
    try {
        const { user, guestDetails, roomCategory, checkInDate, checkOutDate, financials, source } = req.body;
        
        const booking = new Booking({
            user,
            guestDetails,
            roomCategory,
            checkInDate,
            checkOutDate,
            financials,
            source: source || 'Website',
            status: 'Confirmed'
        });

        await booking.save();

        // Update Inventory
        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            await DailyInventory.findOneAndUpdate(
                { roomCategory, date: new Date(dateStr) },
                { $inc: { bookingsCount: 1 } },
                { upsert: true }
            );
        }

        res.status(201).json(booking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST: Walk-in Booking (Creates + Optional immediate check-in)
router.post('/walk-in', async (req, res) => {
    try {
        const { guestDetails, roomCategory, roomUnit, checkInDate, checkOutDate, financials, immediateCheckIn } = req.body;
        
        const booking = new Booking({
            guestDetails,
            roomCategory,
            roomUnit: roomUnit || null,
            checkInDate,
            checkOutDate,
            financials,
            source: 'Walk-in',
            status: immediateCheckIn ? 'Checked-In' : 'Confirmed'
        });

        if (immediateCheckIn) {
            booking.actualCheckInTime = new Date();
            if (roomUnit) {
                await RoomUnit.findByIdAndUpdate(roomUnit, { status: 'Occupied' });
            }
        }

        await booking.save();

        // Update Inventory
        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            await DailyInventory.findOneAndUpdate(
                { roomCategory, date: new Date(dateStr) },
                { $inc: { bookingsCount: 1 } },
                { upsert: true }
            );
        }

        res.status(201).json(booking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST: Check-In Guest
router.post('/:id/check-in', async (req, res) => {
    try {
        const { roomUnit, idProof } = req.body;
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (!roomUnit) return res.status(400).json({ message: 'Room unit assignment required for check-in' });

        booking.status = 'Checked-In';
        booking.roomUnit = roomUnit;
        booking.guestDetails.idProof = idProof;
        booking.actualCheckInTime = new Date();

        await booking.save();
        await RoomUnit.findByIdAndUpdate(roomUnit, { status: 'Occupied' });

        req.app.get('socketio').emit('booking_updated', { type: 'check-in', bookingId: booking._id });
        res.json(booking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST: Collect Payment (Audit Log)
router.post('/:id/collect-payment', async (req, res) => {
    try {
        const { amount, mode, staff } = req.body;
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.financials.paymentHistory.push({
            amount: Number(amount),
            mode,
            staff: staff || 'FrontDesk',
            timestamp: new Date()
        });

        booking.financials.amountPaid += Number(amount);
        booking.financials.balance = booking.financials.totalAmount - booking.financials.amountPaid;

        if (booking.financials.balance <= 0) {
            booking.financials.paymentMode = mode;
            if (booking.status === 'Pending') {
                booking.status = 'Confirmed';
            }
        }

        await booking.save();
        req.app.get('socketio').emit('booking_updated', { type: 'payment', bookingId: booking._id });
        res.json(booking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST: Add Service Charge (F&B / Other)
router.post('/:id/add-charge', async (req, res) => {
    try {
        const { description, amount, source } = req.body;
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.financials.extraCharges.push({
            description,
            amount: Number(amount),
            source: source || 'Other',
            date: new Date()
        });

        booking.financials.totalAmount += Number(amount);
        booking.financials.balance = booking.financials.totalAmount - booking.financials.amountPaid;

        await booking.save();
        req.app.get('socketio').emit('booking_updated', { type: 'charge', bookingId: booking._id });
        res.json(booking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST: Check-Out Guest
router.post('/:id/check-out', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Late Checkout Logic (Simulated 11 AM threshold)
        const now = new Date();
        const scheduledOut = new Date(booking.checkOutDate);
        scheduledOut.setHours(11, 0, 0, 0);

        if (now > scheduledOut) {
            // Auto add late fee if not already added
            const hoursLate = (now - scheduledOut) / (1000 * 60 * 60);
            if (hoursLate > 1) {
                // Check if late fee already exists
                const hasLateFee = booking.financials.extraCharges.some(c => c.source === 'LateCheckout');
                if (!hasLateFee) {
                    const lateFee = (booking.financials.roomTariff || 1000) * 0.5; // 50% charge
                    booking.financials.extraCharges.push({
                        description: 'Late Checkout Penalty (50%)',
                        amount: lateFee,
                        source: 'LateCheckout',
                        date: new Date()
                    });
                    booking.financials.totalAmount += lateFee;
                    booking.financials.balance = booking.financials.totalAmount - booking.financials.amountPaid;
                }
            }
        }

        // Strict Balance Check
        if (booking.financials.balance > 0 && !req.body.override) {
            return res.status(400).json({ 
                message: 'BALANCE DUE', 
                balance: booking.financials.balance,
                requiresOverride: true 
                });
        }

        booking.status = 'Checked-Out';
        booking.actualCheckOutTime = new Date();
        await booking.save();

        if (booking.roomUnit) {
            await RoomUnit.findByIdAndUpdate(booking.roomUnit, { status: 'Dirty' });
        }

        req.app.get('socketio').emit('booking_updated', { type: 'check-out', bookingId: booking._id });
        res.json(booking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all bookings (Admin)
router.get('/', async (req, res) => {
    try {
        const bookings = await Booking.find().populate('roomCategory').populate('roomUnit').sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user's bookings (Mobile/Web)
router.get('/my-bookings', protect, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('roomCategory')
            .populate('roomUnit')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// RAZORPAY: Create Order
router.post('/create-order', async (req, res) => {
    try {
        const options = {
            amount: req.body.amount * 100, // in paise
            currency: "INR",
            receipt: req.body.receipt
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// RAZORPAY: Verify Payment
router.post('/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'uzFnCvUKNpK9mjM0mkAOjJrF')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            const booking = await Booking.findById(bookingId);
            if (booking) {
                const amountJustPaid = booking.financials.balance; // Assuming full payment of remaining balance
                booking.financials.amountPaid += amountJustPaid;
                booking.financials.balance = 0;
                booking.financials.paymentMode = 'Online (Razorpay)';
                booking.financials.paymentHistory.push({
                    amount: amountJustPaid,
                    mode: 'Online',
                    staff: 'System',
                    timestamp: new Date()
                });
                await booking.save();
            }
            res.json({ success: true, message: "Payment verified and bill updated successfully" });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST: Notify Admin & WhatsApp
router.post('/:id/notify', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('roomCategory');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const { guestDetails, checkInDate, checkOutDate, financials } = booking;
        const guestName = `${guestDetails.firstName} ${guestDetails.lastName}`;
        
        // 1. Email to Admin
        const mailOptions = {
            from: 'bhopalinn@gmail.com',
            to: 'bhopalinn@gmail.com',
            subject: `New Booking Alert: ${guestName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
                    <h2 style="color: #0A192F;">New Reservation Received</h2>
                    <p><strong>Guest:</strong> ${guestName}</p>
                    <p><strong>Room:</strong> ${booking.roomCategory?.title}</p>
                    <p><strong>Dates:</strong> ${new Date(checkInDate).toLocaleDateString()} to ${new Date(checkOutDate).toLocaleDateString()}</p>
                    <p><strong>Total Amount:</strong> ₹${financials.totalAmount}</p>
                    <p><strong>Source:</strong> Website</p>
                    <hr/>
                    <p style="font-size: 12px; color: #888;">Manage this booking in your Admin Dashboard.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        // 2. Simulated WhatsApp Notification (Log)
        console.log(`[WHATSAPP NOTIFICATION] Forwarding details to +91 62672 76957: 
            New Booking: ${guestName} 
            Room: ${booking.roomCategory?.title} 
            Dates: ${new Date(checkInDate).toLocaleDateString()} - ${new Date(checkOutDate).toLocaleDateString()} 
            Amount: ₹${financials.totalAmount}`);

        res.json({ success: true, message: 'Notifications sent' });
    } catch (err) {
        console.error('Notification Error:', err);
        res.status(500).json({ message: 'Failed to send notifications' });
    }
});

module.exports = router;
