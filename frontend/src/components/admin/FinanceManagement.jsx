import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { 
    IndianRupee, TrendingUp, TrendingDown, Wallet, Plus, 
    Download, ShieldAlert, CheckCircle, AlertCircle, List, ArrowLeft
} from 'lucide-react';
import { socket } from '@/lib/socket';

const API_BASE = config.API_URL;

const FinanceManagement = ({ role = 'Admin' }) => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pendingDues, setPendingDues] = useState([]);
  const [handover, setHandover] = useState(null);
  const [viewingList, setViewingList] = useState(null); // 'pending' or null
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  
  const [newIncome, setNewIncome] = useState({
      category: 'Room Rent', amount: '', description: '', paymentMode: 'Cash', recordedBy: ''
  });
  const [newExpense, setNewExpense] = useState({
      category: 'Kitchen', amount: '', description: '', paymentMode: 'Cash', approvedBy: ''
  });
  
  const [handoverForm, setHandoverForm] = useState({
      shiftEndTime: '', staffName: '', handoverTo: ''
  });

    useEffect(() => {
        fetchData();
        
        socket.on('finance_updated', fetchData);
        return () => socket.off('finance_updated', fetchData);
    }, [selectedDate]);

  const fetchData = async () => {
    try {
      const [txRes, sumRes, duesRes, handoverRes] = await Promise.all([
          axios.get(`${API_BASE}/api/finance/transactions?date=${selectedDate}`),
          axios.get(`${API_BASE}/api/finance/daily-report?date=${selectedDate}`),
          axios.get(`${API_BASE}/api/finance/pending-dues`),
          axios.get(`${API_BASE}/api/finance/cash-handover?date=${selectedDate}`)
      ]);
      setTransactions(txRes.data);
      setSummary(sumRes.data);
      setPendingDues(duesRes.data);
      setHandover(handoverRes.data);
    } catch (err) {
      console.error('Error fetching finance data', err);
    }
  };

  const handleAddIncome = async (e) => {
      e.preventDefault();
      try {
          await axios.post(`${API_BASE}/api/finance/transactions`, {
              ...newIncome, type: 'Income', amount: Number(newIncome.amount), date: new Date(selectedDate)
          });
          setShowIncomeModal(false);
          setNewIncome({ ...newIncome, amount: '', description: '' });
          fetchData();
      } catch (err) { console.error(err); }
  };

  const handleAddExpense = async (e) => {
      e.preventDefault();
      try {
          await axios.post(`${API_BASE}/api/finance/transactions`, {
              ...newExpense, type: 'Expense', amount: Number(newExpense.amount), date: new Date(selectedDate), approved: true // Assume approved if Manager signs off
          });
          setShowExpenseModal(false);
          setNewExpense({ ...newExpense, amount: '', description: '' });
          fetchData();
      } catch (err) { console.error(err); }
  };
  
  const handleVoidTransaction = async (id) => {
      const reason = prompt('Enter reason for voiding this transaction:');
      if (!reason) return;
      try {
          await axios.post(`${API_BASE}/api/finance/transactions/void/${id}`, { voidReason: reason });
          fetchData();
      } catch (err) { console.error(err); }
  };
  
  const submitHandover = async (e) => {
      e.preventDefault();
      if (!summary) return;
      try {
          await axios.post(`${API_BASE}/api/finance/cash-handover`, {
              ...handoverForm,
              date: new Date(selectedDate),
              openingBalance: summary.openingBalance || 0, 
              totalCashIncome: summary.incomeByMode['Cash'] || 0,
              totalCashExpense: summary.totalExpense || 0, 
              closingBalance: (summary.openingBalance || 0) + (summary.incomeByMode['Cash'] || 0) - (summary.totalExpense || 0),
              netDayTotal: (summary.totalIncome || 0) - (summary.totalExpense || 0)
          });
          fetchData();
      } catch (err) { console.error(err); }
  };

  const incomeTx = transactions.filter(tx => tx.type === 'Income');
  const expenseTx = transactions.filter(tx => tx.type === 'Expense');
  const isLocked = !!handover;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-serif font-bold text-[#0A192F]">Finance</h2>
            <p className="text-slate-500 text-sm mt-1">Manage daily ledgers and end-of-shift reporting.</p>
        </div>
        <div className="flex items-center gap-4">
            {role === 'Admin' && (
                <button className="bg-white border border-slate-200 text-[#0A192F] px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-2">
                    <Download size={14} /> Download Report
                </button>
            )}
            <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="border border-slate-200 p-2 rounded-sm text-sm bg-white focus:outline-none focus:border-[#BFA37E]"
            />
        </div>
      </div>

      {viewingList === 'pending' ? (
          <div className="bg-white rounded-sm shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-[#f97316] p-6 text-white flex justify-between items-center">
                  <div>
                      <h3 className="text-xl font-serif font-bold uppercase tracking-widest">Detailed Pending Dues List</h3>
                      <p className="text-xs opacity-80 mt-1">Total Outstanding: ₹{pendingDues.reduce((acc, curr) => acc + curr.balance, 0).toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => setViewingList(null)}
                    className="bg-white text-[#f97316] px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors rounded-full"
                  >
                      Back to Dashboard
                  </button>
              </div>
              <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-50 text-[#0A192F] text-[10px] font-bold uppercase tracking-widest border-b border-slate-200">
                              <th className="px-6 py-4">#</th>
                              <th className="px-6 py-4">Guest Name</th>
                              <th className="px-6 py-4">Room Category</th>
                              <th className="px-6 py-4 text-right">Balance Due</th>
                              <th className="px-6 py-4 text-center">Status</th>
                          </tr>
                      </thead>
                      <tbody>
                          {pendingDues.map((due, idx) => (
                              <tr key={due._id} className="border-b hover:bg-orange-50 transition-colors">
                                  <td className="px-6 py-4 text-xs text-slate-500">{idx + 1}</td>
                                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{due.guestName}</td>
                                  <td className="px-6 py-4 text-xs text-slate-500 uppercase font-bold">{due.room}</td>
                                  <td className="px-6 py-4 text-right text-base font-black text-[#f97316]">₹{due.balance.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-center">
                                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Unsettled</span>
                                  </td>
                              </tr>
                          ))}
                          {pendingDues.length === 0 && (
                              <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 uppercase font-bold tracking-widest">No pending dues found.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      ) : (
          <>
            {role !== 'FrontDesk' && summary && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-0 rounded-sm overflow-hidden shadow-sm border border-slate-100">
                    <div className="bg-[#0A192F] text-white p-6 flex flex-col justify-center border-r border-white/10 cursor-pointer hover:bg-[#0A192F]/90 transition-colors">
                        <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-2">Date</p>
                        <p className="text-xl font-serif font-bold">{new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}</p>
                    </div>
                    <div className="bg-[#10B981] text-white p-6 border-r border-white/10 cursor-pointer hover:bg-[#10B981]/90 transition-colors">
                        <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold mb-1">Total Income</p>
                        <p className="text-2xl font-serif font-bold flex items-center gap-1">₹{summary.totalIncome.toLocaleString()}</p>
                    </div>
                    <div className="bg-[#EF4444] text-white p-6 border-r border-white/10 cursor-pointer hover:bg-[#EF4444]/90 transition-colors">
                        <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold mb-1">Total Expense</p>
                        <p className="text-2xl font-serif font-bold flex items-center gap-1">₹{summary.totalExpense.toLocaleString()}</p>
                    </div>
                    <div className="bg-[#0ea5e9] text-white p-6 border-r border-white/10 cursor-pointer hover:bg-[#0ea5e9]/90 transition-colors">
                        <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold mb-1">Net Cash</p>
                        <p className="text-2xl font-serif font-bold flex items-center gap-1">₹{summary.netCashHandover.toLocaleString()}</p>
                    </div>
                    <div 
                      onClick={() => setViewingList('pending')}
                      className="bg-[#f97316] text-white p-6 cursor-pointer hover:bg-[#f97316]/90 transition-colors"
                    >
                        <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold mb-1">Pending Due</p>
                        <p className="text-2xl font-serif font-bold flex items-center gap-1">₹{pendingDues.reduce((acc, curr) => acc + curr.balance, 0).toLocaleString()}</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-sm shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-[#10B981] p-4 flex justify-between items-center text-white">
                    <h3 className="text-xs font-bold uppercase tracking-widest">Income Ledger — {new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}</h3>
                    {!isLocked && (
                        <button onClick={() => setShowIncomeModal(true)} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-sm transition-colors">
                            <Plus size={16} />
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#0A192F] text-white">
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest w-12">#</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Time</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Description</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Category</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Amount</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Mode</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Staff</th>
                                {role === 'Admin' && <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {incomeTx.length === 0 ? (
                                <tr><td colSpan="8" className="p-8 text-center text-slate-400 italic">No income entries for this date.</td></tr>
                            ) : (
                                incomeTx.map((tx, idx) => (
                                    <tr key={tx._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="p-3 text-xs text-slate-400 font-bold">{idx + 1}</td>
                                        <td className="p-3 text-xs text-slate-600">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="p-3 text-sm text-slate-800 font-medium">{tx.description}</td>
                                        <td className="p-3 text-xs uppercase font-bold text-[#10B981]">{tx.category}</td>
                                        <td className="p-3 text-sm font-black text-slate-800">₹{tx.amount.toLocaleString()}</td>
                                        <td className="p-3 text-xs text-slate-600">{tx.paymentMode}</td>
                                        <td className="p-3 text-xs text-slate-600 font-medium">{tx.recordedBy || '-'}</td>
                                        {role === 'Admin' && (
                                            <td className="p-3 text-right">
                                                <button onClick={() => handleVoidTransaction(tx._id)} className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest">Void</button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-sm shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-[#EF4444] p-4 flex justify-between items-center text-white">
                    <h3 className="text-xs font-bold uppercase tracking-widest">Expense Ledger — {new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}</h3>
                    {!isLocked && (
                        <button onClick={() => setShowExpenseModal(true)} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-sm transition-colors">
                            <Plus size={16} />
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#0A192F] text-white">
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest w-12">#</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Time</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Description</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Category</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Amount</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Mode</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Approved By</th>
                                {role === 'Admin' && <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {expenseTx.length === 0 ? (
                                <tr><td colSpan="8" className="p-8 text-center text-slate-400 italic">No expense entries for this date.</td></tr>
                            ) : (
                                expenseTx.map((tx, idx) => (
                                    <tr key={tx._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="p-3 text-xs text-slate-400 font-bold">{idx + 1}</td>
                                        <td className="p-3 text-xs text-slate-600">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="p-3 text-sm text-slate-800 font-medium">{tx.description}</td>
                                        <td className="p-3 text-xs uppercase font-bold text-[#EF4444]">{tx.category}</td>
                                        <td className="p-3 text-sm font-black text-slate-800">₹{tx.amount.toLocaleString()}</td>
                                        <td className="p-3 text-xs text-slate-600">{tx.paymentMode}</td>
                                        <td className="p-3 text-xs text-slate-600 font-medium">{tx.approvedBy || '-'}</td>
                                        {role === 'Admin' && (
                                            <td className="p-3 text-right">
                                                <button onClick={() => handleVoidTransaction(tx._id)} className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest">Void</button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-sm shadow-sm border border-[#BFA37E] overflow-hidden">
                <div className="bg-[#BFA37E] p-4 text-white text-center">
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em]">End of Day — Cash Handover Summary</h3>
                </div>
                {handover ? (
                    <div className="p-8 text-center bg-green-50/30">
                        <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                        <h4 className="text-lg font-serif font-bold text-[#0A192F] mb-2">Handover Submitted</h4>
                        <p className="text-xs text-slate-500 mb-6">The cash handover for this date has been completed and locked.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
                            <div className="bg-white p-4 border border-slate-100 rounded-sm">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Shift End</p>
                                <p className="text-sm font-bold text-[#0A192F] mt-1">{handover.shiftEndTime}</p>
                            </div>
                            <div className="bg-white p-4 border border-slate-100 rounded-sm">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Staff Name</p>
                                <p className="text-sm font-bold text-[#0A192F] mt-1">{handover.staffName}</p>
                            </div>
                            <div className="bg-white p-4 border border-slate-100 rounded-sm">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Handover To</p>
                                <p className="text-sm font-bold text-[#0A192F] mt-1">{handover.handoverTo}</p>
                            </div>
                            <div className="bg-white p-4 border border-slate-100 rounded-sm">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Closing Balance</p>
                                <p className="text-sm font-bold text-green-600 mt-1">₹{handover.closingBalance.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={submitHandover} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Date</label>
                                <input type="text" disabled value={new Date(selectedDate).toLocaleDateString()} className="w-full border border-slate-200 p-2.5 text-xs bg-slate-50 text-slate-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Shift End Time</label>
                                <input type="time" required value={handoverForm.shiftEndTime} onChange={e => setHandoverForm({...handoverForm, shiftEndTime: e.target.value})} className="w-full border border-slate-200 p-2.5 text-xs bg-white focus:outline-none focus:border-[#BFA37E]" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Staff Name</label>
                                <input type="text" required value={handoverForm.staffName} onChange={e => setHandoverForm({...handoverForm, staffName: e.target.value})} placeholder="e.g. Amit Sharma" className="w-full border border-slate-200 p-2.5 text-xs bg-white focus:outline-none focus:border-[#BFA37E]" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Handover To</label>
                                <input type="text" required value={handoverForm.handoverTo} onChange={e => setHandoverForm({...handoverForm, handoverTo: e.target.value})} placeholder="e.g. Night Manager Ravi" className="w-full border border-slate-200 p-2.5 text-xs bg-white focus:outline-none focus:border-[#BFA37E]" />
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end">
                            <button type="submit" className="bg-[#BFA37E] hover:bg-[#A38A6A] text-white px-8 py-3 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 rounded-sm shadow-sm">
                                <ShieldAlert size={14} /> Lock & Submit Handover
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {role !== 'FrontDesk' && summary && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Cash Summary */}
                    <div className="bg-[#0A192F] text-white rounded-sm overflow-hidden shadow-sm">
                        <div className="bg-[#1A2B48] p-4 text-center border-b border-white/10">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#0ea5e9]">Cash Summary</h3>
                        </div>
                        <div className="grid grid-cols-2 text-sm">
                            <div className="p-4 border-r border-b border-white/5 flex justify-between items-center">
                                <span className="text-white/60">Opening Cash Balance:</span>
                                <span className="font-bold">₹{summary.openingBalance || 0}</span>
                            </div>
                            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                <span className="text-white/60">Total Cash Income:</span>
                                <span className="font-bold text-[#10B981]">₹{(summary.incomeByMode?.['Cash'] || 0).toLocaleString()}</span>
                            </div>
                            <div className="p-4 border-r border-b border-white/5 flex justify-between items-center">
                                <span className="text-white/60">Total Cash Expense:</span>
                                <span className="font-bold text-[#EF4444]">₹{(summary.totalExpense || 0).toLocaleString()}</span>
                            </div>
                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <span className="text-white/80 font-bold">Closing Cash Balance:</span>
                                <span className="font-bold text-white">₹{((summary.openingBalance || 0) + (summary.incomeByMode?.['Cash'] || 0) - (summary.totalExpense || 0)).toLocaleString()}</span>
                            </div>
                            <div className="p-4 border-r border-white/5 flex justify-between items-center">
                                <span className="text-white/60">Online Income:</span>
                                <span className="font-bold">₹{((summary.incomeByMode?.['Online'] || 0) + (summary.incomeByMode?.['UPI'] || 0) + (summary.incomeByMode?.['Card'] || 0) + (summary.incomeByMode?.['Bank Transfer'] || 0)).toLocaleString()}</span>
                            </div>
                            <div className="p-4 flex justify-between items-center bg-[#BFA37E]/20">
                                <span className="text-[#BFA37E] font-bold">Net Day Total:</span>
                                <span className="font-bold text-[#BFA37E]">₹{((summary.totalIncome || 0) - (summary.totalExpense || 0)).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Pending Dues */}
                    <div className="bg-white border border-[#0A192F] rounded-sm overflow-hidden shadow-sm">
                        <div className="bg-[#0A192F] p-4 text-center">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Pending Dues (Rooms not settled)</h3>
                        </div>
                        <div className="p-0">
                            {pendingDues.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">No pending dues.</div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <tbody>
                                        {pendingDues.map((due, idx) => (
                                            <tr key={due._id} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                                                <td className="p-3 border-b border-slate-100 font-medium text-slate-700">{due.guestName}</td>
                                                <td className="p-3 border-b border-slate-100 text-right font-bold text-orange-600">Pending ₹{due.balance.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
          </>
      )}

      {showIncomeModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-sm shadow-xl w-full max-w-md overflow-hidden">
                  <div className="bg-[#10B981] p-4 text-white flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-widest">Add Income Entry</h3>
                      <button onClick={() => setShowIncomeModal(false)} className="hover:text-white/70">✕</button>
                  </div>
                  <form onSubmit={handleAddIncome} className="p-6 space-y-4">
                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Description</label>
                          <input type="text" required value={newIncome.description} onChange={e => setNewIncome({...newIncome, description: e.target.value})} placeholder="e.g. Extra Mattress / F&B" className="w-full border border-slate-200 p-2.5 text-xs focus:border-[#10B981] focus:outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Category</label>
                              <select value={newIncome.category} onChange={e => setNewIncome({...newIncome, category: e.target.value})} className="w-full border border-slate-200 p-2.5 text-xs focus:border-[#10B981] focus:outline-none">
                                  {['Room Rent', 'F&B', 'Laundry', 'Travel', 'Misc'].map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Amount (₹)</label>
                              <input type="number" required value={newIncome.amount} onChange={e => setNewIncome({...newIncome, amount: e.target.value})} className="w-full border border-slate-200 p-2.5 text-xs focus:border-[#10B981] focus:outline-none" />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Mode</label>
                              <select value={newIncome.paymentMode} onChange={e => setNewIncome({...newIncome, paymentMode: e.target.value})} className="w-full border border-slate-200 p-2.5 text-xs focus:border-[#10B981] focus:outline-none">
                                  {['Cash', 'Online', 'UPI', 'Card', 'Bank Transfer'].map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Recorded By</label>
                              <input type="text" required value={newIncome.recordedBy} onChange={e => setNewIncome({...newIncome, recordedBy: e.target.value})} placeholder="Staff Name" className="w-full border border-slate-200 p-2.5 text-xs focus:border-[#10B981] focus:outline-none" />
                          </div>
                      </div>
                      <button type="submit" className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-3 mt-4 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors">
                          Save Income
                      </button>
                  </form>
              </div>
          </div>
      )}

      {showExpenseModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-sm shadow-xl w-full max-w-md overflow-hidden">
                  <div className="bg-[#EF4444] p-4 text-white flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-widest">Add Expense Entry</h3>
                      <button onClick={() => setShowExpenseModal(false)} className="hover:text-white/70">✕</button>
                  </div>
                  <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Description</label>
                          <input type="text" required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="e.g. Vegetables & Grocery" className="w-full border border-slate-200 p-2.5 text-xs focus:border-[#EF4444] focus:outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Category</label>
                              <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="w-full border border-slate-200 p-2.5 text-xs focus:border-[#EF4444] focus:outline-none">
                                  {['Kitchen', 'Utility', 'Salary', 'Maintenance', 'Marketing', 'Vendor Payment', 'Misc'].map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Amount (₹)</label>
                              <input type="number" required value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="w-full border border-slate-200 p-2.5 text-xs focus:border-[#EF4444] focus:outline-none" />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Mode</label>
                              <select value={newExpense.paymentMode} onChange={e => setNewExpense({...newExpense, paymentMode: e.target.value})} className="w-full border border-slate-200 p-2.5 text-xs focus:border-[#EF4444] focus:outline-none">
                                  {['Cash', 'Online', 'UPI', 'Card', 'Bank Transfer'].map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">Approved By <AlertCircle size={10} className="text-orange-500"/></label>
                              <input type="text" required value={newExpense.approvedBy} onChange={e => setNewExpense({...newExpense, approvedBy: e.target.value})} placeholder="Manager Name" className="w-full border border-orange-200 p-2.5 text-xs focus:border-[#EF4444] focus:outline-none bg-orange-50" />
                          </div>
                      </div>
                      <button type="submit" className="w-full bg-[#EF4444] hover:bg-[#DC2626] text-white py-3 mt-4 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors">
                          Save Expense
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default FinanceManagement;
