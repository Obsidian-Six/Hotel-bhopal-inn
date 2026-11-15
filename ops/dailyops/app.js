'use strict';
(() => {
const DEMO = !!window.EOD_DEMO;
const app = document.getElementById('app');

// ================= helpers =================
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const parseYmd = ds => { const [y, m, d] = ds.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (ds, n) => { const t = parseYmd(ds); t.setDate(t.getDate() + n); return ymd(t); };
const fmtDate = ds => parseYmd(ds).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtTime = iso => iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '';
const fmtHM = hm => { const [h, m] = hm.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return fmtTime(d.toISOString()); };
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const num = v => (v === '' || v == null || isNaN(Number(v))) ? null : Number(v);
const inr = v => v == null ? '—' : '₹' + Math.round(Number(v)).toLocaleString('en-IN');
const r2 = n => Math.round(n * 100) / 100;
const sumF = (arr, k) => arr.reduce((a, s) => a + (num(s.data[k]) || 0), 0);
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const ls = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};
let toastT;
function toast(msg, bad) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'show' + (bad ? ' bad' : '');
  clearTimeout(toastT); toastT = setTimeout(() => (t.className = ''), 3500);
}

// ================= what each role fills =================
const ROLE_LABEL = { admin: 'Owner', manager: 'Manager', supervisor: 'Supervisor', receptionist: 'Receptionist', housekeeping: 'Housekeeping', kitchen: 'Kitchen' };
const ROLE_ORDER = ['manager', 'supervisor', 'receptionist', 'housekeeping', 'kitchen'];
const LEVELS = ['Full', 'Half', 'Low', 'Empty'];
const ROOM_STATES = [
  { k: 'clean', l: 'Clean' },
  { k: 'occupied', l: 'Occupied' },
  { k: 'dirty', l: 'Dirty' },
  { k: 'blocked', l: 'Maintenance' },
];
const STOCK_COLS = [['opening', 'Opening'], ['received', 'Received'], ['used', 'Used'], ['closing', 'Closing']];

const FORMS = {
  receptionist: { photo: "Photo of the reception register for this shift", fields: [
    { k: 'duty_name', l: 'Your name (who did the night duty)', t: 'text', sec: 'Night duty', show_if: ['shift', 'Night'] },
    { k: 'cash_opening', l: 'Cash in drawer at START of shift', t: 'money', sec: 'Cash drawer' },
    { k: 'cash', l: 'Cash received this shift', t: 'money' },
    { k: 'expenses', l: 'Cash paid out from drawer (expenses)', t: 'money' },
    { k: 'cash_handover', l: 'Cash handed over (to owner / bank)', t: 'money', hint: 'Write 0 if none' },
    { k: 'cash_closing', l: 'Cash counted in drawer at END of shift', t: 'money' },
    { k: '_cashcheck', t: 'cashcheck' },
    { k: 'upi', l: 'UPI received this shift', t: 'money', sec: 'Other payments' },
    { k: 'card', l: 'Card received this shift', t: 'money' },
    { k: 'ota', l: 'Online / OTA bookings amount', t: 'money' },
    { k: 'checkins', l: 'Check-ins this shift', t: 'num', sec: 'Guests' },
    { k: 'checkouts', l: 'Check-outs this shift', t: 'num' },
    { k: 'occupied', l: 'Rooms occupied right now', t: 'num' },
    { k: 'water_calls', l: 'Guest calls about water or hot water', t: 'num' },
    { k: 'complaints', l: 'Guest complaints this shift', t: 'text', opt: true },
    { k: 'neg_review', l: 'Any negative review today? (Google, MakeMyTrip, OTA)', t: 'yesno', sec: 'Reviews' },
    { k: 'neg_review_details', l: 'Negative review: where, guest name, what they wrote', t: 'text', show_if: ['neg_review', 'yes'] },
    { k: 'neg_review_action', l: 'What was done about it?', t: 'select', opts: ['Asked guest to remove', 'Replied to it', 'Not handled yet'], show_if: ['neg_review', 'yes'] },
    { k: 'review_asks', l: 'Guests asked to give a positive review', t: 'num' },
    { k: 'pos_reviews', l: 'New positive reviews received', t: 'num' },
  ]},
  housekeeping: { photo: "Photo of today's housekeeping tracker", fields: [
    { k: 'staff_names', l: 'Housekeeping staff on duty today (names)', t: 'textline', hint: 'Everyone who cleaned rooms today' },
    { k: 'rooms', l: 'Room status at end of shift', t: 'rooms', hint: 'Tap a room to change: Clean → Occupied → Dirty → Maintenance.' },
    { k: 'pump1_start', l: 'Water pump, 1st run: started at', t: 'time', opt: true, hint: 'Leave empty if it was not switched on', sec: 'Water' },
    { k: 'pump1_min', l: '1st run: ran for how many minutes?', t: 'num', opt: true, hint: 'Should be 60' },
    { k: 'pump2_start', l: 'Water pump, 2nd run: started at', t: 'time', opt: true, hint: 'Leave empty if it was not switched on' },
    { k: 'pump2_min', l: '2nd run: ran for how many minutes?', t: 'num', opt: true, hint: 'Should be 60' },
    { k: 'geyser_on', l: 'Hot water (geyser / boiler) switched ON at', t: 'time', opt: true, hint: 'Leave empty if it was not switched on' },
    { k: 'tank_level', l: 'Water tank level right now', t: 'select', opts: LEVELS },
    { k: 'hotwater', l: 'Hot water working in all your rooms', t: 'yesno' },
    { k: 'linen', l: 'Linen sets changed', t: 'num' },
    { k: 'issues', l: 'Room issues (leak, AC, TV, etc.)', t: 'text', opt: true },
  ]},
  supervisor: { photo: "Photo of today's supervisor checklist", fields: [
    { k: 'inspected', l: 'Rooms inspected', t: 'num' },
    { k: 'failed', l: 'Rooms that failed inspection', t: 'text', opt: true, hint: 'Room numbers, e.g. 104, 203' },
    { k: 'tank_level', l: 'Water tank level right now', t: 'select', opts: LEVELS },
    { k: 'hotwater', l: 'Hot water working in all rooms', t: 'yesno' },
    { k: 'staff_present', l: 'Staff present today', t: 'num' },
    { k: 'issues', l: 'Other issues', t: 'text', opt: true },
  ]},
  kitchen: { photo: "Photo of today's kitchen stock sheet", fields: [
    { k: 'orders', l: 'Orders served', t: 'num' },
    { k: 'kitchen_sales', l: 'Kitchen sales (cash + UPI)', t: 'money' },
    { k: 'stock', l: 'Stock', t: 'stock' },
    { k: 'wastage', l: 'Wastage / spoiled items', t: 'text', opt: true },
  ]},
  manager: { photo: "Photo of today's day-close sheet", fields: [
    { k: 'total_collection', l: 'Total collection, all modes', t: 'money', hint: 'Reception + kitchen, everything' },
    { k: 'cash_in_hand', l: 'Cash in hand at close', t: 'money' },
    { k: 'expenses', l: 'Total expenses today', t: 'money' },
    { k: 'bank_deposit', l: 'Bank deposit', t: 'money' },
    { k: 'notes', l: 'Notes for owner', t: 'text', opt: true },
  ]},
};

// ================= offline storage (IndexedDB) =================
const Store = (() => {
  let dbp = null;
  const mem = { subs: new Map(), drafts: new Map() };
  const open = () => dbp || (dbp = new Promise(res => {
    try {
      const r = indexedDB.open('daily-ops', 1);
      r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('subs', { keyPath: 'client_id' }); d.createObjectStore('drafts'); };
      r.onsuccess = () => res(r.result); r.onerror = () => res(null); r.onblocked = () => res(null);
    } catch (e) { res(null); }
  }));
  const run = async (store, mode, make) => {
    const d = await open();
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode); const r = make(t.objectStore(store));
      t.oncomplete = () => res(r.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  };
  return {
    async queued() { return (await open()) ? (await run('subs', 'readonly', o => o.getAll())) || [] : [...mem.subs.values()]; },
    async enqueue(s) { if (await open()) await run('subs', 'readwrite', o => o.put(s)); else mem.subs.set(s.client_id, s); },
    async dequeue(id) { if (await open()) await run('subs', 'readwrite', o => o.delete(id)); else mem.subs.delete(id); },
    async getDraft(k) { return (await open()) ? run('drafts', 'readonly', o => o.get(k)) : mem.drafts.get(k); },
    async setDraft(k, v) { if (await open()) await run('drafts', 'readwrite', o => o.put(v, k)); else mem.drafts.set(k, v); },
    async delDraft(k) { if (await open()) await run('drafts', 'readwrite', o => o.delete(k)); else mem.drafts.delete(k); },
  };
})();

