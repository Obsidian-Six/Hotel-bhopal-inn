const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const User = require('./models/User');
const Booking = require('./models/Booking');
const Transaction = require('./models/Transaction');
const CashHandover = require('./models/CashHandover');

const MONGO_URI = process.env.MONGO_URI;

const cleanup = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
    console.log('Connected to MongoDB for selective cleanup...');

    // August 13, 2026 boundaries (UTC & local boundaries)
    const startOfAug13 = new Date('2026-08-13T00:00:00.000Z');
    const endOfAug13 = new Date('2026-08-13T23:59:59.999Z');

    console.log('Preserving data for date: 13/August/2026');

    // 1. Clean Past Users (Keep admins and users registered on 13th August 2026)
    const userDeleteFilter = {
      role: { $ne: 'admin' },
      $or: [
        { createdAt: { $lt: startOfAug13 } },
        { createdAt: { $gt: endOfAug13 } },
        { createdAt: { $exists: false } }
      ]
    };
    const deletedUsers = await User.deleteMany(userDeleteFilter);
    console.log(`Deleted ${deletedUsers.deletedCount} past non-admin users.`);

    // 2. Clean Front Desk Bookings (Keep bookings where checkInDate or createdAt is on 13th August 2026)
    const bookingDeleteFilter = {
      $and: [
        {
          $or: [
            { checkInDate: { $lt: startOfAug13 } },
            { checkInDate: { $gt: endOfAug13 } },
            { checkInDate: { $exists: false } }
          ]
        },
        {
          $or: [
            { createdAt: { $lt: startOfAug13 } },
            { createdAt: { $gt: endOfAug13 } },
            { createdAt: { $exists: false } }
          ]
        }
      ]
    };
    const deletedBookings = await Booking.deleteMany(bookingDeleteFilter);
    console.log(`Deleted ${deletedBookings.deletedCount} past bookings/front desk entries.`);

    // 3. Clean Finance Transactions (Keep transactions where date or createdAt is on 13th August 2026)
    const transactionDeleteFilter = {
      $and: [
        {
          $or: [
            { date: { $lt: startOfAug13 } },
            { date: { $gt: endOfAug13 } },
            { date: { $exists: false } }
          ]
        },
        {
          $or: [
            { createdAt: { $lt: startOfAug13 } },
            { createdAt: { $gt: endOfAug13 } },
            { createdAt: { $exists: false } }
          ]
        }
      ]
    };
    const deletedTransactions = await Transaction.deleteMany(transactionDeleteFilter);
    console.log(`Deleted ${deletedTransactions.deletedCount} past finance transactions.`);

    // 4. Clean Cash Handovers (Keep handovers where date or createdAt is on 13th August 2026)
    const cashHandoverDeleteFilter = {
      $and: [
        {
          $or: [
            { date: { $lt: startOfAug13 } },
            { date: { $gt: endOfAug13 } },
            { date: { $exists: false } }
          ]
        },
        {
          $or: [
            { createdAt: { $lt: startOfAug13 } },
            { createdAt: { $gt: endOfAug13 } },
            { createdAt: { $exists: false } }
          ]
        }
      ]
    };
    const deletedHandovers = await CashHandover.deleteMany(cashHandoverDeleteFilter);
    console.log(`Deleted ${deletedHandovers.deletedCount} past cash handovers.`);

    console.log('Cleanup completed successfully. Inventory calendar and all other property data were untouched.');
    process.exit(0);
  } catch (err) {
    console.error('Cleanup error:', err);
    process.exit(1);
  }
};

cleanup();
