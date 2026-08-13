const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const CashHandover = require('../models/CashHandover');
const Booking = require('../models/Booking');
const RoomUnit = require('../models/RoomUnit');
const { encrypt, decrypt } = require('../utils/crypto');

// Add a transaction
router.post('/transactions', async (req, res) => {
    try {
        const { type, category, amount, description, paymentMode, recordedBy, approved, approvedBy } = req.body;
        
        // Encrypt sensitive fields
        const encryptedAmount = encrypt(amount.toString());
        const encryptedDesc = description ? encrypt(description) : encrypt('');

        const newTx = new Transaction({ 
            type, 
            category, 
            amount: encryptedAmount, 
            description: encryptedDesc, 
            paymentMode, 
            recordedBy,
            approved: approved !== undefined ? approved : (type === 'Income'),
            approvedBy
        });
        
        await newTx.save();
        
        // Return decrypted for immediate frontend use
        const responseTx = newTx.toObject();
        responseTx.amount = amount;
        responseTx.description = description;
        
        req.app.get('socketio').emit('finance_updated', responseTx);
        res.status(201).json(responseTx);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get transactions (filter by date)
router.get('/transactions', async (req, res) => {
    try {
        const { date } = req.query;
        let query = { isVoided: false };
        let startOfDay, endOfDay;
        
        if (date) {
            startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            
            query.date = { $gte: startOfDay, $lte: endOfDay };
        }

        const transactions = await Transaction.find(query).sort({ date: -1 });
        
        // Decrypt on the fly
        const decryptedTx = transactions.map(tx => {
            const obj = tx.toObject();
            obj.amount = Number(decrypt(obj.amount)) || 0;
            obj.description = decrypt(obj.description);
            return obj;
        });
        
        // Fetch online payments from bookings
        let bookingQuery = {};
        if (date) {
            bookingQuery = {
                'financials.paymentHistory.timestamp': { $gte: startOfDay, $lte: endOfDay }
            };
        }
        const bookings = await Booking.find(bookingQuery);
        let bookingTx = [];
        bookings.forEach(b => {
            b.financials.paymentHistory.forEach(p => {
                if (!date || (p.timestamp >= startOfDay && p.timestamp <= endOfDay)) {
                    if (p.mode === 'Online' || p.mode === 'Card' || p.mode === 'UPI' || p.mode === 'Bank Transfer') {
                        bookingTx.push({
                            _id: p._id || Math.random().toString(),
                            type: 'Income',
                            category: 'Room Rent',
                            amount: p.amount,
                            description: `${b.guestDetails.firstName} ${b.guestDetails.lastName} - Booking #${b._id.toString().slice(-8)}`,
                            paymentMode: p.mode,
                            recordedBy: p.staff || 'System',
                            approved: true,
                            createdAt: p.timestamp,
                            date: p.timestamp
                        });
                    }
                }
            });
        });
        
        const allTx = [...decryptedTx, ...bookingTx].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
        
        res.json(allTx);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Void a transaction (instead of delete)
router.post('/transactions/void/:id', async (req, res) => {
    try {
        const { voidReason } = req.body;
        const tx = await Transaction.findById(req.params.id);
        if (!tx) return res.status(404).json({ message: 'Transaction not found' });
        
        tx.isVoided = true;
        tx.voidReason = voidReason || 'Admin Voided';
        await tx.save();
        
        res.json({ message: 'Transaction voided successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get daily report summary
router.get('/daily-report', async (req, res) => {
    try {
        const { date } = req.query;
        let queryDate = date ? new Date(date) : new Date();
        
        const startOfDay = new Date(queryDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(queryDate);
        endOfDay.setHours(23, 59, 59, 999);

        const transactions = await Transaction.find({
            date: { $gte: startOfDay, $lte: endOfDay },
            isVoided: false
        });

        let summary = {
            totalIncome: 0,
            totalExpense: 0,
            netCashHandover: 0,
            incomeByMode: {
                Cash: 0,
                UPI: 0,
                Card: 0,
                'Bank Transfer': 0,
                Online: 0
            }
        };

        transactions.forEach(tx => {
            const amount = Number(decrypt(tx.amount)) || 0;
            if (tx.type === 'Income') {
                summary.totalIncome += amount;
                if (summary.incomeByMode[tx.paymentMode] !== undefined) {
                    summary.incomeByMode[tx.paymentMode] += amount;
                }
            } else if (tx.type === 'Expense' && tx.approved) {
                summary.totalExpense += amount;
            }
        });
        
        // Include booking online payments
        const bookings = await Booking.find({
            'financials.paymentHistory.timestamp': { $gte: startOfDay, $lte: endOfDay }
        });
        bookings.forEach(b => {
            b.financials.paymentHistory.forEach(p => {
                if (p.timestamp >= startOfDay && p.timestamp <= endOfDay) {
                    if (p.mode === 'Online' || p.mode === 'Card' || p.mode === 'UPI' || p.mode === 'Bank Transfer') {
                        summary.totalIncome += p.amount;
                        if (summary.incomeByMode[p.mode] !== undefined) {
                            summary.incomeByMode[p.mode] += p.amount;
                        } else {
                            summary.incomeByMode['Online'] += p.amount;
                        }
                    }
                }
            });
        });

        summary.netCashHandover = summary.incomeByMode['Cash'] - summary.totalExpense;

        res.json(summary);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET: Dedicated Front Desk Analytics for selected date
router.get('/analytics-date', async (req, res) => {
    try {
        const { date } = req.query;
        let queryDate = date ? new Date(date) : new Date();
        
        const startOfDay = new Date(queryDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(queryDate);
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Room Bookings & Check-ins for selected date
        const checkIns = await Booking.countDocuments({
            checkInDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: 'Cancelled' }
        });

        const activeBookingsOnDate = await Booking.find({
            status: { $ne: 'Cancelled' },
            checkInDate: { $lte: endOfDay },
            checkOutDate: { $gte: startOfDay }
        }).populate('roomCategory').populate('roomUnit');

        const occupiedCount = activeBookingsOnDate.filter(b => b.status === 'Checked-In').length;

        // Fetch all room units
        const allUnits = await RoomUnit.find().populate('category');

        const categoryConfig = {
            'Balcony Deluxe': ['101', '102', '201', '202'],
            'Double Deluxe': ['103', '104', '105', '106', '203', '204', '205', '206'],
            'Super Deluxe': ['107', '108', '207', '208']
        };

        const vacantByCategory = {};
        let totalVacant = 0;
        let totalRoomsCount = 0;

        Object.keys(categoryConfig).forEach(catName => {
            const catUnits = allUnits.filter(u => {
                const title = u.category?.title || u.category?.category || '';
                return title.toLowerCase().includes(catName.toLowerCase()) || 
                       categoryConfig[catName].includes(u.roomNumber);
            });

            const catOccupiedUnits = activeBookingsOnDate.filter(b => {
                if (b.status !== 'Checked-In') return false;
                const bRoomNum = b.roomUnit?.roomNumber;
                const bCatTitle = b.roomCategory?.title || b.roomCategory?.category || '';
                return categoryConfig[catName].includes(bRoomNum) || bCatTitle.toLowerCase().includes(catName.toLowerCase());
            });

            const totalInCat = catUnits.length || categoryConfig[catName].length;
            const occupiedInCat = catOccupiedUnits.length;
            const vacantInCat = Math.max(0, totalInCat - occupiedInCat);

            vacantByCategory[catName] = {
                total: totalInCat,
                occupied: occupiedInCat,
                vacant: vacantInCat,
                roomNumbers: categoryConfig[catName]
            };

            totalRoomsCount += totalInCat;
            totalVacant += vacantInCat;
        });

        // 2. Finance Desk Calculations ("Today's Reading Difference:")
        const todayTx = await Transaction.find({
            date: { $gte: startOfDay, $lte: endOfDay },
            isVoided: false
        });

        let cashSale = 0;
        let onlineSale = 0;
        let cashExpenses = 0;

        todayTx.forEach(tx => {
            const amount = Number(decrypt(tx.amount)) || 0;
            if (tx.type === 'Income') {
                if (tx.paymentMode === 'Cash') {
                    cashSale += amount;
                } else {
                    onlineSale += amount;
                }
            } else if (tx.type === 'Expense' && tx.approved) {
                if (tx.paymentMode === 'Cash' || !tx.paymentMode) {
                    cashExpenses += amount;
                }
            }
        });

        // Online payments from Bookings on this date
        const bookingsWithPayments = await Booking.find({
            'financials.paymentHistory.timestamp': { $gte: startOfDay, $lte: endOfDay }
        });

        bookingsWithPayments.forEach(b => {
            b.financials.paymentHistory.forEach(p => {
                if (p.timestamp >= startOfDay && p.timestamp <= endOfDay) {
                    if (['Online', 'Card', 'UPI', 'Bank Transfer'].includes(p.mode)) {
                        onlineSale += Number(p.amount) || 0;
                    }
                }
            });
        });

        const totalSale = cashSale + onlineSale;

        // 3. Counter Opening Balance calculation (net prior cash accumulation)
        const priorTx = await Transaction.find({
            date: { $lt: startOfDay },
            isVoided: false
        });

        let priorCashIncome = 0;
        let priorCashExpense = 0;

        priorTx.forEach(tx => {
            const amount = Number(decrypt(tx.amount)) || 0;
            if (tx.type === 'Income' && tx.paymentMode === 'Cash') {
                priorCashIncome += amount;
            } else if (tx.type === 'Expense' && tx.approved && (tx.paymentMode === 'Cash' || !tx.paymentMode)) {
                priorCashExpense += amount;
            }
        });

        const openingBalanceCounter = Math.max(0, priorCashIncome - priorCashExpense);
        const cashBalanceCounter = openingBalanceCounter + cashSale - cashExpenses;

        res.json({
            date: queryDate.toISOString().split('T')[0],
            formattedDate: queryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            checkIns,
            occupiedRooms: occupiedCount,
            totalRooms: totalRoomsCount,
            vacantRooms: totalVacant,
            vacantByCategory,
            readingDifference: {
                cashSale,
                onlineSale,
                totalSale,
                cashExpenses,
                openingBalanceCounter,
                cashBalanceCounter
            }
        });
    } catch (err) {
        console.error('Analytics Date Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get pending dues from bookings
router.get('/pending-dues', async (req, res) => {
    try {
        const bookings = await Booking.find({
            status: { $in: ['Confirmed', 'Checked-In', 'Checked-Out'] },
            'financials.balance': { $gt: 0 }
        }).populate('roomCategory');
        
        const dues = bookings.map(b => ({
            _id: b._id,
            guestName: `${b.guestDetails.firstName} ${b.guestDetails.lastName}`,
            room: b.roomCategory ? b.roomCategory.title : 'Unassigned',
            balance: b.financials.balance
        }));
        
        res.json(dues);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Submit Cash Handover
router.post('/cash-handover', async (req, res) => {
    try {
        const { date, shiftEndTime, staffName, handoverTo, openingBalance, totalCashIncome, totalCashExpense, closingBalance, netDayTotal } = req.body;
        
        const handover = new CashHandover({
            date,
            shiftEndTime,
            staffName,
            handoverTo,
            openingBalance: encrypt(openingBalance.toString()),
            totalCashIncome: encrypt(totalCashIncome.toString()),
            totalCashExpense: encrypt(totalCashExpense.toString()),
            closingBalance: encrypt(closingBalance.toString()),
            netDayTotal: encrypt(netDayTotal.toString())
        });
        
        await handover.save();
        res.status(201).json({ message: 'Cash handover submitted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Cash Handover for a date
router.get('/cash-handover', async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Date is required' });
        
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const handover = await CashHandover.findOne({
            date: { $gte: startOfDay, $lte: endOfDay }
        });
        
        if (!handover) return res.json(null);
        
        const result = handover.toObject();
        result.openingBalance = Number(decrypt(result.openingBalance)) || 0;
        result.totalCashIncome = Number(decrypt(result.totalCashIncome)) || 0;
        result.totalCashExpense = Number(decrypt(result.totalCashExpense)) || 0;
        result.closingBalance = Number(decrypt(result.closingBalance)) || 0;
        result.netDayTotal = Number(decrypt(result.netDayTotal)) || 0;
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
