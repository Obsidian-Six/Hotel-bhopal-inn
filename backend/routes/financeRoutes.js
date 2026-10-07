const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const CashHandover = require('../models/CashHandover');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const RoomUnit = require('../models/RoomUnit');
const ElectricityReading = require('../models/ElectricityReading');
const Amendment = require('../models/Amendment');
const { encrypt, decrypt } = require('../utils/crypto');
const { protect, superAdmin } = require('../middleware/auth');

// Add a transaction
router.post('/transactions', async (req, res) => {
    try {
        const { type, category, amount, description, paymentMode, recordedBy, approved, approvedBy, date } = req.body;
        
        // Encrypt sensitive fields
        const encryptedAmount = encrypt(amount.toString());
        const encryptedDesc = description ? encrypt(description) : encrypt('');

        let txDate = new Date();
        if (date) {
            if (typeof date === 'string' && date.includes('-')) {
                const datePart = date.split('T')[0];
                const [y, m, d] = datePart.split('-').map(Number);
                const now = new Date();
                txDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
            } else {
                txDate = new Date(date);
            }
        }

        const newTx = new Transaction({ 
            date: txDate,
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
            if (typeof date === 'string' && date.includes('-')) {
                const [y, m, d] = date.split('-').map(Number);
                startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
                endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
            } else {
                startOfDay = new Date(date);
                startOfDay.setHours(0, 0, 0, 0);
                endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);
            }
            
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
            b.financials?.paymentHistory?.forEach(p => {
                if (!date || (p.timestamp >= startOfDay && p.timestamp <= endOfDay)) {
                    if (p.mode === 'Online' || p.mode === 'Card' || p.mode === 'UPI' || p.mode === 'Bank Transfer') {
                        // Check if a matching Transaction already exists in decryptedTx to prevent double counting
                        const isDuplicate = decryptedTx.some(tx => {
                            // 1. Direct booking reference match
                            if (tx.booking && tx.booking.toString() === b._id.toString()) return true;

                            // 2. Ref ID in description match
                            const bRef = b._id.toString().slice(-8).toLowerCase();
                            const txDesc = (tx.description || '').toLowerCase();
                            if (txDesc.includes(bRef)) return true;

                            // 3. Name and amount match
                            const sameAmount = Math.abs(Number(tx.amount) - Number(p.amount)) < 0.01;
                            const fName = (b.guestDetails?.firstName || '').toLowerCase().trim();
                            const lName = (b.guestDetails?.lastName || '').toLowerCase().trim();
                            const nameMatch = (fName && txDesc.includes(fName)) || (lName && txDesc.includes(lName));

                            const pTime = new Date(p.timestamp).getTime();
                            const txTime = new Date(tx.date || tx.createdAt).getTime();
                            const timeDiff = Math.abs(txTime - pTime);

                            return sameAmount && (nameMatch || timeDiff < 60 * 60 * 1000);
                        });

                        if (!isDuplicate) {
                            bookingTx.push({
                                _id: p._id || Math.random().toString(),
                                type: 'Income',
                                category: 'Room Rent',
                                amount: p.amount,
                                description: `${b.guestDetails?.firstName || ''} ${b.guestDetails?.lastName || ''} - Booking #${b._id.toString().slice(-8)}`.trim(),
                                paymentMode: p.mode,
                                recordedBy: p.staff || 'System',
                                approved: true,
                                createdAt: p.timestamp,
                                date: p.timestamp,
                                booking: b._id
                            });
                        }
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

// PUT: Edit Transaction (Super Admin or staff with approved amendment)
router.put('/transactions/:id', protect, async (req, res) => {
    try {
        const tx = await Transaction.findById(req.params.id);
        if (!tx) return res.status(404).json({ message: 'Transaction not found' });

        const isSuper = req.user && req.user.role === 'superadmin';
        if (!isSuper) {
            const approvedAmend = await Amendment.findOne({
                $or: [
                    { transaction: tx._id },
                    ...(tx.booking ? [{ booking: tx.booking }] : [])
                ],
                status: 'Approved',
                canEdit: true
            });
            if (!approvedAmend) {
                return res.status(403).json({ message: 'Permission denied. Please request an amendment from Super Admin first.' });
            }
        }

        const {
            date,
            type,
            category,
            amount,
            description,
            paymentMode,
            recordedBy,
            approved,
            approvedBy
        } = req.body;

        const oldAmount = Number(decrypt(tx.amount)) || 0;

        if (date) tx.date = new Date(date);
        if (type) tx.type = type;
        if (category) tx.category = category;
        if (amount !== undefined && amount !== null) {
            tx.amount = encrypt(amount.toString());
        }
        if (description !== undefined) {
            tx.description = encrypt(description || '');
        }
        if (paymentMode) tx.paymentMode = paymentMode;
        if (recordedBy !== undefined) tx.recordedBy = recordedBy;
        if (approved !== undefined) tx.approved = approved;
        if (approvedBy !== undefined) tx.approvedBy = approvedBy;

        await tx.save();

        const decryptedTx = tx.toObject();
        decryptedTx.amount = amount !== undefined ? Number(amount) : oldAmount;
        decryptedTx.description = description !== undefined ? description : decrypt(tx.description);

        // If linked to a booking and amount changed, keep booking balance synchronized
        if (tx.booking && amount !== undefined && tx.type === 'Income') {
            try {
                const booking = await Booking.findById(tx.booking);
                if (booking) {
                    const newAmount = Number(amount);
                    const diff = newAmount - oldAmount;
                    if (diff !== 0) {
                        booking.financials.amountPaid = Math.max(0, (booking.financials.amountPaid || 0) + diff);
                        booking.financials.balance = Math.max(0, (booking.financials.totalAmount || 0) - booking.financials.amountPaid);
                        await booking.save();
                        const io = req.app.get('socketio');
                        if (io) io.emit('booking_updated', booking);
                    }
                }
            } catch (bErr) {
                console.error('Error synchronizing booking financials:', bErr);
            }
        }

        const io = req.app.get('socketio');
        if (io) {
            io.emit('finance_updated', decryptedTx);
        }

        res.json({
            message: 'Transaction successfully updated by Super Admin.',
            transaction: decryptedTx
        });
    } catch (err) {
        console.error('Error editing transaction:', err);
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

// Helper: Calculate financials for a specific date range (calculates total collections actually received on that day)
const calculateFinancialsForRange = async (sDate, eDate) => {
    const txs = await Transaction.find({
        date: { $gte: sDate, $lte: eDate },
        isVoided: false
    });

    let cash = 0;
    let online = 0;
    let otaTotal = 0;
    let otaApproved = 0;
    let otaApprovedCount = 0;
    let otaPendingCount = 0;
    let totalExpenses = 0;
    let cashExpenses = 0;

    const decryptedTxs = [];

    txs.forEach(tx => {
        const amount = Number(decrypt(tx.amount)) || 0;
        const desc = decrypt(tx.description);
        decryptedTxs.push({ ...tx.toObject(), amount, description: desc });

        if (tx.type === 'Income') {
            if (tx.paymentMode === 'OTA') {
                otaTotal += amount;
                if (tx.approved) {
                    otaApproved += amount;
                    otaApprovedCount++;
                } else {
                    otaPendingCount++;
                }
            } else if (tx.paymentMode === 'Cash') {
                cash += amount;
            } else {
                online += amount;
            }
        } else if (tx.type === 'Expense' && tx.approved) {
            totalExpenses += amount;
            if (tx.paymentMode === 'Cash' || !tx.paymentMode) {
                cashExpenses += amount;
            }
        }
    });

    // Fallback: check booking paymentHistory for any payments on this date not already in Transaction
    const bookings = await Booking.find({
        status: { $ne: 'Cancelled' },
        'financials.paymentHistory.timestamp': { $gte: sDate, $lte: eDate }
    });

    bookings.forEach(b => {
        (b.financials?.paymentHistory || []).forEach(p => {
            if (p.timestamp >= sDate && p.timestamp <= eDate) {
                const amt = Number(p.amount) || 0;
                if (amt <= 0) return;

                const isDuplicate = decryptedTxs.some(tx => {
                    if (tx.booking && tx.booking.toString() === b._id.toString()) {
                        if (Math.abs(Number(tx.amount) - amt) < 0.01) return true;
                    }
                    const bRef = b._id.toString().slice(-8).toLowerCase();
                    const txDesc = (tx.description || '').toLowerCase();
                    if (txDesc.includes(bRef) && Math.abs(Number(tx.amount) - amt) < 0.01) return true;

                    const fName = (b.guestDetails?.firstName || '').toLowerCase().trim();
                    const lName = (b.guestDetails?.lastName || '').toLowerCase().trim();
                    const nameMatch = (fName && txDesc.includes(fName)) || (lName && txDesc.includes(lName));
                    return Math.abs(Number(tx.amount) - amt) < 0.01 && nameMatch;
                });

                if (!isDuplicate) {
                    if (p.mode === 'OTA') {
                        otaTotal += amt;
                        otaApproved += amt;
                        otaApprovedCount++;
                    } else if (p.mode === 'Cash') {
                        cash += amt;
                    } else {
                        online += amt;
                    }
                }
            }
        });
    });

    const otaPending = Math.max(0, otaTotal - otaApproved);
    return { 
        cash, 
        online, 
        otaTotal, 
        otaApproved, 
        otaPending, 
        otaApprovedCount, 
        otaPendingCount, 
        ota: otaTotal, 
        total: cash + online + otaTotal, 
        expenses: totalExpenses,
        cashExpenses: cashExpenses
    };
};

// Calculate opening cash balance for a given day (carried forward from previous days)
const getOpeningCashBalance = async (startOfDay) => {
    // 1. Check if an explicit CashHandover was submitted on the previous day
    const yesterdayStart = new Date(startOfDay);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const prevHandover = await CashHandover.findOne({
        date: { $gte: yesterdayStart, $lte: yesterdayEnd }
    });

    if (prevHandover) {
        return Number(decrypt(prevHandover.closingBalance)) || 0;
    }

    // 2. Check the most recent CashHandover prior to this date
    const mostRecentHandover = await CashHandover.findOne({
        date: { $lt: startOfDay }
    }).sort({ date: -1 });

    let baseDate = new Date(2026, 7, 10, 0, 0, 0, 0); // 10th Aug 2026 default baseline
    let baseBalance = 0;

    if (mostRecentHandover) {
        baseDate = new Date(mostRecentHandover.date);
        baseDate.setDate(baseDate.getDate() + 1);
        baseDate.setHours(0, 0, 0, 0);
        baseBalance = Number(decrypt(mostRecentHandover.closingBalance)) || 0;
    }

    if (startOfDay <= baseDate) {
        return baseBalance;
    }

    // Calculate cash income and cash expenses between baseDate and startOfDay
    const priorFin = await calculateFinancialsForRange(baseDate, new Date(startOfDay.getTime() - 1));
    const accumulatedCash = (priorFin.cash || 0) - (priorFin.cashExpenses || 0);

    return Math.max(0, baseBalance + accumulatedCash);
};

// Get daily report summary
router.get('/daily-report', async (req, res) => {
    try {
        const { date } = req.query;
        let startOfDay, endOfDay, queryDate;

        if (date && typeof date === 'string' && date.includes('-')) {
            const [y, m, d] = date.split('-').map(Number);
            queryDate = new Date(y, m - 1, d, 12, 0, 0);
            startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
            endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
        } else {
            queryDate = date ? new Date(date) : new Date();
            const y = queryDate.getFullYear();
            const m = queryDate.getMonth();
            const d = queryDate.getDate();
            startOfDay = new Date(y, m, d, 0, 0, 0, 0);
            endOfDay = new Date(y, m, d, 23, 59, 59, 999);
        }

        // 1. Calculate financials for selected date
        const todayFin = await calculateFinancialsForRange(startOfDay, endOfDay);

        // 2. Fetch transactions for mode breakdown
        const transactions = await Transaction.find({
            date: { $gte: startOfDay, $lte: endOfDay },
            isVoided: false
        });

        let incomeByMode = {
            Cash: todayFin.cash,
            Online: 0,
            UPI: 0,
            Card: 0,
            'Bank Transfer': 0,
            OTA: todayFin.otaTotal
        };

        transactions.forEach(tx => {
            const amount = Number(decrypt(tx.amount)) || 0;
            if (tx.type === 'Income') {
                if (['UPI', 'Card', 'Bank Transfer'].includes(tx.paymentMode)) {
                    incomeByMode[tx.paymentMode] = (incomeByMode[tx.paymentMode] || 0) + amount;
                } else if (tx.paymentMode !== 'Cash' && tx.paymentMode !== 'OTA') {
                    incomeByMode.Online = (incomeByMode.Online || 0) + amount;
                }
            }
        });

        // 3. Opening Cash Balance carried forward from previous day
        const openingBalance = await getOpeningCashBalance(startOfDay);

        const totalCashIncome = todayFin.cash;
        const totalCashExpense = todayFin.cashExpenses;
        const closingCashBalance = openingBalance + totalCashIncome - totalCashExpense;

        let summary = {
            totalIncome: todayFin.total,
            totalExpense: todayFin.expenses,
            openingBalance: openingBalance,
            closingBalance: closingCashBalance,
            netCashHandover: closingCashBalance, // Closing cash balance carried forward to Net Cash
            todayCashIncome: totalCashIncome,
            todayCashExpense: totalCashExpense,
            netCashDay: totalCashIncome - totalCashExpense,
            incomeByMode,
            otaTotal: todayFin.otaTotal,
            otaApproved: todayFin.otaApproved,
            otaPending: todayFin.otaPending
        };

        res.json(summary);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET: Dedicated Front Desk Analytics for selected date
router.get('/analytics-date', async (req, res) => {
    try {
        const { date } = req.query;
        let startOfDay, endOfDay;
        let targetDateStr;
        let queryDate;

        if (date && typeof date === 'string' && date.includes('-')) {
            targetDateStr = date;
            const [y, m, d] = date.split('-').map(Number);
            queryDate = new Date(y, m - 1, d, 12, 0, 0);
            startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
            endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
        } else {
            queryDate = date ? new Date(date) : new Date();
            const y = queryDate.getFullYear();
            const m = queryDate.getMonth();
            const d = queryDate.getDate();
            targetDateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            startOfDay = new Date(y, m, d, 0, 0, 0, 0);
            endOfDay = new Date(y, m, d, 23, 59, 59, 999);
        }

        // 1. Room Bookings & Check-ins for selected date (11:59 PM EOD Snapshot)
        const checkIns = await Booking.countDocuments({
            status: { $ne: 'Cancelled' },
            checkInDate: { $gte: startOfDay, $lte: endOfDay }
        });

        const activeBookingsOnDate = await Booking.find({
            status: { $ne: 'Cancelled' },
            checkInDate: { $lte: endOfDay },
            checkOutDate: { $gt: startOfDay }
        }).populate('roomCategory').populate('roomUnit');

        // Check if guest was occupied in-house on this date at 11:59 PM EOD
        const isOccupiedOnDate = (b) => {
            if (b.status === 'Cancelled') return false;
            
            const nowTime = new Date();
            const isToday = (endOfDay >= nowTime);

            if (isToday) {
                return b.status === 'Checked-In';
            }

            // For past dates: 11:59 PM EOD snapshot for bookings checked-in on this date
            const cIn = new Date(b.checkInDate);
            const cOut = new Date(b.checkOutDate);

            return cIn >= startOfDay && cIn <= endOfDay && cOut > startOfDay;
        };

        const occupiedCount = activeBookingsOnDate.filter(isOccupiedOnDate).length;

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
                if (!isOccupiedOnDate(b)) return false;
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

        // 2. Today's Financials
        const todayFin = await calculateFinancialsForRange(startOfDay, endOfDay);
        const cashSale = todayFin.cash;
        const onlineSale = todayFin.online;
        const otaSale = todayFin.otaApproved;
        const otaTotal = todayFin.otaTotal;
        const otaApproved = todayFin.otaApproved;
        const totalSale = todayFin.total;
        const cashExpenses = todayFin.expenses;

        // 3. Counter Opening Balance calculation (starts from 10th Aug 2026 with opening balance on Aug 10 = 0)
        let openingBalanceCounter = 0;
        const [targetY, targetM, targetD] = targetDateStr.split('-').map(Number);
        const baseDate = new Date(2026, 7, 10, 0, 0, 0, 0); // 10th Aug 2026 local
        const currentDateObj = new Date(targetY, targetM - 1, targetD, 0, 0, 0, 0);

        if (currentDateObj > baseDate) {
            let iterDate = new Date(baseDate);
            while (iterDate < currentDateObj) {
                const iterStart = new Date(iterDate);
                const iterEnd = new Date(iterDate);
                iterEnd.setHours(23, 59, 59, 999);

                const iterFin = await calculateFinancialsForRange(iterStart, iterEnd);
                openingBalanceCounter += (iterFin.total - iterFin.expenses);

                iterDate.setDate(iterDate.getDate() + 1);
            }
        }

        const cashBalanceCounter = openingBalanceCounter + totalSale - cashExpenses;

        // 4. Electricity Meter Analytics Calculation
        const todayMeterDoc = await ElectricityReading.findOne({ dateStr: targetDateStr });
        
        const yesterdayObj = new Date(queryDate);
        yesterdayObj.setDate(yesterdayObj.getDate() - 1);
        const yY = yesterdayObj.getFullYear();
        const yM = String(yesterdayObj.getMonth() + 1).padStart(2, '0');
        const yD = String(yesterdayObj.getDate()).padStart(2, '0');
        const yesterdayDateStr = `${yY}-${yM}-${yD}`;
        
        const yesterdayMeterDoc = await ElectricityReading.findOne({ dateStr: yesterdayDateStr });
        
        let priorMeterDoc = yesterdayMeterDoc;
        let missedDates = [];
        
        if (!priorMeterDoc) {
            priorMeterDoc = await ElectricityReading.findOne({
                dateStr: { $lt: targetDateStr }
            }).sort({ dateStr: -1 });

            if (priorMeterDoc && priorMeterDoc.date) {
                let currDate = new Date(priorMeterDoc.date);
                currDate.setDate(currDate.getDate() + 1);
                
                while (currDate < queryDate) {
                    const missedStr = currDate.toISOString().split('T')[0];
                    missedDates.push(missedStr);
                    currDate.setDate(currDate.getDate() + 1);
                }
            }
        }

        let meterDiff = null;
        let meterStatus = 'Today Reading Not Updated';

        if (todayMeterDoc && priorMeterDoc) {
            meterDiff = todayMeterDoc.reading - priorMeterDoc.reading;
            meterStatus = 'Calculated';
        } else if (!priorMeterDoc) {
            meterStatus = 'No Previous Reading Found';
        }

        const meterAnalytics = {
            selectedDateStr: targetDateStr,
            today: todayMeterDoc ? {
                recorded: true,
                reading: todayMeterDoc.reading,
                dateStr: todayMeterDoc.dateStr,
                recordedBy: todayMeterDoc.recordedBy
            } : {
                recorded: false,
                dateStr: targetDateStr
            },
            yesterday: priorMeterDoc ? {
                recorded: true,
                isExactYesterday: yesterdayMeterDoc ? true : false,
                reading: priorMeterDoc.reading,
                dateStr: priorMeterDoc.dateStr,
                recordedBy: priorMeterDoc.recordedBy
            } : {
                recorded: false,
                dateStr: yesterdayDateStr
            },
            difference: meterDiff,
            status: meterStatus,
            missedDates
        };

        res.json({
            date: targetDateStr,
            formattedDate: queryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            checkIns,
            occupiedRooms: occupiedCount,
            totalRooms: totalRoomsCount,
            vacantRooms: totalVacant,
            vacantByCategory,
            readingDifference: {
                cashSale,
                onlineSale,
                otaSale: otaApproved,
                otaTotal,
                otaApproved,
                otaPending: Math.max(0, otaTotal - otaApproved),
                otaApprovedCount: todayFin.otaApprovedCount || 0,
                otaPendingCount: todayFin.otaPendingCount || 0,
                totalSale,
                cashExpenses,
                openingBalanceCounter,
                cashBalanceCounter
            },
            meterAnalytics
        });
    } catch (err) {
        console.error('Analytics Date Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET: F&B Food Orders & Restaurant Bills for Front Desk Analytics
router.get('/food-orders', async (req, res) => {
    try {
        const { date } = req.query; // date in YYYY-MM-DD format
        let startOfDay, endOfDay;

        if (date && typeof date === 'string' && date.includes('-')) {
            const [y, m, d] = date.split('-').map(Number);
            startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
            endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
        } else if (date) {
            const qDate = new Date(date);
            startOfDay = new Date(qDate.getFullYear(), qDate.getMonth(), qDate.getDate(), 0, 0, 0, 0);
            endOfDay = new Date(qDate.getFullYear(), qDate.getMonth(), qDate.getDate(), 23, 59, 59, 999);
        }

        const dateQuery = startOfDay && endOfDay ? { $gte: startOfDay, $lte: endOfDay } : null;

        // 1. Fetch extraCharges from Bookings with source = 'F&B' or food description
        const bookingQuery = dateQuery ? {
            'financials.extraCharges': {
                $elemMatch: {
                    date: dateQuery
                }
            }
        } : {
            'financials.extraCharges.0': { $exists: true }
        };

        const bookings = await Booking.find(bookingQuery)
            .populate('roomUnit')
            .populate('roomCategory')
            .lean();

        const orders = [];

        bookings.forEach(b => {
            const guestName = `${b.guestDetails?.firstName || ''} ${b.guestDetails?.lastName || ''}`.trim() || 'Guest';
            const roomNum = b.roomUnit?.roomNumber ? `Room ${b.roomUnit.roomNumber}` : (b.roomCategory?.title ? `${b.roomCategory.title}` : 'In-House');
            const phone = b.guestDetails?.phone || '';

            (b.financials?.extraCharges || []).forEach((ch, idx) => {
                const isFood = (ch.source === 'F&B') || (ch.description && /food|f&b|kitchen|restaurant|dining|meal|breakfast|lunch|dinner/i.test(ch.description));
                if (!isFood) return;

                const chargeDate = ch.date ? new Date(ch.date) : (b.createdAt ? new Date(b.createdAt) : new Date());
                if (dateQuery && (chargeDate < startOfDay || chargeDate > endOfDay)) return;

                orders.push({
                    _id: `${b._id}_fb_${idx}`,
                    bookingId: b._id,
                    guestName,
                    phone,
                    room: roomNum,
                    type: 'Room Folio',
                    description: ch.description || 'Food & Beverage Order',
                    amount: Number(ch.amount) || 0,
                    paymentMode: 'Charged to Room',
                    status: b.status === 'Checked-Out' ? 'Settled on Checkout' : 'Active on Folio',
                    date: chargeDate,
                    time: chargeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                    createdAt: chargeDate
                });
            });
        });

        // 2. Fetch standalone F&B Transactions from Transaction collection
        const txQuery = {
            isVoided: false,
            $or: [
                { category: 'F&B' },
                { description: { $regex: /food|f&b|restaurant|kitchen|dining|meal/i } }
            ]
        };
        if (dateQuery) {
            txQuery.date = dateQuery;
        }

        const fbTransactions = await Transaction.find(txQuery).lean();
        fbTransactions.forEach(tx => {
            if (tx.booking && orders.some(o => o.bookingId && o.bookingId.toString() === tx.booking.toString())) {
                return;
            }

            const amt = Number(decrypt(tx.amount)) || 0;
            const desc = decrypt(tx.description) || 'Restaurant F&B Order';
            const txDate = tx.date ? new Date(tx.date) : new Date(tx.createdAt);

            orders.push({
                _id: tx._id,
                bookingId: tx.booking || null,
                guestName: tx.recordedBy ? `Guest (Staff: ${tx.recordedBy})` : 'Walk-in Dining Guest',
                phone: '',
                room: 'Restaurant / Counter',
                type: 'Direct Sale',
                description: desc,
                amount: amt,
                paymentMode: tx.paymentMode || 'Cash',
                status: 'Paid Direct',
                date: txDate,
                time: txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                createdAt: txDate
            });
        });

        // Sort descending by order date/time
        orders.sort((a, b) => new Date(b.date) - new Date(a.date));

        const totalAmount = orders.reduce((sum, o) => sum + o.amount, 0);

        res.json({
            date: date || 'All',
            totalOrders: orders.length,
            totalAmount,
            orders
        });
    } catch (err) {
        console.error('Error fetching F&B orders:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get pending dues from bookings with amendment status
router.get('/pending-dues', async (req, res) => {
    try {
        const bookings = await Booking.find({
            status: { $in: ['Confirmed', 'Checked-In', 'Checked-Out'] },
            'financials.balance': { $gt: 0 }
        }).populate('roomCategory').populate('roomUnit').sort({ 'financials.balance': -1 });
        
        const bookingIds = bookings.map(b => b._id);
        const amendments = await Amendment.find({
            booking: { $in: bookingIds }
        }).sort({ updatedAt: -1 });

        const dues = bookings.map(b => {
            const amend = amendments.find(a => a.booking.toString() === b._id.toString());
            const roomNumber = b.roomUnit ? b.roomUnit.roomNumber : '';
            const roomCat = b.roomCategory ? (b.roomCategory.title || b.roomCategory.category) : 'Unassigned';

            return {
                _id: b._id,
                guestName: `${b.guestDetails.firstName} ${b.guestDetails.lastName}`,
                phone: b.guestDetails?.phone || '',
                room: roomNumber ? `Room ${roomNumber} (${roomCat})` : roomCat,
                roomNumber,
                roomCategory: roomCat,
                checkInDate: b.checkInDate,
                checkOutDate: b.checkOutDate,
                totalAmount: b.financials.totalAmount || 0,
                amountPaid: b.financials.amountPaid || 0,
                balance: b.financials.balance || 0,
                status: b.status,
                hasActiveAmendment: !!(amend && amend.status !== 'Closed'),
                amendmentId: amend ? amend._id : null,
                amendmentStatus: amend ? amend.status : null,
                latestMessage: amend && amend.messages?.length > 0 ? amend.messages[amend.messages.length - 1] : null,
                superAdminNote: amend ? amend.superAdminNote : null
            };
        });
        
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

// Save or Update Electricity Meter Reading (Support both create and edit by ID/date)
router.post('/meter-reading', async (req, res) => {
    try {
        const { _id, date, reading, notes, recordedBy } = req.body;
        if (!date || reading === undefined || reading === null || reading === '') {
            return res.status(400).json({ message: 'Date and meter reading value are required' });
        }
        
        let dateStr = '';
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
            dateStr = date.substring(0, 10);
        } else {
            const d = new Date(date);
            dateStr = d.toISOString().split('T')[0];
        }
        const dateObj = new Date(dateStr + 'T00:00:00.000Z');

        let updated;
        if (_id) {
            // Edit existing reading by MongoDB _id
            updated = await ElectricityReading.findByIdAndUpdate(
                _id,
                {
                    date: dateObj,
                    dateStr,
                    reading: Number(reading),
                    notes: notes || '',
                    recordedBy: recordedBy || 'Front Desk'
                },
                { new: true }
            );
        } else {
            // Find or create by dateStr
            updated = await ElectricityReading.findOneAndUpdate(
                { dateStr },
                {
                    date: dateObj,
                    dateStr,
                    reading: Number(reading),
                    notes: notes || '',
                    recordedBy: recordedBy || 'Front Desk'
                },
                { upsert: true, new: true }
            );
        }

        const io = req.app.get('socketio');
        if (io) {
            io.emit('meter_reading_updated', updated);
        }

        res.status(200).json(updated);
    } catch (err) {
        console.error('Meter reading save error:', err);
        res.status(400).json({ message: err.message });
    }
});

// Update specific Meter Reading by ID
router.put('/meter-reading/:id', async (req, res) => {
    try {
        const { date, reading, notes, recordedBy } = req.body;
        if (!date || reading === undefined || reading === null || reading === '') {
            return res.status(400).json({ message: 'Date and meter reading value are required' });
        }

        let dateStr = '';
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
            dateStr = date.substring(0, 10);
        } else {
            const d = new Date(date);
            dateStr = d.toISOString().split('T')[0];
        }
        const dateObj = new Date(dateStr + 'T00:00:00.000Z');

        const updated = await ElectricityReading.findByIdAndUpdate(
            req.params.id,
            {
                date: dateObj,
                dateStr,
                reading: Number(reading),
                notes: notes || '',
                recordedBy: recordedBy || 'Front Desk'
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'Meter reading not found' });
        }

        const io = req.app.get('socketio');
        if (io) {
            io.emit('meter_reading_updated', updated);
        }

        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete specific Meter Reading by ID
router.delete('/meter-reading/:id', async (req, res) => {
    try {
        const deleted = await ElectricityReading.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Meter reading not found' });
        }

        const io = req.app.get('socketio');
        if (io) {
            io.emit('meter_reading_deleted', { id: req.params.id });
        }

        res.json({ message: 'Meter reading deleted successfully', id: req.params.id });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get Electricity Meter Readings
router.get('/meter-readings', async (req, res) => {
    try {
        const readings = await ElectricityReading.find().sort({ dateStr: -1 }).limit(50);
        res.json(readings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET: Fetch all OTA transactions (with optional ?date=YYYY-MM-DD and ?status=all|pending|approved)
router.get('/ota-transactions', async (req, res) => {
    try {
        const { date, status } = req.query;
        let query = {
            paymentMode: 'OTA',
            isVoided: false
        };

        if (status === 'pending') {
            query.approved = false;
        } else if (status === 'approved') {
            query.approved = true;
        }

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.date = { $gte: startOfDay, $lte: endOfDay };
        }

        const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 });

        let otaTotal = 0;
        let otaApproved = 0;

        const decryptedTxs = transactions.map(tx => {
            const obj = tx.toObject();
            const amt = Number(decrypt(obj.amount)) || 0;
            obj.amount = amt;
            obj.description = decrypt(obj.description);
            otaTotal += amt;
            if (obj.approved) {
                otaApproved += amt;
            }
            return obj;
        });

        res.json({
            transactions: decryptedTxs,
            otaTotal,
            otaApproved,
            otaPending: Math.max(0, otaTotal - otaApproved),
            pendingCount: decryptedTxs.filter(t => !t.approved).length,
            approvedCount: decryptedTxs.filter(t => t.approved).length
        });
    } catch (err) {
        console.error('Error fetching OTA transactions:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST: Approve an OTA transaction
router.post('/ota-transactions/:id/approve', async (req, res) => {
    try {
        const tx = await Transaction.findById(req.params.id);
        if (!tx) {
            return res.status(404).json({ message: 'Transaction not found.' });
        }

        if (tx.paymentMode !== 'OTA') {
            return res.status(400).json({ message: 'Only OTA transactions require this approval flow.' });
        }

        tx.approved = true;
        tx.approvedBy = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email : 'Admin';
        await tx.save();

        const responseTx = tx.toObject();
        responseTx.amount = Number(decrypt(responseTx.amount)) || 0;
        responseTx.description = decrypt(responseTx.description);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('finance_updated', responseTx);
        }

        res.json({
            message: `OTA transaction for ₹${responseTx.amount} approved and added to Total Sales.`,
            transaction: responseTx
        });
    } catch (err) {
        console.error('Error approving OTA transaction:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST: Batch approve all pending OTA transactions
router.post('/ota-transactions/approve-all', async (req, res) => {
    try {
        const { date } = req.body;
        let query = {
            paymentMode: 'OTA',
            approved: false,
            isVoided: false
        };

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.date = { $gte: startOfDay, $lte: endOfDay };
        }

        const approver = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email : 'Admin';

        const updateResult = await Transaction.updateMany(query, {
            $set: { approved: true, approvedBy: approver }
        });

        const io = req.app.get('socketio');
        if (io) {
            io.emit('finance_updated', { type: 'batch_ota_approved' });
        }

        res.json({
            message: `${updateResult.modifiedCount} OTA transaction(s) approved and added to Total Sales.`,
            count: updateResult.modifiedCount
        });
    } catch (err) {
        console.error('Error batch approving OTA transactions:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET: Dedicated Front Desk Analytics Monthly Report
router.get('/monthly-report', async (req, res) => {
    try {
        const { month, year: qYear } = req.query;
        let targetYear, targetMonth; // 1-indexed

        if (month && month.includes('-')) {
            const [y, m] = month.split('-').map(Number);
            targetYear = y;
            targetMonth = m;
        } else if (qYear && month) {
            targetYear = Number(qYear);
            targetMonth = Number(month);
        } else {
            const now = new Date();
            targetYear = now.getFullYear();
            targetMonth = now.getMonth() + 1;
        }

        const startDate = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
        const lastDay = new Date(targetYear, targetMonth, 0).getDate();
        const endDate = new Date(targetYear, targetMonth - 1, lastDay, 23, 59, 59, 999);

        // Fetch all transactions for this month
        const transactions = await Transaction.find({
            date: { $gte: startDate, $lte: endDate },
            isVoided: false
        });

        // Fetch all bookings with checkIn or paymentHistory in this month
        const bookings = await Booking.find({
            status: { $ne: 'Cancelled' },
            $or: [
                { checkInDate: { $gte: startDate, $lte: endDate } },
                { 'financials.paymentHistory.timestamp': { $gte: startDate, $lte: endDate } },
                { createdAt: { $gte: startDate, $lte: endDate } }
            ]
        }).lean();

        // Total hotel room capacity (16 rooms)
        const totalRooms = 16;
        const totalPossibleRoomNights = totalRooms * lastDay;

        // Daily breakdown array
        const dailyBreakdown = [];
        let monthCash = 0;
        let monthOnline = 0;
        let monthOtaTotal = 0;
        let monthOtaApproved = 0;
        let monthExpenses = 0;
        let monthCheckIns = 0;
        let monthOccupiedNights = 0;

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let d = 1; d <= lastDay; d++) {
            const dayStart = new Date(targetYear, targetMonth - 1, d, 0, 0, 0, 0);
            const dayEnd = new Date(targetYear, targetMonth - 1, d, 23, 59, 59, 999);
            const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayOfWeek = dayNames[dayStart.getDay()];

            // 1. Transactions on this day
            let dayCash = 0;
            let dayOnline = 0;
            let dayOtaTotal = 0;
            let dayOtaApproved = 0;
            let dayExpenses = 0;

            const dayTxs = transactions.filter(t => t.date >= dayStart && t.date <= dayEnd);
            dayTxs.forEach(tx => {
                const amt = Number(decrypt(tx.amount)) || 0;
                if (tx.type === 'Income') {
                    if (tx.paymentMode === 'OTA') {
                        dayOtaTotal += amt;
                        if (tx.approved) dayOtaApproved += amt;
                    } else if (tx.paymentMode === 'Cash') {
                        dayCash += amt;
                    } else {
                        dayOnline += amt;
                    }
                } else if (tx.type === 'Expense' && tx.approved) {
                    if (tx.paymentMode === 'Cash' || !tx.paymentMode) {
                        dayExpenses += amt;
                    }
                }
            });

            // 2. Bookings & Payments on this day
            const dayCheckIns = bookings.filter(b => {
                const cIn = new Date(b.checkInDate);
                return cIn >= dayStart && cIn <= dayEnd;
            }).length;

            bookings.forEach(b => {
                // Payment history
                const pHistory = (b.financials?.paymentHistory || []).filter(
                    p => p.timestamp >= dayStart && p.timestamp <= dayEnd
                );
                pHistory.forEach(p => {
                    const amt = Number(p.amount) || 0;
                    if (amt <= 0) return;

                    const isDup = dayTxs.some(t => {
                        const tAmt = Number(decrypt(t.amount)) || 0;
                        if (t.booking && t.booking.toString() === b._id.toString() && Math.abs(tAmt - amt) < 0.01) return true;
                        const bRef = b._id.toString().slice(-8).toLowerCase();
                        const desc = (decrypt(t.description) || '').toLowerCase();
                        if (desc.includes(bRef) && Math.abs(tAmt - amt) < 0.01) return true;
                        return false;
                    });

                    if (!isDup) {
                        if (p.mode === 'OTA') {
                            dayOtaTotal += amt;
                            dayOtaApproved += amt;
                        } else if (p.mode === 'Cash') {
                            dayCash += amt;
                        } else {
                            dayOnline += amt;
                        }
                    }
                });

                // In-house occupancy count for this day
                const cIn = new Date(b.checkInDate);
                const cOut = new Date(b.checkOutDate);
                if (cIn <= dayEnd && cOut > dayStart) {
                    monthOccupiedNights += 1;
                }
            });

            const dayTotalSale = dayCash + dayOnline + dayOtaTotal;
            const dayNet = dayTotalSale - dayExpenses;

            monthCash += dayCash;
            monthOnline += dayOnline;
            monthOtaTotal += dayOtaTotal;
            monthOtaApproved += dayOtaApproved;
            monthExpenses += dayExpenses;
            monthCheckIns += dayCheckIns;

            dailyBreakdown.push({
                dateStr,
                dayNumber: d,
                dayOfWeek,
                checkIns: dayCheckIns,
                cashSale: dayCash,
                onlineSale: dayOnline,
                otaTotal: dayOtaTotal,
                otaApproved: dayOtaApproved,
                totalSale: dayTotalSale,
                expenses: dayExpenses,
                netCashflow: dayNet
            });
        }

        const monthTotalSale = monthCash + monthOnline + monthOtaApproved;
        const monthNetProfit = monthTotalSale - monthExpenses;
        const occupancyRate = totalPossibleRoomNights > 0 
            ? Number(((monthOccupiedNights / totalPossibleRoomNights) * 100).toFixed(1)) 
            : 0;

        const monthName = new Date(targetYear, targetMonth - 1, 1).toLocaleDateString('en-US', { month: 'long' });

        res.json({
            year: targetYear,
            month: targetMonth,
            monthName,
            formattedHeading: `${monthName} ${targetYear}`,
            summary: {
                totalSale: monthTotalSale,
                cashSale: monthCash,
                onlineSale: monthOnline,
                otaTotal: monthOtaTotal,
                otaApproved: monthOtaApproved,
                otaPending: Math.max(0, monthOtaTotal - monthOtaApproved),
                totalExpenses: monthExpenses,
                netProfit: monthNetProfit,
                totalCheckIns: monthCheckIns,
                totalRoomNights: monthOccupiedNights,
                totalPossibleRoomNights,
                occupancyRate
            },
            dailyBreakdown
        });
    } catch (err) {
        console.error('Error generating monthly report:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
