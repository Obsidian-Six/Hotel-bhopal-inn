import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { 
  X, CheckCircle2, IndianRupee, Printer, LogOut, 
  Plus, Info, ArrowRight, User, Calendar, CreditCard, AlertTriangle, History, FastForward, Coffee, TrendingUp, BarChart3, CalendarPlus, Zap, Activity
} from 'lucide-react';
import { socket } from '@/lib/socket';
import FrontDeskAnalytics from './FrontDeskAnalytics';

const API_BASE = config.API_URL;

const FrontDeskManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ checkIns: 0, checkOuts: 0, inHouse: 0, available: 0 });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isExtendStayOpen, setIsExtendStayOpen] = useState(false);
  const [extendForm, setExtendForm] = useState({ newCheckOutDate: '', additionalTariff: '' });

  const [isCollectPaymentOpen, setIsCollectPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', mode: 'Cash' });

  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);
  const [meterForm, setMeterForm] = useState({
    date: new Date().toISOString().split('T')[0],
    reading: '',
    notes: ''
  });
  const [meterReadings, setMeterReadings] = useState([]);

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
    guestDetails: { firstName: '', lastName: '', phone: '', email: '', idProof: '', adults: 2, children: 0 },
    roomCategory: '',
    roomUnit: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    financials: { roomTariff: 0, amountPaid: 0, totalAmount: 0, balance: 0 },
    source: 'Walk-in',
    otaPlatform: '',
    otaReferenceId: '',
    roomPlan: 'EP',
    immediateCheckIn: false
  });

  // Calculate Walk-in Financials dynamically based on stay duration
  useEffect(() => {
    const checkIn = new Date(walkInForm.checkInDate);
    const checkOut = new Date(walkInForm.checkOutDate);
    const diffTime = checkOut - checkIn;
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const calculatedTotal = walkInForm.financials.roomTariff * nights;
    const calculatedBalance = calculatedTotal - walkInForm.financials.amountPaid;

    if (calculatedTotal !== walkInForm.financials.totalAmount || calculatedBalance !== walkInForm.financials.balance) {
      setWalkInForm(prev => ({
        ...prev,
        financials: {
          ...prev.financials,
          totalAmount: calculatedTotal,
          balance: calculatedBalance
        }
      }));
    }
  }, [walkInForm.checkInDate, walkInForm.checkOutDate, walkInForm.financials.roomTariff, walkInForm.financials.amountPaid]);

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
      const payload = {
        guestDetails: walkInForm.guestDetails,
        roomCategory: walkInForm.roomCategory,
        roomUnit: walkInForm.immediateCheckIn ? walkInForm.roomUnit : null,
        checkInDate: walkInForm.checkInDate,
        checkOutDate: walkInForm.checkOutDate,
        financials: walkInForm.financials,
        source: walkInForm.source,
        otaPlatform: walkInForm.otaPlatform,
        otaReferenceId: walkInForm.otaReferenceId,
        roomPlan: walkInForm.roomPlan,
        immediateCheckIn: walkInForm.immediateCheckIn
      };

      await axios.post(`${API_BASE}/api/bookings/walk-in`, payload);
      
      // Record Advance Payment in Finance if exists
      if (walkInForm.financials.amountPaid > 0) {
          await axios.post(`${API_BASE}/api/finance/transactions`, {
            type: 'Income',
            category: 'Room Rent',
            amount: Number(walkInForm.financials.amountPaid),
            description: `Walk-in Advance (${walkInForm.source}) - ${walkInForm.guestDetails.firstName} ${walkInForm.guestDetails.lastName}`,
            paymentMode: 'Cash', // Default for walk-ins
            date: new Date(),
            recordedBy: 'FrontDesk'
          });
      }

      setIsWalkInOpen(false);
      // Reset form state
      setWalkInForm({
        guestDetails: { firstName: '', lastName: '', phone: '', email: '', idProof: '', adults: 2, children: 0 },
        roomCategory: '',
        roomUnit: '',
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        financials: { roomTariff: 0, amountPaid: 0, totalAmount: 0, balance: 0 },
        source: 'Walk-in',
        otaPlatform: '',
        otaReferenceId: '',
        roomPlan: 'EP',
        immediateCheckIn: false
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Walk-in booking failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExtendStaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      const res = await axios.post(`${API_BASE}/api/bookings/${selectedBooking._id}/extend-stay`, {
        newCheckOutDate: extendForm.newCheckOutDate,
        additionalTariff: extendForm.additionalTariff
      });
      
      alert('Stay extended successfully! Inventory calendar updated.');
      setIsExtendStayOpen(false);
      fetchData();
      setSelectedBooking(res.data);
    } catch (err) {
      console.error(err);
      alert('Extend stay failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const fetchMeterReadings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/finance/meter-readings`);
      if (res.data) setMeterReadings(res.data);
    } catch (err) {
      console.error('Error fetching meter readings:', err);
    }
  };

  const handleMeterSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/finance/meter-reading`, {
        date: meterForm.date,
        reading: Number(meterForm.reading),
        notes: meterForm.notes,
        recordedBy: 'Front Desk'
      });
      alert('Electricity meter reading saved successfully!');
      setMeterForm({ date: new Date().toISOString().split('T')[0], reading: '', notes: '' });
      setIsMeterModalOpen(false);
      fetchMeterReadings();
    } catch (err) {
      console.error(err);
      alert('Failed to save meter reading: ' + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    if (isMeterModalOpen) {
      fetchMeterReadings();
    }
  }, [isMeterModalOpen]);

  const handlePrint = (booking) => {
    const printWindow = window.open('', '_blank');
    
    // Calculate total days
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    // Separate Lodging and Extra Guest charges
    const extraGuestCharge = booking.financials.extraCharges?.find(c => 
      c.description.toLowerCase().includes('extra') || c.source.toLowerCase().includes('guest')
    )?.amount || 0;
    
    const otherCharges = booking.financials.extraCharges?.filter(c => 
      !c.description.toLowerCase().includes('extra') && !c.source.toLowerCase().includes('guest')
    ) || [];

    const html = `
      <html>
        <head>
          <title>Invoice - ${booking.guestDetails.firstName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Roboto:wght@400;700;900&display=swap');
            
            body { 
              font-family: 'Courier Prime', monospace; 
              color: #000; 
              padding: 20px; 
              line-height: 1.2;
              background: #fff;
            }
            
            .bill-container {
              width: 210mm;
              margin: 0 auto;
              border: 1px solid #ddd;
              padding: 20px;
              position: relative;
            }

            .header {
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }

            .header-top {
              width: 100%;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 10px;
            }

            .logo-house {
              width: 80px;
              height: 80px;
              border: 4px solid #BFA37E;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: 'Roboto', sans-serif;
              font-size: 40px;
              font-weight: 900;
              color: #1A2B48;
              position: relative;
            }

            .logo-house:after {
              content: '';
              position: absolute;
              top: -20px;
              left: -4px;
              width: 0;
              height: 0;
              border-left: 44px solid transparent;
              border-right: 44px solid transparent;
              border-bottom: 20px solid #BFA37E;
            }

            .sl-no {
              font-weight: bold;
              font-size: 18px;
            }
            .sl-no span { color: #E74C3C; }

            .hotel-main-info {
              text-align: center;
              flex-grow: 1;
            }

            .hotel-name {
              font-family: 'Roboto', sans-serif;
              font-size: 32px;
              font-weight: 900;
              margin: 0;
              letter-spacing: 1px;
            }
            .hotel-name .by { font-size: 16px; font-weight: normal; font-style: italic; color: #666; margin: 0 5px; }
            .hotel-name .tenonten { color: #BFA37E; }

            .address {
              font-size: 12px;
              margin: 5px 0;
              font-weight: bold;
            }

            .contact-info {
              width: 100%;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              font-weight: bold;
              margin-top: 10px;
            }

            .guest-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 20px;
            }

            .field-row {
              margin-bottom: 10px;
              display: flex;
              align-items: flex-end;
            }

            .label {
              white-space: nowrap;
              margin-right: 10px;
              font-weight: bold;
            }

            .value {
              flex-grow: 1;
              border-bottom: 1px dotted #000;
              padding-left: 10px;
              min-height: 1.2em;
            }

            .bill-grid {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            .bill-grid th, .bill-grid td {
              border: 1.5px solid #000;
              padding: 8px;
              text-align: left;
            }

            .bill-grid th {
              background: #f0f0f0;
            }

            .amount-col {
              width: 150px;
              text-align: right !important;
            }

            .total-section {
              margin-top: 30px;
              display: flex;
              justify-content: flex-end;
            }

            .total-table {
              width: 300px;
              border-collapse: collapse;
            }

            .total-table td {
              padding: 5px;
              border-bottom: 1px solid #000;
            }

            .total-table .final-total {
              font-weight: bold;
              font-size: 18px;
              background: #f0f0f0;
            }

            .footer-note {
              margin-top: 40px;
              font-size: 12px;
              text-align: center;
              font-style: italic;
            }

            .jurisdiction {
              position: absolute;
              top: 100px;
              right: 20px;
              font-size: 10px;
              font-weight: bold;
              transform: rotate(0deg);
            }

            @media print {
              body { padding: 0; }
              .bill-container { border: none; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="bill-container">
            <div class="jurisdiction">(Under Bhopal Jurisdiction)</div>
            <div class="header">
              <div class="header-top">
                <div class="logo-house">18</div>
                <div class="hotel-main-info">
                  <h1 class="hotel-name">HOTEL BHOPAL INN <span class="by">by</span> <span class="tenonten">TENONTEN STAYS</span></h1>
                  <p class="address">Add.: D2-214, Danish Nagar, Behind Ashima Mall, Hoshangabad Road, Bhopal-462026</p>
                </div>
                <div class="sl-no">SL. NO. <span>${Math.floor(100 + Math.random() * 900)}</span></div>
              </div>
              <div class="contact-info">
                <span>Mob.: 7225-888650, +91 9630732562</span>
                <span>Date: ${new Date().toLocaleDateString('en-GB')}</span>
                <span>GST : 23AAXFT4552...</span>
              </div>
            </div>

            <div class="guest-details">
              <div class="left-col">
                <div class="field-row"><span class="label">Name:</span> <span class="value">${booking.guestDetails.firstName} ${booking.guestDetails.lastName}</span></div>
                <div class="field-row"><span class="label">From:</span> <span class="value">${booking.guestDetails.city || '--------------------'}</span></div>
                <div class="field-row"><span class="label">No. of Person:</span> <span class="value">${(Number(booking.guestDetails.adults) || 0) + (Number(booking.guestDetails.children) || 0)}</span></div>
                <div class="field-row"><span class="label">Room Plan:</span> <span class="value">${booking.roomPlan || 'EP'}</span></div>
              </div>
              <div class="right-col">
                <div class="field-row"><span class="label">Room No.:</span> <span class="value">${booking.roomUnit?.roomNumber || '---'}</span></div>
                <div class="field-row"><span class="label">Reg. S. No.:</span> <span class="value">BK-${booking._id.slice(-6).toUpperCase()}</span></div>
                <div class="field-row"><span class="label">Source / Platform:</span> <span class="value">${booking.source || 'Walk-in'} ${booking.otaReferenceId ? `(Ref: ${booking.otaReferenceId})` : ''}</span></div>
              </div>
            </div>

            <div class="guest-details" style="grid-template-columns: 1fr 1fr; margin-top: -10px;">
                <div class="field-row">
                    <span class="label">Arrival:</span> 
                    <span class="label">Date</span> <span class="value">${new Date(booking.checkInDate).toLocaleDateString('en-GB')}</span>
                    <span class="label" style="margin-left: 10px;">Time</span> <span class="value">${new Date(booking.checkInDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div class="field-row">
                    <span class="label">Departure:</span> 
                    <span class="label">Date</span> <span class="value">${new Date(booking.checkOutDate).toLocaleDateString('en-GB')}</span>
                    <span class="label" style="margin-left: 10px;">Time</span> <span class="value">${new Date(booking.checkOutDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            </div>

            <table class="bill-grid">
              <thead>
                <tr>
                  <th>Particulars / Details</th>
                  <th class="amount-col">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>TOTAL NO. OF DAYS</td>
                  <td class="amount-col">${diffDays}</td>
                </tr>
                <tr>
                  <td>Lodging (${booking.roomCategory?.title})</td>
                  <td class="amount-col">${booking.financials.roomTariff?.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Extra Guest Charge</td>
                  <td class="amount-col">${extraGuestCharge > 0 ? extraGuestCharge.toLocaleString() : '-'}</td>
                </tr>
                ${otherCharges.map(charge => `
                  <tr>
                    <td>${charge.description} (${charge.source})</td>
                    <td class="amount-col">${charge.amount.toLocaleString()}</td>
                  </tr>
                `).join('')}
                <!-- Fill remaining rows to look like a bill book -->
                ${Array(Math.max(0, 5 - otherCharges.length)).fill(0).map(() => `
                  <tr style="height: 30px;">
                    <td></td>
                    <td class="amount-col"></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total-section">
              <table class="total-table">
                <tr>
                  <td>Total Billable Amount:</td>
                  <td class="amount-col">₹${booking.financials.totalAmount?.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Total Amount Paid:</td>
                  <td class="amount-col">₹${booking.financials.amountPaid?.toLocaleString()}</td>
                </tr>
                <tr class="final-total">
                  <td><strong>Net Balance Payable:</strong></td>
                  <td class="amount-col"><strong>₹${booking.financials.balance?.toLocaleString()}</strong></td>
                </tr>
              </table>
            </div>

            <div class="footer-note">
              <p>Thank you for staying with us! Please visit again.</p>
              <div style="display: flex; justify-content: space-between; margin-top: 50px;">
                <div style="border-top: 1px solid #000; width: 150px; padding-top: 5px;">Guest Signature</div>
                <div style="border-top: 1px solid #000; width: 150px; padding-top: 5px;">Manager Signature</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { 
              // Small delay to ensure styles are loaded
              setTimeout(() => {
                window.print(); 
              }, 500);
            }
          </script>
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
      {/* Top Electricity Meter Tracker Bar (Requirement 3) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 border border-amber-500/40 shadow-md rounded-sm gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-600 rounded">
            <Zap size={20} className="fill-amber-500" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-[#1A2B48] tracking-wider">Electricity Meter Reading Tracker</h3>
            <p className="text-[10px] text-slate-500 font-semibold">Record daily kWh readings for Front Desk & Financial Analytics</p>
          </div>
        </div>
        <button 
          onClick={() => setIsMeterModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2.5 rounded-sm text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-95"
        >
          <Zap size={14} className="fill-slate-950" /> Enter Meter Readings
        </button>
      </div>

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
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-[#BFA37E] uppercase tracking-widest hidden md:inline bg-[#BFA37E]/10 px-2.5 py-1 rounded border border-[#BFA37E]/20">
              Front Desk Intelligence
            </span>
            <button 
              onClick={() => setIsAnalyticsOpen(true)} 
              className="bg-[#BFA37E] hover:bg-[#a68d6d] text-slate-950 px-5 py-2 rounded-sm text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <TrendingUp size={16} /> Analytics
            </button>
            <button onClick={() => setIsWalkInOpen(true)} className="bg-white hover:bg-slate-100 text-[#1A2B48] px-6 py-2 rounded-sm text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg">
              <Plus size={16} /> New Walk-In
            </button>
          </div>
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
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded border border-amber-200">
                                Meal Plan: {selectedBooking.roomPlan || 'EP'}
                              </span>
                              <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded border border-blue-200">
                                Platform: {selectedBooking.source} {selectedBooking.otaReferenceId ? `(#${selectedBooking.otaReferenceId})` : ''}
                              </span>
                            </div>
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
                                setPaymentForm({ amount: selectedBooking.financials.balance || 0, mode: 'Cash' });
                                setIsCollectPaymentOpen(true);
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
                            icon={<CalendarPlus size={18} />} 
                            label="Extend Stay" 
                            color="bg-cyan-700 hover:bg-cyan-800" 
                            onClick={() => {
                              const currOut = selectedBooking.checkOutDate ? new Date(selectedBooking.checkOutDate).toISOString().split('T')[0] : '';
                              const nextDay = currOut ? new Date(new Date(currOut).getTime() + 86400000).toISOString().split('T')[0] : '';
                              setExtendForm({ newCheckOutDate: nextDay, additionalTariff: '' });
                              setIsExtendStayOpen(true);
                            }}
                            disabled={selectedBooking.status === 'Checked-Out' || selectedBooking.status === 'Cancelled'}
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
        <div className="fixed inset-0 bg-[#1A2B48]/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-sm p-8 shadow-2xl border-t-8 border-[#BFA37E] my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-[#1A2B48] uppercase">New Walk-In Registration</h3>
              <button onClick={() => setIsWalkInOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleWalkInSubmit} className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <InputField label="First Name" value={walkInForm.guestDetails.firstName} onChange={v => setWalkInForm({...walkInForm, guestDetails: {...walkInForm.guestDetails, firstName: v}})} />
                  <InputField label="Last Name" value={walkInForm.guestDetails.lastName} onChange={v => setWalkInForm({...walkInForm, guestDetails: {...walkInForm.guestDetails, lastName: v}})} />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <InputField label="Phone" value={walkInForm.guestDetails.phone} onChange={v => setWalkInForm({...walkInForm, guestDetails: {...walkInForm.guestDetails, phone: v}})} required={true} />
                  <InputField label="Email" type="email" value={walkInForm.guestDetails.email} onChange={v => setWalkInForm({...walkInForm, guestDetails: {...walkInForm.guestDetails, email: v}})} required={false} />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Room Category</label>
                      <select className="w-full border-2 border-slate-200 p-3 text-sm focus:border-[#1A2B48] transition-all font-semibold focus:outline-none" value={walkInForm.roomCategory} onChange={e => setWalkInForm({...walkInForm, roomCategory: e.target.value})} required>
                        <option value="">-- Select Category --</option>
                        {roomCategories.map(cat => <option key={cat._id} value={cat._id}>{cat.title}</option>)}
                      </select>
                  </div>
                  <InputField label="Room Tariff (Rack Rate / Night)" type="number" value={walkInForm.financials.roomTariff} onChange={v => setWalkInForm({...walkInForm, financials: {...walkInForm.financials, roomTariff: Number(v)}})} />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <InputField label="Check-In" type="date" value={walkInForm.checkInDate} onChange={v => setWalkInForm({...walkInForm, checkInDate: v})} />
                  <InputField label="Check-Out" type="date" value={walkInForm.checkOutDate} onChange={v => setWalkInForm({...walkInForm, checkOutDate: v})} />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <InputField label="Adults" type="number" value={walkInForm.guestDetails.adults} onChange={v => setWalkInForm({...walkInForm, guestDetails: {...walkInForm.guestDetails, adults: Number(v)}})} />
                  <InputField label="Children" type="number" value={walkInForm.guestDetails.children} onChange={v => setWalkInForm({...walkInForm, guestDetails: {...walkInForm.guestDetails, children: Number(v)}})} />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <InputField label="Advance Paid" type="number" value={walkInForm.financials.amountPaid} onChange={v => setWalkInForm({...walkInForm, financials: {...walkInForm.financials, amountPaid: Number(v)}})} required={false} />
                  <InputField label="ID Proof Number" value={walkInForm.guestDetails.idProof} onChange={v => setWalkInForm({...walkInForm, guestDetails: {...walkInForm.guestDetails, idProof: v}})} required={false} />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Booking Source / OTA Platform</label>
                      <select 
                        className="w-full border-2 border-slate-200 p-3 text-sm focus:border-[#1A2B48] transition-all font-semibold focus:outline-none" 
                        value={walkInForm.source} 
                        onChange={e => setWalkInForm({...walkInForm, source: e.target.value, otaPlatform: e.target.value !== 'Walk-in' && e.target.value !== 'Website' ? e.target.value : ''})} 
                        required
                      >
                        <option value="Walk-in">Direct Walk-in</option>
                        <option value="Booking.com">Booking.com</option>
                        <option value="MakeMyTrip">MakeMyTrip</option>
                        <option value="Goibibo">Goibibo</option>
                        <option value="Agoda">Agoda</option>
                        <option value="Expedia">Expedia</option>
                        <option value="Airbnb">Airbnb</option>
                        <option value="OTA">Other OTA Channel</option>
                        <option value="Website">Direct Website</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Room Plan / Meal Plan</label>
                      <select 
                        className="w-full border-2 border-slate-200 p-3 text-sm focus:border-[#1A2B48] transition-all font-semibold focus:outline-none" 
                        value={walkInForm.roomPlan} 
                        onChange={e => setWalkInForm({...walkInForm, roomPlan: e.target.value})} 
                        required
                      >
                        <option value="EP">EP — European Plan (Room Only)</option>
                        <option value="CP">CP — Continental Plan (Room + Breakfast)</option>
                        <option value="MAP">MAP — Modified American (Breakfast + Dinner)</option>
                        <option value="AP">AP — American Plan (Room + All Meals)</option>
                      </select>
                  </div>
               </div>

               {walkInForm.source !== 'Walk-in' && walkInForm.source !== 'Website' && (
                 <div className="grid grid-cols-1 gap-6">
                   <InputField 
                     label="OTA Reference ID / Confirmation Number" 
                     value={walkInForm.otaReferenceId} 
                     onChange={v => setWalkInForm({...walkInForm, otaReferenceId: v})} 
                     required={false} 
                     placeholder="e.g. BK-98723412 or MMT-6543"
                   />
                 </div>
               )}

               <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 transition-colors border border-dashed border-slate-200 rounded-sm">
                          <input 
                              type="checkbox" 
                              checked={walkInForm.immediateCheckIn} 
                              onChange={e => setWalkInForm({...walkInForm, immediateCheckIn: e.target.checked})} 
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                          />
                          <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-slate-700">Immediate Check-In</span>
                              <span className="text-[9px] text-slate-400">Check in guest and occupy room unit now</span>
                          </div>
                      </label>
                  </div>
               </div>

               {walkInForm.immediateCheckIn && (
                  <div className="animate-in slide-in-from-top-2 duration-200 space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase">Assign Room Unit</label>
                      <select 
                          className="w-full border-2 border-slate-200 p-3 text-sm focus:border-[#1A2B48] transition-all font-semibold focus:outline-none" 
                          value={walkInForm.roomUnit} 
                          onChange={e => setWalkInForm({...walkInForm, roomUnit: e.target.value})} 
                          required={walkInForm.immediateCheckIn}
                      >
                          <option value="">-- Choose Room Unit --</option>
                          {availableUnits
                            .filter(u => {
                              if (!u.category || !walkInForm.roomCategory) return false;
                              const uCatId = (u.category?._id || u.category).toString();
                              const bCatId = walkInForm.roomCategory.toString();
                              return uCatId === bCatId;
                            })
                            .map(u => (
                              <option key={u._id} value={u._id} disabled={u.status === 'Occupied' || u.status === 'Maintenance'}>
                                Room {u.roomNumber} ({u.status === 'Dirty' ? '⚠️ Dirty' : '✓ Ready'})
                              </option>
                            ))
                          }
                      </select>
                      {availableUnits.filter(u => {
                            if (!u.category || !walkInForm.roomCategory) return false;
                            const uCatId = (u.category?._id || u.category).toString();
                            const bCatId = walkInForm.roomCategory.toString();
                            return uCatId === bCatId;
                          }).length === 0 && (
                          <p className="text-xs text-rose-600 font-bold mt-2 uppercase flex items-center gap-2">
                            <AlertTriangle size={14} /> No room units created or available for this category.
                          </p>
                      )}
                  </div>
               )}

               {/* Dynamic Bill Preview */}
               <div className="bg-slate-50 p-4 border border-slate-200 rounded-sm space-y-1">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Registration Billing Preview</h4>
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                     <span>Stay Duration:</span>
                     <span>
                        {Math.max(1, Math.ceil((new Date(walkInForm.checkOutDate) - new Date(walkInForm.checkInDate)) / (1000 * 60 * 60 * 24)))} Nights
                     </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                     <span>Total Room Tariff:</span>
                     <span>₹{walkInForm.financials.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                     <span>Advance Paid:</span>
                     <span>₹{walkInForm.financials.amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-slate-200 my-2"></div>
                  <div className="flex justify-between text-sm font-black text-[#1A2B48]">
                     <span>Net Balance Due at Checkout:</span>
                     <span className={walkInForm.financials.balance > 0 ? "text-rose-600" : "text-emerald-600"}>
                        ₹{walkInForm.financials.balance.toLocaleString()}
                     </span>
                  </div>
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

      {/* Extend Stay Modal */}
      {isExtendStayOpen && selectedBooking && (
        <div className="fixed inset-0 bg-[#1A2B48]/95 z-[130] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-sm shadow-2xl p-8 border-t-8 border-cyan-600 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-[#1A2B48] uppercase">Extend Guest Stay</h3>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  Guest: {selectedBooking.guestDetails.firstName} {selectedBooking.guestDetails.lastName} | Room: {selectedBooking.roomUnit?.roomNumber || 'Assigned'}
                </p>
              </div>
              <button onClick={() => setIsExtendStayOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={20}/></button>
            </div>

            <form onSubmit={handleExtendStaySubmit} className="space-y-6">
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-sm text-xs space-y-1 font-semibold text-slate-700">
                <div className="flex justify-between">
                  <span>Current Check-In:</span>
                  <span className="font-bold">{new Date(selectedBooking.checkInDate).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Check-Out:</span>
                  <span className="font-bold text-rose-600">{new Date(selectedBooking.checkOutDate).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Room Tariff:</span>
                  <span className="font-bold">₹{selectedBooking.financials.roomTariff?.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">New Check-Out Date</label>
                <input 
                  type="date" 
                  min={selectedBooking.checkOutDate ? new Date(new Date(selectedBooking.checkOutDate).getTime() + 86400000).toISOString().split('T')[0] : ''}
                  value={extendForm.newCheckOutDate}
                  onChange={e => setExtendForm({...extendForm, newCheckOutDate: e.target.value})}
                  className="w-full border-2 border-slate-200 p-4 text-sm font-bold focus:outline-none focus:border-cyan-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Additional Tariff Amount (₹)</label>
                <input 
                  type="number" 
                  placeholder="Leave blank to auto-calculate per-night rate"
                  value={extendForm.additionalTariff}
                  onChange={e => setExtendForm({...extendForm, additionalTariff: e.target.value})}
                  className="w-full border-2 border-slate-200 p-4 text-sm font-bold focus:outline-none focus:border-cyan-600"
                />
                <span className="text-[9px] text-slate-400 font-bold block mt-1">If left blank, extra tariff will be auto-computed based on current room nightly rate.</span>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setIsExtendStayOpen(false)} className="flex-1 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-700">Cancel</button>
                <button type="submit" className="flex-1 bg-cyan-700 hover:bg-cyan-800 text-white py-4 text-xs font-black uppercase shadow-xl transition-all">Confirm Extend Stay</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal (Requirement 1: Cash vs Online) */}
      {isCollectPaymentOpen && selectedBooking && (
        <div className="fixed inset-0 bg-[#1A2B48]/95 z-[140] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-sm shadow-2xl p-8 border-t-8 border-[#1A2B48] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-[#1A2B48] uppercase">Collect Guest Payment</h3>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  Guest: {selectedBooking.guestDetails.firstName} {selectedBooking.guestDetails.lastName} | Balance: ₹{selectedBooking.financials.balance?.toLocaleString()}
                </p>
              </div>
              <button onClick={() => setIsCollectPaymentOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={20}/></button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                collectPayment(selectedBooking._id, paymentForm.amount, paymentForm.mode);
                setIsCollectPaymentOpen(false);
              }} 
              className="space-y-6"
            >
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Payment Amount (₹)</label>
                <input 
                  type="number" 
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                  className="w-full border-2 border-slate-200 p-4 text-lg font-black focus:outline-none focus:border-[#1A2B48]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Payment Mode Selection</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentForm({...paymentForm, mode: 'Cash'})}
                    className={`p-4 rounded-sm border-2 font-black text-xs uppercase flex flex-col items-center gap-2 transition-all ${
                      paymentForm.mode === 'Cash' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-md' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <IndianRupee size={20} />
                    <span>Cash (Manual Cash)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentForm({...paymentForm, mode: 'Online'})}
                    className={`p-4 rounded-sm border-2 font-black text-xs uppercase flex flex-col items-center gap-2 transition-all ${
                      paymentForm.mode === 'Online' ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard size={20} />
                    <span>Online (PhonePe / UPI)</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setIsCollectPaymentOpen(false)} className="flex-1 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-700">Cancel</button>
                <button type="submit" className="flex-1 bg-[#1A2B48] hover:bg-[#253d66] text-white py-4 text-xs font-black uppercase shadow-xl transition-all">Submit Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Electricity Meter Readings Modal (Requirement 3) */}
      {isMeterModalOpen && (
        <div className="fixed inset-0 bg-[#1A2B48]/95 z-[140] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-sm shadow-2xl p-8 border-t-8 border-amber-500 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-900 rounded">
                  <Zap size={24} className="fill-amber-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#1A2B48] uppercase">Electricity Meter Readings</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">Record daily kWh meter readings for property analytics</p>
                </div>
              </div>
              <button onClick={() => setIsMeterModalOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={20}/></button>
            </div>

            <form onSubmit={handleMeterSubmit} className="space-y-6 bg-slate-50 p-6 border border-slate-200 rounded-sm mb-6">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">New Reading Entry</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Reading Date</label>
                  <input 
                    type="date"
                    value={meterForm.date}
                    onChange={e => setMeterForm({...meterForm, date: e.target.value})}
                    className="w-full border-2 border-slate-200 p-3 text-sm font-bold focus:outline-none focus:border-amber-500 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Meter Reading Value (kWh)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 500 or 600"
                    value={meterForm.reading}
                    onChange={e => setMeterForm({...meterForm, reading: e.target.value})}
                    className="w-full border-2 border-slate-200 p-3 text-sm font-bold focus:outline-none focus:border-amber-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Notes / Remarks (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. Monthly bill check or shift reading"
                  value={meterForm.notes}
                  onChange={e => setMeterForm({...meterForm, notes: e.target.value})}
                  className="w-full border-2 border-slate-200 p-3 text-sm font-semibold focus:outline-none focus:border-amber-500 bg-white"
                />
              </div>

              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-4 font-black uppercase text-xs shadow-lg transition-all flex items-center justify-center gap-2">
                <Zap size={16} className="fill-slate-950" /> Save Electricity Reading
              </button>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Recently Logged Meter Readings</h4>
              <div className="border border-slate-200 rounded-sm overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500 border-b">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Reading (kWh)</th>
                      <th className="p-3">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {meterReadings.length === 0 ? (
                      <tr><td colSpan="3" className="p-4 text-center text-slate-400 italic">No meter readings recorded yet.</td></tr>
                    ) : (
                      meterReadings.map(r => (
                        <tr key={r._id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold">{new Date(r.date).toLocaleDateString('en-GB')}</td>
                          <td className="p-3 font-black text-amber-600">{r.reading} kWh</td>
                          <td className="p-3 text-slate-500">{r.recordedBy}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Front Desk Analytics Full-Page Modal View */}
      {isAnalyticsOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 overflow-y-auto animate-in fade-in duration-200">
          <FrontDeskAnalytics onClose={() => setIsAnalyticsOpen(false)} />
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

const InputField = ({ label, value, onChange, type = "text", required = true }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full border-2 border-slate-200 p-3 text-sm focus:border-[#1A2B48] transition-all focus:outline-none" required={required} />
  </div>
);

const ChevronRight = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6"/>
    </svg>
);

export default FrontDeskManagement;
