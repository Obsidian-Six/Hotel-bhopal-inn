const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const RoomUnit = require('../models/RoomUnit');
const DailyInventory = require('../models/DailyInventory');

const { protect } = require('../middleware/auth');
const axios = require('axios');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const { StandardCheckoutClient, Env, StandardCheckoutPayRequest } = require('@phonepe-pg/pg-sdk-node');

// PhonePe Credentials
const clientId = process.env.PHONEPE_CLIENT_ID || "M22SGYECP7TW5_2605211959";
const clientSecret = process.env.PHONEPE_CLIENT_SECRET || "NDNlNGIyNmMtOTExMy00NWQ4LThhMDEtZDg4MzU5YWMzN2U3";
const clientVersion = 1;
const env = process.env.PHONEPE_ENV === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

let phonepeClient;
try {
    phonepeClient = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);
    console.log(`PhonePe SDK client initialized successfully in ${env} mode`);
} catch (sdkError) {
    console.error("Error initializing PhonePe SDK client:", sdkError);
}

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
        for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
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

// POST: Walk-in / OTA Registration (Creates + Optional immediate check-in)
router.post('/walk-in', async (req, res) => {
    try {
        const { guestDetails, roomCategory, roomUnit, checkInDate, checkOutDate, financials, immediateCheckIn, source, otaPlatform, roomPlan, paymentMode } = req.body;
        
        const booking = new Booking({
            guestDetails,
            roomCategory,
            roomUnit: roomUnit || null,
            checkInDate,
            checkOutDate,
            financials,
            source: source || 'Walk-in',
            otaPlatform: otaPlatform || '',
            roomPlan: roomPlan || 'EP',
            status: immediateCheckIn ? 'Checked-In' : 'Confirmed'
        });

        if (paymentMode) {
            booking.financials.paymentMode = paymentMode;
        }

        if (financials && financials.amountPaid > 0) {
            booking.financials.paymentHistory.push({
                amount: Number(financials.amountPaid),
                mode: paymentMode || 'Cash',
                staff: 'FrontDesk',
                timestamp: new Date()
            });
        }

        if (immediateCheckIn) {
            booking.actualCheckInTime = new Date();
            if (roomUnit) {
                await RoomUnit.findByIdAndUpdate(roomUnit, { status: 'Occupied' });
            }
        }

        await booking.save();

        // Update Inventory Count (UTC midnight normalization)
        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);
        let curr = new Date(start);
        while (curr < end) {
            const dateStr = curr.toISOString().split('T')[0];
            const utcDate = new Date(dateStr);
            utcDate.setUTCHours(0, 0, 0, 0);
            
            await DailyInventory.findOneAndUpdate(
                { roomCategory, date: utcDate },
                { $inc: { bookingsCount: 1 } },
                { upsert: true }
            );
            curr.setDate(curr.getDate() + 1);
        }

        const io = req.app.get('socketio');
        if (io) {
            io.emit('inventory_updated', { roomCategory });
            io.emit('booking_updated', booking);
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

        const io = req.app.get('socketio');
        if (io) {
            io.emit('inventory_updated', { roomCategory: booking.roomCategory });
            io.emit('booking_updated', { type: 'check-in', bookingId: booking._id });
        }
        res.json(booking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST: Extend Stay for Guest
router.post('/:id/extend-stay', async (req, res) => {
    try {
        const { newCheckOutDate, additionalTariff } = req.body;
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (!newCheckOutDate) return res.status(400).json({ message: 'New checkout date required' });

        const oldCheckOut = new Date(booking.checkOutDate);
        const newCheckOut = new Date(newCheckOutDate);

        if (newCheckOut <= oldCheckOut) {
            return res.status(400).json({ message: 'New checkout date must be after current checkout date' });
        }

        // Update inventory count for extra nights
        let curr = new Date(oldCheckOut);
        while (curr < newCheckOut) {
            const dateStr = curr.toISOString().split('T')[0];
            const utcDate = new Date(dateStr);
            utcDate.setUTCHours(0, 0, 0, 0);
            
            await DailyInventory.findOneAndUpdate(
                { roomCategory: booking.roomCategory, date: utcDate },
                { $inc: { bookingsCount: 1 } },
                { upsert: true }
            );
            curr.setDate(curr.getDate() + 1);
        }

        // Calculate stay Extension Tariff
        const checkIn = new Date(booking.checkInDate);
        const prevNights = Math.max(1, Math.ceil((oldCheckOut - checkIn) / (1000 * 60 * 60 * 24)));
        const extraNights = Math.max(1, Math.ceil((newCheckOut - oldCheckOut) / (1000 * 60 * 60 * 24)));

        let addChargeAmount = 0;
        if (additionalTariff !== undefined && additionalTariff !== null && additionalTariff !== '') {
            addChargeAmount = Number(additionalTariff);
        } else {
            const nightRate = (booking.financials?.roomTariff || 0) / prevNights;
            addChargeAmount = Math.round(nightRate * extraNights);
        }

        booking.checkOutDate = newCheckOut;
        booking.financials.roomTariff = (booking.financials?.roomTariff || 0) + addChargeAmount;
        
        const extraChargesTotal = (booking.financials?.extraCharges || []).reduce((acc, c) => acc + (c.amount || 0), 0);
        booking.financials.totalAmount = booking.financials.roomTariff + extraChargesTotal;
        booking.financials.balance = booking.financials.totalAmount - (booking.financials?.amountPaid || 0);

        booking.financials.extraCharges.push({
            description: `Stay Extension (+${extraNights} Night${extraNights > 1 ? 's' : ''} up to ${newCheckOut.toLocaleDateString('en-GB')})`,
            amount: addChargeAmount,
            date: new Date(),
            source: 'Stay Extension'
        });

        await booking.save();

        const io = req.app.get('socketio');
        if (io) {
            io.emit('inventory_updated', { roomCategory: booking.roomCategory });
            io.emit('booking_updated', booking);
        }

        res.json(booking);
    } catch (err) {
        console.error('Extend stay error:', err);
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

// PHONEPE SDK: Create Payment Link
router.post('/phonepe-pay', async (req, res) => {
    try {
        const { bookingId, amount } = req.body;
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const merchantOrderId = `OMO_${bookingId}_${Date.now()}`;
        const amountInPaise = Math.round(amount * 100);
        const redirectUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/bookings/phonepe-redirect?bookingId=${bookingId}&merchantOrderId=${merchantOrderId}`;

        if (!phonepeClient) {
            console.log("No PhonePe SDK client initialized. Simulating success redirect URL...");
            booking.financials.paymentMode = 'Online (PhonePe - Simulated)';
            await booking.save();
            return res.json({
                success: true,
                redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings?paymentStatus=success`
            });
        }

        const request = StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantOrderId)
            .amount(amountInPaise)
            .redirectUrl(redirectUrl)
            .build();

        console.log(`Initiating PhonePe payment for booking ${bookingId}, order ID: ${merchantOrderId}, amount: ₹${amount}`);

        const response = await phonepeClient.pay(request);

        if (response && response.redirectUrl) {
            // Save the merchantOrderId in booking financials
            booking.financials.paymentMode = 'Online (PhonePe - Pending)';
            await booking.save();

            res.json({
                success: true,
                redirectUrl: response.redirectUrl
            });
        } else {
            console.error("PhonePe payment initiation failed - no redirect URL");
            res.status(400).json({
                success: false,
                message: "Failed to obtain redirect URL from PhonePe SDK"
            });
        }
    } catch (err) {
        console.error("PhonePe Pay SDK Error:", err.message);
        res.status(500).json({
            success: false,
            message: err.message || "Failed to initiate payment with PhonePe SDK"
        });
    }
});

// PHONEPE SDK: Verify and Redirect
const handlePhonePeRedirect = async (req, res) => {
    try {
        const { bookingId, merchantOrderId } = req.query;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings?payment=notfound`);
        }

        let isCompleted = false;

        if (!phonepeClient) {
            console.log("Simulating PhonePe verification: Success");
            isCompleted = true;
        } else if (merchantOrderId) {
            const response = await phonepeClient.getOrderStatus(merchantOrderId);
            const state = response.state; 
            console.log(`PhonePe order status response state: ${state}`);
            if (state === 'COMPLETED') {
                isCompleted = true;
            }
        }

        if (isCompleted) {
            const amountJustPaid = booking.financials.balance;
            booking.financials.amountPaid += amountJustPaid;
            booking.financials.balance = 0;
            booking.financials.paymentMode = 'Online (PhonePe)';
            booking.financials.paymentHistory.push({
                amount: amountJustPaid,
                mode: 'Online',
                staff: 'System',
                timestamp: new Date()
            });
            booking.status = 'Confirmed';
            await booking.save();

            // Send Notifications via Backend
            try {
                await axios.post(`${process.env.BACKEND_URL || 'http://localhost:8000'}/api/bookings/${bookingId}/notify`);
            } catch (nErr) {
                console.warn('Notification failed during PhonePe SDK redirect', nErr.message);
            }

            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings?paymentStatus=success`);
        }

        booking.financials.paymentMode = 'Online (PhonePe - Failed)';
        await booking.save();
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings?paymentStatus=failed`);
    } catch (err) {
        console.error("PhonePe SDK Redirect Handler Error:", err.message);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings?paymentStatus=error`);
    }
};

router.get('/phonepe-redirect', handlePhonePeRedirect);
router.post('/phonepe-redirect', handlePhonePeRedirect);

// POST: Notify Admin & WhatsApp
router.post('/:id/notify', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('roomCategory');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const { guestDetails, checkInDate, checkOutDate, financials } = booking;
        const guestName = `${guestDetails.firstName} ${guestDetails.lastName}`;
        
        // 1. Email to Admin
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL,
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

// POST: Extend Booking
router.post('/:id/extend', async (req, res) => {
    try {
        const { newCheckOutDate, additionalAmount } = req.body;
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Update booking details
        booking.checkOutDate = new Date(newCheckOutDate);
        booking.financials.totalAmount += Number(additionalAmount);
        booking.financials.balance = booking.financials.totalAmount - booking.financials.amountPaid;

        await booking.save();
        
        req.app.get('socketio').emit('booking_updated', { type: 'extension', bookingId: booking._id });
        res.json(booking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;

