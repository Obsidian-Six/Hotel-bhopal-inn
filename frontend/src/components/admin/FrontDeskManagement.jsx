import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { 
  X, CheckCircle2, IndianRupee, Printer, LogOut, 
  Plus, Info, ArrowRight, User, Calendar, CreditCard, AlertTriangle, History, FastForward, Coffee, TrendingUp, BarChart3, CalendarPlus, Zap, Activity, Bed
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

  const [selectedRoomCategoryFilter, setSelectedRoomCategoryFilter] = useState('All');
  const [selectedUnitForCleaning, setSelectedUnitForCleaning] = useState(null);
  const [isCleaningModalOpen, setIsCleaningModalOpen] = useState(false);
  const [isMarkedCleanChecked, setIsMarkedCleanChecked] = useState(true);

  // Derived filtered units for Housekeeping Grid
  const filteredRoomUnits = (availableUnits || []).filter(unit => {
    if (selectedRoomCategoryFilter === 'All') return true;
    const catTitle = unit.category?.title || unit.category?.category || '';
    return catTitle.toLowerCase().includes(selectedRoomCategoryFilter.toLowerCase()) || 
           (selectedRoomCategoryFilter === 'Balcony Deluxe' && ['101','102','201','202'].includes(unit.roomNumber)) ||
           (selectedRoomCategoryFilter === 'Double Deluxe' && ['103','104','105','106','203','204','205','206'].includes(unit.roomNumber)) ||
           (selectedRoomCategoryFilter === 'Super Deluxe' && ['107','108','207','208'].includes(unit.roomNumber));
  });

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
    
    socket.on('booking_updated', () => {
      fetchData();
      fetchSupportData();
    });
    socket.on('room_unit_updated', fetchSupportData);

    return () => {
      socket.off('booking_updated');
      socket.off('room_unit_updated');
    };
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

  const [selectedDashboardDate, setSelectedDashboardDate] = useState('');

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Derived filtered bookings for Dashboard Table based on Selected Calendar Date
  const filteredDashboardBookings = (bookings || []).filter(b => {
    if (!selectedDashboardDate) return true;
    const targetDate = selectedDashboardDate;
    const cIn = b.checkInDate ? b.checkInDate.split('T')[0] : '';
    return cIn === targetDate;
  });

  const handlePrint = (booking) => {
    if (!booking) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print the0invoice.");
      return;
    }
    
    // Calculate total days
    const checkIn = booking.checkInDate ? new Date(booking.checkInDate) : new Date();
    const checkOut = booking.checkOutDate ? new Date(booking.checkOutDate) : new Date();
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const financials = booking.financials || {};
    const extraChargesList = financials.extraCharges || [];

    // Separate balance/extra0guest
    const extraGuestCharge = extraChargesList.find(c => 
      c.description?.toLowerCase().includes('extra') || c.source?.toLowerCase().includes('guest')
    )?.amount || 0;
    
    const otherCharges = extraChargesList.filter(c => 
      !c.description?.toLowerCase().includes('extra') && !c.source?.toLowerCase().includes('guest')
    ) || [];

    const guestName = `${booking.guestDetails?.firstName || ''} ${booking.guestDetails?.lastName || ''}`.trim() || 'Valued Guest';
    const roomNum = booking.roomUnit?.roomNumber || (booking.roomCategory?.title || 'Assigned');
    const roomType = booking.roomCategory?.title || 'Standard';
    const roomPlan = booking.roomPlan || 'EP';
    const bookingId = booking._id ? `BK-${booking._id.slice(-6).toUpperCase()}` : 'N/A';
    const slNo = booking._id ? (parseInt(booking._id.slice(-4), 16) % 9000 + 1000) : 1001;

    const html = `<!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${guestName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
            
            @page {
              size: A4 portrait;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            body { 
              font-family: 'Montserrat', sans-serif; 
              color: #1a2332; 
              margin: 0; 
              padding: 0;
              background: #fff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .bill-container {
              width: 210mm;
              height: 297mm;
              box-sizing: border-box;
              margin: 0 auto;
              padding: 215px 45px 175px 45px;
              background-image: url('/letterhead.png');
              background-size: 100% 100%;
              background-repeat: no-repeat;
              background-position: center top;
              position: relative;
              display: flex;
              flex-direction: column;
            }

            .meta-header-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
              position: relative;
            }

            .room-pill-wrapper {
              position: absolute;
              left: 50%;
              transform: translateX(-50%);
            }

            .room-pill-box {
              background-color: #f7f3ec;
              border: 1.5px solid #cbb281;
              color: #111827;
              padding: 6px 28px;
              border-radius: 12px;
              font-weight: 800;
              font-size: 15px;
              letter-spacing: 0.5px;
            }

            .sl-no-text {
              margin-left: auto;
              font-weight: 800;
              font-size: 14px;
              color: #111827;
              letter-spacing: 0.5px;
            }
            .sl-no-text span {
              color: #b58838;
            }

            .guest-info-card {
              border: 1.5px solid #cbb281;
              border-radius: 12px;
              padding: 18px 22px 14px 22px;
              margin-bottom: 20px;
              background-color: rgba(255, 255, 255, 0.4);
            }

            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              column-gap: 30px;
              row-gap: 14px;
            }

            .field-line {
              display: flex;
              align-items: baseline;
              font-size: 13px;
            }

            .field-label {
              font-weight: 700;
              color: #111827;
              white-space: nowrap;
              margin-right: 8px;
            }

            .field-value-dotted {
              flex-grow: 1;
              border-bottom: 1px dotted #777;
              padding-bottom: 2px;
              padding-left: 4px;
              font-weight: 600;
              color: #1a2332;
              min-height: 18px;
            }

            .dates-row {
              margin-top: 14px;
              display: flex;
              justify-content: space-between;
              font-size: 13px;
            }

            .date-group {
              display: flex;
              align-items: baseline;
            }

            .particulars-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }

            .particulars-table th, 
            .particulars-table td {
              border: 1.5px solid #cbb281;
              padding: 10px 14px;
              font-size: 13px;
            }

            .particulars-table th {
              background-color: #f7f3ec;
              color: #111827;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .col-sl {
              width: 50px;
              text-align: center !important;
              font-weight: 700;
            }

            .col-desc {
              text-align: left;
              font-weight: 500;
              color: #334155;
            }

            .col-amt {
              width: 160px;
              text-align: right !important;
              font-weight: 800;
              color: #111827;
            }

            .totals-container {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 25px;
            }

            .totals-table {
              width: 360px;
              border-collapse: collapse;
            }

            .totals-table td {
              padding: 8px 12px;
              font-size: 13px;
              border-bottom: 1.5px solid #e2d4bd;
            }

            .totals-table .label-cell {
              font-weight: 600;
              color: #334155;
            }

            .totals-table .value-cell {
              text-align: right;
              font-weight: 800;
              color: #111827;
            }

            .totals-table .net-payable-row {
              background-color: #f7f3ec;
              border-top: 1.5px solid #cbb281;
              border-bottom: 1.5px solid #cbb281;
            }

            .totals-table .net-payable-row td {
              font-weight: 800;
              font-size: 14px;
              color: #111827;
              padding: 10px 12px;
            }

            .signatures-container {
              display: flex;
              justify-content: space-between;
              padding: 0 40px;
              margin-top: auto;
              margin-bottom: 0px;
            }

            .sig-box {
              width: 180px;
              text-align: center;
            }

            .sig-icon {
              display: flex;
              justify-content: center;
              margin-bottom: 6px;
              color: #b58838;
            }

            .sig-line-rule {
              border-top: 1.5px solid #b58838;
              margin-bottom: 6px;
            }

            .sig-title {
              font-size: 13px;
              font-weight: 800;
              color: #111827;
            }

            @media print {
              body { padding: 0; margin: 0; }
              .bill-container { border: none; width: 100%; height: 100vh; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="bill-container">
            <!-- Room Pill Box & SL NO -->
            <div class="meta-header-row">
              <div class="room-pill-wrapper">
                <div class="room-pill-box">
                  ROOM: ${roomNum}
                </div>
              </div>
              <div class="sl-no-text">
                SL. NO. <span>#${slNo}</span>
              </div>
            </div>

            <!-- Guest Details Card -->
            <div class="guest-info-card">
              <div class="info-grid">
                <div class="field-line">
                  <span class="field-label">Guest Name:</span>
                  <span class="field-value-dotted">${guestName}</span>
                </div>
                <div class="field-line">
                  <span class="field-label">Room Category:</span>
                  <span class="field-value-dotted">${roomType}</span>
                </div>
                <div class="field-line">
                  <span class="field-label">City / From:</span>
                  <span class="field-value-dotted">${booking.guestDetails?.city || 'N/A'}</span>
                </div>
                <div class="field-line">
                  <span class="field-label">Booking Ref ID:</span>
                  <span class="field-value-dotted">${bookingId}</span>
                </div>
                <div class="field-line">
                  <span class="field-label">Guests:</span>
                  <span class="field-value-dotted">${Number(booking.guestDetails?.adults || 1)} Adults ${booking.guestDetails?.children ? `, ${booking.guestDetails.children} Children` : ''}</span>
                </div>
                <div class="field-line">
                  <span class="field-label">Source / Channel:</span>
                  <span class="field-value-dotted">${booking.source || 'Walk-in'} ${booking.otaReferenceId ? `(Ref: ${booking.otaReferenceId})` : ''}</span>
                </div>
              </div>
              
              <div class="field-line" style="margin-top: 14px;">
                <span class="field-label">Meal / Room Plan:</span>
                <span class="field-value-dotted" style="max-width: 320px;">${roomPlan}</span>
              </div>

              <div class="dates-row">
                <div class="date-group">
                  <span class="field-label">Arrival:</span>
                  <span class="field-label" style="margin-left: 10px;">Date</span>
                  <span class="field-value-dotted" style="width: 100px;">${checkIn.toLocaleDateString('en-GB')}</span>
                  <span class="field-label" style="margin-left: 15px;">Time</span>
                  <span class="field-value-dotted" style="width: 80px;">${checkIn.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div class="date-group">
                  <span class="field-label">Departure:</span>
                  <span class="field-label" style="margin-left: 10px;">Date</span>
                  <span class="field-value-dotted" style="width: 100px;">${checkOut.toLocaleDateString('en-GB')}</span>
                  <span class="field-label" style="margin-left: 15px;">Time</span>
                  <span class="field-value-dotted" style="width: 80px;">${checkOut.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            </div>

            <!-- Particulars Table -->
            <table class="particulars-table">
              <thead>
                <tr>
                  <th class="col-sl">SL</th>
                  <th class="col-desc">PARTICULARS / CHARGE DESCRIPTION</th>
                  <th class="col-amt">AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="col-sl">1</td>
                  <td class="col-desc">Room Stay Lodging (${diffDays} Night${diffDays > 1 ? 's' : ''} — ${roomType})</td>
                  <td class="col-amt">${(financials.roomTariff || 0).toLocaleString()}</td>
                </tr>
                ${extraGuestCharge > 0 ? `
                  <tr>
                    <td class="col-sl">2</td>
                    <td class="col-desc">Extra Guest Charges</td>
                    <td class="col-amt">${extraGuestCharge.toLocaleString()}</td>
                  </tr>
                ` : ''}
                ${otherCharges.map((charge, idx) => `
                  <tr>
                    <td class="col-sl">${(extraGuestCharge > 0 ? 3 : 2) + idx}</td>
                    <td class="col-desc">${charge.description || ''} (${charge.source || ''})</td>
                    <td class="col-amt">${(charge.amount || 0).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Totals Section -->
            <div class="totals-container">
              <table class="totals-table">
                <tr>
                  <td class="label-cell">Total Billable Amount:</td>
                  <td class="value-cell">₹${(financials.totalAmount || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td class="label-cell">Total Payments Received:</td>
                  <td class="value-cell">₹${(financials.amountPaid || 0).toLocaleString()}</td>
                </tr>
                <tr class="net-payable-row">
                  <td class="label-cell">Net Balance Payable:</td>
                  <td class="value-cell">₹${(financials.balance || 0).toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <!-- Signatures Section -->
            <div class="signatures-container">
              <div class="sig-box">
                <div class="sig-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b58838" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </div>
                <div class="sig-line-rule"></div>
                <div class="sig-title">Guest Signature</div>
              </div>
              <div class="sig-box">
                <div class="sig-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b58838" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div class="sig-line-rule"></div>
                <div class="sig-title">Authorized Manager</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { 
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
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

      {/* Requirement 1: Interactive Room Cleaning & Housekeeping Status Grid */}
      <div className="bg-white rounded-sm shadow-xl border border-slate-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1A2B48] text-white rounded">
              <Bed size={22} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-[#1A2B48] tracking-wider">
                Room Housekeeping & Unit Status Grid
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Click any room box to update cleaning status (Red = Dirty/Needs Cleaning, Green = Clean/Ready, Blue = Occupied)
              </p>
            </div>
          </div>

          {/* Room Category Filter Selection */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Filter Type:</span>
            <select
              value={selectedRoomCategoryFilter}
              onChange={(e) => setSelectedRoomCategoryFilter(e.target.value)}
              className="bg-slate-50 border-2 border-slate-200 text-[#1A2B48] px-3 py-2 rounded-sm text-xs font-bold outline-none focus:border-[#1A2B48] transition-all cursor-pointer w-full sm:w-auto"
            >
              <option value="All">All Room Types (16 Rooms)</option>
              <option value="Balcony Deluxe">Balcony Deluxe (101, 102, 201, 202)</option>
              <option value="Double Deluxe">Double Deluxe (103..106, 203..206)</option>
              <option value="Super Deluxe">Super Deluxe (107, 108, 207, 208)</option>
            </select>
          </div>
        </div>

        {/* Legend Indicator */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold pt-1">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 rounded">
            <div className="w-3 h-3 bg-rose-500 rounded-sm"></div>
            <span>Dirty / Needs Cleaning (Red)</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded">
            <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
            <span>Clean & Ready for Guests (Green)</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 border border-sky-200 text-sky-800 rounded">
            <div className="w-3 h-3 bg-sky-600 rounded-sm"></div>
            <span>Currently Occupied (Blue)</span>
          </div>
        </div>

        {/* Square Boxes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 pt-2">
          {filteredRoomUnits.map((unit) => {
            const isOccupied = bookings.some(
              b => b.status === 'Checked-In' && (b.roomUnit?._id === unit._id || b.roomUnit?.roomNumber === unit.roomNumber)
            );
            const isDirty = !isOccupied && unit.status === 'Dirty';

            let bgColor = 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-600 shadow-emerald-100';
            let statusText = 'CLEAN';
            let badgeBg = 'bg-white/25 text-white';

            if (isOccupied) {
              bgColor = 'bg-sky-600 text-white hover:bg-sky-700 border-sky-700 shadow-sky-100';
              statusText = 'OCCUPIED';
              badgeBg = 'bg-white/25 text-white';
            } else if (isDirty) {
              bgColor = 'bg-rose-500 text-white hover:bg-rose-600 border-rose-600 shadow-rose-100';
              statusText = 'DIRTY';
              badgeBg = 'bg-white/30 text-white';
            }

            return (
              <button
                key={unit._id || unit.roomNumber}
                onClick={() => {
                  if (isOccupied) {
                    alert(`Room ${unit.roomNumber} is currently occupied by a checked-in guest.`);
                    return;
                  }
                  setSelectedUnitForCleaning(unit);
                  setIsMarkedCleanChecked(unit.status !== 'Dirty');
                  setIsCleaningModalOpen(true);
                }}
                className={`p-4 rounded-sm border-2 flex flex-col items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer relative overflow-hidden ${bgColor}`}
                title={`Click to manage housekeeping status for Room ${unit.roomNumber}`}
              >
                <span className="text-2xl font-black tracking-tight">{unit.roomNumber}</span>
                <span className="text-[9px] font-bold opacity-80 uppercase truncate max-w-full mt-0.5">
                  {unit.category?.title || unit.category?.category || 'Deluxe'}
                </span>
                <span className={`mt-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${badgeBg}`}>
                  {statusText}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Unified Tracker Dashboard */}
      <div className="bg-white rounded-sm shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-[#1A2B48] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-white text-sm font-bold uppercase tracking-widest">Unified Front Desk Dashboard</h2>
            <button onClick={fetchData} className="text-white/40 hover:text-white transition-colors" title="Refresh Dashboard">
              <History size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            
            {/* Calendar Date Picker Filter */}
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded border border-slate-700">
              <Calendar size={14} className="text-[#BFA37E]" />
              <span className="text-[10px] font-bold text-slate-300 uppercase whitespace-nowrap">Filter Date:</span>
              <input 
                type="date"
                value={selectedDashboardDate}
                onChange={e => setSelectedDashboardDate(e.target.value)}
                className="bg-slate-800 text-white text-xs font-bold px-2 py-0.5 rounded border border-slate-600 focus:outline-none focus:border-[#BFA37E] cursor-pointer"
              />
              {selectedDashboardDate && (
                <button 
                  onClick={() => setSelectedDashboardDate('')}
                  className="text-[10px] bg-amber-500 hover:bg-amber-600 text-slate-950 px-2 py-0.5 rounded font-black uppercase tracking-wider transition-all ml-1"
                >
                  Show All
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
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
              ) : filteredDashboardBookings.length === 0 ? (
                <tr><td colSpan="7" className="p-12 text-center text-slate-400 uppercase font-bold tracking-widest">No bookings found for selected calendar date ({selectedDashboardDate}).</td></tr>
              ) : filteredDashboardBookings.map((booking) => (
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
                    <span className={`whitespace-nowrap inline-block px-3.5 py-1 rounded-full text-[10px] font-black uppercase shadow-sm ${
                        booking.status === 'Checked-In' ? 'bg-emerald-500 text-white' : 
                        booking.status === 'Confirmed' ? 'bg-amber-500 text-white' : 
                        booking.status === 'Checked-Out' ? 'bg-slate-700 text-white' : 'bg-slate-400 text-white'
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

      {/* Room Housekeeping Cleaning Control Modal (Requirement 1) */}
      {isCleaningModalOpen && selectedUnitForCleaning && (
        <div className="fixed inset-0 bg-[#1A2B48]/95 z-[150] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-sm shadow-2xl p-8 border-t-8 border-[#1A2B48] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-[#1A2B48] uppercase">Room Housekeeping Status</h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  Room Unit Number: <span className="text-[#1A2B48] font-extrabold">{selectedUnitForCleaning.roomNumber}</span>
                </p>
              </div>
              <button onClick={() => setIsCleaningModalOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={20}/></button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const targetStatus = isMarkedCleanChecked ? 'Available' : 'Dirty';
                  await axios.put(`${API_BASE}/api/inventory/units/${selectedUnitForCleaning._id}/status`, {
                    status: targetStatus
                  });
                  alert(`Room ${selectedUnitForCleaning.roomNumber} marked as ${targetStatus === 'Available' ? 'CLEAN & READY (Green)' : 'DIRTY (Red)'}!`);
                  setIsCleaningModalOpen(false);
                  fetchSupportData();
                } catch (err) {
                  console.error(err);
                  alert('Failed to update room housekeeping status: ' + (err.response?.data?.message || err.message));
                }
              }}
              className="space-y-6"
            >
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-sm space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500 uppercase">Category:</span>
                  <span className="font-black text-[#1A2B48] uppercase">{selectedUnitForCleaning.category?.title || selectedUnitForCleaning.category?.category || 'Deluxe'}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-500 uppercase">Current Status:</span>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase ${
                    selectedUnitForCleaning.status === 'Dirty' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {selectedUnitForCleaning.status === 'Dirty' ? 'Dirty / Needs Cleaning (Red)' : 'Clean & Ready (Green)'}
                  </span>
                </div>
              </div>

              <div className="p-4 border-2 border-emerald-500 bg-emerald-50/60 rounded-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={isMarkedCleanChecked}
                    onChange={(e) => setIsMarkedCleanChecked(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black uppercase text-emerald-900 block">Is Room Cleaned & Ready?</span>
                    <span className="text-[10px] font-bold text-emerald-700 block">Check box to set room status to Clean / Available (Green)</span>
                  </div>
                </label>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setIsCleaningModalOpen(false)} className="flex-1 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-700">Cancel</button>
                <button type="submit" className="flex-1 bg-[#1A2B48] hover:bg-[#253d66] text-white py-4 text-xs font-black uppercase shadow-xl transition-all">Save Housekeeping Status</button>
              </div>
            </form>
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
