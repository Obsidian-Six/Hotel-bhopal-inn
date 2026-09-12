const express = require('express');
const router = express.Router();
const Amendment = require('../models/Amendment');
const Booking = require('../models/Booking');
const RoomUnit = require('../models/RoomUnit');
const DailyInventory = require('../models/DailyInventory');
const Transaction = require('../models/Transaction');
const { encrypt, decrypt } = require('../utils/crypto');
const { protect, superAdmin } = require('../middleware/auth');

// GET: List all amendments (Supports ?status=active or all)
router.get('/', protect, async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status === 'active') {
            query.status = { $in: ['Pending Admin Action', 'Admin Responded'] };
        } else if (status) {
            query.status = status;
        }

        const amendments = await Amendment.find(query)
            .populate({
                path: 'booking',
                populate: [
                    { path: 'roomCategory' },
                    { path: 'roomUnit' }
                ]
            })
            .sort({ updatedAt: -1 });

        res.json(amendments);
    } catch (err) {
        console.error('Error fetching amendments:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET: Single amendment by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const amendment = await Amendment.findById(req.params.id)
            .populate({
                path: 'booking',
                populate: [
                    { path: 'roomCategory' },
                    { path: 'roomUnit' }
                ]
            });

        if (!amendment) {
            return res.status(404).json({ message: 'Amendment record not found.' });
        }
        res.json(amendment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST: Create Amendment Request (Super Admin Only)
router.post('/', protect, superAdmin, async (req, res) => {
    try {
        const { bookingId, superAdminNote } = req.body;
        if (!bookingId || !superAdminNote) {
            return res.status(400).json({ message: 'Booking ID and Super Admin note are required.' });
        }

        const booking = await Booking.findById(bookingId).populate('roomCategory').populate('roomUnit');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        const senderName = req.user ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : 'Super Admin';

        // Check if an existing open amendment already exists for this booking
        let amendment = await Amendment.findOne({
            booking: bookingId,
            status: { $in: ['Pending Admin Action', 'Admin Responded'] }
        });

        if (amendment) {
            // Update existing active amendment with the new note and reopen for admin action
            amendment.superAdminNote = superAdminNote;
            amendment.balanceDue = booking.financials?.balance || 0;
            amendment.status = 'Pending Admin Action';
            amendment.messages.push({
                sender: 'SuperAdmin',
                senderName,
                text: superAdminNote,
                createdAt: new Date()
            });
            await amendment.save();
        } else {
            const roomLabel = booking.roomUnit 
                ? `Room ${booking.roomUnit.roomNumber} - ${booking.roomCategory?.title || ''}` 
                : (booking.roomCategory?.title || 'Unassigned');

            amendment = new Amendment({
                booking: booking._id,
                guestName: `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`,
                roomInfo: roomLabel,
                balanceDue: booking.financials?.balance || 0,
                superAdminNote,
                status: 'Pending Admin Action',
                messages: [{
                    sender: 'SuperAdmin',
                    senderName,
                    text: superAdminNote,
                    createdAt: new Date()
                }],
                createdBy: senderName
            });
            await amendment.save();
        }

        const populated = await Amendment.findById(amendment._id)
            .populate({
                path: 'booking',
                populate: [{ path: 'roomCategory' }, { path: 'roomUnit' }]
            });

        const io = req.app.get('socketio');
        if (io) {
            io.emit('amendment_created', populated);
            io.emit('amendment_updated', populated);
        }

        res.status(201).json(populated);
    } catch (err) {
        console.error('Error creating amendment:', err);
        res.status(400).json({ message: err.message });
    }
});

// POST: Add message to conversation thread (Both Super Admin & Staff Admin)
router.post('/:id/messages', protect, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Message text cannot be empty.' });
        }

        const amendment = await Amendment.findById(req.params.id);
        if (!amendment) {
            return res.status(404).json({ message: 'Amendment not found.' });
        }

        const isSuper = req.user && req.user.role === 'superadmin';
        const sender = isSuper ? 'SuperAdmin' : 'StaffAdmin';
        const senderName = req.user ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : (isSuper ? 'Super Admin' : 'Staff Admin');

        amendment.messages.push({
            sender,
            senderName,
            text: text.trim(),
            createdAt: new Date()
        });

        // Set status based on who sent the message
        if (isSuper) {
            amendment.status = 'Pending Admin Action';
        } else {
            amendment.status = 'Admin Responded';
        }

        await amendment.save();

        const populated = await Amendment.findById(amendment._id)
            .populate({
                path: 'booking',
                populate: [{ path: 'roomCategory' }, { path: 'roomUnit' }]
            });

        const io = req.app.get('socketio');
        if (io) {
            io.emit('amendment_updated', populated);
        }

        res.json(populated);
    } catch (err) {
        console.error('Error posting message to amendment:', err);
        res.status(400).json({ message: err.message });
    }
});

