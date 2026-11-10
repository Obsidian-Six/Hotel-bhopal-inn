import React, { useState } from 'react';
import axios from 'axios';
import config from '../../config';
import { X, KeyRound } from 'lucide-react';

// Lets any logged-in admin change their own password.
const ChangePassword = ({ onClose }) => {
  const [f, setF] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const strong = f.next.length >= 10;
  const match = f.next && f.next === f.confirm;

  const submit = async (e) => {
    e.preventDefault();
    if (!strong) return setMsg({ bad: true, t: 'New password must be at least 10 characters.' });
    if (!match) return setMsg({ bad: true, t: 'The two new passwords do not match.' });
    setBusy(true); setMsg(null);
    try {
      await axios.post(`${config.API_URL}/api/auth/change-password`, { currentPassword: f.current, newPassword: f.next });
      setMsg({ bad: false, t: 'Password changed. Use the new password next time you log in.' });
      setF({ current: '', next: '', confirm: '' });
    } catch (err) {
      setMsg({ bad: true, t: err.response?.data?.message || 'Could not change the password.' });
    } finally { setBusy(false); }
  };

  const input = 'w-full border-2 border-slate-200 p-3 text-base font-semibold focus:outline-none focus:border-[#1A2B48]';
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-white w-full sm:max-w-md p-6 space-y-4 rounded-t-xl sm:rounded-sm text-slate-800">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black text-[#1A2B48] flex items-center gap-2"><KeyRound size={20} /> Change password</h3>
          <button type="button" onClick={onClose} aria-label="Close"><X /></button>
        </div>
        <label className="block text-xs font-black uppercase text-slate-500">Current password
          <input type="password" autoComplete="current-password" required value={f.current} onChange={e => setF({ ...f, current: e.target.value })} className={input + ' mt-1'} />
        </label>
        <label className="block text-xs font-black uppercase text-slate-500">New password <span className="normal-case font-semibold">(at least 10 characters)</span>
          <input type="password" autoComplete="new-password" required value={f.next} onChange={e => setF({ ...f, next: e.target.value })} className={input + ' mt-1'} />
        </label>
        <label className="block text-xs font-black uppercase text-slate-500">New password again
          <input type="password" autoComplete="new-password" required value={f.confirm} onChange={e => setF({ ...f, confirm: e.target.value })} className={input + ' mt-1'} />
        </label>
        {f.next && <p className={`text-sm font-bold ${strong && match ? 'text-emerald-600' : 'text-amber-600'}`}>{!strong ? 'Too short' : !match ? 'Passwords don’t match yet' : 'Looks good'}</p>}
        {msg && <p className={`text-sm font-bold ${msg.bad ? 'text-rose-600' : 'text-emerald-700'}`}>{msg.t}</p>}
        <button type="submit" disabled={busy} className="w-full bg-[#1A2B48] text-white py-4 font-black uppercase text-sm disabled:opacity-60">{busy ? 'Saving…' : 'Change password'}</button>
      </form>
    </div>
  );
};

export default ChangePassword;
