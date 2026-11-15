import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import config from '../../config';
import { X, Utensils, Plus, Minus, Printer, Search, Trash2, ChefHat, Receipt } from 'lucide-react';

// Food Bill for a guest: pick menu items (or type any item), save to the room bill
// or mark paid now, print the kitchen ticket (KOT) and a separate food bill.
const API = config.API_URL;
const inr = n => '₹' + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-IN');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDT = d => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '';
const guestName = b => `${b?.guestDetails?.firstName || ''} ${b?.guestDetails?.lastName || ''}`.trim() || 'Guest';
const roomOf = b => b?.roomUnit?.roomNumber || '';

const isFood = c => c && (c.source === 'F&B' || /food|f&b|kitchen|restaurant|meal|breakfast|lunch|dinner/i.test(c.description || ''));

const printWindow = (title, body, width = '80mm') => {
  const w = window.open('', '_blank', 'width=420,height=640');
  if (!w) { alert('Please allow pop-ups to print.'); return; }
  w.document.write(`<!DOCTYPE html><html><head><title>${esc(title)}</title><style>
    @page { size: ${width} auto; margin: 4mm; }
    body { font-family: Arial, Helvetica, sans-serif; color:#000; margin:0; padding:6px; width:${width}; max-width:100%; font-size:12px; }
    h1 { font-size:16px; margin:0; text-align:center; } .c { text-align:center; } .sm { font-size:11px; }
    .big { font-size:15px; font-weight:bold; } hr { border:0; border-top:1px dashed #000; margin:6px 0; }
    table { width:100%; border-collapse:collapse; } td, th { padding:2px 0; vertical-align:top; } th { text-align:left; border-bottom:1px solid #000; font-size:11px; }
    .r { text-align:right; } .q { width:28px; } .tot td { font-weight:bold; border-top:1px solid #000; padding-top:4px; }
    .kotq { font-size:15px; font-weight:bold; }
  </style></head><body>${body}<script>window.onload=function(){window.print();setTimeout(function(){window.close()},400)}<\/script></body></html>`);
  w.document.close();
};

export const printKOT = (booking, order) => {
  const lines = (order.items && order.items.length ? order.items : [{ name: order.description, qty: 1 }])
    .map(i => `<tr><td class="q kotq">${esc(i.qty)}</td><td class="kotq">${esc(i.name)}</td></tr>`).join('');
  printWindow(order.kotNo || 'KOT', `
    <h1>KITCHEN ORDER (KOT)</h1>
    <p class="c big">${esc(order.kotNo || '')}</p>
    <p class="c">Room <b class="big">${esc(roomOf(booking) || '—')}</b> · ${esc(guestName(booking))}</p>
    <p class="c sm">${esc(fmtDT(order.date))}${order.staff ? ' · ' + esc(order.staff) : ''}</p><hr>
    <table><tr><th class="q">Qty</th><th>Item</th></tr>${lines}</table>
    ${order.notes ? `<hr><p><b>Note:</b> ${esc(order.notes)}</p>` : ''}<hr><p class="c sm">Kitchen copy — no prices</p>`);
};

export const printFoodBill = (booking, orders) => {
  if (!orders.length) { alert('No food orders for this guest yet.'); return; }
  let total = 0, paid = 0;
  const blocks = orders.map(o => {
    total += Number(o.amount) || 0;
    if (o.paidMode) paid += Number(o.amount) || 0;
    const items = o.items && o.items.length ? o.items : [{ name: o.description || 'Food & beverage', qty: 1, rate: o.amount }];
    return `<tr><td colspan="4" class="sm" style="padding-top:6px"><b>${esc(o.kotNo || 'Order')}</b> · ${esc(fmtDT(o.date))}${o.paidMode ? ' · Paid (' + esc(o.paidMode) + ')' : ''}</td></tr>` +
      items.map(i => `<tr><td>${esc(i.name)}</td><td class="r">${esc(i.qty)}</td><td class="r">${inr(i.rate)}</td><td class="r">${inr((Number(i.qty) || 0) * (Number(i.rate) || 0))}</td></tr>`).join('');
  }).join('');
  const due = total - paid;
  printWindow('Food Bill - ' + guestName(booking), `
    <h1>HOTEL BHOPAL INN</h1><p class="c sm">Food Bill</p><hr>
    <table class="sm"><tr><td>Guest: <b>${esc(guestName(booking))}</b></td><td class="r">Room: <b>${esc(roomOf(booking) || '—')}</b></td></tr>
    <tr><td>Ref: BK-${esc(String(booking._id || '').slice(-6).toUpperCase())}</td><td class="r">${esc(new Date().toLocaleDateString('en-IN'))}</td></tr></table><hr>
    <table><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr>${blocks}
    <tr class="tot"><td colspan="3">Food total</td><td class="r">${inr(total)}</td></tr>
    ${paid ? `<tr><td colspan="3">Paid at order time</td><td class="r">${inr(paid)}</td></tr>` : ''}
    <tr><td colspan="3"><b>${due > 0 ? 'Added to room bill' : 'Balance'}</b></td><td class="r"><b>${inr(due)}</b></td></tr></table>
    <hr><p class="c sm">Thank you! Please visit again.</p>`);
};

