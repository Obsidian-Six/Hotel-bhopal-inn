import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { 
    IndianRupee, TrendingUp, TrendingDown, Wallet, Plus, 
    Download, ShieldAlert, CheckCircle, AlertCircle, List, ArrowLeft,
    MessageSquare, Send, ShieldCheck, X, FileEdit, CheckCheck, RefreshCw, Globe, Tag, Trash2
} from 'lucide-react';
import { socket } from '@/lib/socket';
import { useAuth } from '@/lib/AuthContext';

const API_BASE = config.API_URL;

const FinanceManagement = ({ role = 'Admin', isSuperAdmin: propIsSuperAdmin }) => {
  const { user, isSuperAdmin: authIsSuperAdmin } = useAuth();
  const isSuperAdmin = propIsSuperAdmin !== undefined ? propIsSuperAdmin : (role === 'Super Admin' ? true : authIsSuperAdmin);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pendingDues, setPendingDues] = useState([]);
  const [handover, setHandover] = useState(null);
  const [viewingList, setViewingList] = useState(null); // 'pending' or null
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Super Admin Amendment States
  const [selectedDueForAmend, setSelectedDueForAmend] = useState(null);
  const [amendModalOpen, setAmendModalOpen] = useState(false);
  const [amendNote, setAmendNote] = useState('');
  const [amendThread, setAmendThread] = useState(null);
  const [amendReplyText, setAmendReplyText] = useState('');
  const [loadingAmend, setLoadingAmend] = useState(false);
  
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
        socket.on('amendment_updated', fetchData);
        socket.on('amendment_created', fetchData);
        return () => {
          socket.off('finance_updated', fetchData);
          socket.off('amendment_updated', fetchData);
          socket.off('amendment_created', fetchData);
        };
    }, [selectedDate]);

  const handleOpenAmendModal = async (due) => {
    setSelectedDueForAmend(due);
    setAmendNote('');
    setAmendReplyText('');
    setAmendModalOpen(true);

    if (due.amendmentId) {
      try {
        setLoadingAmend(true);
        const res = await axios.get(`${API_BASE}/api/amendments/${due.amendmentId}`);
        setAmendThread(res.data);
      } catch (err) {
        console.error('Error fetching amendment thread:', err);
      } finally {
        setLoadingAmend(false);
      }
    } else {
      setAmendThread(null);
    }
  };

  const handleCreateAmendment = async (e) => {
    e.preventDefault();
    if (!amendNote.trim()) return;
    try {
      setLoadingAmend(true);
      const res = await axios.post(`${API_BASE}/api/amendments`, {
        bookingId: selectedDueForAmend._id,
        superAdminNote: amendNote.trim()
      });
      setAmendThread(res.data);
      setAmendNote('');
      fetchData();
      alert('Amendment successfully issued! Staff Admin can now view this in the Amendments tab.');
    } catch (err) {
      alert('Failed to issue amendment: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingAmend(false);
    }
  };

  const handleSendSuperAdminMessage = async (e) => {
    e.preventDefault();
    if (!amendReplyText.trim() || !amendThread) return;
    try {
      const res = await axios.post(`${API_BASE}/api/amendments/${amendThread._id}/messages`, {
        text: amendReplyText.trim()
      });
      setAmendThread(res.data);
      setAmendReplyText('');
      fetchData();
    } catch (err) {
      alert('Failed to post message: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteAmendmentRecord = async () => {
    if (!amendThread) return;
    if (!window.confirm(`⚠️ PERMANENT FRONT DESK DELETION\n\nPermanently delete this booking record from Front Desk?\n\n- The booking will be completely removed from Front Desk.\n- Any assigned room will be immediately released.\n- Any collections linked to this amendment will be deducted from daily sales.\n- This amendment thread will be removed.`)) {
      return;
    }
    try {
      const res = await axios.delete(`${API_BASE}/api/amendments/${amendThread._id}`);
      setAmendModalOpen(false);
      setAmendThread(null);
      fetchData();
      alert(res.data?.message || 'Record permanently deleted from Front Desk.');
    } catch (err) {
      alert('Failed to delete record: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCloseAmendment = async () => {
    if (!amendThread) return;
    if (!window.confirm('Close and finalize this amendment? Staff delegated access for this booking will end.')) return;
    try {
      const res = await axios.post(`${API_BASE}/api/amendments/${amendThread._id}/resolve`, {
        note: 'Super Admin closed and finalized resolution.'
      });
      setAmendThread(res.data);
      fetchData();
      alert('Amendment closed and resolved.');
    } catch (err) {
      alert('Failed to close amendment: ' + (err.response?.data?.message || err.message));
    }
  };

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

  const handleDownloadExcelReport = () => {
    try {
      const formattedDateStr = new Date(selectedDate).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });

      const incomeByMode = summary?.incomeByMode || {};
      const totalIncome = summary?.totalIncome || 0;
      const totalExpense = summary?.totalExpense || 0;
      const openingBalance = summary?.openingBalance || 0;
      const netCashBalance = openingBalance + (incomeByMode['Cash'] || 0) - totalExpense;
      const totalPendingDues = pendingDues.reduce((acc, curr) => acc + (curr.balance || 0), 0);

      const tableHtml = `
        <table>
          <tr>
            <td colspan="7" class="header-title" style="font-size: 16pt; font-weight: bold; color: #1A2B48; text-align: center;">
              HOTEL BHOPAL INN - FINANCIAL AUDIT & RECONCILIATION REPORT
            </td>
          </tr>
          <tr>
            <td colspan="7" class="header-sub" style="font-size: 10pt; color: #64748B; text-align: center;">
              Audit Date: ${formattedDateStr} (${selectedDate}) | Generated: ${new Date().toLocaleString()}
            </td>
          </tr>
          <tr><td colspan="7"></td></tr>
          
          <!-- SUMMARY SECTION -->
          <tr>
            <td colspan="7" class="section-header" style="font-size: 12pt; font-weight: bold; background-color: #F1F5F9; color: #0F172A; padding: 8px 12px; border: 1px solid #CBD5E1;">
              1. EXECUTIVE FINANCIAL SUMMARY
            </td>
          </tr>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <td style="border: 1px solid #CBD5E1; padding: 6px;">Opening Cash Balance</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px;">Cash Income</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px;">Online Income (UPI/Card)</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px;">OTA Income</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px;">Total Day Income</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px;">Total Expenses</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px;">Closing Counter Cash</td>
          </tr>
          <tr>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right;">₹${openingBalance.toLocaleString()}</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right;">₹${(incomeByMode['Cash'] || 0).toLocaleString()}</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right;">₹${(incomeByMode['Online'] || 0).toLocaleString()}</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right;">₹${(incomeByMode['OTA'] || 0).toLocaleString()}</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #065F46;">₹${totalIncome.toLocaleString()}</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #991B1B;">₹${totalExpense.toLocaleString()}</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold;">₹${netCashBalance.toLocaleString()}</td>
          </tr>
          <tr><td colspan="7"></td></tr>

          <!-- INCOME LEDGER -->
          <tr>
            <td colspan="7" class="section-header" style="font-size: 12pt; font-weight: bold; background-color: #ECFDF5; color: #065F46; padding: 8px 12px; border: 1px solid #CBD5E1;">
              2. INCOME LEDGER (${incomeTx.length} Entries)
            </td>
          </tr>
          <tr style="background-color: #065F46; color: #ffffff; font-weight: bold;">
            <th style="border: 1px solid #718096; padding: 6px; width: 40px; text-align: center;">#</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 90px; text-align: center;">Time</th>
            <th style="border: 1px solid #718096; padding: 6px; text-align: left;">Description</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 120px; text-align: left;">Category</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 110px; text-align: right;">Amount</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 100px; text-align: center;">Mode</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 140px; text-align: left;">Recorded By</th>
          </tr>
          ${incomeTx.length === 0 ? `
            <tr><td colspan="7" style="border: 1px solid #CBD5E1; padding: 10px; text-align: center; color: #64748B;">No income transactions recorded for this date.</td></tr>
          ` : incomeTx.map((tx, idx) => `
            <tr>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${idx + 1}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px;">${(tx.description || '').replace(/</g, '&lt;')}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px;">${tx.category || '-'}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #065F46;">₹${Number(tx.amount || 0).toLocaleString()}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${tx.paymentMode || '-'}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px;">${tx.recordedBy || '-'}</td>
            </tr>
          `).join('')}
          <tr style="font-weight: bold; background-color: #F1F5F9; border-top: 2px solid #64748B;">
            <td colspan="4" style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold;">Total Income:</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #065F46;">₹${incomeTx.reduce((acc, t) => acc + (t.amount || 0), 0).toLocaleString()}</td>
            <td colspan="2" style="border: 1px solid #CBD5E1; padding: 6px;"></td>
          </tr>
          <tr><td colspan="7"></td></tr>

          <!-- EXPENSE LEDGER -->
          <tr>
            <td colspan="7" class="section-header" style="font-size: 12pt; font-weight: bold; background-color: #FEF2F2; color: #991B1B; padding: 8px 12px; border: 1px solid #CBD5E1;">
              3. EXPENSE LEDGER (${expenseTx.length} Entries)
            </td>
          </tr>
          <tr style="background-color: #991B1B; color: #ffffff; font-weight: bold;">
            <th style="border: 1px solid #718096; padding: 6px; width: 40px; text-align: center;">#</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 90px; text-align: center;">Time</th>
            <th style="border: 1px solid #718096; padding: 6px; text-align: left;">Description</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 120px; text-align: left;">Category</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 110px; text-align: right;">Amount</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 100px; text-align: center;">Mode</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 140px; text-align: left;">Approved By</th>
          </tr>
          ${expenseTx.length === 0 ? `
            <tr><td colspan="7" style="border: 1px solid #CBD5E1; padding: 10px; text-align: center; color: #64748B;">No expense transactions recorded for this date.</td></tr>
          ` : expenseTx.map((tx, idx) => `
            <tr>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${idx + 1}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px;">${(tx.description || '').replace(/</g, '&lt;')}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px;">${tx.category || '-'}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #991B1B;">₹${Number(tx.amount || 0).toLocaleString()}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${tx.paymentMode || '-'}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px;">${tx.approvedBy || '-'}</td>
            </tr>
          `).join('')}
          <tr style="font-weight: bold; background-color: #F1F5F9; border-top: 2px solid #64748B;">
            <td colspan="4" style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold;">Total Expenses:</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #991B1B;">₹${expenseTx.reduce((acc, t) => acc + (t.amount || 0), 0).toLocaleString()}</td>
            <td colspan="2" style="border: 1px solid #CBD5E1; padding: 6px;"></td>
          </tr>
          <tr><td colspan="7"></td></tr>

          <!-- PENDING DUES AUDIT SECTION -->
          <tr>
            <td colspan="7" class="section-header" style="font-size: 12pt; font-weight: bold; background-color: #FFFBEB; color: #92400E; padding: 8px 12px; border: 1px solid #CBD5E1;">
              4. PENDING DUES & AUDIT RECONCILIATION (${pendingDues.length} Outstanding Accounts)
            </td>
          </tr>
          <tr style="background-color: #D97706; color: #ffffff; font-weight: bold;">
            <th style="border: 1px solid #718096; padding: 6px; width: 40px; text-align: center;">#</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 100px; text-align: center;">Booking Ref</th>
            <th style="border: 1px solid #718096; padding: 6px; text-align: left;">Guest Details</th>
            <th style="border: 1px solid #718096; padding: 6px; text-align: left;">Room</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 110px; text-align: right;">Total Bill</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 110px; text-align: right;">Paid So Far</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 110px; text-align: right;">Balance Due</th>
          </tr>
          ${pendingDues.length === 0 ? `
            <tr><td colspan="7" style="border: 1px solid #CBD5E1; padding: 10px; text-align: center; color: #64748B;">All guest accounts reconciled. No outstanding dues!</td></tr>
          ` : pendingDues.map((due, idx) => `
            <tr>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${idx + 1}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-weight: bold;">#${(due.bookingReference || due._id || '').slice(-8)}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px;">${due.guest?.name || due.guestName || 'Guest'} (${due.guest?.phone || ''})</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px;">Room ${due.roomNumber || due.roomCategory || '-'}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right;">₹${Number(due.totalAmount || 0).toLocaleString()}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #065F46;">₹${Number(due.amountPaid || 0).toLocaleString()}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #B91C1C;">₹${Number(due.balance || 0).toLocaleString()}</td>
            </tr>
          `).join('')}
          <tr style="font-weight: bold; background-color: #F1F5F9; border-top: 2px solid #64748B;">
            <td colspan="6" style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold;">Total Outstanding Pending Balance:</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #B91C1C;">₹${totalPendingDues.toLocaleString()}</td>
          </tr>
        </table>
      `;

      const template = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Financial Audit</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
          <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
          <style>
            body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
            table { border-collapse: collapse; width: 100%; }
            th { border: 1px solid #718096; padding: 7px 10px; font-size: 10pt; text-transform: uppercase; }
            td { border: 1px solid #CBD5E1; padding: 6px 10px; font-size: 10pt; }
          </style>
        </head>
        <body>
          ${tableHtml}
        </body>
        </html>
      `;

      const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Hotel_Bhopal_Inn_Financial_Audit_${selectedDate}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting financial audit excel:', err);
      alert('Failed to generate Excel report: ' + err.message);
    }
  };

  const incomeTx = transactions.filter(tx => tx.type === 'Income');
  const expenseTx = transactions.filter(tx => tx.type === 'Expense');
  const isLocked = !!handover;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-serif font-bold text-[#000000]">Finance</h2>
            <p className="text-slate-500 text-sm mt-1">Manage daily ledgers and end-of-shift reporting.</p>
        </div>
        <div className="flex items-center gap-4">
            {(role === 'Admin' || role === 'Super Admin' || isSuperAdmin) && (
                <button 
                    onClick={handleDownloadExcelReport}
                    className="bg-white border border-slate-200 text-[#000000] px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    title="Download complete financial audit & ledgers in Excel sheet format (.xls)"
                >
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
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-serif font-bold uppercase tracking-widest">Daily Pending Dues & Audit Reconciliation</h3>
                        {isSuperAdmin && (
                          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                            Super Admin Amendments Enabled
                          </span>
                        )}
                      </div>
                      <p className="text-xs opacity-90 mt-1">
                        Total Outstanding: <span className="font-black">₹{pendingDues.reduce((acc, curr) => acc + (curr.balance || 0), 0).toLocaleString()}</span> across {pendingDues.length} reservations
                      </p>
                  </div>
                  <div className="flex items-center gap-3">
                      <button 
                        onClick={handleDownloadExcelReport}
                        className="bg-white text-[#f97316] px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors rounded-full shadow-sm flex items-center gap-1.5"
                        title="Download Pending Dues and Financial Audit in Excel format"
                      >
                          <Download size={13} /> Export Excel
                      </button>
                      <button 
                        onClick={() => setViewingList(null)}
                        className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-full shadow-sm"
                      >
                          Back to Dashboard
                      </button>
                  </div>
              </div>
              <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-50 text-[#000000] text-[10px] font-bold uppercase tracking-widest border-b border-slate-200">
                              <th className="px-5 py-4 whitespace-nowrap">#</th>
                              <th className="px-5 py-4 whitespace-nowrap">Guest Details</th>
                              <th className="px-5 py-4 whitespace-nowrap">Room / Unit</th>
                              <th className="px-5 py-4 whitespace-nowrap">Stay Dates</th>
                              <th className="px-5 py-4 whitespace-nowrap text-right">Total Bill</th>
                              <th className="px-5 py-4 whitespace-nowrap text-right">Paid</th>
                              <th className="px-5 py-4 whitespace-nowrap text-right">Balance Due</th>
                              <th className="px-5 py-4 whitespace-nowrap text-center">Amendment Status</th>
                              <th className="px-5 py-4 whitespace-nowrap text-right">Super Action</th>
                          </tr>
                      </thead>
                      <tbody>
                          {pendingDues.map((due, idx) => (
                              <tr key={due._id} className="border-b hover:bg-orange-50/50 transition-colors">
                                  <td className="px-5 py-4 text-xs text-slate-400 font-bold whitespace-nowrap">{idx + 1}</td>
                                  <td className="px-5 py-4 whitespace-nowrap">
                                    <div className="font-bold text-sm text-slate-900 truncate max-w-[200px]">{due.guestName}</div>
                                    {due.phone && <div className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">{due.phone}</div>}
                                  </td>
                                  <td className="px-5 py-4 text-xs text-slate-700 font-bold uppercase whitespace-nowrap">
                                    {due.room || due.roomCategory || 'Unassigned'}
                                  </td>
                                  <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                                    {due.checkInDate ? new Date(due.checkInDate).toLocaleDateString('en-GB') : '-'} ➔ {due.checkOutDate ? new Date(due.checkOutDate).toLocaleDateString('en-GB') : '-'}
                                  </td>
                                  <td className="px-5 py-4 text-right text-xs font-semibold text-slate-700 whitespace-nowrap">
                                    ₹{(due.totalAmount || 0).toLocaleString()}
                                  </td>
                                  <td className="px-5 py-4 text-right text-xs font-bold text-emerald-600 whitespace-nowrap">
                                    ₹{(due.amountPaid || 0).toLocaleString()}
                                  </td>
                                  <td className="px-5 py-4 text-right text-sm font-black text-rose-600 bg-rose-50/40 whitespace-nowrap">
                                    ₹{(due.balance || 0).toLocaleString()}
                                  </td>
                                  <td className="px-5 py-4 text-center whitespace-nowrap">
                                    {due.hasActiveAmendment ? (
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap shadow-xs ${
                                        due.amendmentStatus === 'Admin Responded'
                                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                          : 'bg-purple-100 text-purple-900 border border-purple-300'
                                      }`}>
                                        <FileEdit size={12} />
                                        {due.amendmentStatus || 'Amendment Active'}
                                      </span>
                                    ) : (
                                      <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap">
                                        No Amendment
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-5 py-4 text-right whitespace-nowrap">
                                    {isSuperAdmin ? (
                                      <button
                                        onClick={() => handleOpenAmendModal(due)}
                                        className={`px-3.5 py-2 rounded text-xs font-black uppercase tracking-wider transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
                                          due.hasActiveAmendment
                                            ? 'bg-purple-700 hover:bg-purple-800 text-white shadow-sm'
                                            : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:scale-[1.02]'
                                        }`}
                                      >
                                        <MessageSquare size={14} />
                                        {due.hasActiveAmendment ? 'View Thread' : 'Amend'}
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic whitespace-nowrap">Super Admin Only</span>
                                    )}
                                  </td>
                              </tr>
                          ))}
                          {pendingDues.length === 0 && (
                              <tr><td colSpan="9" className="px-6 py-12 text-center text-slate-400 uppercase font-bold tracking-widest whitespace-nowrap">No pending dues found.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      ) : (
          <>
            {role !== 'FrontDesk' && summary && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-0 rounded-sm overflow-hidden shadow-sm border border-slate-100">
                    <div className="bg-[#000000] text-white p-6 flex flex-col justify-center border-r border-white/10 cursor-pointer hover:bg-[#000000]/90 transition-colors">
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
                            <tr className="bg-[#000000] text-white">
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
                            <tr className="bg-[#000000] text-white">
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
                        <h4 className="text-lg font-serif font-bold text-[#000000] mb-2">Handover Submitted</h4>
                        <p className="text-xs text-slate-500 mb-6">The cash handover for this date has been completed and locked.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
                            <div className="bg-white p-4 border border-slate-100 rounded-sm">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Shift End</p>
                                <p className="text-sm font-bold text-[#000000] mt-1">{handover.shiftEndTime}</p>
                            </div>
                            <div className="bg-white p-4 border border-slate-100 rounded-sm">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Staff Name</p>
                                <p className="text-sm font-bold text-[#000000] mt-1">{handover.staffName}</p>
                            </div>
                            <div className="bg-white p-4 border border-slate-100 rounded-sm">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Handover To</p>
                                <p className="text-sm font-bold text-[#000000] mt-1">{handover.handoverTo}</p>
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
                    <div className="bg-[#000000] text-white rounded-sm overflow-hidden shadow-sm">
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
                                <span className="font-bold text-blue-400">₹{((summary.incomeByMode?.['Online'] || 0) + (summary.incomeByMode?.['UPI'] || 0) + (summary.incomeByMode?.['Card'] || 0) + (summary.incomeByMode?.['Bank Transfer'] || 0)).toLocaleString()}</span>
                            </div>
                            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                <span className="text-white/60">OTA Income:</span>
                                <span className="font-bold text-amber-400">₹{(summary.incomeByMode?.['OTA'] || 0).toLocaleString()}</span>
                            </div>
                            <div className="p-4 col-span-2 flex justify-between items-center bg-[#BFA37E]/20">
                                <span className="text-[#BFA37E] font-bold">Net Day Total:</span>
                                <span className="font-bold text-[#BFA37E]">₹{((summary.totalIncome || 0) - (summary.totalExpense || 0)).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Pending Dues Reconciliation Card & Amend Shortcut */}
                    <div className="bg-white border border-[#000000] rounded-sm overflow-hidden shadow-sm flex flex-col">
                        <div className="bg-[#000000] p-4 text-center flex justify-between items-center px-6">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Pending Dues & Audit ({pendingDues.length})</h3>
                            <button 
                              onClick={() => setViewingList('pending')} 
                              className="text-[10px] text-amber-400 font-bold uppercase tracking-wider hover:underline"
                            >
                              Expand All ➔
                            </button>
                        </div>
                        <div className="p-0 flex-1 overflow-y-auto max-h-72">
                            {pendingDues.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">No pending dues.</div>
                            ) : (
                                <table className="w-full text-left text-xs">
                                    <tbody className="divide-y divide-slate-100">
                                        {pendingDues.map((due, idx) => (
                                            <tr key={due._id} className={idx % 2 === 0 ? 'bg-slate-50/70 hover:bg-orange-50/40' : 'bg-white hover:bg-orange-50/40'}>
                                                <td className="p-3 font-bold text-slate-800">
                                                    <div>{due.guestName}</div>
                                                    <div className="text-[10px] text-slate-400 font-semibold">{due.room}</div>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="font-black text-rose-600">Pending ₹{due.balance.toLocaleString()}</div>
                                                    {due.hasActiveAmendment && (
                                                      <span className="text-[9px] font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded uppercase">
                                                        {due.amendmentStatus}
                                                      </span>
                                                    )}
                                                </td>
                                                {isSuperAdmin && (
                                                  <td className="p-3 text-right w-24">
                                                    <button
                                                      onClick={() => handleOpenAmendModal(due)}
                                                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-black uppercase tracking-wider transition-all"
                                                    >
                                                      {due.hasActiveAmendment ? 'Thread' : 'Amend'}
                                                    </button>
                                                  </td>
                                                )}
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
                                  {['Cash', 'Online', 'OTA', 'UPI', 'Card', 'Bank Transfer'].map(m => <option key={m} value={m}>{m}</option>)}
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

      {/* Super Admin Amend & Instructions Modal */}
      {amendModalOpen && selectedDueForAmend && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 p-5 text-white flex justify-between items-center shrink-0">
                      <div>
                          <div className="flex items-center gap-2">
                              <ShieldAlert className="text-amber-400" size={18} />
                              <h3 className="text-sm font-bold uppercase tracking-wider">Super Admin Financial Audit Amendment</h3>
                          </div>
                          <p className="text-xs text-purple-200 mt-1">
                              Booking Ref #{selectedDueForAmend._id.slice(-8)} — {selectedDueForAmend.guestName}
                          </p>
                      </div>
                      <button 
                          onClick={() => { setAmendModalOpen(false); setSelectedDueForAmend(null); setAmendThread(null); }}
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                      >
                          <X size={16} />
                      </button>
                  </div>

                  {/* Summary Strip */}
                  <div className="bg-purple-50/70 border-b border-purple-100 p-4 grid grid-cols-4 gap-3 text-xs shrink-0">
                      <div>
                          <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block whitespace-nowrap">Guest & Room</span>
                          <span className="font-bold text-slate-800 block truncate whitespace-nowrap">{selectedDueForAmend.guestName}</span>
                          <span className="text-slate-500 block text-[11px] truncate whitespace-nowrap">{selectedDueForAmend.room}</span>
                      </div>
                      <div>
                          <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block whitespace-nowrap">Total Bill</span>
                          <span className="font-bold text-slate-800 whitespace-nowrap">₹{(selectedDueForAmend.totalAmount || 0).toLocaleString()}</span>
                      </div>
                      <div>
                          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block whitespace-nowrap">Paid So Far</span>
                          <span className="font-bold text-emerald-700 whitespace-nowrap">₹{(selectedDueForAmend.amountPaid || 0).toLocaleString()}</span>
                      </div>
                      <div>
                          <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block whitespace-nowrap">Balance Due</span>
                          <span className="font-black text-rose-600 text-sm whitespace-nowrap">₹{(selectedDueForAmend.balance || 0).toLocaleString()}</span>
                      </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto space-y-5 flex-1">
                      {loadingAmend ? (
                          <div className="py-12 text-center text-slate-400 font-semibold flex items-center justify-center gap-2">
                              <RefreshCw size={18} className="animate-spin text-purple-600" />
                              Loading amendment details...
                          </div>
                      ) : amendThread ? (
                          <div className="space-y-4">
                              {/* Status & Controls bar */}
                              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                                  <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Status:</span>
                                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                                          amendThread.status === 'Closed' ? 'bg-slate-200 text-slate-700' :
                                          amendThread.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                                          amendThread.status === 'Admin Responded' ? 'bg-indigo-100 text-indigo-800' :
                                          'bg-amber-100 text-amber-800'
                                      }`}>
                                          {amendThread.status}
                                      </span>
                                  </div>
                                  {amendThread.status !== 'Closed' && (
                                      <div className="flex items-center gap-2">
                                          <button
                                              onClick={handleDeleteAmendmentRecord}
                                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded flex items-center gap-1 transition-colors"
                                              title="Permanently Delete Booking & Amendment from Front Desk"
                                          >
                                              <Trash2 size={13} /> Delete Record (Front Desk)
                                          </button>
                                          <button
                                              onClick={handleCloseAmendment}
                                              className="px-3 py-1.5 bg-slate-800 hover:bg-black text-white text-xs font-bold rounded flex items-center gap-1 transition-colors"
                                          >
                                              <CheckCheck size={14} /> Close & Finalize
                                          </button>
                                      </div>
                                  )}
                              </div>

                              {/* Super Admin Initial Instructions Box */}
                              <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3.5">
                                  <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs uppercase tracking-wider mb-1">
                                      <ShieldAlert size={14} /> Super Admin Instructions:
                                  </div>
                                  <p className="text-xs text-amber-950 font-medium whitespace-pre-wrap">
                                      {amendThread.superAdminNote}
                                  </p>
                              </div>

                              {/* Message History Thread */}
                              <div className="space-y-3 pt-2">
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                      <MessageSquare size={12} /> Conversation & Audit Trail ({amendThread.messages?.length || 0})
                                  </div>
                                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                      {amendThread.messages?.map((msg, i) => {
                                          const isSuper = msg.sender === 'SuperAdmin';
                                          const isSys = msg.sender === 'System';
                                          return (
                                              <div 
                                                  key={i} 
                                                  className={`p-3 rounded-lg text-xs ${
                                                      isSys 
                                                          ? 'bg-slate-100 border border-slate-200 text-slate-700 text-center font-medium italic'
                                                          : isSuper 
                                                          ? 'bg-purple-50 border border-purple-200 text-purple-950 ml-6' 
                                                          : 'bg-emerald-50 border border-emerald-200 text-emerald-950 mr-6'
                                                  }`}
                                              >
                                                  {!isSys && (
                                                      <div className="flex justify-between items-center mb-1 text-[10px] font-bold">
                                                          <span className={isSuper ? 'text-purple-800' : 'text-emerald-800'}>
                                                              {isSuper ? '👑 ' : '👤 '}{msg.senderName} ({isSuper ? 'Super Admin' : 'Admin Panel'})
                                                          </span>
                                                          <span className="text-slate-400 font-normal">
                                                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                          </span>
                                                      </div>
                                                  )}
                                                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>

                              {/* Super Admin Reply Box */}
                              {amendThread.status !== 'Closed' && (
                                  <form onSubmit={handleSendSuperAdminMessage} className="pt-2 flex gap-2">
                                      <input
                                          type="text"
                                          value={amendReplyText}
                                          onChange={(e) => setAmendReplyText(e.target.value)}
                                          placeholder="Write an instruction or response to Admin..."
                                          className="flex-1 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-purple-600"
                                      />
                                      <button
                                          type="submit"
                                          disabled={!amendReplyText.trim()}
                                          className="bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                                      >
                                          <Send size={14} /> Send
                                      </button>
                                  </form>
                              )}
                          </div>
                      ) : (
                          /* Create New Amendment Form */
                          <form onSubmit={handleCreateAmendment} className="space-y-4">
                              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed">
                                  <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
                                      <ShieldAlert size={15} /> How Financial Audit Amendments Work:
                                  </p>
                                  Submitting an amendment sends your instructions directly to the <strong>Staff Admin Panel</strong> under the new <strong>"Amendments"</strong> tab. It grants delegated access <em>strictly for this specific booking</em> to view your message, edit booking details, and collect the pending balance (which will immediately update that day's sales).
                              </div>

                              <div>
                                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                      Super Admin Instructions / Amendment Reason:
                                  </label>
                                  <textarea
                                      required
                                      rows={4}
                                      value={amendNote}
                                      onChange={(e) => setAmendNote(e.target.value)}
                                      placeholder="e.g. Please verify guest checkout details, collect the remaining ₹... balance via Online/Cash/OTA, and update room charges accordingly."
                                      className="w-full border border-slate-300 rounded-lg p-3 text-xs focus:outline-none focus:border-purple-600 font-sans"
                                  />
                              </div>

                              <div className="flex justify-end gap-2 pt-2">
                                  <button
                                      type="button"
                                      onClick={() => setAmendModalOpen(false)}
                                      className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors"
                                  >
                                      Cancel
                                  </button>
                                  <button
                                      type="submit"
                                      disabled={!amendNote.trim()}
                                      className="bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
                                  >
                                      <Send size={14} /> Issue Amendment to Admin Panel
                                  </button>
                              </div>
                          </form>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default FinanceManagement;