// POST: Collect Pending Amount (Delegated access for booking under active amendment)
// CRITICAL: Automatically adds the collected amount into that day's Sales Amount (Income Transaction)
router.post('/:id/collect-payment', protect, async (req, res) => {
    try {
        const { amount, mode = 'Cash', note } = req.body;
        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0) {
            return res.status(400).json({ message: 'Valid payment amount is required.' });
        }

        const amendment = await Amendment.findById(req.params.id);
        if (!amendment) {
            return res.status(404).json({ message: 'Amendment not found.' });
        }

        if (amendment.status === 'Closed') {
            return res.status(400).json({ message: 'This amendment has already been closed.' });
        }

        const booking = await Booking.findById(amendment.booking);
        if (!booking) {
            return res.status(404).json({ message: 'Associated booking not found.' });
        }

        const staffName = req.user ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : 'Staff Admin';

        // 1. Record into booking paymentHistory
        booking.financials.paymentHistory.push({
            amount: numAmount,
            mode: mode,
            staff: staffName,
            note: note ? `Amendment: ${note}` : 'Collected via Amendment resolution',
            timestamp: new Date()
        });

        booking.financials.amountPaid += numAmount;
        booking.financials.balance = Math.max(0, (booking.financials.totalAmount || 0) - booking.financials.amountPaid);
        
        if (booking.financials.balance <= 0) {
            booking.financials.paymentMode = mode;
            if (booking.status === 'Pending') {
                booking.status = 'Confirmed';
            }
        }
        await booking.save();

        // 2. USER REQUIREMENT: "once pending amount is collected add them into sales amount"
        // Record into daily Financial Income Transactions so it reflects in today's Sales Amount
        const encryptedAmount = encrypt(numAmount.toString());
        const desc = `Collected Pending Due (${mode}) - ${booking.guestDetails.firstName} ${booking.guestDetails.lastName} - Ref #${booking._id.toString().slice(-8)}`;
        const encryptedDesc = encrypt(desc);

        const isOtaMode = mode === 'OTA';
        const newTx = new Transaction({
            type: 'Income',
            category: 'Room Rent',
            amount: encryptedAmount,
            description: encryptedDesc,
            paymentMode: mode,
            recordedBy: staffName,
            approved: !isOtaMode, // OTA requires explicit approval before adding to Total Sales
            amendment: amendment._id,
            booking: booking._id,
            date: new Date()
        });
        await newTx.save();

        // 3. Update Amendment record and add automated confirmation in chat thread
        amendment.balanceDue = booking.financials.balance;
        amendment.messages.push({
            sender: 'System',
            senderName: 'Sales & Ledger System',
            text: isOtaMode 
                ? `💰 Payment of ₹${numAmount.toLocaleString('en-IN')} collected via OTA portal. Pending approval in Front Desk Analytics before adding to Total Sales. Net balance updated to ₹${booking.financials.balance.toLocaleString('en-IN')}.${note ? ` (Note: ${note})` : ''}`
                : `💰 Payment of ₹${numAmount.toLocaleString('en-IN')} successfully collected via ${mode} and added to today's Sales Amount. Net balance updated to ₹${booking.financials.balance.toLocaleString('en-IN')}.${note ? ` (Note: ${note})` : ''}`,
            createdAt: new Date()
        });

        // Set status to Admin Responded so Super Admin sees the action immediately
        amendment.status = 'Admin Responded';
        await amendment.save();

        const populated = await Amendment.findById(amendment._id)
            .populate({
                path: 'booking',
                populate: [{ path: 'roomCategory' }, { path: 'roomUnit' }]
            });

        const io = req.app.get('socketio');
        if (io) {
            io.emit('finance_updated', newTx);
            io.emit('booking_updated', booking);
            io.emit('amendment_updated', populated);
        }

        res.json({
            message: `₹${numAmount} collected and added to sales.`,
            amendment: populated,
            booking
        });
    } catch (err) {
        console.error('Error collecting amendment payment:', err);
        res.status(400).json({ message: err.message });
    }
});