// All food orders on a booking, newest last
export const foodOrdersOf = booking => (booking?.financials?.extraCharges || []).filter(isFood)
  .map(c => ({ ...c })).sort((a, b) => new Date(a.date) - new Date(b.date));

const FoodBill = ({ bookings = [], initialBookingId = '', onClose, onSaved }) => {
  const inHouse = useMemo(() => bookings.filter(b => b.status === 'Checked-In'), [bookings]);
  const [bookingId, setBookingId] = useState(initialBookingId || (inHouse[0] && inHouse[0]._id) || '');
  const [booking, setBooking] = useState(() => bookings.find(b => b._id === (initialBookingId || (inHouse[0] && inHouse[0]._id))) || null);
  const [menu, setMenu] = useState([]);
  const [cats, setCats] = useState([]);
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [cart, setCart] = useState([]); // {key, name, qty, rate}
  const [custom, setCustom] = useState({ name: '', rate: '', qty: 1 });
  const [notes, setNotes] = useState('');
  const [payMode, setPayMode] = useState('Cash');
  const [printKot, setPrintKot] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [tab, setTab] = useState('new');

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/menu/items`).catch(() => ({ data: [] })),
      axios.get(`${API}/api/menu/categories`).catch(() => ({ data: [] }))
    ]).then(([i, c]) => { setMenu(Array.isArray(i.data) ? i.data : []); setCats(Array.isArray(c.data) ? c.data : []); });
  }, []);

  useEffect(() => { setBooking(bookings.find(b => b._id === bookingId) || null); }, [bookingId, bookings]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return menu.filter(m => (cat === 'All' || (m.category?._id || m.category) === cat) && (!s || (m.name || '').toLowerCase().includes(s))).slice(0, 80);
  }, [menu, cat, q]);

  const add = (name, rate, key) => setCart(c => {
    const k = key || 'x_' + name.toLowerCase();
    const f = c.find(x => x.key === k);
    if (f) return c.map(x => x.key === k ? { ...x, qty: x.qty + 1 } : x);
    return [...c, { key: k, name, qty: 1, rate: rate === null || rate === undefined || rate === '' ? '' : Number(rate) }];
  });
  const setLine = (k, patch) => setCart(c => c.map(x => x.key === k ? { ...x, ...patch } : x).filter(x => x.qty > 0));
  const addCustom = () => {
    const name = custom.name.trim();
    if (!name) return setMsg({ bad: true, t: 'Type the item name.' });
    if (!(Number(custom.rate) >= 0) || custom.rate === '') return setMsg({ bad: true, t: 'Type the rate for this item.' });
    setCart(c => [...c, { key: 'c_' + Date.now(), name, qty: Math.max(1, Number(custom.qty) || 1), rate: Number(custom.rate) }]);
    setCustom({ name: '', rate: '', qty: 1 }); setMsg(null);
  };

  const total = cart.reduce((s, x) => s + (Number(x.qty) || 0) * (Number(x.rate) || 0), 0);
  const missingRate = cart.some(x => x.rate === '' || isNaN(Number(x.rate)));
  const orders = foodOrdersOf(booking);
  const foodTotal = orders.reduce((s, o) => s + (Number(o.amount) || 0), 0);

  const save = async (paidNow) => {
    if (!booking) return setMsg({ bad: true, t: 'Pick the guest / room first.' });
    if (!cart.length) return setMsg({ bad: true, t: 'Add at least one item.' });
    if (missingRate) return setMsg({ bad: true, t: 'Some items have no rate. Type the rate in the red box.' });
    if (paidNow && !window.confirm(`Guest paid ${inr(total)} now by ${payMode}?`)) return;
    setBusy(true); setMsg(null);
    try {
      const r = await axios.post(`${API}/api/bookings/${booking._id}/food-order`, {
        items: cart.map(x => ({ name: x.name, qty: Number(x.qty), rate: Number(x.rate) })),
        notes, paidNow: paidNow ? { mode: payMode } : null
      });
      const updated = r.data.booking;
      const order = foodOrdersOf(updated).find(o => o.kotNo === r.data.kotNo);
      if (printKot && order) printKOT(updated, order);
      setBooking(updated); setCart([]); setNotes('');
      setMsg({ bad: false, t: `${r.data.kotNo} saved · ${inr(r.data.amount)} ${paidNow ? 'paid by ' + payMode : 'added to room bill'}.` });
      onSaved && onSaved(updated);
    } catch (e) {
      setMsg({ bad: true, t: e.response?.data?.message || 'Could not save the food order.' });
    } finally { setBusy(false); }
  };

  const chip = (active) => `px-3 py-1.5 text-xs font-bold whitespace-nowrap border ${active ? 'bg-[#1A2B48] text-white border-[#1A2B48]' : 'bg-white text-slate-600 border-slate-200'}`;

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-3xl h-[94vh] sm:h-[88vh] flex flex-col rounded-t-xl sm:rounded-sm shadow-2xl border-t-4 border-amber-500" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-black text-[#1A2B48] uppercase flex items-center gap-2"><Utensils size={18} className="text-amber-600" /> Food Bill</h3>
            {initialBookingId && booking ? (
              <p className="text-sm text-slate-600 font-semibold truncate">Room {roomOf(booking) || '—'} · {guestName(booking)}</p>
            ) : (
              <select value={bookingId} onChange={e => setBookingId(e.target.value)} className="mt-1 border-2 border-slate-200 p-2 text-sm font-semibold w-full max-w-xs">
                {!inHouse.length && <option value="">No guest is checked in</option>}
                {inHouse.map(b => <option key={b._id} value={b._id}>Room {roomOf(b) || '—'} · {guestName(b)}</option>)}
              </select>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1"><X /></button>
        </div>

        <div className="flex border-b text-xs font-black uppercase">
          <button onClick={() => setTab('new')} className={`flex-1 py-3 ${tab === 'new' ? 'border-b-4 border-amber-500 text-[#1A2B48]' : 'text-slate-400'}`}>New order</button>
          <button onClick={() => setTab('list')} className={`flex-1 py-3 ${tab === 'list' ? 'border-b-4 border-amber-500 text-[#1A2B48]' : 'text-slate-400'}`}>This guest's food ({orders.length}) · {inr(foodTotal)}</button>
        </div>

        {tab === 'new' ? (
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
            {/* Menu */}
            <div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search menu… e.g. paneer, tea" className="w-full border-2 border-slate-200 pl-9 p-2.5 text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div className="flex gap-1.5 overflow-x-auto mt-2 pb-1">
                <button className={chip(cat === 'All')} onClick={() => setCat('All')}>All</button>
                {cats.map(c => <button key={c._id} className={chip(cat === c._id)} onClick={() => setCat(c._id)}>{c.name}</button>)}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 max-h-56 overflow-y-auto">
                {shown.map(m => (
                  <button key={m._id} onClick={() => add(m.name, m.cost, m._id)} className="text-left border border-slate-200 p-2 hover:border-amber-500 hover:bg-amber-50 active:scale-[.98]">
                    <span className="block text-xs font-bold text-slate-800 leading-tight">{m.name}</span>
                    <span className="text-xs text-slate-500">{m.cost ? inr(m.cost) : 'rate not set'}</span>
                  </button>
                ))}
                {!shown.length && <p className="text-sm text-slate-400 col-span-full">{menu.length ? 'No item matches.' : 'Menu not loaded — add items by hand below.'}</p>}
              </div>
            </div>

            {/* Item not on menu */}
            <div className="bg-slate-50 border border-slate-200 p-3">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Item not on the menu</p>
              <div className="flex gap-2 flex-wrap">
                <input value={custom.name} onChange={e => setCustom({ ...custom, name: e.target.value })} placeholder="Item name" className="flex-1 min-w-[140px] border p-2 text-sm" />
                <input value={custom.rate} onChange={e => setCustom({ ...custom, rate: e.target.value })} placeholder="Rate ₹" inputMode="decimal" className="w-24 border p-2 text-sm" />
                <input value={custom.qty} onChange={e => setCustom({ ...custom, qty: e.target.value })} placeholder="Qty" inputMode="numeric" className="w-16 border p-2 text-sm" />
                <button onClick={addCustom} className="bg-[#1A2B48] text-white px-3 text-xs font-black uppercase flex items-center gap-1"><Plus size={14} /> Add</button>
              </div>
            </div>

            {/* Cart */}
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500 mb-1">This order</p>
              {!cart.length ? <p className="text-sm text-slate-400">Tap menu items above to add them.</p> : (
                <div className="divide-y border">
                  {cart.map(x => (
                    <div key={x.key} className="flex items-center gap-2 p-2">
                      <span className="flex-1 text-sm font-semibold text-slate-800 min-w-0 truncate">{x.name}</span>
                      <div className="flex items-center border">
                        <button onClick={() => setLine(x.key, { qty: x.qty - 1 })} className="p-1.5" aria-label="Less"><Minus size={14} /></button>
                        <span className="w-6 text-center text-sm font-bold">{x.qty}</span>
                        <button onClick={() => setLine(x.key, { qty: x.qty + 1 })} className="p-1.5" aria-label="More"><Plus size={14} /></button>
                      </div>
                      <input value={x.rate} onChange={e => setLine(x.key, { rate: e.target.value })} inputMode="decimal" placeholder="Rate"
                        className={`w-20 border p-1.5 text-sm text-right ${x.rate === '' ? 'border-rose-500 bg-rose-50' : ''}`} />
                      <span className="w-20 text-right text-sm font-bold">{inr((Number(x.qty) || 0) * (Number(x.rate) || 0))}</span>
                      <button onClick={() => setLine(x.key, { qty: 0 })} className="p-1 text-rose-500" aria-label="Remove"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <div className="flex justify-between p-2 bg-amber-50 font-black text-[#1A2B48]"><span>Total</span><span>{inr(total)}</span></div>
                </div>
              )}
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Note for kitchen (optional) — e.g. less spicy" className="w-full border p-2 text-sm mt-2" />
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mt-2">
                <input type="checkbox" checked={printKot} onChange={e => setPrintKot(e.target.checked)} /> <ChefHat size={16} /> Print KOT for the kitchen when saved
              </label>
            </div>
            {msg && <p className={`text-sm font-bold ${msg.bad ? 'text-rose-600' : 'text-emerald-700'}`}>{msg.t}</p>}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overscroll-contain p-4">
            {!orders.length ? <p className="text-sm text-slate-400">No food orders for this guest yet.</p> : (
              <div className="space-y-2">
                {orders.map((o, i) => (
                  <div key={o._id || i} className="border p-3">
                    <div className="flex justify-between gap-2">
                      <span className="text-xs font-black text-[#1A2B48]">{o.kotNo || 'Older entry'} <span className="text-slate-400 font-semibold">· {fmtDT(o.date)}</span></span>
                      <span className="text-sm font-black">{inr(o.amount)}</span>
                    </div>
                    <p className="text-sm text-slate-700 mt-1">{o.items && o.items.length ? o.items.map(it => `${it.name} ×${it.qty}`).join(', ') : o.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 ${o.paidMode ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{o.paidMode ? `Paid · ${o.paidMode}` : 'On room bill'}</span>
                      <button onClick={() => printKOT(booking, o)} className="text-xs font-bold text-[#1A2B48] flex items-center gap-1"><Printer size={13} /> KOT</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {msg && <p className={`text-sm font-bold mt-3 ${msg.bad ? 'text-rose-600' : 'text-emerald-700'}`}>{msg.t}</p>}
          </div>
        )}

        {/* Footer actions */}
        <div className="border-t p-3 space-y-2 bg-white">
          {tab === 'new' ? (
            <>
              <button disabled={busy || !cart.length} onClick={() => save(false)} className="w-full bg-[#1A2B48] text-white py-3.5 font-black uppercase text-xs disabled:opacity-50">
                {busy ? 'Saving…' : `Add ${inr(total)} to room bill`}
              </button>
              <div className="flex gap-2">
                <select value={payMode} onChange={e => setPayMode(e.target.value)} className="border-2 border-slate-200 px-2 text-sm font-semibold">
                  <option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option>
                </select>
                <button disabled={busy || !cart.length} onClick={() => save(true)} className="flex-1 bg-emerald-600 text-white py-3 font-black uppercase text-xs disabled:opacity-50">Paid now</button>
              </div>
            </>
          ) : (
            <button disabled={!orders.length} onClick={() => printFoodBill(booking, orders)} className="w-full bg-indigo-600 text-white py-3.5 font-black uppercase text-xs flex items-center justify-center gap-2 disabled:opacity-50">
              <Receipt size={16} /> Print food bill · {inr(foodTotal)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodBill;