// ================= server API =================
class NetErr extends Error {}
async function call(a, { method = 'GET', body, params } = {}) {
  const qs = new URLSearchParams({ a, ...(params || {}) });
  let r;
  try {
    r = await fetch('api.php?' + qs, {
      method, credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) { throw new NetErr('No internet connection'); }
  let j = null;
  try { j = await r.json(); } catch (e) {}
  if (j && j.offline) throw new NetErr('No internet connection');
  if (!r.ok || !j || j.error) {
    if (!j && (r.status === 0 || r.status >= 502)) throw new NetErr('Server not reachable');
    const err = new Error((j && j.error) || `Something went wrong (${r.status})`);
    err.status = r.status; throw err;
  }
  return j;
}
const ServerAPI = {
  config: () => call('config'),
  me: () => call('me'),
  login: (staff_id, pin) => call('login', { method: 'POST', body: { staff_id, pin } }),
  logout: () => call('logout', { method: 'POST' }),
  submit: s => call('submit', { method: 'POST', body: s }),
  mine: () => call('mine'),
  day: date => call('day', { params: { date } }),
  month: m => call('month', { params: { m } }),
  verify: (id, v) => call('verify', { method: 'POST', body: { id, verified: v ? 1 : 0 } }),
  attendance: (date, staff_id, status) => call('attendance', { method: 'POST', body: { date, staff_id, status } }),
  aiRead: (id, fields) => call('ai_read', { method: 'POST', body: { id, fields } }),
  cms: date => call('cms', { params: { date } }),
  complaintAdd: c => call('complaint_add', { method: 'POST', body: c }),
  complaints: (from, to) => call('complaints', { params: from ? { from, to } : {} }),
  complaintStatus: (id, status) => call('complaint_status', { method: 'POST', body: { id, status } }),
  stockHistory: date => call('stock_history', { params: { date } }),
  photoUrl: f => 'api.php?a=photo&f=' + encodeURIComponent(f),
};
const API = DEMO ? window.DemoAPI : ServerAPI;

// ================= state =================
const S = {
  cfg: null, me: null, view: 'home', pick: null,
  mine: [], queue: [], form: null, busy: false,
  date: today(), day: null, dayErr: null, cms: null, cmsErr: null, comp: [], stockHist: null, myComp: [], cform: null,
  month: today().slice(0, 7), monthData: null,
  open: null, zoom: null, aiBusy: false,
};
const staffById = id => (S.cfg.staff || []).find(s => s.id === id);

// ================= analysis for the owner dashboard =================
function latestPerStaff(subs) {
  const m = {};
  for (const s of subs) {
    const k = s.staff_id + '|' + ((s.data && s.data.shift) || '');
    if (!m[k] || s.created_at > m[k].created_at) m[k] = s;
  }
  return m;
}
function groupByRole(latest) {
  const g = {};
  for (const s of Object.values(latest)) (g[s.role] = g[s.role] || []).push(s);
  for (const k in g) g[k].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return g;
}
const nameOf = s => (staffById(s.staff_id) || { name: s.staff_id }).name;
const staffName = id => (staffById(id) || { name: id || '—' }).name;
const subsOf = (latest, id) => Object.values(latest).filter(s => s.staff_id === id).sort((a, b) => a.created_at.localeCompare(b.created_at));
const shiftOf = s => (s && s.data && s.data.shift) || 'Day';
const DAY_DUE = '20:00';
const atTime = (ds, hm) => { const d = parseYmd(ds); const [h, m] = hm.split(':').map(Number); d.setHours(h, m, 0, 0); return d; };
const cashExpected = d => (num(d.cash_opening) ?? 0) + (num(d.cash) ?? 0) - (num(d.expenses) ?? 0) - (num(d.cash_handover) ?? 0);
const hasCashCount = d => num(d.cash_opening) != null && num(d.cash_closing) != null;

// Complaints: first one for a person inside the window = warning, each one after = fine.
function complaintActions(list) {
  const win = S.cfg.warning_window_days || 30;
  const out = {};
  const sorted = [...list].sort((a, b) => (a.date + String(a.id).padStart(9, '0')).localeCompare(b.date + String(b.id).padStart(9, '0')));
  const hist = {};
  for (const c of sorted) {
    out[c.id] = { hk: null, sup: null };
    if (c.status === 'waived' || c.type === 'other') continue;
    for (const [who, field] of [['hk', 'hk_staff'], ['sup', 'sup_staff']]) {
      const id = c[field]; if (!id) continue;
      const since = addDays(c.date, -win);
      const prior = (hist[id] || []).filter(d => d > since).length;
      out[c.id][who] = prior === 0 ? 'warning' : 'fine';
      (hist[id] = hist[id] || []).push(c.date);
    }
  }
  return out;
}
const TYPE_LABEL = { cleaning: 'Cleaning', washroom: 'Washroom', other: 'Other' };

function roomStatus(hk, sup) {
  const map = {};
  for (const s of hk) for (const [r, st] of Object.entries(s.data.rooms || {})) if (st) map[r] = st;
  const failed = [];
  const rooms = S.cfg.rooms;
  for (const s of sup) {
    const toks = String(s.data.failed || '').match(/[A-Za-z]?\d{2,4}[A-Za-z]?/g) || [];
    for (const t of toks) if (rooms.includes(t) && !failed.includes(t)) failed.push(t);
  }
  const by = k => rooms.filter(r => map[r] === k);
  return { map, failed, clean: by('clean'), occupied: by('occupied'), dirty: by('dirty'), blocked: by('blocked'), unset: rooms.filter(r => !map[r]) };
}

function moneySummary(byRole) {
  const rec = byRole.receptionist || [], kit = byRole.kitchen || [], mgr = (byRole.manager || []).slice(-1)[0];
  const m = {
    hasRec: rec.length > 0, hasKit: kit.length > 0,
    cash: sumF(rec, 'cash'), upi: sumF(rec, 'upi'), card: sumF(rec, 'card'), ota: sumF(rec, 'ota'),
    recExp: sumF(rec, 'expenses'), kitchen: sumF(kit, 'kitchen_sales'),
    mgr: mgr ? num(mgr.data.total_collection) : null, mgrSub: mgr,
    cashInHand: mgr ? num(mgr.data.cash_in_hand) : null,
    mgrExp: mgr ? num(mgr.data.expenses) : null,
    deposit: mgr ? num(mgr.data.bank_deposit) : null,
  };
  m.expected = (m.hasRec || m.hasKit) ? m.cash + m.upi + m.card + m.ota + m.kitchen : null;
  m.diff = (m.mgr != null && m.expected != null) ? m.mgr - m.expected : null;
  return m;
}

function stockCheck(kit, prevKit) {
  const sub = (kit || []).slice(-1)[0], prev = (prevKit || []).slice(-1)[0];
  const out = { sub, rows: [], mismatches: 0 };
  if (!sub) return out;
  for (const it of S.cfg.stock_items) {
    const x = (sub.data.stock || {})[it.k] || {};
    const o = num(x.opening), rc = num(x.received), u = num(x.used), c = num(x.closing);
    const row = { ...it, o, rc, u, c, exp: null, mismatch: false, carry: false, low: false, prev: null };
    if ([o, rc, u, c].every(v => v != null)) { row.exp = r2(o + rc - u); row.mismatch = row.exp !== r2(c); }
    const p = prev && (prev.data.stock || {})[it.k];
    if (p && num(p.closing) != null && o != null) { row.prev = num(p.closing); row.carry = r2(row.prev) !== r2(o); }
    if (c != null && it.min != null && c < it.min) row.low = true;
    const hist = S.stockHist || {};
    const uses = Object.keys(hist).filter(d => d <= sub.date).sort().slice(-7).map(d => num((hist[d][it.k] || {}).used)).filter(v => v != null);
    if (uses.length >= 2 && c != null) {
      const avg = uses.reduce((a, b) => a + b, 0) / uses.length;
      if (avg > 0) { row.avg = Math.round(avg * 10) / 10; row.daysLeft = c / avg; }
    }
    if (row.mismatch) out.mismatches++;
    out.rows.push(row);
  }
  return out;
}

function fmtVal(f, v) {
  if (v == null || v === '') return '—';
  if (f.t === 'money') return inr(v);
  if (f.t === 'yesno') return String(v).toLowerCase() === 'yes' ? 'Yes' : 'No';
  return String(v);
}
function aiCompare(s) {
  const vals = s.ai && s.ai.values;
  if (!vals || !FORMS[s.role]) return [];
  const out = [];
  for (const f of FORMS[s.role].fields) {
    if (f.t === 'stock') {
      const pv = vals.stock || {};
      for (const it of S.cfg.stock_items) {
        const p = pv[it.k] && num(pv[it.k].closing), fv = num(((s.data.stock || {})[it.k] || {}).closing);
        if (p != null && fv != null && r2(p) !== r2(fv)) out.push({ k: 'stock', l: `${it.l} closing`, form: fv, paper: p });
      }
      continue;
    }
    if (!['num', 'money', 'yesno', 'select'].includes(f.t)) continue;
    const pv = vals[f.k], fv = s.data[f.k];
    if (pv == null || pv === '' || fv == null || fv === '') continue;
    const same = (f.t === 'num' || f.t === 'money')
      ? Math.abs((num(pv) ?? NaN) - num(fv)) < 1
      : String(pv).trim().toLowerCase() === String(fv).trim().toLowerCase();
    if (!same) out.push({ k: f.k, l: f.l, form: fmtVal(f, fv), paper: fmtVal(f, pv) });
  }
  return out;
}

function analyze(day) {
  const cfg = S.cfg;
  const staff = cfg.staff.filter(s => s.role !== 'admin');
  const latest = latestPerStaff(day.subs), prevLatest = latestPerStaff(day.prev || []);
  const byRole = groupByRole(latest), prevByRole = groupByRole(prevLatest);
  const isToday = day.date === today();
  const beforeCutoff = isToday && nowHM() < cfg.eod_cutoff;
  const roles = ROLE_ORDER.filter(r => staff.some(s => s.role === r));
  const flags = [];
  const R = (title, detail, id) => flags.push({ lvl: 'red', title, detail, id });
  const A = (title, detail, id) => flags.push({ lvl: 'amber', title, detail, id });

  for (const r of roles) if (r !== 'receptionist' && !byRole[r]) (beforeCutoff ? A : R)(`No EOD from ${ROLE_LABEL[r]}`, beforeCutoff ? `Due by ${fmtHM(cfg.eod_cutoff)}` : 'Nothing submitted for this day');

  const hk = byRole.housekeeping || [], sup = byRole.supervisor || [], rec = byRole.receptionist || [];
  const U = (lvl, title, detail, id) => flags.push({ lvl, title, detail, id, urgent: true });

  // ---- reception: day report by 8 PM, night report (8 PM → morning) next morning ----
  const recDay = rec.filter(s => shiftOf(s) === 'Day').slice(-1)[0];
  const recNight = rec.filter(s => shiftOf(s) === 'Night').slice(-1)[0];
  const recMain = recDay || recNight;
  const now = new Date();
  if (roles.includes('receptionist')) {
    if (!recDay) (now < atTime(day.date, DAY_DUE) ? A : R)(now < atTime(day.date, DAY_DUE) ? 'Reception day report pending' : 'Reception day report NOT submitted', `Due by ${fmtHM(DAY_DUE)}`);
    if (!recNight && now >= atTime(day.date, DAY_DUE)) (now < atTime(addDays(day.date, 1), '11:00') ? A : R)(
      now < atTime(addDays(day.date, 1), '11:00') ? 'Reception night report pending' : 'Reception night report NOT submitted',
      `8 PM to morning — due by 11 AM on ${fmtDate(addDays(day.date, 1))}`);
  }
  const tolC = cfg.money_tolerance;
  for (const s of [recDay, recNight].filter(Boolean)) {
    const d = s.data;
    if (!hasCashCount(d)) continue;
    const exp = cashExpected(d), diff = num(d.cash_closing) - exp;
    if (Math.abs(diff) > tolC) U('red', `Cash ${diff < 0 ? 'SHORT' : 'extra'} ${inr(Math.abs(diff))} in ${shiftOf(s).toLowerCase()} shift`,
      `Start ${inr(d.cash_opening)} + received ${inr(d.cash)} − paid out ${inr(d.expenses)} − handed over ${inr(d.cash_handover)} = ${inr(exp)}, but ${inr(d.cash_closing)} counted`, s.id);
  }
  const prevNight = (prevByRole.receptionist || []).filter(s => shiftOf(s) === 'Night').slice(-1)[0];
  const handoffs = [[prevNight, recDay, 'Last night ended', 'this morning started'], [recDay, recNight, 'Day shift ended', 'night shift started']];
  for (const [a, b, la, lb] of handoffs) {
    if (!a || !b) continue;
    const c1 = num(a.data.cash_closing), o2 = num(b.data.cash_opening);
    if (c1 != null && o2 != null && Math.abs(c1 - o2) > tolC) U('red', `Cash changed by ${inr(Math.abs(c1 - o2))} between shifts`, `${la} with ${inr(c1)}, ${lb} with ${inr(o2)}`, b.id);
  }
  // ---- reviews ----
  for (const s of rec) {
    if (s.data.neg_review === 'yes') {
      const handled = s.data.neg_review_action && s.data.neg_review_action !== 'Not handled yet';
      U('red', handled ? 'Negative review today' : 'Negative review — NOT handled yet', [s.data.neg_review_details, s.data.neg_review_action].filter(Boolean).join(' · '), s.id);
    }
  }
  const outs = sumF(rec, 'checkouts'), asks = sumF(rec, 'review_asks');
  if (rec.length && outs > 0 && asks === 0) A('No guest was asked for a review', `${outs} check-out${outs > 1 ? 's' : ''} today, 0 asked`, recMain.id);
  // water + hot water
  for (const s of hk) {
    const d = s.data;
    if (d.tank_morning === 'no') R('Water tank NOT checked in the morning', `${nameOf(s)}'s EOD`, s.id);
    if (d.tank_evening === 'no') R('Water tank NOT checked in the evening', `${nameOf(s)}'s EOD`, s.id);
    if ('pump1_start' in d || 'pump2_start' in d || 'geyser_on' in d || 'staff_names' in d) {
      const runs = [[d.pump1_start, num(d.pump1_min)], [d.pump2_start, num(d.pump2_min)]].filter(([t]) => t);
      if (runs.length === 0) U('red', 'Water pump NOT run today', 'Must run 2 times a day, 1 hour each', s.id);
      else if (runs.length === 1) U('red', 'Water pump ran only ONCE today', `Ran at ${fmtHM(runs[0][0])} — needs 2 runs of 1 hour`, s.id);
      runs.forEach(([t, m], i) => { if (m != null && m < 60) A(`Pump run ${i + 1} was only ${m} minutes`, `Started ${fmtHM(t)} — should run 60 minutes`, s.id); });
      if (!d.geyser_on) U('red', 'Hot water NOT switched on today', 'Geyser / boiler must be switched on once a day', s.id);
    }
  }
  for (const s of [...hk, ...sup]) {
    if (s.data.tank_level === 'Low' || s.data.tank_level === 'Empty') U('red', `Water tank ${s.data.tank_level.toUpperCase()}`, `Reported by ${nameOf(s)} — refill before guests run out`, s.id);
    if (s.data.hotwater === 'no') U('red', 'Hot water NOT working in all rooms', `Reported by ${nameOf(s)}`, s.id);
  }
  const calls = sumF(rec, 'water_calls');
  if (calls > 0) A(`${calls} guest call${calls > 1 ? 's' : ''} about water / hot water`, 'From reception', rec[0].id);

  // rooms
  const rooms = roomStatus(hk, sup);
  if (rooms.failed.length) R(`${rooms.failed.length} room${rooms.failed.length > 1 ? 's' : ''} failed inspection`, rooms.failed.join(', '), sup[0] && sup[0].id);
  if (rooms.dirty.length) A(`${rooms.dirty.length} room${rooms.dirty.length > 1 ? 's' : ''} still dirty`, rooms.dirty.join(', '), hk[0] && hk[0].id);
  if (rooms.blocked.length) A(`${rooms.blocked.length} room${rooms.blocked.length > 1 ? 's' : ''} under maintenance`, rooms.blocked.join(', '), hk[0] && hk[0].id);
  const hkStaff = staff.filter(s => s.role === 'housekeeping');
  if (hk.length && hk.length === hkStaff.length && rooms.unset.length) A('Room status not marked', rooms.unset.join(', '), hk[0].id);
  const recOcc = recMain ? num(recMain.data.occupied) : null;
  if (hk.length && recOcc != null && recOcc !== rooms.occupied.length)
    A('Occupancy does not match', `Reception says ${recOcc} rooms occupied, housekeeping marked ${rooms.occupied.length}`, recMain.id);

  // money
  const money = moneySummary(byRole);
  if (money.mgr == null) { if (roles.includes('manager') && (money.hasRec || money.hasKit)) A('Money not cross-checked yet', 'Manager day-close not submitted'); }
  else if (money.diff != null && Math.abs(money.diff) > cfg.money_tolerance)
    R(`Money mismatch ${inr(Math.abs(money.diff))} ${money.diff < 0 ? 'short' : 'extra'}`, `Manager reported ${inr(money.mgr)}, reception + kitchen add up to ${inr(money.expected)}`, money.mgrSub.id);

  // stock
  const stock = stockCheck(byRole.kitchen, prevByRole.kitchen);
  for (const row of stock.rows) {
    if (row.mismatch) R(`Stock mismatch: ${row.l}`, `Closing written ${row.c} ${row.unit}, should be ${row.exp} (${row.o} + ${row.rc} − ${row.u})`, stock.sub.id);
    else if (row.carry) A(`${row.l}: opening ≠ yesterday's closing`, `Opening ${row.o}, yesterday closed at ${row.prev}`, stock.sub.id);
    if (row.daysLeft != null && row.daysLeft < 1.5) U('red', `${row.l} will run out ${row.daysLeft < 0.5 ? 'in less than a day' : 'in about ' + Math.round(row.daysLeft * 10) / 10 + ' day(s)'}`, `${row.c} ${row.unit} left, using about ${row.avg} a day — order now`, stock.sub.id);
    else if (row.daysLeft != null && row.daysLeft < 3) A(`${row.l} running low — about ${Math.round(row.daysLeft * 10) / 10} days left`, `${row.c} ${row.unit} left, using about ${row.avg} a day`, stock.sub.id);
    else if (row.low) A(`Low stock: ${row.l}`, `Only ${row.c} ${row.unit} left (minimum ${row.min})`, stock.sub.id);
  }

  // what staff wrote
  for (const s of rec) if (String(s.data.complaints || '').trim()) A('Guest complaint', s.data.complaints, s.id);
  for (const s of [...hk, ...sup]) if (String(s.data.issues || '').trim()) A(`Issue from ${nameOf(s)}`, s.data.issues, s.id);
  for (const s of byRole.manager || []) if (String(s.data.notes || '').trim()) A('Note from manager', s.data.notes, s.id);

  // paper vs form (after AI reading)
  for (const s of Object.values(latest)) {
    const mm = aiCompare(s);
    if (mm.length) R(`Paper ≠ form — ${nameOf(s)}`, mm.slice(0, 3).map(x => `${x.l}: form ${x.form}, paper ${x.paper}`).join(' · '), s.id);
  }

  // ---- cross-checks against the hotel CMS ----
  const cms = S.cms && S.cms.date === day.date ? S.cms : null;
  const cmsRows = [];
  if (cms) {
    const lastRec = recMain;
    const tol = cfg.money_tolerance;
    const row = (l, cmsV, staffV, kind, lvl) => {
      const fmt = kind === 'money' ? inr : (v => (v == null ? '—' : v));
      const diff = (cmsV != null && staffV != null) ? staffV - cmsV : null;
      const bad = diff != null && (kind === 'money' ? Math.abs(diff) > tol : diff !== 0);
      cmsRows.push({ l, cms: fmt(cmsV), staff: staffV == null ? '—' : fmt(staffV), bad, lvl });
      return bad ? diff : null;
    };
    const recCheckins = rec.length ? sumF(rec, 'checkins') : null;
    const dCheck = row('Check-ins', cms.checkIns, recCheckins, 'num', 'amber');
    if (dCheck != null) A('Check-ins differ from CMS', `CMS ${cms.checkIns}, reception wrote ${recCheckins}`, lastRec.id);
    const dOcc = row('Rooms occupied', cms.occupiedRooms, lastRec ? num(lastRec.data.occupied) : null, 'num', 'amber');
    if (dOcc != null) A('Occupancy differs from CMS', `CMS ${cms.occupiedRooms} occupied, reception wrote ${num(lastRec.data.occupied)}`, lastRec.id);
    const dCash = row('Cash', cms.cashSale, money.hasRec ? money.cash : null, 'money', 'red');
    if (dCash != null) R(`Cash differs from CMS by ${inr(Math.abs(dCash))}`, `CMS cash sale ${inr(cms.cashSale)}, reception wrote ${inr(money.cash)}`, lastRec && lastRec.id);
    const dOnline = row('UPI + card', cms.onlineSale, money.hasRec ? money.upi + money.card : null, 'money', 'red');
    if (dOnline != null) R(`UPI + card differs from CMS by ${inr(Math.abs(dOnline))}`, `CMS online sale ${inr(cms.onlineSale)}, reception wrote ${inr(money.upi + money.card)}`, lastRec && lastRec.id);
    row('OTA approved', cms.otaApproved, money.hasRec ? money.ota : null, 'money', 'amber');
    if (cms.otaPending > 0) A(`${inr(cms.otaPending)} OTA money waiting for approval in CMS`, `${cms.otaPendingCount || ''} booking(s) — approve in Front Desk Analytics`.trim());
    const kitS = (byRole.kitchen || []).length ? money.kitchen : null;
    const dFood = row('Kitchen / F&B', cms.foodRevenue, kitS, 'money', 'amber');
    if (dFood != null) A(`Kitchen sales differ from CMS by ${inr(Math.abs(dFood))}`, `CMS F&B ${inr(cms.foodRevenue)}, kitchen wrote ${inr(kitS)}`, (byRole.kitchen || [])[0] && byRole.kitchen[0].id);
    row('Expenses', cms.cashExpenses, money.hasRec ? money.recExp : null, 'money', 'amber');
    cmsRows.push({ l: 'Cash in hand — Finance Audit', cms: inr(cms.counterBalance), staff: '', bad: false });
    for (const it of (cms.lowStock || [])) {
      const out = it.quantity <= 0, key = /water|linen/i.test(it.category + ' ' + it.name);
      (out || key) ? U(out ? 'red' : 'red', `${out ? 'OUT of stock' : 'Low stock'}: ${it.name}`, `${it.quantity} ${it.unit} left in CMS stock (order below ${it.min})`)
                   : A(`Low stock: ${it.name}`, `${it.quantity} ${it.unit} left in CMS stock (order below ${it.min})`);
    }
    if (!cms.meterRecorded) (cms.meterMissedDays >= 2 ? R : A)(
      cms.meterMissedDays >= 2 ? `Electricity meter not recorded for ${cms.meterMissedDays + 1} days` : 'Electricity meter reading not entered today',
      cms.meterLastDate ? `Last reading in CMS: ${fmtDate(cms.meterLastDate)}` : 'Enter it in CMS Front Desk → Meter Readings');
    if (cms.roomStatus && hk.length) {
      const toKey = { Available: 'clean', Occupied: 'occupied', Dirty: 'dirty', Maintenance: 'blocked' };
      const off = [];
      for (const [r, st] of Object.entries(rooms.map)) {
        const c = toKey[cms.roomStatus[r]];
        if (c && c !== st) off.push(`${r} (CMS ${ROOM_STATES.find(x => x.k === c).l.toLowerCase()}, housekeeping ${ROOM_STATES.find(x => x.k === st).l.toLowerCase()})`);
      }
      if (off.length) A(off.length > 1 ? `${off.length} rooms differ from CMS status` : '1 room differs from CMS status', off.join(' · '), hk[0].id);
    }
  }

  // ---- room complaints logged for this day ----
  const compAll = S.comp || [];
  const acts = complaintActions(compAll);
  const comps = compAll.filter(c => c.date === day.date);
  const actTxt = (a) => a === 'fine' ? `${inr(cfg.penalty_amount)} fine` : a === 'warning' ? 'warning' : 'no action';
  for (const c of comps) {
    const a = acts[c.id] || {};
    const who = [];
    if (a.hk) who.push(`${staffName(c.hk_staff)}${c.hk_names ? ' (' + c.hk_names + ')' : ''}: ${actTxt(a.hk)}`);
    if (a.sup) who.push(`${staffName(c.sup_staff)}: ${actTxt(a.sup)}`);
    (c.status === 'waived' ? A : R)(`Room ${c.room}: ${TYPE_LABEL[c.type].toLowerCase()} complaint${c.status === 'waived' ? ' (waived)' : ''}`, [c.details, who.join(' · ')].filter(Boolean).join(' — '));
  }

  flags.sort((a, b) => (a.lvl === b.lvl ? 0 : a.lvl === 'red' ? -1 : 1));
  const att = staff.map(st => {
    const ss = subsOf(latest, st.id), s = ss[ss.length - 1], ov = (day.attendance || {})[st.id] || '';
    return { st, sub: s, subs: ss, ov, status: ov || (s ? 'P' : '') };
  });
  return { staff, latest, byRole, roles, flags, rooms, money, stock, att, beforeCutoff, cms, cmsRows, recDay, recNight, comps, acts };
}

// ================= views =================
function header() {
  return `<header class="top"><div class="top-l"><div class="brand">${esc(S.cfg.hotel_name)}</div>
    <div class="who">${esc(S.me.name)}${S.me.name !== ROLE_LABEL[S.me.role] ? ' · ' + ROLE_LABEL[S.me.role] : ''}${DEMO ? ' · <b>Demo</b>' : ''}</div></div>
    <div class="top-r">${S.me.role === 'admin' ? `<button class="icon-btn" data-act="refresh" aria-label="Refresh">↻</button>` : ''}
    <button class="link-btn light" data-act="logout">Log out</button></div></header>`;
}
function banner() {
  const off = !navigator.onLine;
  const q = S.queue.length;
  let h = '';
  if (off) h += `<div class="banner amber">You're offline. EOD forms will be saved on this phone and uploaded when internet is back.</div>`;
  if (q) h += `<div class="banner blue">${q} EOD form${q > 1 ? 's' : ''} waiting to upload ${off ? '' : '<button class="link-btn" data-act="sync">Upload now</button>'}</div>`;
  return h;
}
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (S.cfg && S.view !== 'form') render(); });
function installHint() {
  if (DEMO) return '';
  if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) return '';
  if (installEvt) return `<button class="btn block" data-act="install">Install app on this phone</button>`;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<p class="hint center">${ios ? 'To install: tap the Share button, then “Add to Home Screen”.' : 'To install: open the browser menu (⋮), then “Add to Home screen” or “Install app”.'}</p>`;
}

// ---------- login ----------
function renderLogin() {
  const groups = ['admin', ...ROLE_ORDER].map(r => ({ r, list: S.cfg.staff.filter(s => s.role === r) })).filter(g => g.list.length);
  let body;
  if (S.pick) {
    const s = staffById(S.pick);
    body = `<button class="back" data-act="unpick">‹ Back</button>
      <h1 class="h1">Hi, ${esc(s.name)}</h1><p class="muted">Enter your PIN</p>
      <form id="loginForm" class="pin-form"><input id="pin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="12" required aria-label="PIN">
      <button class="btn primary" type="submit">Log in</button></form><p class="err" id="loginErr"></p>`;
  } else {
    body = `<h1 class="h1">Who are you?</h1>` + groups.map(g => `<div class="grp-label">${ROLE_LABEL[g.r]}</div>
      <div class="staff-grid">${g.list.map(s => `<button class="staff-btn" data-act="pick" data-id="${esc(s.id)}">${esc(s.name)}</button>`).join('')}</div>`).join('');
  }
  app.innerHTML = `<header class="top"><div class="top-l"><div class="brand">${esc(S.cfg.hotel_name)}</div><div class="who">Daily Ops</div></div></header>
    <main class="wrap narrow">${banner()}${body}
    ${DEMO ? `<p class="hint demo-note">Demo with sample data — PIN for everyone is <b>1234</b>. Log in as <b>Owner</b> to see the dashboard, or as any staff member to fill an EOD.</p>` : ''}
    ${installHint()}</main>`;
  if (S.pick) { const p = document.getElementById('pin'); p && p.focus(); }
}

// ---------- staff home ----------
const isQueued = s => S.queue.some(q => q.client_id === s.client_id);
function myRecordHtml() {
  if (!['housekeeping', 'supervisor'].includes(S.me.role)) return '';
  const list = S.myComp || [];
  const acts = complaintActions(list);
  const since = addDays(today(), -(S.cfg.warning_window_days || 30));
  const mine = list.filter(c => c.date > since && (c.hk_staff === S.me.id || c.sup_staff === S.me.id));
  const myAct = c => (c.hk_staff === S.me.id ? acts[c.id].hk : acts[c.id].sup);
  const warns = mine.filter(c => myAct(c) === 'warning').length, fines = mine.filter(c => myAct(c) === 'fine').length;
  return `<section class="card ${fines ? 'rec-bad' : warns ? 'rec-warn' : 'rec-ok'}"><h2 class="h2">Your record — last ${S.cfg.warning_window_days || 30} days</h2>
    <div class="rec-nums"><div><b>${mine.length}</b><span>Complaints</span></div><div><b>${warns}</b><span>Warnings</span></div><div><b>${inr(fines * (S.cfg.penalty_amount || 500))}</b><span>Fines</span></div></div>
    <p class="muted sm">${fines ? 'Fines are cut from salary.' : warns ? 'One more cleaning or washroom complaint means a ' + inr(S.cfg.penalty_amount || 500) + ' fine.' : 'No complaints. Keep it up!'}</p>
    ${mine.slice().reverse().map(c => complaintCard(c, acts, false)).join('')}</section>`;
}
function renderStaffHome() {
  const t = today(), y = addDays(t, -1);
  const all = [...S.queue.filter(q => q.staff_id === S.me.id), ...S.mine.filter(m => !S.queue.some(q => q.client_id === m.client_id))]
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const doneOn = (d, sh) => all.find(s => s.date === d && (!sh || shiftOf(s) === sh));
  const canComplain = ['receptionist', 'supervisor', 'manager'].includes(S.me.role);
  const compBtn = canComplain ? `<button class="btn block" data-act="cnew">Report a room complaint (cleaning / washroom)</button>` : '';
  const recent = `<section class="card"><h2 class="h2">Your recent reports</h2>
      ${all.length ? `<ul class="plain">${all.slice(0, 8).map(s => `<li class="row-between"><span>${fmtDate(s.date)}${S.me.role === 'receptionist' ? ' · ' + shiftOf(s) : ''}</span><span class="muted sm">${fmtTime(s.created_at)} ${isQueued(s) ? '<span class="chip blue">Waiting to upload</span>' : s.verified ? '<span class="chip green">Verified</span>' : '<span class="chip grey">Sent</span>'}</span></li>`).join('')}</ul>` : '<p class="muted">Nothing yet.</p>'}
    </section>`;
  if (S.me.role === 'receptionist') {
    const nowHr = new Date().getHours();
    const nightDate = nowHr < 14 ? y : t; // before 2 PM, "night" means last night
    const dd = doneOn(t, 'Day'), dn = doneOn(nightDate, 'Night');
    const card = (title, sub, done, date, sh, primary) => `<section class="card hero ${done ? 'ok' : 'due'}">
      <div class="eyebrow">${title}</div>
      ${done ? `<div class="big">Submitted ✓</div><div class="muted">at ${fmtTime(done.created_at)}${isQueued(done) ? ' · waiting to upload' : ''}</div>` : `<div class="big">Not submitted yet</div><div class="muted">${sub}</div>`}
      <button class="btn ${done || !primary ? '' : 'primary'} block lg" data-act="fill" data-date="${date}" data-shift="${sh}">${done ? 'Submit a correction' : 'Fill ' + sh.toLowerCase() + ' shift report'}</button></section>`;
    const dayFirst = nowHr >= 14;
    const dayCard = card(`Day shift · ${fmtDate(t)}`, 'Morning to 8 PM — submit by 8:00 PM', dd, t, 'Day', dayFirst);
    const nightCard = card(`Night shift · ${fmtDate(nightDate)} 8 PM → morning`, 'Submit when your night duty ends', dn, nightDate, 'Night', !dayFirst);
    const only = S.me.shift; // 'Day' = Vishal Singh's login, 'Night' = shared Night Desk login
    const cards = only === 'Day' ? card(`Day shift · ${fmtDate(t)}`, 'Morning to 8 PM — submit by 8:00 PM', dd, t, 'Day', true)
      : only === 'Night' ? card(`Night shift · ${fmtDate(nightDate)} 8 PM → morning`, 'Submit when your night duty ends. Write your name in the form.', dn, nightDate, 'Night', true)
      : (dayFirst ? dayCard + nightCard : nightCard + dayCard);
    app.innerHTML = `${header()}<main class="wrap narrow">${banner()}${cards}${compBtn}${recent}${installHint()}</main>`;
    return;
  }
  const dt = doneOn(t), dy = doneOn(y);
  app.innerHTML = `${header()}<main class="wrap narrow">${banner()}
    <section class="card hero ${dt ? 'ok' : 'due'}">
      <div class="eyebrow">${fmtDate(t)} · Today</div>
      ${dt ? `<div class="big">EOD submitted ✓</div><div class="muted">at ${fmtTime(dt.created_at)}${isQueued(dt) ? ' · saved on phone, waiting to upload' : ''}</div>`
           : `<div class="big">EOD not submitted yet</div><div class="muted">Due by ${fmtHM(S.cfg.eod_cutoff)}</div>`}
      <button class="btn ${dt ? '' : 'primary'} block lg" data-act="fill" data-date="${t}">${dt ? 'Submit a correction' : "Fill today's EOD"}</button>
    </section>
    ${!dy ? `<section class="card row-between"><div><b>Yesterday · ${fmtDate(y)}</b><div class="muted sm">No EOD found</div></div><button class="btn" data-act="fill" data-date="${y}">Fill now</button></section>` : ''}
    ${compBtn}${myRecordHtml()}${recent}${installHint()}</main>`;
}

// ---------- staff form ----------
async function openForm(date, shift) {
  const key = `${S.me.id}|${date}${shift ? '|' + shift : ''}`;
  let d = null;
  try { d = await Store.getDraft(key); } catch (e) {}
  S.form = { key, date, data: (d && d.data) || {}, photos: (d && d.photos) || [], errors: [] };
  if (shift) S.form.data.shift = shift;
  if (S.me.role === 'receptionist' && S.form.data.cash_opening == null) {
    const lastCash = ls.get('lastCash_' + S.me.id);
    if (lastCash != null) S.form.data.cash_opening = String(lastCash);
  }
  if (S.me.role === 'kitchen' && !S.form.data.stock) {
    const last = ls.get('lastStock_' + S.me.id);
    if (last) S.form.data.stock = Object.fromEntries(Object.entries(last).map(([k, c]) => [k, { opening: c }]));
  }
  S.view = 'form'; render(); window.scrollTo(0, 0);
}
const saveDraft = debounce(() => { if (S.form) Store.setDraft(S.form.key, { data: S.form.data, photos: S.form.photos }).catch(() => {}); }, 400);

function cashCheckHtml() {
  const d = S.form.data;
  if (num(d.cash_opening) == null || num(d.cash_closing) == null) return '<span class="muted">Fill start and end cash to check the drawer.</span>';
  const exp = cashExpected(d), diff = num(d.cash_closing) - exp;
  if (Math.abs(diff) <= S.cfg.money_tolerance) return `<span class="ok">✓ Drawer matches — should be ${inr(exp)}, counted ${inr(d.cash_closing)}</span>`;
  return `<span class="bad">Drawer ${diff < 0 ? 'SHORT' : 'extra'} by ${inr(Math.abs(diff))} — should be ${inr(exp)}. Count again before submitting.</span>`;
}
const fieldVisible = f => !f.show_if || S.form.data[f.show_if[0]] === f.show_if[1];
function fieldHtml(f) {
  if (!fieldVisible(f)) return '';
  const secH = f.sec ? `<div class="sec-h">${esc(f.sec)}</div>` : '';
  return secH + fieldInner(f);
}
function fieldInner(f) {
  const v = S.form.data[f.k];
  if (f.t === 'cashcheck') return `<div class="field cashcheck" id="cashcheck">${cashCheckHtml()}</div>`;
  const err = S.form.errors.includes(f.k) ? ' has-err' : '';
  const lbl = `<label class="lbl" for="f_${f.k}">${esc(f.l)}${f.opt ? ' <span class="opt">optional</span>' : ''}</label>${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}`;
  switch (f.t) {
    case 'num': case 'money':
      return `<div class="field${err}">${lbl}<div class="inp ${f.t}">${f.t === 'money' ? '<span class="pre">₹</span>' : ''}<input id="f_${f.k}" data-k="${f.k}" type="number" inputmode="${f.t === 'money' ? 'decimal' : 'numeric'}" min="0" step="any" value="${esc(v ?? '')}"></div></div>`;
    case 'text':
      return `<div class="field${err}">${lbl}<textarea id="f_${f.k}" data-k="${f.k}" rows="2">${esc(v ?? '')}</textarea></div>`;
    case 'textline':
      return `<div class="field${err}">${lbl}<input class="txt" id="f_${f.k}" data-k="${f.k}" type="text" value="${esc(v ?? '')}"></div>`;
    case 'time':
      return `<div class="field${err}">${lbl}<div class="row-gap2"><input class="txt time" id="f_${f.k}" data-k="${f.k}" type="time" value="${esc(v ?? '')}">${v ? `<button type="button" class="link-btn" data-act="clearval" data-k="${f.k}">Clear</button>` : ''}</div></div>`;
    case 'yesno': case 'select': {
      const opts = f.t === 'yesno' ? [['yes', 'Yes'], ['no', 'No']] : f.opts.map(o => [o, o]);
      return `<div class="field${err}">${lbl}<div class="seg">${opts.map(([o, l]) => `<button type="button" class="seg-btn${v === o ? ' on v-' + o.toLowerCase() : ''}" data-act="set" data-k="${f.k}" data-v="${esc(o)}">${esc(l)}</button>`).join('')}</div></div>`;
    }
    case 'rooms': {
      const rv = S.form.data.rooms || {};
      return `<div class="field${err}"><div class="lbl">${esc(f.l)}</div><div class="hint">${esc(f.hint)}</div>
        <div class="rooms">${S.cfg.rooms.map(r => { const st = ROOM_STATES.find(x => x.k === rv[r]); return `<button type="button" class="room${st ? ' st-' + st.k : ''}" data-act="room" data-room="${esc(r)}"><span class="rn">${esc(r)}</span><span class="rs">${st ? st.l : '—'}</span></button>`; }).join('')}</div>
        <div class="row-gap"><button type="button" class="link-btn" data-act="roomsclear">Clear all</button></div></div>`;
    }
    case 'stock': {
      const sv = S.form.data.stock || {};
      return `<div class="field${err}"><div class="lbl">${esc(f.l)}</div><div class="hint">Opening + Received − Used should equal Closing.</div>
        <div class="stock">${S.cfg.stock_items.map(it => { const x = sv[it.k] || {}; return `<div class="st-row" data-item="${esc(it.k)}">
          <div class="st-name">${esc(it.l)} <span class="unit">${esc(it.unit)}</span></div>
          <div class="st-cells">${STOCK_COLS.map(([c, cl]) => `<label><span>${cl}</span><input type="number" inputmode="decimal" min="0" step="any" data-stock="${esc(it.k)}" data-col="${c}" value="${esc(x[c] ?? '')}"></label>`).join('')}</div>
          <div class="st-check">${stockHint(x)}</div></div>`; }).join('')}</div></div>`;
    }
  }
  return '';
}
function stockHint(x) {
  const o = num(x.opening), rc = num(x.received), u = num(x.used), c = num(x.closing);
  if ([o, rc, u, c].some(v => v == null)) return '';
  const exp = r2(o + rc - u);
  return exp === r2(c) ? '<span class="ok">✓ Adds up</span>' : `<span class="bad">Doesn't add up — should be ${exp}</span>`;
}
function renderForm() {
  const F = FORMS[S.me.role], f = S.form;
  app.innerHTML = `${header()}<main class="wrap narrow">${banner()}
    <button class="back" data-act="home">‹ Back</button>
    <h1 class="h1">${S.me.role === 'receptionist' ? `Reception · ${esc(f.data.shift || 'Day')} shift` : ROLE_LABEL[S.me.role] + ' EOD'}</h1>
    <p class="muted">${S.me.role === 'receptionist' ? (f.data.shift === 'Night' ? `Night of ${fmtDate(f.date)}, 8 PM → next morning` : `${fmtDate(f.date)}, morning → 8 PM`) : fmtDate(f.date) + (f.date !== today() ? ' (yesterday)' : '')} — copy the numbers from your paper tracker, then add its photo.</p>
    <form id="eodForm" novalidate>
      ${F.fields.map(fieldHtml).join('')}
      <div class="field${f.errors.includes('_photos') ? ' has-err' : ''}"><div class="lbl">${esc(F.photo)}</div>
        <div class="photos">${f.photos.map((p, i) => `<div class="ph"><img src="${p}" alt="Paper photo ${i + 1}"><button type="button" class="ph-x" data-act="rmphoto" data-i="${i}" aria-label="Remove photo">×</button></div>`).join('')}</div>
        ${f.photos.length < 4 ? `<div class="photo-btns"><label class="btn"><input type="file" accept="image/*" capture="environment" data-photo hidden>📷 Take photo</label><label class="btn"><input type="file" accept="image/*" multiple data-photo hidden>From gallery</label></div>` : ''}
        <div class="hint">Keep the whole page in the photo, in good light.</div>
      </div>
      ${f.errors.length ? `<p class="err">Please fill the items marked in red.</p>` : ''}
      <button class="btn primary block lg" type="submit" ${S.busy ? 'disabled' : ''}>${S.busy ? 'Submitting…' : 'Submit EOD'}</button>
    </form></main>`;
}
function validate() {
  const d = S.form.data, errs = [];
  for (const f of FORMS[S.me.role].fields) {
    if (f.opt || f.t === 'cashcheck' || !fieldVisible(f)) continue;
    if (f.t === 'rooms') { if (!Object.values(d.rooms || {}).some(Boolean)) errs.push(f.k); }
    else if (f.t === 'stock') { const v = d.stock || {}; if (S.cfg.stock_items.some(it => STOCK_COLS.some(([c]) => num((v[it.k] || {})[c]) == null))) errs.push(f.k); }
    else if (f.t === 'num' || f.t === 'money') { if (num(d[f.k]) == null) errs.push(f.k); }
    else if (d[f.k] == null || d[f.k] === '') errs.push(f.k);
  }
  if (!S.form.photos.length) errs.push('_photos');
  return errs;
}
async function compress(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const max = 1600, sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  } finally { URL.revokeObjectURL(url); }
}
async function submitForm() {
  if (S.busy) return;
  S.form.errors = validate();
  if (S.form.errors.length) { render(); const e = document.querySelector('.has-err'); e && e.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  S.busy = true; render();
  const sub = { client_id: uuid(), staff_id: S.me.id, role: S.me.role, date: S.form.date, data: S.form.data, photos: S.form.photos, created_at: new Date().toISOString() };
  let msg;
  try { await API.submit(sub); msg = 'EOD submitted. Thank you!'; }
  catch (e) {
    if (e instanceof NetErr) { await Store.enqueue(sub); msg = 'Saved on this phone. It will upload when internet is back.'; }
    else { S.busy = false; render(); toast(e.message, true); if (e.status === 401) logoutLocal(); return; }
  }
  if (S.me.role === 'receptionist' && num(sub.data.cash_closing) != null) ls.set('lastCash_' + S.me.id, num(sub.data.cash_closing));
  if (S.me.role === 'kitchen' && sub.data.stock) ls.set('lastStock_' + S.me.id, Object.fromEntries(Object.entries(sub.data.stock).map(([k, x]) => [k, x.closing])));
  Store.delDraft(S.form.key).catch(() => {});
  S.busy = false; S.form = null; S.view = 'home';
  await loadMine(); render(); window.scrollTo(0, 0); toast(msg);
}

// ---------- owner dashboard ----------
async function loadDay() {
  S.dayErr = null; render();
  const date = S.date;
  const cmsP = (S.cfg.cms_enabled && API.cms) ? API.cms(date).then(r => r.cms, e => { S.cmsErr = e.message; return null; }) : Promise.resolve(null);
  const extraP = Promise.all([
    API.complaints ? API.complaints(addDays(date, -45), date).then(r => r.complaints, () => []) : [],
    API.stockHistory ? API.stockHistory(date).then(r => r.history, () => null) : null,
  ]);
  try { [S.day, [S.comp, S.stockHist]] = await Promise.all([API.day(date), extraP]); }
  catch (e) { S.dayErr = e.message; if (e.status === 401) return logoutLocal(); }
  render();
  S.cmsErr = null;
  const c = await cmsP;
  if (S.date === date) { S.cms = c && c.date === date ? c : null; if (S.cms) S.cmsAt = Date.now(); render(); }
}
function renderDash() {
  const t = today();
  let body;
  if (!S.day || S.day.date !== S.date) body = S.dayErr ? `<div class="card err">${esc(S.dayErr)} <button class="link-btn" data-act="refresh">Try again</button></div>` : '<div class="card muted">Loading…</div>';
  else {
    const A = analyze(S.day);
    body = actNowHtml(A) + liveHtml(A) + inventoryHtml(A) + tilesHtml(A) + `<nav class="chips">${[...(S.cfg.cms_enabled && S.date === today() ? [['live', 'Live hotel'], ['inv', 'Room inventory']] : []), ['flags', 'Flags'], ...(S.cfg.cms_enabled ? [['hmoney', 'Hotel money'], ['cms', 'CMS check']] : []), ['comp', 'Complaints'], ['status', 'Daily status'], ['money', 'Money'], ['stock', 'Stock'], ['rooms', 'Rooms'], ['att', 'Attendance']].map(([k, l]) => `<a href="#sec-${k}">${l}</a>`).join('')}</nav>
      <div class="dash-grid">${flagsHtml(A)}${hotelMoneyHtml(A)}${cmsHtml(A)}${complaintsHtml(A)}${statusHtml(A)}${moneyHtml(A)}${stockHtml(A)}${roomsHtml(A)}${attHtml(A)}</div>`;
  }
  const lbl = S.date === t ? 'Today' : S.date === addDays(t, -1) ? 'Yesterday' : '';
  app.innerHTML = `${header()}<main class="wrap wide">${banner()}
    <div class="datebar"><button class="icon-btn" data-act="day" data-d="-1" aria-label="Previous day">‹</button>
      <label class="dt"><span class="dt-main">${fmtDate(S.date)}</span><span class="muted sm">${lbl || 'Change date'}</span><input type="date" data-datepick value="${S.date}" max="${t}"></label>
      <button class="icon-btn" data-act="day" data-d="1" ${S.date >= t ? 'disabled' : ''} aria-label="Next day">›</button>
      <button class="btn sm" data-act="month">Month</button></div>
    ${body}</main>`;
}
function tilesHtml(A) {
  const done = A.staff.filter(s => subsOf(A.latest, s.id).length).length, reds = A.flags.filter(f => f.lvl === 'red').length;
  const unv = Object.values(A.latest).filter(s => !s.verified).length;
  return `<div class="tiles">
    <a href="#sec-status" class="tile ${done < A.staff.length ? (A.beforeCutoff ? 'amber' : 'red') : 'green'}"><div class="tv">${done}/${A.staff.length}</div><div class="tl">EODs submitted</div></a>
    <a href="#sec-flags" class="tile ${reds ? 'red' : 'green'}"><div class="tv">${reds}</div><div class="tl">Red flags</div></a>
    ${A.cms && A.cms.finance ? `<a href="#sec-hmoney" class="tile"><div class="tv">${inr(A.cms.finance.totalIncome)}</div><div class="tl">Income (CMS Finance)</div></a>
    <a href="#sec-hmoney" class="tile ${A.cms.finance.pendingExpenseCount ? 'amber' : ''}"><div class="tv">${inr(A.cms.finance.totalExpense)}</div><div class="tl">Expenses (CMS Finance)</div></a>`
    : `<a href="#sec-money" class="tile ${A.money.diff != null && Math.abs(A.money.diff) > S.cfg.money_tolerance ? 'red' : ''}"><div class="tv">${inr(A.money.expected)}</div><div class="tl">Collection (staff EOD)</div></a>`}
    <a href="#sec-stock" class="tile ${A.stock.mismatches ? 'red' : ''}"><div class="tv">${A.stock.sub ? A.stock.mismatches : '—'}</div><div class="tl">Stock mismatches</div></a>
  </div>${unv ? `<p class="muted sm center">${unv} EOD${unv > 1 ? 's' : ''} not verified yet — open each one and check it against the paper photo.</p>` : ''}`;
}
const CMS_ROOM = { Available: ['clean', 'Ready'], Occupied: ['occupied', 'Occupied'], Dirty: ['dirty', 'Dirty'], Maintenance: ['blocked', 'Maintenance'] };
function liveHtml(A) {
  if (!S.cfg.cms_enabled || S.date !== today()) return '';
  const c = A.cms;
  if (!c) return `<section class="card live" id="sec-live"><h2 class="h2">Live hotel</h2><p class="muted">${S.cmsErr ? esc(S.cmsErr) : 'Connecting to the CMS…'}</p></section>`;
  const rs = c.roomStatus || {};
  const invRoom = {}; ((c.inventory && c.inventory.rooms) || []).forEach(x => { invRoom[String(x.room)] = x; });
  const rooms = [...S.cfg.rooms, ...Object.keys(rs).filter(r => !S.cfg.rooms.includes(r) && !/^test/i.test(r))];
  const counts = {};
  for (const r of rooms) { const k = (CMS_ROOM[rs[r]] || [null])[0] || 'other'; counts[k] = (counts[k] || 0) + 1; }
  const L = c.live || {};
  const ago = S.cmsAt ? Math.max(0, Math.round((Date.now() - S.cmsAt) / 1000)) : null;
  return `<section class="card live span2" id="sec-live">
    <div class="row-between"><h2 class="h2">Live hotel <span class="chip green">● live</span></h2><span class="muted sm">${ago == null ? '' : ago < 60 ? 'updated just now' : 'updated ' + Math.round(ago / 60) + ' min ago'} · every minute</span></div>
    <div class="tiles live-tiles">
      <div class="tile"><div class="tv">${L.inHouse ?? c.occupiedRooms ?? '—'}</div><div class="tl">In-house rooms</div></div>
      <div class="tile"><div class="tv">${L.checkIns ?? c.checkIns ?? '—'}</div><div class="tl">Check-ins today</div></div>
      <div class="tile"><div class="tv">${L.checkOuts ?? '—'}</div><div class="tl">Check-outs today</div></div>
      <div class="tile"><div class="tv">${L.available ?? c.vacantRooms ?? '—'}</div><div class="tl">Available</div></div>
    </div>
    <div class="legend" style="margin-top:12px"><span class="lg st-clean">${counts.clean || 0} Ready</span><span class="lg st-occupied">${counts.occupied || 0} Occupied</span><span class="lg st-dirty">${counts.dirty || 0} Dirty</span>${counts.blocked ? `<span class="lg st-blocked">${counts.blocked} Maintenance</span>` : ''}</div>
    <div class="rooms view">${rooms.map(r => { const m = CMS_ROOM[rs[r]]; const iv = invRoom[r]; const out = iv && iv.checkOut ? (iv.leavingToday ? 'leaves today' : 'till ' + fmtShort(iv.checkOut)) : ''; return `<div class="room${m ? ' st-' + m[0] : ''}"><span class="rn">${esc(r)}</span><span class="rs">${m ? m[1] : esc(rs[r] || '—')}</span>${out ? `<span class="rs">${esc(out)}</span>` : ''}</div>`; }).join('')}</div>
    <div class="row-between sm" style="margin-top:10px"><span class="muted">Today in CMS Finance: income ${inr(c.totalSale)} · expenses ${inr(c.cashExpenses)} · cash in hand ${inr(c.counterBalance)}</span><button class="link-btn" data-act="cmsnow">Refresh now</button></div>
  </section>`;
}
const fmtShort = d => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
function inventoryHtml(A) {
  if (!S.cfg.cms_enabled || S.date !== today()) return '';
  const inv = A.cms && A.cms.inventory;
  if (!inv) return A.cms ? `<section class="card span2" id="sec-inv"><h2 class="h2">Room inventory</h2><p class="muted">Room inventory not available from the CMS right now.</p></section>` : '';
  const types = inv.types || [], nights = inv.nights || [];
  const cell = (b, t) => { const free = Math.max(0, t - b); const cls = free === 0 ? 'inv-full' : free <= Math.ceil(t / 4) ? 'inv-low' : 'inv-ok'; return `<td class="r ${cls}"><b>${free}</b><span class="muted">/${t}</span></td>`; };
  return `<section class="card span2" id="sec-inv">
    <div class="row-between"><h2 class="h2">Room inventory</h2><span class="muted sm">from CMS bookings</span></div>
    <p class="sm">Today: <b>${inv.arrivalsToday ?? 0}</b> room(s) arriving · <b>${inv.departuresToday ?? 0}</b> leaving. Room-by-room status is in Live hotel above.</p>
    <p class="muted sm" style="margin:12px 0 6px">Free rooms per night (free / total). Red = sold out, amber = almost full.</p>
    <div class="tbl-scroll"><table class="tbl inv-tbl"><thead><tr><th>Night of</th>${types.map(t => `<th class="r">${esc(String(t.name).replace(/\s*room$/i, ''))}</th>`).join('')}<th class="r">All</th></tr></thead><tbody>
      ${nights.map(n => { let tb = 0, tt = 0; const cells = types.map(t => { const x = (n.byType || {})[t.id] || { booked: 0, total: t.total }; tb += x.booked; tt += x.total; return cell(x.booked, x.total); }).join('');
        return `<tr><td>${n.date === inv.today ? '<b>Tonight</b>' : esc(fmtShort(n.date))}</td>${cells}${cell(tb, tt)}</tr>`; }).join('')}
    </tbody></table></div>
  </section>`;
}
function hotelMoneyHtml(A) {
  if (!S.cfg.cms_enabled) return '';
  const f = A.cms && A.cms.finance;
  if (!f) return A.cms ? `<section class="card span2" id="sec-hmoney"><h2 class="h2">Hotel money</h2><p class="muted">Finance numbers not available from the CMS right now.</p></section>` : '';
  const cats = Object.entries(f.byCategory || {}).filter(([, v]) => v).sort((a, b) => b[1] - a[1]);
  const ex = f.expenses || [];
  return `<section class="card span2" id="sec-hmoney">
    <div class="row-between"><h2 class="h2">Hotel money <span class="chip green">same as CMS Finance Audit</span></h2></div>
    <div class="tiles live-tiles">
      <div class="tile"><div class="tv">${inr(f.totalIncome)}</div><div class="tl">Total income</div></div>
      <div class="tile"><div class="tv">${inr(f.totalExpense)}</div><div class="tl">Total expenses</div></div>
      <div class="tile"><div class="tv">${inr(f.totalIncome - f.totalExpense)}</div><div class="tl">Net for the day</div></div>
      <div class="tile"><div class="tv">${inr(f.closingCash)}</div><div class="tl">Cash in hand (end of day)</div></div>
    </div>
    <div class="hm-grid">
      <div><div class="grp-label">Income by payment</div><table class="tbl"><tbody>
        <tr><td>Cash</td><td class="r">${inr(f.cash)}</td></tr>
        <tr><td>UPI / online</td><td class="r">${inr(f.upi)}</td></tr>
        ${f.card ? `<tr><td>Card</td><td class="r">${inr(f.card)}</td></tr>` : ''}${f.bank ? `<tr><td>Bank transfer</td><td class="r">${inr(f.bank)}</td></tr>` : ''}
        <tr><td>OTA</td><td class="r">${inr(f.ota)}${f.otaPending ? ` <span class="chip amber">${inr(f.otaPending)} to approve</span>` : ''}</td></tr>
        <tr><td><b>Total</b></td><td class="r"><b>${inr(f.totalIncome)}</b></td></tr></tbody></table></div>
      <div><div class="grp-label">Income by type</div><table class="tbl"><tbody>
        ${cats.length ? cats.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="r">${inr(v)}</td></tr>`).join('') : '<tr><td class="muted">No income yet</td><td></td></tr>'}</tbody></table>
        <div class="grp-label" style="margin-top:10px">Cash drawer</div><table class="tbl"><tbody>
        <tr><td>Opening cash</td><td class="r">${inr(f.openingCash)}</td></tr>
        <tr><td>+ Cash income</td><td class="r">${inr(f.cash)}</td></tr>
        <tr><td>− Cash expenses</td><td class="r">${inr(f.cashExpense)}</td></tr>
        ${f.handover ? `<tr><td>− Given to ${esc(f.handover.to || 'owner')}${f.handover.at ? ` <span class="muted sm">${esc(fmtTime(f.handover.at))}</span>` : ''}</td><td class="r">${inr(f.handover.given)}</td></tr>
        <tr><td>Counted in drawer at handover</td><td class="r">${inr(f.handover.counted)}</td></tr>` : ''}
        <tr><td><b>Cash in hand</b></td><td class="r"><b>${inr(f.closingCash)}</b></td></tr></tbody></table>
        ${f.handover && f.handover.system != null && Math.abs(f.handover.system - f.handover.counted) >= 1 ? `<p class="muted sm">Software figure before the count was ${inr(f.handover.system)}; the counted cash is used from now on.</p>` : ''}</div>
    </div>
    <div class="grp-label" style="margin-top:12px">Expenses (${ex.length})${f.pendingExpenseCount ? ` · <span class="bad">${f.pendingExpenseCount} waiting for approval (${inr(f.pendingExpenseAmount)})</span>` : ''}</div>
    ${ex.length ? `<div class="tbl-scroll"><table class="tbl"><thead><tr><th>What</th><th>Paid by</th><th class="r">Amount</th></tr></thead><tbody>
      ${ex.map(e => `<tr${e.approved ? '' : ' class="warn"'}><td>${esc(e.category)}${e.description ? `<div class="muted sm">${esc(e.description)}</div>` : ''}</td><td class="sm">${esc(e.mode || '—')}${e.by ? `<div class="muted sm">${esc(e.by)}</div>` : ''}</td><td class="r">${inr(e.amount)}${e.approved ? '' : '<div class="sm bad">not approved</div>'}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="muted">No expenses entered in the CMS for this day.</p>'}
  </section>`;
}
function actNowHtml(A) {
  const u = A.flags.filter(f => f.urgent && f.lvl === 'red');
  if (!u.length) return '';
  return `<section class="actnow"><div class="actnow-h">⚠ Act now</div>${u.map(f => `<div class="actnow-i"${f.id ? ` data-act="open" data-id="${f.id}"` : ''}><b>${esc(f.title)}</b>${f.detail ? `<span>${esc(f.detail)}</span>` : ''}</div>`).join('')}</section>`;
}
function actionChip(a) {
  if (a === 'fine') return `<span class="chip red">${inr(S.cfg.penalty_amount)} fine</span>`;
  if (a === 'warning') return '<span class="chip amber">Warning</span>';
  return '<span class="chip grey">No action</span>';
}
function complaintCard(c, acts, owner) {
  const a = acts[c.id] || {};
  return `<div class="comp${c.status === 'waived' ? ' waived' : ''}">
    <div class="row-between"><b>Room ${esc(c.room)} · ${TYPE_LABEL[c.type] || esc(c.type)}</b><span class="muted sm">${fmtDate(c.date)}</span></div>
    ${c.details ? `<div class="sm">${esc(c.details)}</div>` : ''}
    <div class="comp-who"><span>Cleaned by: <b>${esc(staffName(c.hk_staff))}</b>${c.hk_names ? ` (${esc(c.hk_names)})` : ''}</span> ${actionChip(a.hk)}</div>
    <div class="comp-who"><span>Inspected by: <b>${esc(staffName(c.sup_staff))}</b></span> ${actionChip(a.sup)}</div>
    <div class="muted sm">Logged by ${esc(staffName(c.reported_by))}${c.source ? ' · ' + esc(c.source) : ''}${c.status === 'waived' ? ' · waived by owner' : ''}</div>
    ${owner ? `<button class="link-btn" data-act="cwaive" data-id="${c.id}" data-v="${c.status === 'waived' ? 'open' : 'waived'}">${c.status === 'waived' ? 'Undo waive' : 'Waive (no warning / fine)'}</button>` : ''}
  </div>`;
}
function complaintsHtml(A) {
  const pa = S.cfg.penalty_amount || 500, win = S.cfg.warning_window_days || 30;
  return `<section class="card" id="sec-comp"><div class="row-between"><h2 class="h2">Room complaints</h2><button class="btn sm" data-act="cnew">+ Log complaint</button></div>
    <p class="muted sm">Cleaning or washroom complaint → the person who cleaned the room and the supervisor who inspected it each get a warning the first time in ${win} days, then a ${inr(pa)} fine for every one after.</p>
    ${A.comps.length ? A.comps.map(c => complaintCard(c, A.acts, true)).join('') : '<p class="all-good">No room complaints logged for this day.</p>'}</section>`;
}
function flagsHtml(A) {
  return `<section class="card span2" id="sec-flags"><h2 class="h2">Needs attention</h2>${A.flags.length
    ? `<ul class="flags">${A.flags.map(f => `<li class="flag ${f.lvl}"${f.id ? ` data-act="open" data-id="${f.id}"` : ''}><span class="dot"></span><div class="fx"><div class="ft">${esc(f.title)}</div>${f.detail ? `<div class="fd">${esc(f.detail)}</div>` : ''}</div>${f.id ? '<span class="chev">›</span>' : ''}</li>`).join('')}</ul>`
    : '<p class="all-good">All clear — nothing flagged for this day.</p>'}</section>`;
}
function statusHtml(A) {
  const rowFor = (p, s, label) => {
    const late = s.received_at && (new Date(s.received_at) - new Date(s.created_at)) > 30 * 60000;
    return `<button class="srow" data-act="open" data-id="${s.id}"><img class="thumb" src="${esc(API.photoUrl(s.photos[0]))}" alt="" loading="lazy"><div class="sname">${esc(p.name)}${label ? ` · ${label}` : ''}<div class="muted sm">Filled ${fmtTime(s.created_at)}${late ? ' · uploaded later (offline)' : ''}</div></div><span class="chip ${s.verified ? 'green' : 'grey'}">${s.verified ? 'Verified' : 'To check'}</span><span class="chev">›</span></button>`;
  };
  return `<section class="card" id="sec-status"><h2 class="h2">Daily status</h2>${A.roles.map(r => `<div class="grp-label">${ROLE_LABEL[r]}</div>${A.staff.filter(s => s.role === r).map(p => {
    if (r === 'receptionist') {
      const ss = subsOf(A.latest, p.id);
      const day = ss.filter(x => shiftOf(x) === 'Day').slice(-1)[0], night = ss.filter(x => shiftOf(x) === 'Night').slice(-1)[0];
      const pend = (l, due) => `<div class="srow"><div class="thumb empty">—</div><div class="sname">${esc(p.name)} · ${l}<div class="muted sm">${due}</div></div><span class="chip amber">Pending</span></div>`;
      const nightLabel = n => 'Night shift' + (n.data && n.data.duty_name ? ` · by ${esc(n.data.duty_name)}` : '');
      const dayRow = day ? rowFor(p, day, 'Day shift') : pend('Day shift', 'Due by 8:00 PM');
      const nightRow = night ? rowFor(p, night, nightLabel(night)) : pend('Night shift', '8 PM → morning');
      return p.shift === 'Day' ? dayRow : p.shift === 'Night' ? nightRow : dayRow + nightRow;
    }
    const s = subsOf(A.latest, p.id).slice(-1)[0];
    if (!s) return `<div class="srow"><div class="thumb empty">—</div><div class="sname">${esc(p.name)}</div><span class="chip ${A.beforeCutoff ? 'amber' : 'red'}">${A.beforeCutoff ? 'Pending' : 'Not submitted'}</span></div>`;
    const late = s.received_at && (new Date(s.received_at) - new Date(s.created_at)) > 30 * 60000;
    return `<button class="srow" data-act="open" data-id="${s.id}"><img class="thumb" src="${esc(API.photoUrl(s.photos[0]))}" alt="" loading="lazy"><div class="sname">${esc(p.name)}<div class="muted sm">Filled ${fmtTime(s.created_at)}${late ? ' · uploaded later (offline)' : ''}</div></div><span class="chip ${s.verified ? 'green' : 'grey'}">${s.verified ? 'Verified' : 'To check'}</span><span class="chev">›</span></button>`;
  }).join('')}`).join('')}</section>`;
}
function moneyHtml(A) {
  const m = A.money, tol = S.cfg.money_tolerance, hasMgr = A.roles.includes('manager');
  if (!m.hasRec && !m.hasKit && m.mgr == null) return `<section class="card" id="sec-money"><h2 class="h2">Money summary</h2><p class="muted">No reception, kitchen or manager EOD yet.</p></section>`;
  const bad = m.diff != null && Math.abs(m.diff) > tol;
  const row = (l, v, cls = '') => `<tr class="${cls}"><td>${l}</td><td class="r">${v}</td></tr>`;
  const drawer = [['Day', A.recDay], ['Night', A.recNight]].filter(([, x]) => x && hasCashCount(x.data)).map(([l, x]) => {
    const d = x.data, exp = cashExpected(d), diff = num(d.cash_closing) - exp, badC = Math.abs(diff) > tol;
    return `<tr class="sum"><td colspan="2"><b>Cash drawer — ${l} shift</b></td></tr>${row('Start', inr(d.cash_opening))}${row('+ Received', inr(d.cash))}${row('− Paid out', inr(d.expenses))}${row('− Handed over', inr(d.cash_handover))}${row('Should be', inr(exp))}${row('Counted', inr(d.cash_closing), badC ? 'bad' : 'good')}${badC ? row(diff < 0 ? 'SHORT' : 'Extra', inr(Math.abs(diff)), 'bad') : ''}`;
  }).join('');
  return `<section class="card" id="sec-money"><h2 class="h2">Money summary</h2><table class="tbl">
    ${row('Cash', m.hasRec ? inr(m.cash) : '—')}${row('UPI', m.hasRec ? inr(m.upi) : '—')}${row('Card', m.hasRec ? inr(m.card) : '—')}${row('Online / OTA', m.hasRec ? inr(m.ota) : '—')}
    ${row('Kitchen sales', m.hasKit ? inr(m.kitchen) : '<span class="muted">not submitted</span>')}
    ${row('<b>Reception + kitchen</b>', `<b>${inr(m.expected)}</b>`, 'sum')}
    ${hasMgr ? row('Manager reported total', m.mgr != null ? inr(m.mgr) : '<span class="muted">not submitted</span>') : ''}
    ${hasMgr ? row('Difference', m.diff == null ? '—' : (m.diff === 0 ? '₹0 ✓' : (m.diff > 0 ? '+' : '−') + inr(Math.abs(m.diff)).slice(0)), bad ? 'bad' : m.diff != null ? 'good' : '') : ''}
    ${hasMgr ? row('Cash in hand at close', inr(m.cashInHand)) + row('Expenses (manager)', inr(m.mgrExp)) : ''}${row('Expenses paid at counter', m.hasRec ? inr(m.recExp) : '—')}${hasMgr ? row('Bank deposit', inr(m.deposit)) : ''}${drawer}
  </table>${bad ? `<p class="err sm">Difference is more than ${inr(tol)}. Check the reception register and the day-close sheet.</p>` : ''}</section>`;
}
function cmsHtml(A) {
  if (!S.cfg.cms_enabled) return '';
  if (!A.cms) return `<section class="card span2" id="sec-cms"><h2 class="h2">CMS check</h2><p class="muted">${S.cmsErr ? esc(S.cmsErr) : 'Reading the hotel CMS…'}</p></section>`;
  return `<section class="card span2" id="sec-cms"><h2 class="h2">CMS check <span class="chip green">live</span></h2>
    <p class="muted sm">Numbers from the hotel CMS next to what staff wrote today. Red rows don't match.</p>
    <div class="tbl-scroll"><table class="tbl"><thead><tr><th></th><th class="r">CMS</th><th class="r">Staff EOD</th></tr></thead><tbody>
    ${A.cmsRows.map(r => `<tr class="${r.bad ? (r.lvl === 'red' ? 'bad' : 'warn') : ''}"><td>${esc(r.l)}</td><td class="r">${r.cms}</td><td class="r">${r.staff}</td></tr>`).join('')}
    <tr><td>Electricity meter</td><td class="r">${A.cms.meterRecorded ? 'Entered ✓' : '<span class="bad">Not entered</span>'}</td><td></td></tr>
    </tbody></table></div></section>`;
}
function stockHtml(A) {
  const st = A.stock;
  if (!st.sub) return `<section class="card" id="sec-stock"><h2 class="h2">Kitchen stock</h2><p class="muted">Kitchen EOD not submitted.</p></section>`;
  const v = x => x == null ? '—' : x;
  return `<section class="card" id="sec-stock"><h2 class="h2">Kitchen stock</h2><div class="tbl-scroll"><table class="tbl stock-tbl">
    <thead><tr><th>Item</th><th>Open</th><th>In</th><th>Used</th><th>Close</th><th>Days left</th></tr></thead><tbody>
    ${st.rows.map(r => `<tr class="${r.mismatch ? 'bad' : (r.carry || r.low) ? 'warn' : ''}"><td>${esc(r.l)} <span class="unit">${esc(r.unit)}</span></td><td>${v(r.o)}${r.carry ? `<div class="sm">yday ${r.prev}</div>` : ''}</td><td>${v(r.rc)}</td><td>${v(r.u)}</td><td><b>${v(r.c)}</b>${r.mismatch ? `<div class="sm">should be ${r.exp}</div>` : ''}</td><td>${r.daysLeft != null ? `<b class="${r.daysLeft < 1.5 ? 'bad' : r.daysLeft < 3 ? '' : 'ok'}">${r.daysLeft < 0.5 ? '<1' : Math.round(r.daysLeft)}</b>` : (r.mismatch ? '✗' : r.low ? 'Low' : '✓')}</td></tr>`).join('')}
    </tbody></table></div></section>`;
}
function roomsHtml(A) {
  const R = A.rooms, hk = A.byRole.housekeeping || [];
  if (!hk.length) return `<section class="card" id="sec-rooms"><h2 class="h2">Room status</h2><p class="muted">Housekeeping EOD not submitted.</p></section>`;
  return `<section class="card" id="sec-rooms"><h2 class="h2">Room status</h2>
    <div class="legend"><span class="lg st-clean">${R.clean.length} Clean</span><span class="lg st-occupied">${R.occupied.length} Occupied</span><span class="lg st-dirty">${R.dirty.length} Dirty</span><span class="lg st-blocked">${R.blocked.length} Maintenance</span>${R.unset.length ? `<span class="lg">${R.unset.length} Not marked</span>` : ''}</div>
    <div class="rooms view">${S.cfg.rooms.map(r => { const st = ROOM_STATES.find(x => x.k === R.map[r]); const f = R.failed.includes(r); return `<div class="room${st ? ' st-' + st.k : ''}${f ? ' failed' : ''}"><span class="rn">${esc(r)}</span><span class="rs">${f ? 'Failed check' : st ? st.l : '—'}</span></div>`; }).join('')}</div></section>`;
}
function attHtml(A) {
  const opts = [['P', 'Present'], ['H', 'Half'], ['A', 'Absent'], ['L', 'Leave']];
  return `<section class="card span2" id="sec-att"><h2 class="h2">Attendance</h2><p class="muted sm">Submitting the EOD marks a person present. Tap to change; tap again to undo.</p>
    ${A.att.map(a => `<div class="att-row"><div class="sname">${esc(a.st.name)}<div class="muted sm">${ROLE_LABEL[a.st.role]} · ${a.sub ? 'EOD ' + fmtTime(a.sub.created_at) : 'No EOD'}${a.ov ? ' · set by you' : ''}</div></div>
      <div class="seg sm">${opts.map(([k, l]) => `<button class="seg-btn${a.status === k ? ' on att-' + k : ''}" data-act="att" data-staff="${esc(a.st.id)}" data-v="${k}" title="${l}">${k}</button>`).join('')}</div></div>`).join('')}</section>`;
}

// ---------- month attendance ----------
async function loadMonth() {
  S.monthData = null; render();
  try {
    const start = S.month + '-01', end = ymd(new Date(Number(S.month.slice(0, 4)), Number(S.month.slice(5, 7)), 0));
    const [md, comp] = await Promise.all([API.month(S.month), API.complaints ? API.complaints(addDays(start, -(S.cfg.warning_window_days || 30) - 1), end).then(r => r.complaints, () => []) : []]);
    S.monthData = md; S.monthComp = comp;
  } catch (e) { toast(e.message, true); }
  render();
}
function renderMonth() {
  const [y, mo] = S.month.split('-').map(Number), days = new Date(y, mo, 0).getDate(), t = today();
  const staff = S.cfg.staff.filter(s => s.role !== 'admin');
  const title = new Date(y, mo - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  let body = '<div class="card muted">Loading…</div>';
  if (S.monthData) {
    const subs = new Set(S.monthData.subs.map(s => s.staff_id + '|' + s.date));
    const ov = {}; for (const a of S.monthData.attendance) ov[a.staff_id + '|' + a.date] = a.status;
    const dates = Array.from({ length: days }, (_, i) => `${S.month}-${pad(i + 1)}`);
    body = `<section class="card"><div class="tbl-scroll"><table class="month"><thead><tr><th class="sticky">Staff</th>${dates.map(d => `<th class="${d === t ? 'today' : ''}">${Number(d.slice(8))}</th>`).join('')}<th>Days</th><th>Leave</th><th>No EOD</th><th>Warnings</th><th>Fines</th></tr></thead><tbody>
      ${staff.map(s => { let p = 0, l = 0, miss = 0; const cells = dates.map(d => {
          const k = s.id + '|' + d; let v = ov[k] || (subs.has(k) ? 'P' : '');
          if (d > t) return '<td></td>';
          if (v === 'P') p++; else if (v === 'H') p += 0.5; else if (v === 'L') l++;
          if (!subs.has(k) && d < t) miss++;
          if (!v && d < t) v = '–';
          return `<td class="m-${v === '–' ? 'x' : v}">${v}</td>`; }).join('');
        const mc = (S.monthComp || []).filter(c => c.date.startsWith(S.month));
        const ac = complaintActions(S.monthComp || []);
        let w = 0, fn = 0;
        for (const c of mc) { const a = ac[c.id] || {}; for (const [who, fld] of [['hk', 'hk_staff'], ['sup', 'sup_staff']]) if (c[fld] === s.id) { if (a[who] === 'warning') w++; if (a[who] === 'fine') fn++; } }
        return `<tr><td class="sticky">${esc(s.name)}</td>${cells}<td><b>${p}</b></td><td>${l}</td><td>${miss}</td><td>${w || ''}</td><td class="${fn ? 'm-A' : ''}">${fn ? inr(fn * (S.cfg.penalty_amount || 500)) : ''}</td></tr>`; }).join('')}
      </tbody></table></div>
      <p class="muted sm">P present · H half day · A absent · L leave · – no EOD and not marked. Days = P + half of H. Fines = ${inr(S.cfg.penalty_amount || 500)} for each room complaint after the first warning — cut from salary. Change any day from the daily dashboard.</p></section>`;
  }
  app.innerHTML = `${header()}<main class="wrap wide">
    <button class="back" data-act="dash">‹ Dashboard</button>
    <div class="datebar"><button class="icon-btn" data-act="mon" data-d="-1">‹</button><div class="dt"><span class="dt-main">${title}</span></div><button class="icon-btn" data-act="mon" data-d="1" ${S.month >= t.slice(0, 7) ? 'disabled' : ''}>›</button></div>
    ${body}</main>`;
}

// ---------- detail sheet ----------
function findSub(id) { return S.day ? [...S.day.subs, ...(S.day.prev || [])].find(s => String(s.id) === String(id)) : null; }
function valHtml(f, s, mm) {
  const v = s.data[f.k];
  const m = mm.filter(x => x.k === f.k);
  let shown;
  if (f.t === 'rooms') {
    const rv = v || {}; const by = k => Object.keys(rv).filter(r => rv[r] === k);
    shown = ROOM_STATES.map(st => { const l = by(st.k); return l.length ? `<div><b>${st.l}:</b> ${esc(l.join(', '))}</div>` : ''; }).join('') || '—';
  } else if (f.t === 'stock') {
    const sv = v || {};
    shown = `<table class="mini"><tr><th></th><th>Open</th><th>In</th><th>Used</th><th>Close</th></tr>${S.cfg.stock_items.map(it => { const x = sv[it.k] || {}; return `<tr><td>${esc(it.l)}</td>${STOCK_COLS.map(([c]) => `<td>${esc(x[c] ?? '—')}</td>`).join('')}</tr>`; }).join('')}</table>`;
  } else {
    const cls = (f.t === 'yesno' && v === 'no') || (f.k === 'tank_level' && (v === 'Low' || v === 'Empty')) ? 'neg' : '';
    shown = `<span class="${cls}">${esc(fmtVal(f, v))}</span>`;
  }
  return `<tr class="${m.length ? 'mm' : ''}"><th>${esc(f.l)}</th><td>${shown}${m.map(x => `<div class="paper-says">Paper says ${f.t === 'stock' ? esc(x.l) + ' ' : ''}<b>${esc(x.paper)}</b></div>`).join('')}</td></tr>`;
}
function aiHtml(s, mm) {
  if (s.ai && s.ai.values) {
    const note = s.ai.demo ? ' <span class="muted sm">(demo — simulated reading)</span>' : '';
    return mm.length
      ? `<div class="ai bad"><b>Paper and form don't match on ${mm.length} item${mm.length > 1 ? 's' : ''}.</b>${note}<br><span class="sm">Rows in red below show what the paper says.</span></div>`
      : `<div class="ai good"><b>AI read the paper — it matches the form ✓</b>${note}</div>`;
  }
  if (S.cfg.ai_enabled) return `<button class="btn block" data-act="ai" data-id="${s.id}" ${S.aiBusy ? 'disabled' : ''}>${S.aiBusy ? 'Reading the paper…' : '🔍 Read the paper with AI and cross-check'}</button>`;
  return `<p class="muted sm">Check the photo against the numbers below. (AI cross-checking can be switched on in config.php.)</p>`;
}
function renderModal() {
  let el = document.getElementById('modal');
  const s = S.open && findSub(S.open);
  if (!s) { if (el) el.remove(); document.body.classList.remove('noscroll'); return; }
  if (!el) { el = document.createElement('div'); el.id = 'modal'; document.body.appendChild(el); el.addEventListener('click', onClick); }
  document.body.classList.add('noscroll');
  const mm = aiCompare(s);
  const late = s.received_at && (new Date(s.received_at) - new Date(s.created_at)) > 30 * 60000;
  el.innerHTML = `<div class="sheet-bg" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="EOD details">
    <div class="sheet-head"><div><div class="h2">${esc(nameOf(s))} · ${ROLE_LABEL[s.role]}</div><div class="muted sm">${fmtDate(s.date)} · filled ${fmtTime(s.created_at)}${late ? ` · uploaded ${fmtTime(s.received_at)}` : ''}</div></div>
      <button class="icon-btn" data-act="close" aria-label="Close">✕</button></div>
    <div class="sheet-body">
      <div class="photos big">${s.photos.map(p => `<img src="${esc(API.photoUrl(p))}" data-act="zoom" data-src="${esc(API.photoUrl(p))}" alt="Paper sheet">`).join('')}</div>
      <div class="hint center">Tap the photo to zoom</div>
      ${aiHtml(s, mm)}
      <table class="kv">${(FORMS[s.role] ? FORMS[s.role].fields : []).filter(f => f.t !== 'cashcheck' && (!f.show_if || s.data[f.show_if[0]] === f.show_if[1])).map(f => valHtml(f, s, mm)).join('')}</table>
    </div>
    <div class="sheet-foot"><button class="btn ${s.verified ? '' : 'primary'} block" data-act="verify" data-id="${s.id}">${s.verified ? 'Verified ✓ — tap to undo' : 'Checked against paper — mark verified'}</button></div>
  </div>${S.zoom ? `<div class="zoom" data-act="unzoom"><img src="${esc(S.zoom)}" alt=""></div>` : ''}`;
}

