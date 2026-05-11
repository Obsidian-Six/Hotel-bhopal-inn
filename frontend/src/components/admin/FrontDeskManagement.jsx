import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { 
  X, CheckCircle2, IndianRupee, Printer, LogOut, 
  Plus, Info, ArrowRight, User, Calendar, CreditCard, AlertTriangle, History, FastForward, Coffee
} from 'lucide-react';
import { socket } from '@/lib/socket';

const API_BASE = config.API_URL;

const FrontDeskManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ checkIns: 0, checkOuts: 0, inHouse: 0, available: 0 });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [roomCategories, setRoomCategories] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);

  // Check-In Form state
  const [checkInForm, setCheckInForm] = useState({
    roomUnit: '',
    idProof: ''
  });

  const [isFBModalOpen, setIsFBModalOpen] = useState(false);
  const [fbForm, setFbForm] = useState({ description: '', amount: '' });

  // Walk-in form state
  const [walkInForm, setWalkInForm] = useState({
    guestDetails: { firstName: '', lastName: '', phone: '', email: '', adults: 2, children: 0 },
    roomCategory: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    financials: { roomTariff: 0, amountPaid: 0, totalAmount: 0, balance: 0 },
    source: 'Walk-in'
  });

  useEffect(() => {
    fetchData();
    fetchSupportData();
    
    socket.on('booking_updated', fetchData);
    return () => socket.off('booking_updated', fetchData);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/bookings`),
        axios.get(`${API_BASE}/api/bookings/front-desk/stats`)
      ]);
      setBookings(bookingsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching front desk data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportData = async () => {
    try {
      const [roomsRes, unitsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/rooms`),
        axios.get(`${API_BASE}/api/inventory/units`) 
      ]);
      setRoomCategories(roomsRes.data);
      setAvailableUnits(unitsRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/bookings/${selectedBooking._id}/check-in`, checkInForm);
      fetchData();
      setIsCheckInModalOpen(false);
      setIsDetailOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async (id, override = false) => {
    try {
      await axios.post(`${API_BASE}/api/bookings/${id}/check-out`, { override });
      fetchData();
      setIsDetailOpen(false);
      alert('Checkout Successful. Room marked as Dirty.');
    } catch (err) {
      if (err.response?.data?.requiresOverride) {
        // Red alert popup for balance due
        setSelectedBooking(prev => ({...prev, checkoutError: `STRICT ALERT: BALANCE DUE ₹${err.response.data.balance}`}));
      } else {
        alert(err.response?.data?.message || 'Check-out failed');
      }
    }
  };

  const collectPayment = async (id, amount, mode) => {
    if(!amount || amount <= 0) return;
    try {
      // 1. Record in Booking History
      await axios.post(`${API_BASE}/api/bookings/${id}/collect-payment`, { 
        amount: Number(amount), 
        mode,
        staff: 'Admin_Staff' 
      });

      // 2. Automatically Record in Finance Ledger
      const guestName = selectedBooking?.guestDetails ? `${selectedBooking.guestDetails.firstName} ${selectedBooking.guestDetails.lastName}` : 'Guest';
      const roomInfo = selectedBooking?.roomUnit ? `Room ${selectedBooking.roomUnit}` : '';
      
      await axios.post(`${API_BASE}/api/finance/transactions`, {
        type: 'Income',
        category: 'Room Rent',
        amount: Number(amount),
        description: `Payment Collection - ${guestName} ${roomInfo}`.trim(),
        paymentMode: mode,
        date: new Date(),
        recordedBy: 'FrontDesk'
      });

      fetchData();
      const updated = (await axios.get(`${API_BASE}/api/bookings`)).data.find(b => b._id === id);
      setSelectedBooking(updated);
    } catch (err) {
      console.error('Payment sync error:', err);
      alert('Payment collection failed to sync with Finance.');
    }
  };

  const addCharge = async (id, description, amount, source = 'F&B') => {
    try {
      await axios.post(`${API_BASE}/api/bookings/${id}/add-charge`, { 
        description, 
        amount, 
        source 
      });
      fetchData();
      const updated = (await axios.get(`${API_BASE}/api/bookings`)).data.find(b => b._id === id);
      setSelectedBooking(updated);
      setIsFBModalOpen(false);
      setFbForm({ description: '', amount: '' });
    } catch (err) {
      alert('Failed to add charge');
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/bookings/walk-in`, walkInForm);
      
      // Record Advance Payment in Finance if exists
      if (walkInForm.financials.amountPaid > 0) {
          await axios.post(`${API_BASE}/api/finance/transactions`, {
            type: 'Income',
            category: 'Room Rent',
            amount: Number(walkInForm.financials.amountPaid),
            description: `Walk-in Advance - ${walkInForm.guestDetails.firstName} ${walkInForm.guestDetails.lastName}`,
            paymentMode: 'Cash', // Default for walk-ins
            date: new Date(),
            recordedBy: 'FrontDesk'
          });
      }

      setIsWalkInOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Walk-in booking failed');
    }
  };

  const handlePrint = (booking) => {
    const printWindow = window.open('', '_blank');
    const balance = booking.financials.balance;

    const html = `
      <html>
        <head>
          <title>Invoice - ${booking.guestDetails.firstName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Playfair+Display:wght@700&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1A2B48; padding: 40px; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1A2B48; padding-bottom: 20px; margin-bottom: 30px; }
            .hotel-name { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: bold; color: #BFA37E; margin: 0; }
            .invoice-title { font-size: 32px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #F8FAFC; padding: 12px; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #E2E8F0; }
            td { padding: 12px; font-size: 13px; border-bottom: 1px solid #F1F5F9; }
            .total-row { background: #1A2B48; color: white; }
            .total-row td { border: none; font-weight: bold; font-size: 16px; padding: 15px; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94A3B8; text-transform: uppercase; }
            .status-stamp { position: absolute; top: 150px; right: 50px; border: 4px solid ${balance <= 0 ? '#27AE60' : '#E74C3C'}; color: ${balance <= 0 ? '#27AE60' : '#E74C3C'}; padding: 10px 20px; font-size: 24px; font-weight: bold; transform: rotate(-15deg); opacity: 0.2; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="status-stamp">${balance <= 0 ? 'Fully Paid' : 'Balance Due'}</div>
          <div class="header">
            <div>
              <h1 class="hotel-name">HOTEL BHOPAL INN</h1>
              <div style="font-size: 10px; color: #64748B; margin-top: 5px;">M.P. NAGAR, BHOPAL | +91 7470795199 | bookings@bhopalinn.com</div>
            </div>
            <div style="text-align: right;">
              <div class="invoice-title">Invoice</div>
              <div style="font-size: 12px; font-weight: bold;">#BK-${booking._id.slice(-8).toUpperCase()}</div>
              <div style="font-size: 10px; color: #64748B;">DATE: ${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div style="margin-bottom: 30px; padding: 20px; background: #F8FAFC; border-radius: 4px;">
            <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; color: #1A2B48;">Guest Details</div>
            <div style="font-size: 14px; font-weight: bold;">${booking.guestDetails.firstName} ${booking.guestDetails.lastName}</div>
            <div style="font-size: 12px; color: #64748B;">Phone: ${booking.guestDetails.phone}</div>
            <div style="font-size: 12px; color: #64748B;">Stay: ${new Date(booking.checkInDate).toLocaleDateString()} to ${new Date(booking.checkOutDate).toLocaleDateString()}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Room Tariff (${booking.roomCategory?.title})</td>
                <td style="text-align: right;">₹${booking.financials.roomTariff?.toLocaleString()}</td>
              </tr>
              ${booking.financials.extraCharges?.map(charge => `
                <tr>
                  <td>${charge.description} (${charge.source})</td>
                  <td style="text-align: right;">₹${charge.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr style="height: 20px;"></tr>
              <tr class="total-row">
                <td style="text-align: right;">Total Billable Amount</td>
                <td style="text-align: right;">₹${booking.financials.totalAmount?.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="text-align: right;">Total Amount Paid</td>
                <td style="text-align: right;">₹${booking.financials.amountPaid?.toLocaleString()}</td>
              </tr>
              <tr style="font-weight: bold; font-size: 18px; color: #1A2B48;">
                <td style="text-align: right; padding-top: 20px; border-top: 2px solid #1A2B48;">Net Balance Payable</td>
                <td style="text-align: right; padding-top: 20px; border-top: 2px solid #1A2B48;">₹${booking.financials.balance?.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="space-y-6 font-sans p-6 bg-slate-50 min-h-screen">
      {/* Dynamic Summary Bar */}
      <div className="grid grid-cols-5 shadow-2xl rounded-sm overflow-hidden border border-slate-200 bg-white">
        <SummaryCard label="Check-Ins" value={stats.checkIns} color="bg-emerald-500" />
        <SummaryCard label="Check-Outs" value={stats.checkOuts} color="bg-rose-500" />
        <SummaryCard label="In-House" value={stats.inHouse} color="bg-indigo-500" />
        <SummaryCard label="Available" value={stats.available} color="bg-cyan-600" />
        <div className="flex flex-col items-center justify-center p-4 border-l bg-slate-50">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Sync</span>
             <div className="flex items-center gap-2 text-emerald-600 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>
                <span className="text-xs font-bold uppercase">Live</span>
             </div>
        </div>
      </div>

      {/* Unified Tracker Dashboard */}
      <div className="bg-white rounded-sm shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-[#1A2B48] p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-white text-sm font-bold uppercase tracking-widest">Unified Front Desk Dashboard</h2>
            <button onClick={fetchData} className="text-white/40 hover:text-white transition-colors">
              <History size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <button onClick={() => setIsWalkInOpen(true)} className="bg-[#BFA37E] hover:bg-[#a68d6d] text-white px-6 py-2 rounded-sm text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg">
            <Plus size={16} /> New Walk-In
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[#1A2B48] text-[10px] font-bold uppercase tracking-widest border-b border-slate-200">
                <th className="px-6 py-4">Room</th>
                <th className="px-6 py-4">Guest Info</th>
                <th className="px-6 py-4">Stay Window</th>
                <th className="px-6 py-4 text-center">Source</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {loading && bookings.length === 0 ? (
                <tr><td colSpan="7" className="p-12 text-center text-slate-400 uppercase font-bold tracking-widest">Syncing Dashboard...</td></tr>
              ) : bookings.map((booking) => (
                <tr key={booking._id} onClick={() => { setSelectedBooking(booking); setIsDetailOpen(true); }} className="border-b hover:bg-emerald-50/50 cursor-pointer transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                        <span className="text-lg font-black text-[#1A2B48]">{booking.roomUnit?.roomNumber || '---'}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{booking.roomCategory?.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">{booking.guestDetails.firstName} {booking.guestDetails.lastName}</span>
                        <span className="text-slate-500">{booking.guestDetails.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-medium">
                    <div className="flex items-center gap-2 text-slate-600">
                        <span>{formatDate(booking.checkInDate)}</span>
                        <ArrowRight size={12} />
                        <span>{formatDate(booking.checkOutDate)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1 rounded-sm text-[9px] font-black uppercase ${
                        booking.source === 'Website' ? 'bg-blue-100 text-blue-800' : 
                        booking.source === 'Walk-in' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {booking.source}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${
                        booking.status === 'Checked-In' ? 'bg-emerald-500 text-white' : 
                        booking.status === 'Confirmed' ? 'bg-amber-500 text-white' : 'bg-slate-400 text-white'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-black">
                    {booking.financials.balance > 0 ? 
                        <span className="text-rose-600">₹{booking.financials.balance.toLocaleString()}</span> : 
                        <span className="text-emerald-600">PAID ✓</span>
                    }
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="text-slate-300 group-hover:text-[#1A2B48] transition-colors"><ChevronRight size={20}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Guest Detail Panel */}
      {isDetailOpen && selectedBooking && (
        <div className="fixed inset-0 bg-[#1A2B48]/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-white border-b p-6 flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black text-[#1A2B48] uppercase">Guest Journey Details</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Booking Ref: #{selectedBooking._id.slice(-8).toUpperCase()}</p>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="bg-slate-100 hover:bg-rose-100 hover:text-rose-600 p-2 rounded-full transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6">
              {/* Alert for Balance Due */}
              {selectedBooking.checkoutError && (
                <div className="mb-6 bg-rose-600 text-white p-4 rounded-sm flex items-center justify-between animate-bounce shadow-xl border-4 border-rose-800">
                    <div className="flex items-center gap-4">
                        <AlertTriangle size={32} />
                        <div>
                            <p className="font-black text-lg">{selectedBooking.checkoutError}</p>
                            <p className="text-xs uppercase font-bold opacity-80">COLLECT FULL PAYMENT BEFORE CHECKOUT OR USE MANAGER OVERRIDE</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleCheckOut(selectedBooking._id, true)}
                        className="bg-white text-rose-600 px-6 py-2 rounded-sm font-black text-xs uppercase"
                    >
                        Manager Override
                    </button>
                </div>
              )}

              <div className="grid grid-cols-12 gap-8">
                {/* Left Column: Info */}
                <div className="col-span-8 space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 border rounded-sm">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Guest Primary</label>
                            <p className="text-lg font-black">{selectedBooking.guestDetails.firstName} {selectedBooking.guestDetails.lastName}</p>
                            <p className="text-sm text-slate-600">{selectedBooking.guestDetails.phone} | {selectedBooking.guestDetails.email || 'No Email'}</p>
                        </div>
                        <div className="p-4 bg-slate-50 border rounded-sm">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Stay Duration</label>
                            <p className="text-lg font-black">{formatDate(selectedBooking.checkInDate)} - {formatDate(selectedBooking.checkOutDate)}</p>
                            <p className="text-sm text-slate-600">Assigned: {selectedBooking.roomUnit?.roomNumber || 'PENDING'} ({selectedBooking.roomCategory?.title})</p>
                        </div>
                    </div>

                    {/* Financial Ledger */}
                    <div className="border rounded-sm overflow-hidden">
                        <div className="bg-slate-100 p-3 flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase">Financial Ledger / Bill Details</span>
                            <button onClick={() => {
                                const desc = prompt("Charge Description:");
                                const amt = prompt("Amount (₹):");
                                if(desc && amt) addCharge(selectedBooking._id, desc, Number(amt));
                            }} className="text-[10px] font-bold uppercase text-indigo-600 hover:underline">+ Add F&B Charge</button>
                        </div>
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b bg-white">
                                    <th className="p-3 text-left">Description</th>
                                    <th className="p-3 text-center">Source</th>
                                    <th className="p-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b">
                                    <td className="p-3">Room Accommodation Charge</td>
                                    <td className="p-3 text-center"><span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-bold">STAY</span></td>
                                    <td className="p-3 text-right font-bold">₹{selectedBooking.financials.roomTariff?.toLocaleString()}</td>
                                </tr>
                                {selectedBooking.financials?.extraCharges?.map((c, i) => (
                                    <tr key={i} className="border-b">
                                        <td className="p-3">{c.description}</td>
                                        <td className="p-3 text-center"><span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">{c.source}</span></td>
                                        <td className="p-3 text-right font-bold">₹{c.amount?.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-[#1A2B48] text-white">
                                    <td colSpan="2" className="p-3 text-right font-bold">GROSS TOTAL</td>
                                    <td className="p-3 text-right font-black">₹{selectedBooking.financials.totalAmount?.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Payment Audit History */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <History size={16} className="text-slate-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Transaction Audit Log</span>
                        </div>
                        <div className="space-y-2">
                            {selectedBooking.financials?.paymentHistory?.map((p, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-emerald-50 border border-emerald-100 rounded-sm">
                                    <div className="flex gap-4 items-center">
                                        <CheckCircle2 size={16} className="text-emerald-600" />
                                        <div>
                                            <p className="text-xs font-bold text-emerald-900">₹{p.amount?.toLocaleString()} - {p.mode}</p>
                                            <p className="text-[9px] text-emerald-600 font-bold uppercase">{new Date(p.timestamp).toLocaleString()} | Collected by: {p.staff}</p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-black text-emerald-700 uppercase">Verified</span>
                                </div>
                            ))}
                            {(selectedBooking.financials?.paymentHistory?.length || 0) === 0 && <p className="text-xs text-slate-400 italic">No payments logged for this journey.</p>}
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions */}
                <div className="col-span-4 space-y-4">
                    <div className="bg-rose-50 border border-rose-100 p-6 rounded-sm text-center">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-2">Net Balance Due</span>
                        <p className="text-4xl font-black text-rose-600 mb-4">₹{selectedBooking.financials.balance?.toLocaleString()}</p>
                        <button 
                            onClick={() => {
                                const amt = prompt("Amount to Collect (₹):", selectedBooking.financials.balance);
                                const mode = prompt("Payment Mode (Cash/UPI/Card):", "Cash");
                                if(amt && mode) collectPayment(selectedBooking._id, amt, mode);
                            }}
                            className="w-full bg-[#1A2B48] text-white py-4 font-black text-xs uppercase shadow-xl hover:bg-[#253d66] transition-all"
                        >
                            Collect Payment
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <ActionButton 
                            icon={<CheckCircle2 size={18} />} 
                            label="Mark Check-In" 
                            color="bg-emerald-600" 
                            onClick={() => setIsCheckInModalOpen(true)}
                            disabled={selectedBooking.status !== 'Confirmed' && selectedBooking.status !== 'Pending'}
                        />
                        <ActionButton 
                            icon={<Printer size={18} />} 
                            label="Print Final Bill" 
                            color="bg-indigo-600" 
                            onClick={() => handlePrint(selectedBooking)}
                        />
                        <ActionButton 
                            icon={<Coffee size={18} />} 
                            label="Add F&B Order" 
                            color="bg-amber-600" 
                            onClick={() => setIsFBModalOpen(true)}
                        />
                        <ActionButton 
                            icon={<LogOut size={18} />} 
                            label="Complete Checkout" 
                            color="bg-rose-600" 
                            onClick={() => handleCheckOut(selectedBooking._id)}
                            disabled={selectedBooking.status !== 'Checked-In'}
                        />
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check-In Modal */}
      {isCheckInModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-[#1A2B48]/95 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-sm shadow-2xl p-8 border-t-8 border-emerald-500">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-[#1A2B48] uppercase tracking-widest">Guest Check-In</h3>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Guest Name</p>
                    <p className="text-sm font-bold text-emerald-600">{selectedBooking.guestDetails.firstName} {selectedBooking.guestDetails.lastName}</p>
                </div>
            </div>
            <form onSubmit={handleCheckIn} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Select Room Unit</label>
                <select 
                  className="w-full border-2 border-slate-200 p-4 text-sm focus:outline-none focus:border-emerald-500 font-bold transition-all"
                  value={checkInForm.roomUnit}
                  onChange={e => setCheckInForm({...checkInForm, roomUnit: e.target.value})}
                  required
                >
                  <option value="">-- Choose Assigned Unit --</option>
                  <optgroup label="RECOMENDED FOR THIS CATEGORY">
                    {availableUnits
                      .filter(u => {
                        if (!u.category || !selectedBooking.roomCategory) return false;
                        const uCatId = (u.category?._id || u.category).toString();
                        const bCatId = (selectedBooking.roomCategory?._id || selectedBooking.roomCategory).toString();
                        return uCatId === bCatId;
                      })
                      .map(u => (
                        <option key={u._id} value={u._id} disabled={u.status === 'Occupied' || u.status === 'Maintenance'}>
                          Room {u.roomNumber} ({u.category?.title || u.category?.category || 'No Category'}) {u.status === 'Dirty' ? '⚠️ Dirty' : '✓ Ready'}
                        </option>
                      ))
                    }
                  </optgroup>
                  <optgroup label="OTHER AVAILABLE ROOMS (OVERRIDE)">
                    {availableUnits
                      .filter(u => {
                        if (!u.category || !selectedBooking.roomCategory) return true;
                        const uCatId = (u.category?._id || u.category).toString();
                        const bCatId = (selectedBooking.roomCategory?._id || selectedBooking.roomCategory).toString();
                        return uCatId !== bCatId;
                      })
                      .map(u => (
                        <option key={u._id} value={u._id} disabled={u.status === 'Occupied' || u.status === 'Maintenance'}>
                          Room {u.roomNumber} ({u.category?.title || u.category?.category || 'No Category'}) - {u.status}
                        </option>
                      ))
                    }
                  </optgroup>
                </select>
                {availableUnits.find(u => u._id === checkInForm.roomUnit)?.status === 'Occupied' && (
                  <p className="text-xs text-rose-600 font-bold mt-2 uppercase flex items-center gap-2">
                    <AlertTriangle size={14} /> THIS ROOM IS NOT YET CHECKED OUT BY PREVIOUS GUEST.
                  </p>
                )}
                {availableUnits.find(u => u._id === checkInForm.roomUnit)?.status === 'Dirty' && (
                  <p className="text-xs text-orange-600 font-bold mt-2 uppercase flex items-center gap-2">
                    <AlertTriangle size={14} /> THIS ROOM IS CURRENTLY DIRTY.
                  </p>
                )}
                {availableUnits.length === 0 && (
                  <p className="text-xs text-rose-600 font-bold mt-2 uppercase flex items-center gap-2">
                    <AlertTriangle size={14} /> NO ROOMS CREATED IN SYSTEM. PLEASE GO TO ROOM MANAGEMENT.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">ID Proof Number</label>
                <input 
                  type="text" 
                  placeholder="Enter Aadhaar / Passport / Voter ID"
                  className="w-full border-2 border-slate-200 p-4 text-sm focus:outline-none focus:border-emerald-500 transition-all"
                  value={checkInForm.idProof}
                  onChange={e => setCheckInForm({...checkInForm, idProof: e.target.value})}
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsCheckInModalOpen(false)} className="flex-1 py-4 text-xs font-black uppercase text-slate-400 hover:text-[#1A2B48] transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-4 text-xs font-black uppercase shadow-lg hover:bg-emerald-700 transition-all">Confirm Check-In</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Walk-In Modal */}
      {isWalkInOpen && (
        <div className="fixed inset-0 bg-[#1A2B48]/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-sm p-8 shadow-2xl border-t-8 border-[#BFA37E]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-[#1A2B48] uppercase">New Walk-In Registration</h3>
              <button onClick={() => setIsWalkInOpen(false)} className="bg-slate-100 p-2 rounded-full"><X size={24}/></button>
            </div>
            <form onSubmit={handleWalkInSubmit} className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <InputField label="First Name" value={walkInForm.guestDetails.firstName} onChange={v => setWalkInForm({...walkInForm, guestDetails: {...walkInForm.guestDetails, firstName: v}})} />
                  <InputField label="Last Name" value={walkInForm.guestDetails.lastName} onChange={v => setWalkInForm({...walkInForm, guestDetails: {...walkInForm.guestDetails, lastName: v}})} />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Room Category</label>
                      <select className="w-full border-2 border-slate-200 p-3 text-sm" value={walkInForm.roomCategory} onChange={e => setWalkInForm({...walkInForm, roomCategory: e.target.value})} required>
                        <option value="">-- Select Category --</option>
                        {roomCategories.map(cat => <option key={cat._id} value={cat._id}>{cat.title}</option>)}
                      </select>
                  </div>
                  <InputField label="Room Tariff (Rack Rate)" type="number" value={walkInForm.financials.roomTariff} onChange={v => setWalkInForm({...walkInForm, financials: {...walkInForm.financials, roomTariff: Number(v), totalAmount: Number(v), balance: Number(v)}})} />
               </div>
               <div className="grid grid-cols-2 gap-6">
                    <InputField label="Check-In" type="date" value={walkInForm.checkInDate} onChange={v => setWalkInForm({...walkInForm, checkInDate: v})} />
                    <InputField label="Check-Out" type="date" value={walkInForm.checkOutDate} onChange={v => setWalkInForm({...walkInForm, checkOutDate: v})} />
               </div>
               <button type="submit" className="w-full bg-[#1A2B48] text-white py-5 font-black uppercase text-xs shadow-xl hover:bg-[#253d66] transition-all">Create Registration Entry</button>
            </form>
          </div>
        </div>
      )}

      {/* F&B Order Modal */}
      {isFBModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-sm shadow-2xl p-6 border-t-4 border-amber-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-[#1A2B48] uppercase">Add F&B Order</h3>
              <button onClick={() => setIsFBModalOpen(false)}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dinner / Breakfast / Drinks"
                  className="w-full border p-3 text-sm focus:outline-none focus:border-amber-500"
                  value={fbForm.description}
                  onChange={e => setFbForm({...fbForm, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Amount (₹)</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className="w-full border p-3 text-sm focus:outline-none focus:border-amber-500"
                  value={fbForm.amount}
                  onChange={e => setFbForm({...fbForm, amount: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => addCharge(selectedBooking._id, fbForm.description, Number(fbForm.amount), 'F&B')}
                  className="w-full bg-[#1A2B48] text-white py-3 font-black uppercase text-xs shadow-md hover:bg-[#253d66]"
                >
                  Add to Room Bill
                </button>
                <div className="flex items-center gap-2 py-2">
                  <div className="h-px bg-slate-200 flex-grow"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">OR</span>
                  <div className="h-px bg-slate-200 flex-grow"></div>
                </div>
                <button 
                  onClick={async () => {
                    if(!fbForm.amount || Number(fbForm.amount) <= 0) return;
                    try {
                      // 1. Add to bill first
                      await addCharge(selectedBooking._id, fbForm.description, Number(fbForm.amount), 'F&B');
                      // 2. Immediately collect payment
                      await collectPayment(selectedBooking._id, Number(fbForm.amount), 'Cash');
                      setIsFBModalOpen(false);
                    } catch (err) { console.error(err); }
                  }}
                  className="w-full bg-emerald-600 text-white py-4 font-black uppercase text-xs shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard size={14} /> Paid Now (Cash)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, color }) => (
    <div className={`p-6 text-white ${color} flex flex-col items-center justify-center border-r border-white/10`}>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{label}</span>
        <span className="text-3xl font-black mt-1 tracking-tighter">{value}</span>
    </div>
);

const ActionButton = ({ icon, label, color, onClick, disabled }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`w-full ${color} text-white p-4 rounded-sm flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale`}
    >
        {icon} {label}
    </button>
);

const InputField = ({ label, value, onChange, type = "text" }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full border-2 border-slate-200 p-3 text-sm focus:border-[#1A2B48] transition-all" required />
  </div>
);

const ChevronRight = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6"/>
    </svg>
);

export default FrontDeskManagement;
