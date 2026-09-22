const express = require('express');
const router = express.Router();
const Amendment = require('../models/Amendment');
const Booking = require('../models/Booking');
const RoomUnit = require('../models/RoomUnit');
const DailyInventory = require('../models/DailyInventory');
const Transaction = require('../models/Transaction');
const { encrypt, decrypt } = require('../utils/crypto');
const { protect, superAdmin } = require('../middleware/auth');

// GET: List all amendment requests (Supports ?status=all|pending|approved|rejected|completed|active)
router.get('/', protect, async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status === 'active') {
            query.status = { $in: ['Pending', 'Approved'] };
        } else if (status && status !== 'all') {
            query.status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        }

        const amendments = await Amendment.find(query)
            .populate({
                path: 'booking',
                populate: [
                    { path: 'roomCategory' },
                    { path: 'roomUnit' }
                ]
            })
            .populate('transaction')
            .sort({ createdAt: -1 });

        res.json(amendments);
    } catch (err) {
        console.error('Error fetching amendments:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET: Single amendment request by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const amendment = await Amendment.findById(req.params.id)
            .populate({
                path: 'booking',
                populate: [
                    { path: 'roomCategory' },
                    { path: 'roomUnit' }
                ]
            })
            .populate('transaction');

        if (!amendment) {
            return res.status(404).json({ message: 'Amendment record not found.' });
        }
        res.json(amendment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST: Normal Admin requests an amendment on a wrong entry
router.post('/request', protect, async (req, res) => {
    try {
        const { bookingId, transactionId, reason } = req.body;
        if (!bookingId && !transactionId) {
            return res.status(400).json({ message: 'Booking ID or Transaction ID is required.' });
        }
        if (!reason || !reason.trim()) {
            return res.status(400).json({ message: 'A reason/message for amendment is required.' });
        }

        const requestedByName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : 'Staff Admin';
        const requestedRole = req.user ? req.user.role : 'admin';

        let amendment;

        if (transactionId) {
            const tx = await Transaction.findById(transactionId);
            if (!tx) {
                return res.status(404).json({ message: 'Transaction not found.' });
            }

            const decryptedAmount = Number(decrypt(tx.amount)) || 0;
            const decryptedDesc = decrypt(tx.description);

            amendment = new Amendment({
                entryType: 'Transaction',
                transaction: tx._id,
                guestName: decryptedDesc || tx.category || 'Ledger Entry',
                roomInfo: `${tx.type} Ledger - ${tx.category} (${tx.paymentMode || 'Cash'})`,
                requestReason: reason.trim(),
                requestedBy: req.user?._id,
                requestedByName,
                requestedRole,
                entrySnapshot: {
                    description: decryptedDesc,
                    category: tx.category,
                    type: tx.type,
                    totalAmount: decryptedAmount,
                    amountPaid: decryptedAmount,
                    balance: 0,
                    paymentMode: tx.paymentMode || 'Cash',
                    recordedBy: tx.recordedBy,
                    approvedBy: tx.approvedBy,
                    checkInDate: tx.date
                },
                status: 'Pending',
                canEdit: false,
                canDelete: false
            });
        } else {
            const booking = await Booking.findById(bookingId)
                .populate('roomCategory')
                .populate('roomUnit');

            if (!booking) {
                return res.status(404).json({ message: 'Booking not found.' });
            }

            const roomLabel = booking.roomUnit 
                ? `Room ${booking.roomUnit.roomNumber} - ${booking.roomCategory?.title || ''}`
                : (booking.roomCategory?.title || 'Unassigned');

            const entrySnapshot = {
                guestDetails: {
                    firstName: booking.guestDetails?.firstName || '',
                    lastName: booking.guestDetails?.lastName || '',
                    email: booking.guestDetails?.email || '',
                    phone: booking.guestDetails?.phone || ''
                },
                roomCategory: booking.roomCategory?.title || '',
                roomNumber: booking.roomUnit ? booking.roomUnit.roomNumber : '',
                checkInDate: booking.checkInDate,
                checkOutDate: booking.checkOutDate,
                totalAmount: booking.financials?.totalAmount || 0,
                amountPaid: booking.financials?.amountPaid || 0,
                balance: booking.financials?.balance || 0,
                paymentMode: booking.financials?.paymentMode || 'Pending',
                status: booking.status
            };

            amendment = new Amendment({
                entryType: 'Booking',
                booking: booking._id,
                guestName: `${booking.guestDetails?.firstName || ''} ${booking.guestDetails?.lastName || ''}`.trim(),
                roomInfo: roomLabel,
                requestReason: reason.trim(),
                requestedBy: req.user?._id,
                requestedByName,
                requestedRole,
                entrySnapshot,
                status: 'Pending',
                canEdit: false,
                canDelete: false
            });
        }

        await amendment.save();

        const populated = await Amendment.findById(amendment._id)
            .populate({
                path: 'booking',
                populate: [{ path: 'roomCategory' }, { path: 'roomUnit' }]
            })
            .populate('transaction');

        const io = req.app.get('socketio');
        if (io) {
            io.emit('amendment_requested', populated);
            io.emit('amendment_created', populated);
            io.emit('amendment_updated', populated);
        }

        res.status(201).json(populated);
    } catch (err) {
        console.error('Error creating amendment request:', err);
        res.status(400).json({ message: err.message });
    }
});

// PUT: Super Admin Approves Amendment Request (Tick Mark - grants edit & delete access)
router.put('/:id/approve', protect, superAdmin, async (req, res) => {
    try {
        const amendment = await Amendment.findById(req.params.id);
        if (!amendment) {
            return res.status(404).json({ message: 'Amendment not found.' });
        }

        const approverName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : 'Super Admin';

        amendment.status = 'Approved';
        amendment.canEdit = true;
        amendment.canDelete = true;
        amendment.superAdminAction = {
            actionBy: approverName,
            actionAt: new Date(),
            note: req.body.note || 'Access granted by Super Admin'
        };

        await amendment.save();

        const populated = await Amendment.findById(amendment._id)
            .populate({
                path: 'booking',
                populate: [{ path: 'roomCategory' }, { path: 'roomUnit' }]
            });

        const io = req.app.get('socketio');
        if (io) {
            io.emit('amendment_approved', populated);
            io.emit('amendment_updated', populated);
        }

        res.json({
            message: `Access granted for amendment #${amendment._id.toString().slice(-6)}. Staff Admin can now edit or delete this entry.`,
            amendment: populated
        });
    } catch (err) {
        console.error('Error approving amendment:', err);
        res.status(500).json({ message: err.message });
    }
});

// PUT: Super Admin Rejects Amendment Request (Wrong Mark)
router.put('/:id/reject', protect, superAdmin, async (req, res) => {
    try {
        const amendment = await Amendment.findById(req.params.id);
        if (!amendment) {
            return res.status(404).json({ message: 'Amendment not found.' });
        }

        const actionName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : 'Super Admin';

        amendment.status = 'Rejected';
        amendment.canEdit = false;
        amendment.canDelete = false;
        amendment.superAdminAction = {
            actionBy: actionName,
            actionAt: new Date(),
            note: req.body.note || 'Amendment request declined by Super Admin'
        };

        await amendment.save();

        const populated = await Amendment.findById(amendment._id)
            .populate({
                path: 'booking',
                populate: [{ path: 'roomCategory' }, { path: 'roomUnit' }]
            });

        const io = req.app.get('socketio');
        if (io) {
            io.emit('amendment_rejected', populated);
            io.emit('amendment_updated', populated);
        }

        res.json({
            message: `Amendment request #${amendment._id.toString().slice(-6)} declined.`,
            amendment: populated
        });
    } catch (err) {
        console.error('Error rejecting amendment:', err);
        res.status(500).json({ message: err.message });
    }
});

// PUT: Execute Edit on the Entry (Staff Admin with approved access OR Super Admin)
router.put('/:id/execute-edit', protect, async (req, res) => {
    try {
        const amendment = await Amendment.findById(req.params.id);
        if (!amendment) {
            return res.status(404).json({ message: 'Amendment record not found.' });
        }

        const isSuper = req.user && req.user.role === 'superadmin';
        if (!isSuper && (!amendment.canEdit || amendment.status !== 'Approved')) {
            return res.status(403).json({ message: 'Permission denied. Super Admin has not granted edit access for this entry.' });
        }

        if (amendment.entryType === 'Transaction' || amendment.transaction) {
            const tx = await Transaction.findById(amendment.transaction);
            if (!tx) {
                return res.status(404).json({ message: 'Linked transaction not found.' });
            }
            const { description, category, type, amount, paymentMode, date, recordedBy, approvedBy } = req.body;
            if (amount !== undefined && amount !== '') tx.amount = encrypt(amount.toString());
            if (description !== undefined) tx.description = encrypt(description || '');
            if (category) tx.category = category;
            if (type) tx.type = type;
            if (paymentMode) tx.paymentMode = paymentMode;
            if (date) tx.date = new Date(date);
            if (recordedBy !== undefined) tx.recordedBy = recordedBy;
            if (approvedBy !== undefined) tx.approvedBy = approvedBy;
            await tx.save();

            amendment.status = 'Completed';
            amendment.completedAt = new Date();
            amendment.completedAction = 'Edited';
            amendment.canEdit = false;
            amendment.canDelete = false;
            await amendment.save();

            const io = req.app.get('socketio');
            if (io) {
                io.emit('finance_updated');
                io.emit('amendment_updated', amendment);
            }
            return res.json({ message: 'Transaction entry updated successfully.', amendment });
        }

        const booking = await Booking.findById(amendment.booking);
        if (!booking) {
            return res.status(404).json({ message: 'Linked booking not found.' });
        }

        const {
            guestDetails,
            roomCategory,
            roomUnit,
            checkInDate,
            checkOutDate,
            totalAmount,
            amountPaid,
            paymentMode,
            roomPlan,
            note
        } = req.body;

        // 1. Update guest details
        if (guestDetails) {
            booking.guestDetails = {
                firstName: guestDetails.firstName || booking.guestDetails?.firstName,
                lastName: guestDetails.lastName || booking.guestDetails?.lastName,
                email: guestDetails.email || booking.guestDetails?.email,
                phone: guestDetails.phone || booking.guestDetails?.phone,
                idProof: guestDetails.idProof || booking.guestDetails?.idProof,
                adults: guestDetails.adults || booking.guestDetails?.adults || 2,
                children: guestDetails.children !== undefined ? guestDetails.children : (booking.guestDetails?.children || 0)
            };
        }

        if (roomPlan) booking.roomPlan = roomPlan;

        // 2. Update room unit if changed
        if (roomUnit && roomUnit !== (booking.roomUnit ? booking.roomUnit.toString() : '')) {
            if (booking.roomUnit) {
                await RoomUnit.findByIdAndUpdate(booking.roomUnit, { status: 'Available', currentBooking: null });
            }
            booking.roomUnit = roomUnit;
            if (['Checked-In', 'Confirmed'].includes(booking.status)) {
                await RoomUnit.findByIdAndUpdate(roomUnit, { status: 'Occupied', currentBooking: booking._id });
            }
        }

        if (roomCategory) booking.roomCategory = roomCategory;

        // 3. Update dates and inventory
        if (checkInDate && checkOutDate) {
            // Revert old inventory
            if (booking.roomCategory && booking.checkInDate && booking.checkOutDate) {
                const oldStart = new Date(booking.checkInDate);
                const oldEnd = new Date(booking.checkOutDate);
                const cur = new Date(oldStart);
                while (cur < oldEnd) {
                    const dateStr = cur.toISOString().split('T')[0];
                    await DailyInventory.updateOne(
                        { roomCategory: booking.roomCategory, date: new Date(dateStr) },
                        { $inc: { bookedUnits: -1 } }
                    );
                    cur.setDate(cur.getDate() + 1);
                }
            }

            booking.checkInDate = new Date(checkInDate);
            booking.checkOutDate = new Date(checkOutDate);

            // Apply new inventory
            const newStart = new Date(checkInDate);
            const newEnd = new Date(checkOutDate);
            const curNew = new Date(newStart);
            while (curNew < newEnd) {
                const dateStr = curNew.toISOString().split('T')[0];
                await DailyInventory.updateOne(
                    { roomCategory: booking.roomCategory, date: new Date(dateStr) },
                    { $inc: { bookedUnits: 1 } },
                    { upsert: true }
                );
                curNew.setDate(curNew.getDate() + 1);
            }
        }

        // 4. Dynamic Financials & Balance Recalculation
        const oldPaid = Number(booking.financials?.amountPaid || 0);
        const oldTotal = Number(booking.financials?.totalAmount || 0);

        const newTotal = totalAmount !== undefined ? Number(totalAmount) : oldTotal;
        const newPaid = amountPaid !== undefined ? Number(amountPaid) : oldPaid;
        const newBalance = Math.max(0, newTotal - newPaid);

        booking.financials.totalAmount = newTotal;
        booking.financials.amountPaid = newPaid;
        booking.financials.balance = newBalance;
        if (paymentMode) booking.financials.paymentMode = paymentMode;

        // 5. Dynamic transaction adjustment if amount was changed
        const diffPaid = newPaid - oldPaid;
        const staffName = req.user ? `${req.user.firstName} ${req.user.lastName}`.trim() : 'FrontDesk';

        if (diffPaid !== 0) {
            const isMore = diffPaid > 0;
            const absDiff = Math.abs(diffPaid);
            const effectiveMode = paymentMode || booking.financials?.paymentMode || 'Cash';
            const isOta = effectiveMode === 'OTA';

            // Add payment history entry
            booking.financials.paymentHistory.push({
                amount: diffPaid,
                mode: effectiveMode,
                staff: staffName,
                note: `Amended entry balance adjustment: ${note || (isMore ? 'Added collected amount' : 'Deducted correction')}`,
                timestamp: new Date()
            });

            // Create dynamic adjustment transaction
            const adjTx = new Transaction({
                type: isMore ? 'Income' : 'Expense',
                category: 'Room Rent',
                amount: encrypt(absDiff.toString()),
                description: encrypt(`Amendment Balance Adjustment (${effectiveMode}) - ${booking.guestDetails.firstName} ${booking.guestDetails.lastName} - Ref #${booking._id.toString().slice(-8)}`),
                paymentMode: effectiveMode,
                recordedBy: staffName,
                approved: !isOta,
                date: new Date(),
                booking: booking._id,
                amendment: amendment._id
            });
            await adjTx.save();
        }

        await booking.save();

        // 6. Mark amendment completed
        amendment.status = 'Completed';
        amendment.completedAt = new Date();
        amendment.completedAction = 'Edited';
        amendment.canEdit = false;
        amendment.canDelete = false;
        await amendment.save();

        const updatedBooking = await Booking.findById(booking._id)
            .populate('roomCategory')
            .populate('roomUnit');

        const io = req.app.get('socketio');
        if (io) {
            io.emit('booking_updated', updatedBooking);
            io.emit('finance_updated', { type: 'amendment_executed', bookingId: booking._id });
            io.emit('amendment_updated', amendment);
        }

        res.json({
            message: 'Booking entry successfully amended, balances recalculated, and dynamic collections updated.',
            booking: updatedBooking,
            amendment
        });
    } catch (err) {
        console.error('Error executing amendment edit:', err);
        res.status(500).json({ message: err.message });
    }
});

// DELETE: Execute Delete on the Entry (Staff Admin with approved access OR Super Admin)
router.delete('/:id/execute-delete', protect, async (req, res) => {
    try {
        const amendment = await Amendment.findById(req.params.id);
        if (!amendment) {
            return res.status(404).json({ message: 'Amendment record not found.' });
        }

        const isSuper = req.user && req.user.role === 'superadmin';
        if (!isSuper && (!amendment.canDelete || amendment.status !== 'Approved')) {
            return res.status(403).json({ message: 'Permission denied. Super Admin has not granted delete access for this entry.' });
        }

        if (amendment.entryType === 'Transaction' || amendment.transaction) {
            const tx = await Transaction.findById(amendment.transaction);
            if (tx) {
                tx.isVoided = true;
                tx.voidReason = 'Voided via approved amendment';
                await tx.save();
            }
            amendment.status = 'Completed';
            amendment.completedAt = new Date();
            amendment.completedAction = 'Deleted';
            amendment.canEdit = false;
            amendment.canDelete = false;
            await amendment.save();

            const io = req.app.get('socketio');
            if (io) {
                io.emit('finance_updated');
                io.emit('amendment_updated', amendment);
            }
            return res.json({ message: 'Transaction entry voided/deleted successfully.', amendment });
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

        // 2. Release DailyInventory booked count
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

        // 3. Find and delete all Transactions linked to this booking or amendment
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

        if (txIdsToDelete.length > 0) {
            await Transaction.deleteMany({ _id: { $in: txIdsToDelete } });
        }

        // 4. Permanently delete the booking from Front Desk
        if (bookingId) {
            await Booking.findByIdAndDelete(bookingId);
        }

        // 5. Mark amendment completed (Deleted)
        amendment.status = 'Completed';
        amendment.completedAt = new Date();
        amendment.completedAction = 'Deleted';
        amendment.canEdit = false;
        amendment.canDelete = false;
        await amendment.save();

        // 6. Emit real-time socket events
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
            io.emit('amendment_updated', amendment);
            io.emit('finance_updated', { voided: true, deducted: totalDeducted });
        }

        res.json({
            message: 'Booking entry permanently deleted from Front Desk, room released, and collections dynamically deducted.',
            deletedBookingId: bookingId,
            deductedAmount: totalDeducted,
            amendment
        });
    } catch (err) {
        console.error('Error executing amendment delete:', err);
        res.status(500).json({ message: err.message });
    }
});

// DELETE: Delete amendment record itself (Super Admin only)
router.delete('/:id', protect, superAdmin, async (req, res) => {
    try {
        await Amendment.findByIdAndDelete(req.params.id);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('amendment_deleted', { id: req.params.id });
        }
        res.json({ message: 'Amendment record cleared.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
