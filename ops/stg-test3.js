// Staging test for update 4 (advance date, payment edit sync, food bill, Daily Ops feeds).
// Runs INSIDE a throwaway backend container pointed at a throwaway Mongo. Never touches live data.
const mongoose = require('mongoose');
const User = require('./models/User');
const Room = require('./models/Room');
const RoomUnit = require('./models/RoomUnit');
const Booking = require('./models/Booking');
const Transaction = require('./models/Transaction');
const { encrypt } = require('./utils/crypto');
const B = 'http://localhost:8000/api';
const out = [];
const ok = (name, cond, extra = '') => out.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const plus = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };

(async () => {
  if (!/hotel-stg-mongo/.test(process.env.MONGO_URI || '')) { console.log('ABORT: not a staging database'); process.exit(1); }
  await mongoose.connect(process.env.MONGO_URI);
  await mongoose.connection.db.dropDatabase();
  await User.create({ firstName: 'Stg', lastName: 'Admin', email: 'stg@test.local', password: 'StgPass#123', role: 'superadmin' });
  const A = await Room.create({ category: 'Balcony Deluxe', title: 'Balcony Deluxe Room', description: 'x' });
  const D = await Room.create({ category: 'Double Deluxe', title: 'Double Deluxe Room', description: 'x' });
  const units = [];
  for (const [n, c] of [['101', A], ['102', A], ['103', D], ['104', D], ['105', D]]) units.push(await RoomUnit.create({ roomNumber: n, category: c._id, status: 'Available' }));

  const j = async (method, path, body, token, extra = {}) => {
    const r = await fetch(B + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...extra }, body: body ? JSON.stringify(body) : undefined });
    let d = null; try { d = await r.json(); } catch (e) {}
    return { s: r.status, d };
  };
  const T = (await j('POST', '/auth/super-admin-login', { email: 'stg@test.local', password: 'StgPass#123' })).d.token;
  const K = { 'X-Integration-Key': process.env.DAILY_OPS_KEY };
  const income = async (date) => (await j('GET', `/finance/daily-report?date=${date}`, null, T)).d.totalIncome;
  const TODAY = plus(0), YEST = plus(-1), CIN = plus(2), COUT = plus(4);
  const guest = { firstName: 'Rohit', lastName: 'Test', phone: '9999999999' };

  // 1. Advance booking: money counts today (day received), not on check-in day
  const adv = await j('POST', '/bookings/walk-in', { guestDetails: guest, roomCategory: D._id, checkInDate: CIN, checkOutDate: COUT, financials: { roomTariff: 1500, totalAmount: 3000, amountPaid: 1000 }, paymentMode: 'UPI', bookingType: 'Advance', paymentDate: '', bookingDate: TODAY }, T);
  ok('advance booking created', adv.s === 201, String(adv.s));
  ok('advance ₹1000 counted today', await income(TODAY) === 1000);
  ok('advance NOT counted on check-in day', await income(CIN) === 0);
  const tx1 = await Transaction.findOne({ booking: adv.d._id });
  ok('advance finance entry linked to payment', tx1 && String(tx1.paymentId) === String(adv.d.financials.paymentHistory[0]._id));

  // 2. Group advance also today
  const g = await j('POST', '/bookings/group', { guestDetails: { ...guest, firstName: 'Group' }, checkInDate: CIN, checkOutDate: COUT, rooms: [{ roomCategory: A._id, count: 1, rate: 1000 }], amountPaid: 500, paymentMode: 'Cash' }, T);
  ok('group advance counted today', g.s === 201 && await income(TODAY) === 1500, String(await income(TODAY)));

  // 3. Edit payment date → finance entry moves (no double)
  const ed = await j('PUT', `/bookings/${adv.d._id}/payment/0`, { date: YEST + 'T10:00:00' }, T);
  ok('edit payment date', ed.s === 200, String(ed.s));
  ok('after date edit: yesterday 1000', await income(YEST) === 1000);
  ok('after date edit: today only group 500 (no double)', await income(TODAY) === 500, String(await income(TODAY)));
  const ea = await j('PUT', `/bookings/${adv.d._id}/payment/0`, { amount: 1200 }, T);
  ok('edit amount → finance shows 1200', ea.s === 200 && await income(YEST) === 1200);

  // 4. Delete payment → finance entry voided
  const del = await j('DELETE', `/bookings/${adv.d._id}/payment/0`, null, T);
  ok('delete payment', del.s === 200 && del.d.financials.amountPaid === 0);
  ok('after delete: yesterday 0', await income(YEST) === 0);
  ok('voided entry kept with reason', !!(await Transaction.findOne({ booking: adv.d._id, isVoided: true, voidReason: /deleted/ })));

  // 5. Old-style entry (no link): edit date still moves it
  const old = await Booking.findById(adv.d._id);
  const when = new Date(CIN + 'T12:00:00');
  old.financials.paymentHistory.push({ amount: 700, mode: 'UPI', staff: 'x', timestamp: when });
  old.financials.amountPaid = 700; await old.save();
  await new Transaction({ type: 'Income', category: 'Room Rent', amount: encrypt('700'), description: encrypt('Advance Booking Advance - Rohit'), paymentMode: 'UPI', date: when, booking: old._id }).save();
  ok('legacy: 700 on check-in day before fix', await income(CIN) === 700);
  await j('PUT', `/bookings/${adv.d._id}/payment/0`, { date: TODAY + 'T09:00:00' }, T);
  ok('legacy: moved to today, gone from check-in day', await income(CIN) === 0 && await income(TODAY) === 1200, `${await income(CIN)} / ${await income(TODAY)}`);

  // 6. Food bill
  const w = await j('POST', '/bookings/walk-in', { guestDetails: { ...guest, firstName: 'Food' }, roomCategory: D._id, roomUnit: units[3]._id, checkInDate: TODAY, checkOutDate: COUT, financials: { roomTariff: 1500, totalAmount: 1500, amountPaid: 0 }, immediateCheckIn: true, bookingType: 'Immediate' }, T);
  const f1 = await j('POST', `/bookings/${w.d._id}/food-order`, { items: [{ name: 'Tea', qty: 2, rate: 25 }, { name: 'Poha', qty: 1, rate: 70 }], notes: 'less sugar' }, T);
  ok('food order to room bill', f1.s === 200 && f1.d.amount === 120 && /^KOT-\d{4}-01$/.test(f1.d.kotNo), `${f1.s} ${f1.d && f1.d.kotNo}`);
  ok('room bill +120, balance 1620', f1.d.booking.financials.totalAmount === 1620 && f1.d.booking.financials.balance === 1620);
  const ch = f1.d.booking.financials.extraCharges.slice(-1)[0];
  ok('items + KOT saved on charge', ch.items.length === 2 && ch.kotNo === f1.d.kotNo && ch.source === 'F&B' && ch.notes === 'less sugar');
  const incBefore = await income(TODAY);
  const f2 = await j('POST', `/bookings/${w.d._id}/food-order`, { items: [{ name: 'Veg Thali', qty: 1, rate: 200 }], paidNow: { mode: 'Cash' } }, T);
  ok('food paid now: KOT 02, paid 200', f2.s === 200 && /-02$/.test(f2.d.kotNo) && f2.d.booking.financials.amountPaid === 200 && f2.d.booking.financials.balance === 1620);
  ok('food paid now counted in finance once', await income(TODAY) === incBefore + 200, `${incBefore} → ${await income(TODAY)}`);
  const fo = await j('GET', `/finance/food-orders?date=${TODAY}`, null, T);
  ok('food orders list shows both, ₹320', fo.d.totalOrders === 2 && fo.d.totalAmount === 320, `${fo.d.totalOrders} ${fo.d.totalAmount}`);
  ok('empty food order refused', (await j('POST', `/bookings/${w.d._id}/food-order`, { items: [] }, T)).s === 400);
  ok('Daily Ops key cannot add food', (await j('POST', `/bookings/${w.d._id}/food-order`, { items: [{ name: 'Tea', qty: 1, rate: 25 }] }, null, K)).s === 401);

  // 7. Daily Ops feeds
  await j('POST', '/finance/transactions', { type: 'Expense', category: 'Groceries', amount: 300, description: 'Milk and bread', paymentMode: 'Cash' }, T);
  const dr = (await j('GET', `/finance/daily-report?date=${TODAY}`, null, T)).d;
  const os = await j('GET', `/finance/ops-summary?date=${TODAY}`, null, null, K);
  ok('ops-summary readable with Daily Ops key', os.s === 200, String(os.s));
  ok('ops-summary = Finance Audit totals', os.d.totalIncome === dr.totalIncome && os.d.totalExpense === dr.totalExpense && os.d.closingBalance === dr.closingBalance, `${os.d.totalIncome}/${dr.totalIncome} ${os.d.totalExpense}/${dr.totalExpense}`);
  ok('ops-summary lists the expense', os.d.expenses.some(e => e.category === 'Groceries' && e.amount === 300));
  ok('ops-summary has F&B income type', (os.d.incomeByCategory['F&B'] || 0) === 200);
  ok('ops-summary has no guest names', !JSON.stringify(os.d).includes('Rohit') && !JSON.stringify(os.d).includes('9999999999'));
  ok('ops-summary needs key or login', (await j('GET', `/finance/ops-summary?date=${TODAY}`)).s === 401);
  const inv = await j('GET', '/bookings/front-desk/ops-inventory?days=7', null, null, K);
  ok('inventory readable with key', inv.s === 200 && inv.d.rooms.length === 5 && inv.d.nights.length === 7, String(inv.s));
  const r104 = inv.d.rooms.find(r => r.room === '104');
  ok('room 104 occupied till check-out', r104 && r104.status === 'Occupied' && r104.checkOut === COUT);
  const nIn = inv.d.nights.find(n => n.date === CIN);
  ok('check-in night: Double Deluxe 2 booked of 3', nIn && nIn.byType[String(D._id)].booked === 2 && nIn.byType[String(D._id)].total === 3, JSON.stringify(nIn && nIn.byType));
  ok('inventory has no guest names', !JSON.stringify(inv.d).includes('Rohit'));
  ok('daily-report still works for Finance screen', dr && typeof dr.openingBalance === 'number');

  console.log(out.join('\n'));
  console.log(out.some(l => l.startsWith('FAIL')) ? 'RESULT: SOME TESTS FAILED' : 'RESULT: ALL PASSED');
  await mongoose.disconnect();
  process.exit(0);
})().catch(e => { console.log(out.join('\n')); console.log('ERROR', e.stack); process.exit(1); });