// PUT: Edit Booking Details (Delegated access exclusively for booking under active amendment)
router.put('/:id/booking-details', protect, async (req, res) => {
    try {
        const amendment = await Amendment.findById(req.params.id);
        if (!amendment) {
            return res.status(404).json({ message: 'Amendment not found.' });
        }

        if (amendment.status === 'Closed') {
            return res.status(403).json({ message: 'Cannot edit booking: Amendment is closed.' });
        }

        const booking = await Booking.findById(amendment.booking);
        if (!booking) {
            return res.status(404).json({ message: 'Associated booking not found.' });
        }

        const staffName = req.user ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : 'Staff Admin';
        const { guestDetails, roomCategory, roomUnit, roomPlan, checkInDate, checkOutDate, roomTariff, updateNote } = req.body;

        if (guestDetails) {
            booking.guestDetails = {
                ...booking.guestDetails,
                ...guestDetails
            };
        }

        if (roomPlan) booking.roomPlan = roomPlan;
        if (checkInDate) booking.checkInDate = new Date(checkInDate);
        if (checkOutDate) booking.checkOutDate = new Date(checkOutDate);

        // Room change handling
        if (roomCategory && roomCategory !== booking.roomCategory?.toString()) {
            booking.roomCategory = roomCategory;
        }

        if (roomUnit !== undefined) {
            if (booking.roomUnit && booking.roomUnit.toString() !== roomUnit) {
                await RoomUnit.findByIdAndUpdate(booking.roomUnit, { status: 'Vacant' });
            }
            booking.roomUnit = roomUnit || null;
            if (roomUnit && booking.status === 'Checked-In') {
                await RoomUnit.findByIdAndUpdate(roomUnit, { status: 'Occupied' });
            }
        }

        // Tariff adjustments
        if (roomTariff !== undefined) {
            const oldTariff = booking.financials.roomTariff || 0;
            const newTariff = Number(roomTariff);
            booking.financials.roomTariff = newTariff;

            // Recalculate totalAmount
            const extraTotal = (booking.financials.extraCharges || []).reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
            booking.financials.totalAmount = newTariff + extraTotal;
            booking.financials.balance = Math.max(0, booking.financials.totalAmount - (booking.financials.amountPaid || 0));
            amendment.balanceDue = booking.financials.balance;
        }

        await booking.save();

        // Update guestName and roomInfo on amendment if modified
        amendment.guestName = `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`;
        if (booking.roomUnit) {
            const unitDoc = await RoomUnit.findById(booking.roomUnit);
            if (unitDoc) amendment.roomInfo = `Room ${unitDoc.roomNumber}`;
        }

        // Add message log
        amendment.messages.push({
            sender: req.user?.role === 'superadmin' ? 'SuperAdmin' : 'StaffAdmin',
            senderName: staffName,
            text: `📝 Booking details updated by ${staffName}.${updateNote ? ` Note: ${updateNote}` : ''}`,
            createdAt: new Date()
        });

        if (req.user?.role !== 'superadmin') {
            amendment.status = 'Admin Responded';
        }
        await amendment.save();

        const populated = await Amendment.findById(amendment._id)
            .populate({
                path: 'booking',
                populate: [{ path: 'roomCategory' }, { path: 'roomUnit' }]
            });

        const io = req.app.get('socketio');
        if (io) {
            io.emit('booking_updated', booking);
            io.emit('amendment_updated', populated);
        }

        res.json({
            message: 'Booking details updated successfully under amendment authority.',
            amendment: populated,
            booking
        });
    } catch (err) {
        console.error('Error updating booking details under amendment:', err);
        res.status(400).json({ message: err.message });
    }
});

// POST: Resolve / Close Amendment
router.post('/:id/resolve', protect, async (req, res) => {
    try {
        const amendment = await Amendment.findById(req.params.id);
        if (!amendment) {
            return res.status(404).json({ message: 'Amendment not found.' });
        }

        const isSuper = req.user && req.user.role === 'superadmin';
        const actorName = req.user ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : (isSuper ? 'Super Admin' : 'Staff Admin');
        const { note } = req.body;

        // Super Admin can directly Close, Staff Admin can mark Resolved
        const targetStatus = isSuper ? 'Closed' : 'Resolved';
        amendment.status = targetStatus;
        amendment.resolvedBy = actorName;
        amendment.resolvedAt = new Date();

        amendment.messages.push({
            sender: isSuper ? 'SuperAdmin' : 'StaffAdmin',
            senderName: actorName,
            text: `✅ Amendment marked as ${targetStatus} by ${actorName}.${note ? ` Reason: ${note}` : ''}`,
            createdAt: new Date()
        });

        await amendment.save();

        const populated = await Amendment.findById(amendment._id)
            .populate({
                path: 'booking',
                populate: [{ path: 'roomCategory' }, { path: 'roomUnit' }]
            });

        const io = req.app.get('socketio');
        if (io) {
            io.emit('amendment_updated', populated);
        }

        res.json(populated);
    } catch (err) {
        console.error('Error resolving amendment:', err);
        res.status(400).json({ message: err.message });
    }
});

