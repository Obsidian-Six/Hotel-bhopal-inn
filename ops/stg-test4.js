// Staging test for the cash count / handover fix. Runs INSIDE a throwaway backend container + throwaway Mongo.
const mongoose = require('mongoose');
const User = require('./models/User');
const B = 'http://localhost:8000/api';
const out = [];
const ok = (name, cond, extra = '') => out.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const plus = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };

(async () => {
  if (!/hotel-stg-mongo/.test(process.env.MONGO_URI || '')) { console.log('ABORT: not a staging database'); process.exit(1); }
  await mongoose.connect(process.env.MONGO_URI);
  await mongoose.connection.db.dropDatabase();
  await User.create({ firstName: 'Stg', lastName: 'Super', email: 'stg@test.local', password: 'StgPass#123', role: 'superadmin' });
  await User.create({ firstName: 'Desk', lastName: 'Staff', email: 'desk@test.local', password: 'DeskPass#123', role: 'admin' });
  const j = async (method, path, body, token, extra = {}) => {
    const r = await fetch(B + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...extra }, body: body ? JSON.stringify(body) : undefined });
    let d = null; try { d = await r.json(); } catch (e) {}
    return { s: r.status, d };
  };
  const S = (await j('POST', '/auth/super-admin-login', { email: 'stg@test.local', password: 'StgPass#123' })).d.token;
  const lg = await j('POST', '/auth/login', { email: 'desk@test.local', password: 'DeskPass#123' });
  const D = lg.d && lg.d.token;
  ok('staff admin login', !!D, String(lg.s));
  const K = { 'X-Integration-Key': process.env.DAILY_OPS_KEY };
  const TODAY = plus(0), YEST = plus(-1), TOM = plus(1);
  const rep = async date => (await j('GET', `/finance/daily-report?date=${date}`, null, S)).d;

  // Build up a wrong running balance: lots of cash income yesterday, none handed over
  await j('POST', '/finance/transactions', { type: 'Income', category: 'Room Rent', amount: 50000, description: 'old cash', paymentMode: 'Cash', date: YEST }, S);
  await j('POST', '/finance/transactions', { type: 'Income', category: 'Room Rent', amount: 2100, description: 'cash today', paymentMode: 'Cash', date: TODAY }, S);
  let r = await rep(TODAY);
  ok('before count: software says 52,100', r.closingBalance === 52100, String(r.closingBalance));

  // Handover with a real count: ₹1,800 given, ₹300 left
  const h = await j('POST', '/finance/cash-handover', { date: new Date(TODAY + 'T20:57:00'), shiftEndTime: '20:57', staffName: 'Front desk', handoverTo: 'Aadarsh', openingBalance: r.openingBalance, totalCashIncome: 2100, totalCashExpense: 0, closingBalance: r.closingBalance, netDayTotal: 2100, handedOver: 1800, countedCash: 300, note: 'test' }, D);
  ok('staff can submit handover with count', h.s === 201, String(h.s));
  r = await rep(TODAY);
  ok('after count: cash in hand = 300', r.closingBalance === 300, String(r.closingBalance));
  ok('handover details in report', r.handover && r.handover.handedOver === 1800 && r.handover.countedCash === 300 && r.handover.systemBalance === 52100);
  ok('income total unchanged by count', r.totalIncome === 2100);

  // Cash coming in after the handover (night shift) is added on top
  await new Promise(x => setTimeout(x, 1100));
  await j('POST', '/finance/transactions', { type: 'Income', category: 'Room Rent', amount: 500, description: 'night cash', paymentMode: 'Cash' }, S);
  await j('POST', '/finance/transactions', { type: 'Expense', category: 'Groceries', amount: 100, description: 'milk', paymentMode: 'Cash', approved: true }, S);
  r = await rep(TODAY);
  ok('night cash after handover: 300 + 500 − 100 = 700', r.closingBalance === 700, String(r.closingBalance));
  const t = await rep(TOM);
  ok('tomorrow opens with 700', t.openingBalance === 700, String(t.openingBalance));

  // Second handover same day: staff blocked, super admin can correct
  const dup = await j('POST', '/finance/cash-handover', { date: new Date(TODAY + 'T21:30:00'), shiftEndTime: '21:30', staffName: 'x', handoverTo: 'y', openingBalance: 0, totalCashIncome: 0, totalCashExpense: 0, closingBalance: 0, netDayTotal: 0, countedCash: 999 }, D);
  ok('staff cannot overwrite a handover', dup.s === 400);
  const fix = await j('POST', '/finance/cash-handover', { date: new Date(TODAY + 'T20:57:00'), shiftEndTime: '20:57', staffName: 'Front desk', handoverTo: 'Aadarsh', openingBalance: 0, totalCashIncome: 2100, totalCashExpense: 0, closingBalance: 52100, netDayTotal: 2100, handedOver: 1800, countedCash: 350 }, S);
  ok('super admin can correct the count', fix.s === 201);
  const g = await j('GET', `/finance/cash-handover?date=${TODAY}`, null, S);
  ok('handover read back: counted 350, given 1800', g.d.countedCash === 350 && g.d.handedOver === 1800 && g.d.closingBalance === 350);

  // Same numbers everywhere
  r = await rep(TODAY);
  const os = (await j('GET', `/finance/ops-summary?date=${TODAY}`, null, null, K)).d;
  ok('Daily Ops sees the same cash in hand', os.closingBalance === r.closingBalance && os.handover && os.handover.countedCash === 350, `${os.closingBalance}/${r.closingBalance}`);
  const an = (await j('GET', `/finance/analytics-date?date=${TODAY}`, null, S)).d;
  ok('Front desk analytics counter = Finance Audit cash', an.readingDifference.cashBalanceCounter === r.closingBalance && an.readingDifference.openingBalanceCounter === r.openingBalance, `${an.readingDifference.cashBalanceCounter}`);
  ok('negative count refused', (await j('POST', '/finance/cash-handover', { date: new Date(TOM + 'T10:00:00'), shiftEndTime: '10:00', staffName: 'x', handoverTo: 'y', closingBalance: 0, countedCash: -5 }, S)).s === 400);

  console.log(out.join('\n'));
  console.log(out.some(l => l.startsWith('FAIL')) ? 'RESULT: SOME TESTS FAILED' : 'RESULT: ALL PASSED');
  await mongoose.disconnect();
  process.exit(0);
})().catch(e => { console.log(out.join('\n')); console.log('ERROR', e.stack); process.exit(1); });
