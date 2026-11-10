import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import config from '../../config';
import { Package, Plus, Minus, Search, X, History, AlertTriangle, ClipboardCheck } from 'lucide-react';

const API_BASE = config.API_URL;
const CATEGORIES = ['Water', 'Linen', 'Beverages', 'Toiletries', 'Kitchen', 'Glasses & Crockery', 'Housekeeping', 'Other'];
const ACTIONS = {
  received: { label: 'Received', hint: 'New stock came in — how many?', color: 'bg-emerald-600', sign: '+' },
  used: { label: 'Used / Sold', hint: 'How many were used or sold?', color: 'bg-[#1A2B48]', sign: '−' },
  damaged: { label: 'Damaged', hint: 'How many are damaged or thrown away?', color: 'bg-rose-600', sign: '−' },
  count: { label: 'Set count', hint: 'Counted physically — how many are there right now?', color: 'bg-amber-600', sign: '=' },
};

const statusOf = (it) => (it.quantity <= 0 ? 'out' : it.quantity <= (it.minQuantity || 0) ? 'low' : 'ok');
const timeAgo = (d) => {
  if (!d) return '';
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} day(s) ago`;
};

const StockInventory = ({ isSuperAdmin }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [category, setCategory] = useState('All');
  const [action, setAction] = useState(null); // { item, type }
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'Water', unit: 'pcs', quantity: '', minQuantity: '' });
  const [history, setHistory] = useState(null); // { item, rows }
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/stock`);
      setItems(res.data || []);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load stock');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const low = items.filter(i => statusOf(i) !== 'ok');
  const cats = useMemo(() => ['All', ...Array.from(new Set(items.map(i => i.category || 'Other')))], [items]);
  const shown = items.filter(i => {
    if (onlyLow && statusOf(i) === 'ok') return false;
    if (category !== 'All' && (i.category || 'Other') !== category) return false;
    const q = query.trim().toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q);
  });
  const grouped = shown.reduce((g, i) => { (g[i.category || 'Other'] = g[i.category || 'Other'] || []).push(i); return g; }, {});

  const openAction = (item, type) => { setAction({ item, type }); setQty(type === 'count' ? String(item.quantity) : ''); setNote(''); };
  const saveAction = async () => {
    if (busy) return;
    const n = Number(qty);
    if (!Number.isFinite(n) || n < 0 || (action.type !== 'count' && n === 0)) { alert('Enter a number'); return; }
    setBusy(true);
    try {
      const res = await axios.post(`${API_BASE}/api/stock/${action.item._id}/move`, { type: action.type, quantity: n, note });
      setItems(prev => prev.map(i => (i._id === res.data._id ? res.data : i)));
      setAction(null);
    } catch (e) { alert(e.response?.data?.message || 'Could not save'); }
    finally { setBusy(false); }
  };

  const saveNew = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await axios.post(`${API_BASE}/api/stock`, newItem);
      setAdding(false);
      setNewItem({ name: '', category: newItem.category, unit: 'pcs', quantity: '', minQuantity: '' });
      load();
    } catch (err) { alert(err.response?.data?.message || 'Could not add item'); }
    finally { setBusy(false); }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await axios.put(`${API_BASE}/api/stock/${editing._id}`, { name: editing.name, category: editing.category, unit: editing.unit, minQuantity: editing.minQuantity });
      setEditing(null); load();
    } catch (err) { alert(err.response?.data?.message || 'Could not save'); }
    finally { setBusy(false); }
  };
  const removeItem = async () => {
    if (!window.confirm(`Remove "${editing.name}" from the stock list?`)) return;
    try { await axios.delete(`${API_BASE}/api/stock/${editing._id}`); setEditing(null); load(); }
    catch (err) { alert(err.response?.data?.message || 'Could not remove'); }
  };

  const openHistory = async (item) => {
    setHistory({ item, rows: null });
    try { const res = await axios.get(`${API_BASE}/api/stock/${item._id}/history`); setHistory({ item, rows: res.data }); }
    catch (e) { setHistory({ item, rows: [] }); }
  };

  const seed = async () => {
    setBusy(true);
    try { await axios.post(`${API_BASE}/api/stock/seed`); load(); }
    catch (e) { alert(e.response?.data?.message || 'Could not load starter list'); }
    finally { setBusy(false); }
  };

  const inputCls = 'w-full border-2 border-slate-200 p-3 text-base font-semibold focus:outline-none focus:border-[#1A2B48] bg-white';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif text-[#1A2B48] flex items-center gap-2"><Package size={26} /> Stock Inventory</h2>
          <p className="text-sm text-slate-500">Tap a button on an item to update it. Red = out of stock, orange = running low.</p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className="bg-[#1A2B48] text-white px-4 py-3 text-xs font-black uppercase flex items-center gap-2"><Plus size={16} /> Add new item</button>
      </div>

      {low.length > 0 && (
        <button type="button" onClick={() => { setOnlyLow(true); setCategory('All'); }} className="w-full text-left bg-rose-600 text-white p-4 rounded-sm shadow">
          <div className="font-black uppercase text-sm flex items-center gap-2"><AlertTriangle size={18} /> {low.length} item{low.length > 1 ? 's' : ''} need ordering</div>
          <div className="text-sm opacity-90 mt-1">{low.slice(0, 6).map(i => `${i.name} (${i.quantity} ${i.unit})`).join(' · ')}{low.length > 6 ? ' …' : ''}</div>
        </button>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex items-center gap-2 border-2 border-slate-200 bg-white px-3">
          <Search size={16} className="text-slate-400" />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search item…" className="flex-1 py-3 text-base focus:outline-none" aria-label="Search stock items" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {cats.map(c => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={`whitespace-nowrap px-3 py-2 text-xs font-black uppercase border-2 ${category === c ? 'bg-[#1A2B48] text-white border-[#1A2B48]' : 'bg-white text-slate-600 border-slate-200'}`}>{c}</button>
          ))}
          <button type="button" onClick={() => setOnlyLow(v => !v)} className={`whitespace-nowrap px-3 py-2 text-xs font-black uppercase border-2 ${onlyLow ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-rose-600 border-rose-200'}`}>Low only</button>
        </div>
      </div>

      {loading ? <p className="text-slate-500">Loading…</p> : error ? <p className="text-rose-600 font-bold">{error}</p> : items.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-300 p-6 text-center space-y-3">
          <p className="font-bold text-slate-700">No stock items yet.</p>
          <button type="button" disabled={busy} onClick={seed} className="bg-emerald-600 text-white px-5 py-3 text-xs font-black uppercase">Load starter list (water, beverages, linen)</button>
          <p className="text-xs text-slate-500">Or add your own items with “Add new item”.</p>
        </div>
      ) : shown.length === 0 ? <p className="text-slate-500">Nothing matches.</p> : (
        Object.entries(grouped).map(([cat, list]) => (
          <section key={cat}>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">{cat}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {list.map(it => {
                const st = statusOf(it);
                return (
                  <div key={it._id} className={`bg-white border-2 p-3 rounded-sm ${st === 'out' ? 'border-rose-500' : st === 'low' ? 'border-amber-400' : 'border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <button type="button" onClick={() => setEditing({ ...it })} className="text-left">
                        <div className="font-black text-[#1A2B48] leading-tight">{it.name}</div>
                        <div className="text-[11px] text-slate-400">Order below {it.minQuantity} · updated {timeAgo(it.lastUpdatedAt)}{it.lastUpdatedBy ? ` by ${it.lastUpdatedBy}` : ''}</div>
                      </button>
                      <div className="text-right shrink-0">
                        <div className={`text-3xl font-black leading-none ${st === 'out' ? 'text-rose-600' : st === 'low' ? 'text-amber-600' : 'text-emerald-700'}`}>{it.quantity}</div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">{it.unit}</div>
                      </div>
                    </div>
                    {st !== 'ok' && <div className={`mt-2 text-[11px] font-black uppercase ${st === 'out' ? 'text-rose-600' : 'text-amber-600'}`}>{st === 'out' ? 'Out of stock — order now' : 'Running low — order soon'}</div>}
                    <div className="grid grid-cols-4 gap-1.5 mt-3">
                      <button type="button" onClick={() => openAction(it, 'received')} className="bg-emerald-600 text-white py-2.5 text-[11px] font-black uppercase flex items-center justify-center gap-1"><Plus size={14} />In</button>
                      <button type="button" onClick={() => openAction(it, 'used')} className="bg-[#1A2B48] text-white py-2.5 text-[11px] font-black uppercase flex items-center justify-center gap-1"><Minus size={14} />Used</button>
                      <button type="button" onClick={() => openAction(it, 'count')} className="bg-amber-500 text-white py-2.5 text-[11px] font-black uppercase flex items-center justify-center gap-1"><ClipboardCheck size={14} />Count</button>
                      <button type="button" onClick={() => openHistory(it)} className="bg-slate-100 text-slate-700 py-2.5 text-[11px] font-black uppercase flex items-center justify-center gap-1" aria-label="History"><History size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      {/* Update quantity sheet */}
      {action && (
        <div className="fixed inset-0 z-[130] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setAction(null)}>
          <div className="bg-white w-full sm:max-w-md p-5 space-y-4 rounded-t-xl sm:rounded-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <div className={`inline-block text-white text-[10px] font-black uppercase px-2 py-1 ${ACTIONS[action.type].color}`}>{ACTIONS[action.type].label}</div>
                <h3 className="text-xl font-black text-[#1A2B48] mt-2">{action.item.name}</h3>
                <p className="text-sm text-slate-500">Now: {action.item.quantity} {action.item.unit}</p>
              </div>
              <button type="button" onClick={() => setAction(null)} aria-label="Close"><X /></button>
            </div>
            <label className="block text-sm font-bold text-slate-700">{ACTIONS[action.type].hint}</label>
            <input autoFocus type="number" inputMode="numeric" min="0" value={qty} onChange={e => setQty(e.target.value)} className={inputCls + ' text-2xl'} />
            {action.type !== 'count' && qty !== '' && Number(qty) > 0 && (
              <p className="text-sm font-bold text-slate-600">New count will be: {action.type === 'received' ? action.item.quantity + Number(qty) : Math.max(0, action.item.quantity - Number(qty))} {action.item.unit}</p>
            )}
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional) — e.g. supplier, room no." className={inputCls} />
            <button type="button" disabled={busy} onClick={saveAction} className={`w-full text-white py-4 font-black uppercase text-sm ${ACTIONS[action.type].color}`}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      )}

      {/* Add item */}
      {adding && (
        <div className="fixed inset-0 z-[130] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setAdding(false)}>
          <form className="bg-white w-full sm:max-w-md p-5 space-y-3 rounded-t-xl sm:rounded-sm" onClick={e => e.stopPropagation()} onSubmit={saveNew}>
            <div className="flex justify-between items-center"><h3 className="text-xl font-black text-[#1A2B48]">Add new item</h3><button type="button" onClick={() => setAdding(false)} aria-label="Close"><X /></button></div>
            <input required value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name — e.g. Shampoo sachet" className={inputCls} />
            <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} className={inputCls}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-[10px] font-black uppercase text-slate-400">Count now</label><input type="number" min="0" inputMode="numeric" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: e.target.value })} className={inputCls} /></div>
              <div><label className="text-[10px] font-black uppercase text-slate-400">Order below</label><input type="number" min="0" inputMode="numeric" value={newItem.minQuantity} onChange={e => setNewItem({ ...newItem, minQuantity: e.target.value })} className={inputCls} /></div>
              <div><label className="text-[10px] font-black uppercase text-slate-400">Unit</label><input value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} className={inputCls} /></div>
            </div>
            <button type="submit" disabled={busy} className="w-full bg-[#1A2B48] text-white py-4 font-black uppercase text-sm">{busy ? 'Saving…' : 'Add item'}</button>
          </form>
        </div>
      )}

      {/* Edit item */}
      {editing && (
        <div className="fixed inset-0 z-[130] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setEditing(null)}>
          <form className="bg-white w-full sm:max-w-md p-5 space-y-3 rounded-t-xl sm:rounded-sm" onClick={e => e.stopPropagation()} onSubmit={saveEdit}>
            <div className="flex justify-between items-center"><h3 className="text-xl font-black text-[#1A2B48]">Edit item</h3><button type="button" onClick={() => setEditing(null)} aria-label="Close"><X /></button></div>
            <input required value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className={inputCls} />
            <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} className={inputCls}>{Array.from(new Set([...CATEGORIES, editing.category])).map(c => <option key={c}>{c}</option>)}</select>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px] font-black uppercase text-slate-400">Order below</label><input type="number" min="0" value={editing.minQuantity} onChange={e => setEditing({ ...editing, minQuantity: e.target.value })} className={inputCls} /></div>
              <div><label className="text-[10px] font-black uppercase text-slate-400">Unit</label><input value={editing.unit} onChange={e => setEditing({ ...editing, unit: e.target.value })} className={inputCls} /></div>
            </div>
            <p className="text-xs text-slate-500">To change the count, use the In / Used / Count buttons so it’s recorded in history.</p>
            <button type="submit" disabled={busy} className="w-full bg-[#1A2B48] text-white py-4 font-black uppercase text-sm">Save</button>
            {isSuperAdmin && <button type="button" onClick={removeItem} className="w-full text-rose-600 py-2 text-xs font-black uppercase">Remove item from list</button>}
          </form>
        </div>
      )}

      {/* History */}
      {history && (
        <div className="fixed inset-0 z-[130] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setHistory(null)}>
          <div className="bg-white w-full sm:max-w-lg p-5 rounded-t-xl sm:rounded-sm max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3"><h3 className="text-lg font-black text-[#1A2B48]">{history.item.name} — history</h3><button type="button" onClick={() => setHistory(null)} aria-label="Close"><X /></button></div>
            {!history.rows ? <p className="text-slate-500">Loading…</p> : history.rows.length === 0 ? <p className="text-slate-500">No changes yet.</p> : (
              <ul className="divide-y">
                {history.rows.map(r => (
                  <li key={r._id} className="py-2 text-sm flex justify-between gap-3">
                    <div>
                      <b>{ACTIONS[r.type]?.label || r.type}</b> {ACTIONS[r.type]?.sign}{r.quantity}
                      <div className="text-xs text-slate-500">{new Date(r.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · {r.by}{r.note ? ` · ${r.note}` : ''}</div>
                    </div>
                    <div className="text-right text-xs text-slate-500 whitespace-nowrap">{r.before} → <b className="text-slate-800">{r.after}</b></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockInventory;