// DELETE: Delete Amendment Record & Permanently Delete Booking from Front Desk
// User requirement: "when amend request came when click on delete it should delete the record permanenetly from frontdesk"
router.delete('/:id', protect, async (req, res) => {
    try {
        const amendment = await Amendment.findById(req.params.id);
        if (!amendment) {
            return res.status(404).json({ message: 'Amendment not found.' });
        }

        const bookingId = amendment.booking;
        const booking = bookingId ? await Booking.findById(bookingId) : null;

        // 1. Release assigned RoomUnit (if any)
        if (booking && booking.roomUnit) {
            await RoomUnit.findByIdAndUpdate(booking.roomUnit, { 
                status: 'Available',
                currentBooking: null 
            });
        }

        // 2. Release DailyInventory booked count (if applicable)
        if (booking && booking.roomCategory && booking.checkInDate && booking.checkOutDate) {
            try {
                const checkIn = new Date(booking.checkInDate);
                const checkOut = new Date(booking.checkOutDate);
                const cur = new Date(checkIn);
                while (cur < checkOut) {
                    const dateStr = cur.toISOString().split('T')[0];
                    await DailyInventory.updateOne(
                        { roomCategory: booking.roomCategory, date: new Date(dateStr) },
                        { $inc: { bookedUnits: -1 } }
                    );
                    cur.setDate(cur.getDate() + 1);
                }
            } catch (invErr) {
                console.error('Error reverting daily inventory:', invErr);
            }
        }

        // 3. Find all Transactions linked to this amendment or booking
        const bookingRef = booking ? `#${booking._id.toString().slice(-8)}` : (bookingId ? `#${bookingId.toString().slice(-8)}` : '');
        
        const linkedTxs = await Transaction.find({
            $or: [
                { amendment: amendment._id },
                ...(bookingId ? [{ booking: bookingId }] : []),
                { isVoided: false, category: 'Room Rent', type: 'Income' },
                { isVoided: false, paymentMode: 'OTA' }
            ]
        });

        let totalDeducted = 0;
        const txIdsToDelete = [];

        for (const tx of linkedTxs) {
            const isMatchAmendment = tx.amendment && tx.amendment.toString() === amendment._id.toString();
            const isMatchBooking = bookingId && tx.booking && tx.booking.toString() === bookingId.toString();

            if (isMatchAmendment || isMatchBooking) {
                const amt = Number(decrypt(tx.amount)) || 0;
                totalDeducted += amt;
                txIdsToDelete.push(tx._id);
            } else if (bookingRef) {
                const dDesc = decrypt(tx.description) || '';
                if (dDesc.includes(bookingRef)) {
                    const amt = Number(decrypt(tx.amount)) || 0;
                    totalDeducted += amt;
                    txIdsToDelete.push(tx._id);
                }
            }
        }

        // Delete/void these transactions so that that day's collections dynamically deduct them
        if (txIdsToDelete.length > 0) {
            await Transaction.deleteMany({ _id: { $in: txIdsToDelete } });
        }

        // 4. Permanently delete the booking record from Front Desk
        if (bookingId) {
            await Booking.findByIdAndDelete(bookingId);
        }

        // 5. Delete amendment records
        if (bookingId) {
            await Amendment.deleteMany({ booking: bookingId });
        } else {
            await Amendment.findByIdAndDelete(req.params.id);
        }

        // 6. Emit real-time socket updates to Front Desk, Rooms, Amendments, and Finance
        const io = req.app.get('socketio');
        if (io) {
            if (bookingId) {
                io.emit('booking_deleted', { id: bookingId, bookingId });
                io.emit('booking_updated', { type: 'delete', bookingId });
            }
            if (booking && booking.roomUnit) {
                io.emit('room_unit_updated', { roomUnit: booking.roomUnit, status: 'Available' });
                io.emit('room_updated', { roomUnit: booking.roomUnit, status: 'Available' });
            }
            io.emit('amendment_deleted', { amendmentId: req.params.id, bookingId });
            io.emit('finance_updated', { voided: true, deducted: totalDeducted });
        }

        res.json({
            message: 'Booking record permanently deleted from Front Desk, room released, and amendment cleared.',
            deletedBookingId: bookingId,
            deductedAmount: totalDeducted
        });
    } catch (err) {
        console.error('Error deleting amendment and booking:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