function renderComplaintForm() {
  const c = S.cform, t = today(), y = addDays(t, -1);
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button type="button" class="seg-btn${c[k] === v ? ' on' : ''}" data-act="cset" data-k="${k}" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>`;
  app.innerHTML = `${header()}<main class="wrap narrow">
    <button class="back" data-act="cback">‹ Back</button>
    <h1 class="h1">Room complaint</h1>
    <p class="muted">Log every guest complaint about cleaning or the washroom. The app finds who cleaned and who inspected the room.</p>
    <div class="field"><div class="lbl">When</div>${seg('date', [[t, 'Today'], [y, 'Yesterday']])}</div>
    <div class="field"><div class="lbl">Room</div><div class="rooms">${S.cfg.rooms.map(r => `<button type="button" class="room${c.room === r ? ' st-dirty' : ''}" data-act="cset" data-k="room" data-v="${esc(r)}"><span class="rn">${esc(r)}</span></button>`).join('')}</div></div>
    <div class="field"><div class="lbl">What is the complaint about?</div>${seg('type', [['cleaning', 'Room cleaning'], ['washroom', 'Washroom'], ['other', 'Other']])}
      <div class="hint">"Other" (AC, TV, noise…) is recorded without a warning or fine.</div></div>
    <div class="field"><div class="lbl">How did the guest tell us? <span class="opt">optional</span></div>${seg('source', [['At front desk', 'At desk'], ['Phone call', 'Phone'], ['Online review', 'Online review'], ['Inspection', 'Inspection']])}</div>
    <div class="field"><label class="lbl" for="cdet">What exactly was the problem? <span class="opt">optional</span></label><textarea id="cdet" data-ck="details" rows="3">${esc(c.details)}</textarea></div>
    ${c.err ? `<p class="err">${esc(c.err)}</p>` : ''}
    <button class="btn primary block lg" data-act="csubmit" ${c.busy ? 'disabled' : ''}>${c.busy ? 'Saving…' : 'Log complaint'}</button>
  </main>`;
}

// ================= routing + events =================
function render() {
  if (!S.cfg) return;
  if (!S.me) renderLogin();
  else if (S.view === 'complaint' && S.cform) renderComplaintForm();
  else if (S.me.role === 'admin') (S.view === 'month' ? renderMonth : renderDash)();
  else if (S.view === 'form' && S.form) renderForm();
  else renderStaffHome();
  renderModal();
}
async function loadMine() {
  try { S.mine = (await API.mine()).subs; ls.set('mine_' + S.me.id, S.mine); }
  catch (e) { S.mine = ls.get('mine_' + S.me.id) || S.mine; if (e.status === 401) logoutLocal(); }
  S.queue = await Store.queued().catch(() => []);
  if (API.complaints && ['housekeeping', 'supervisor'].includes(S.me.role)) {
    try { S.myComp = (await API.complaints()).complaints; } catch (e) {}
  }
}
function logoutLocal() { S.me = null; S.pick = null; S.view = 'home'; S.day = null; S.open = null; ls.del('me'); render(); }
async function afterLogin() {
  ls.set('me', S.me);
  if (S.me.role === 'admin') { S.view = 'dash'; S.date = today(); loadDay(); }
  else { S.view = 'home'; await loadMine(); render(); }
  sync();
}
let syncing = false;
async function sync() {
  if (syncing || DEMO) return;
  syncing = true;
  try {
    const q = await Store.queued();
    let sent = 0;
    for (const s of q) {
      try { await ServerAPI.submit(s); await Store.dequeue(s.client_id); sent++; }
      catch (e) { if (e instanceof NetErr || e.status === 401) break; }
    }
    S.queue = await Store.queued();
    if (sent) { toast(`${sent} saved EOD${sent > 1 ? 's' : ''} uploaded`); if (S.me && S.me.role !== 'admin') await loadMine(); if (S.view !== 'form') render(); }
  } catch (e) {} finally { syncing = false; }
}
window.addEventListener('online', () => { sync(); if (S.view !== 'form') render(); });
window.addEventListener('offline', () => { if (S.view !== 'form') render(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.me && S.me.role === 'admin' && S.view === 'dash' && !S.open) loadDay(); });

// Live refresh: CMS every minute, staff reports every 3 minutes, while the owner dashboard is open.
async function refreshCms() {
  if (!S.cfg || !S.cfg.cms_enabled || !API.cms) return;
  const date = S.date;
  try { const r = await API.cms(date); if (S.date === date && r.cms) { S.cms = r.cms; S.cmsAt = Date.now(); S.cmsErr = null; } }
  catch (e) { S.cmsErr = e.message; }
  if (S.view === 'dash' && !S.open && !isTyping()) render();
}
const isTyping = () => { const a = document.activeElement; return a && ['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName); };
let tick = 0;
setInterval(() => {
  if (!S.me || S.me.role !== 'admin' || S.view !== 'dash' || document.visibilityState !== 'visible' || S.date !== today()) return;
  tick++;
  if (tick % 3 === 0 && !S.open && !isTyping()) loadDay(); else refreshCms();
}, 60000);

const ACT = {
  cmsnow: () => refreshCms(),
  pick: t => { S.pick = t.dataset.id; render(); },
  unpick: () => { S.pick = null; render(); },
  logout: async () => { try { await API.logout(); } catch (e) {} logoutLocal(); },
  fill: t => openForm(t.dataset.date, t.dataset.shift),
  clearval: t => { if (S.form) { delete S.form.data[t.dataset.k]; saveDraft(); render(); } },
  cnew: () => { S.cform = { date: today(), room: '', type: '', source: '', details: '', busy: false, err: '' }; S.prevView = S.view; S.view = 'complaint'; S.open = null; render(); window.scrollTo(0, 0); },
  cback: () => { S.view = S.prevView || (S.me.role === 'admin' ? 'dash' : 'home'); S.cform = null; render(); },
  cset: t => { S.cform[t.dataset.k] = t.dataset.v; S.cform.err = ''; render(); },
  csubmit: async () => {
    const c = S.cform; if (c.busy) return;
    if (!c.room || !c.type) { c.err = 'Pick the room and the type of complaint.'; return render(); }
    c.busy = true; render();
    try {
      await API.complaintAdd({ date: c.date, room: c.room, type: c.type, source: c.source, details: c.details });
      toast('Complaint logged');
      S.cform = null; S.view = S.prevView || (S.me.role === 'admin' ? 'dash' : 'home');
      if (S.me.role === 'admin') { S.date = c.date; loadDay(); } else { await loadMine(); render(); }
    } catch (e) { c.busy = false; c.err = e instanceof NetErr ? 'No internet — complaints need internet to save.' : e.message; render(); }
  },
  cwaive: async t => {
    try { await API.complaintStatus(Number(t.dataset.id), t.dataset.v); const c = (S.comp || []).find(x => String(x.id) === t.dataset.id); if (c) c.status = t.dataset.v; render(); toast(t.dataset.v === 'waived' ? 'Waived — no warning or fine for this one' : 'Waive undone'); }
    catch (e) { toast(e.message, true); }
  },
  home: () => { S.view = 'home'; S.form = null; render(); },
  set: t => { const k = t.dataset.k; S.form.data[k] = t.dataset.v; S.form.errors = S.form.errors.filter(e => e !== k); saveDraft(); render(); },
  room: t => {
    const r = t.dataset.room, rv = S.form.data.rooms = S.form.data.rooms || {};
    const i = ROOM_STATES.findIndex(x => x.k === rv[r]);
    rv[r] = ROOM_STATES[(i + 1) % ROOM_STATES.length].k;
    S.form.errors = S.form.errors.filter(e => e !== 'rooms'); saveDraft(); render();
  },
  roomsclear: () => { S.form.data.rooms = {}; saveDraft(); render(); },
  rmphoto: t => { S.form.photos.splice(Number(t.dataset.i), 1); saveDraft(); render(); },
  sync: () => sync(),
  install: async () => { if (!installEvt) return; installEvt.prompt(); try { await installEvt.userChoice; } catch (e) {} installEvt = null; render(); },
  refresh: () => (S.view === 'month' ? loadMonth() : loadDay()),
  day: t => { const n = addDays(S.date, Number(t.dataset.d)); if (n > today()) return; S.date = n; S.day = null; loadDay(); },
  month: () => { S.view = 'month'; S.month = S.date.slice(0, 7); loadMonth(); },
  mon: t => { const [y, m] = S.month.split('-').map(Number); const d = new Date(y, m - 1 + Number(t.dataset.d), 1); S.month = ymd(d).slice(0, 7); loadMonth(); },
  dash: () => { S.view = 'dash'; render(); window.scrollTo(0, 0); },
  open: t => { S.open = t.dataset.id; S.zoom = null; renderModal(); },
  close: () => { S.open = null; S.zoom = null; renderModal(); },
  zoom: t => { S.zoom = t.dataset.src; renderModal(); },
  unzoom: () => { S.zoom = null; renderModal(); },
  verify: async t => {
    const s = findSub(t.dataset.id); if (!s) return;
    const v = !s.verified;
    try { await API.verify(s.id, v); s.verified = v ? 1 : 0; render(); toast(v ? 'Marked verified' : 'Verification removed'); }
    catch (e) { toast(e.message, true); }
  },
  att: async t => {
    const sid = t.dataset.staff, cur = (S.day.attendance || {})[sid] || '';
    let v = t.dataset.v;
    const auto = latestPerStaff(S.day.subs)[sid] ? 'P' : '';
    if (cur === v || (!cur && auto === v)) v = cur === v ? '' : v;
    try {
      await API.attendance(S.date, sid, v);
      S.day.attendance = { ...(S.day.attendance || {}) }; if (v) S.day.attendance[sid] = v; else delete S.day.attendance[sid];
      render();
    } catch (e) { toast(e.message, true); }
  },
  ai: async t => {
    const s = findSub(t.dataset.id); if (!s || S.aiBusy) return;
    S.aiBusy = true; renderModal();
    try {
      const fields = FORMS[s.role].fields.filter(f => ['num', 'money', 'yesno', 'select', 'stock'].includes(f.t)).map(f => ({ k: f.k, l: f.l, t: f.t }));
      const r = await API.aiRead(s.id, fields); s.ai = r.ai;
      const mm = aiCompare(s); toast(mm.length ? `${mm.length} difference${mm.length > 1 ? 's' : ''} found` : 'Paper matches the form');
    } catch (e) { toast(e.message, true); }
    S.aiBusy = false; render();
  },
};
function onClick(e) {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const fn = ACT[t.dataset.act];
  if (fn) { e.preventDefault(); fn(t, e); }
}
app.addEventListener('click', onClick);
app.addEventListener('submit', async e => {
  e.preventDefault();
  if (e.target.id === 'loginForm') {
    const pin = document.getElementById('pin').value.trim(), errEl = document.getElementById('loginErr');
    const btn = e.target.querySelector('button'); btn.disabled = true;
    try { S.me = (await API.login(S.pick, pin)).me; S.pick = null; await afterLogin(); }
    catch (err) { errEl.textContent = err instanceof NetErr ? 'No internet. You need internet to log in the first time.' : err.message; btn.disabled = false; }
  } else if (e.target.id === 'eodForm') submitForm();
});
app.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.ck && S.cform) { S.cform[t.dataset.ck] = t.value; return; }
  if (!S.form) return;
  if (t.dataset.k) {
    S.form.data[t.dataset.k] = t.value; saveDraft();
    const cc = document.getElementById('cashcheck'); if (cc && /^cash/.test(t.dataset.k) || (cc && ['expenses'].includes(t.dataset.k))) cc.innerHTML = cashCheckHtml();
    if (t.value !== '') { S.form.errors = S.form.errors.filter(x => x !== t.dataset.k); const f = t.closest('.field'); f && f.classList.remove('has-err'); }
  }
  else if (t.dataset.stock) {
    const st = S.form.data.stock = S.form.data.stock || {};
    const row = st[t.dataset.stock] = st[t.dataset.stock] || {};
    row[t.dataset.col] = t.value;
    const chk = t.closest('.st-row').querySelector('.st-check'); chk.innerHTML = stockHint(row);
    saveDraft();
  }
});
app.addEventListener('change', async e => {
  const t = e.target;
  if (t.hasAttribute('data-photo') && S.form) {
    const files = [...t.files].slice(0, 4 - S.form.photos.length);
    for (const f of files) { try { S.form.photos.push(await compress(f)); } catch (err) { toast('Could not read that photo', true); } }
    S.form.errors = S.form.errors.filter(x => x !== '_photos'); saveDraft(); render();
  } else if (S.form && t.dataset.k && t.type === 'time') {
    S.form.data[t.dataset.k] = t.value; S.form.errors = S.form.errors.filter(x => x !== t.dataset.k); saveDraft();
  } else if (t.hasAttribute('data-datepick') && t.value) {
    S.date = t.value > today() ? today() : t.value; S.day = null; loadDay();
  }
});

// ================= start =================
async function boot() {
  try { S.cfg = (await API.config()).config; }
  catch (e) { app.innerHTML = `<div class="boot">Could not load the app. ${esc(e.message)}<br><br><button class="btn" onclick="location.reload()">Try again</button></div>`; return; }
  document.title = `${S.cfg.hotel_name} · Daily Ops`;
  try { S.me = (await API.me()).me; if (S.me) ls.set('me', S.me); else ls.del('me'); }
  catch (e) { S.me = e instanceof NetErr ? ls.get('me') : null; }
  S.queue = await Store.queued().catch(() => []);
  if (S.me) await afterLogin(); else render();
}
if (!DEMO && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
boot();
})();
