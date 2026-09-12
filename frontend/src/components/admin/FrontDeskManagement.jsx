import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { 
  X, CheckCircle2, IndianRupee, Printer, LogOut, 
  Plus, Info, ArrowRight, User, Calendar, CreditCard, AlertTriangle, History, FastForward, Coffee, TrendingUp, BarChart3, CalendarPlus, Zap, Activity, Bed,
  Trash2, Edit3, ShieldCheck, DollarSign, CalendarCheck, Tag
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { socket } from '@/lib/socket';
import FrontDeskAnalytics from './FrontDeskAnalytics';

const API_BASE = config.API_URL;

const FrontDeskManagement = ({ isSuperAdmin: propIsSuperAdmin, role = 'Admin' } = {}) => {
  const { user, isSuperAdmin: authIsSuperAdmin } = useAuth();
  const isSuperAdmin = propIsSuperAdmin !== undefined ? propIsSuperAdmin : authIsSuperAdmin;
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

  // Super Admin: Edit Booking State
  const [isEditBookingOpen, setIsEditBookingOpen] = useState(false);
  const [editBookingForm, setEditBookingForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    idProof: '',
    adults: 2,
    children: 0,
    roomCategory: '',
    roomUnit: '',
    checkInDate: '',
    checkOutDate: '',
    roomPlan: 'EP',
    roomTariff: 0,
    totalAmount: 0,
    amountPaid: 0,
    status: 'Confirmed',
    source: 'Walk-in',
    otaPlatform: '',
    otaReferenceId: ''
  });

  // Super Admin: Manage Payments & Cash vs Online State
  const [isManagePaymentsOpen, setIsManagePaymentsOpen] = useState(false);
  const [newPaymentForm, setNewPaymentForm] = useState({
    amount: '',
    mode: 'Cash',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

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
  const [fbForm, setFbForm] = useState({ description: '', amount: '', paymentMode: 'Cash' });

  // Walk-in form state
  const [walkInForm, setWalkInForm] = useState({
    guestDetails: { firstName: '', lastName: '', phone: '', email: '', idProof: '', adults: 2, children: 0 },
    roomCategory: '',
    roomUnit: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    financials: { roomTariff: 0, amountPaid: 0, totalAmount: 0, balance: 0 },
    paymentMode: 'Cash',
    source: 'Walk-in',
    otaPlatform: '',
    otaReferenceId: '',
    roomPlan: 'EP',
    immediateCheckIn: false,
    isHistorical: false,
    customStatus: 'Confirmed',
    paymentDate: ''
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
    
    const handleRefresh = () => {
      fetchData();
      fetchSupportData();
    };

    socket.on('booking_updated', handleRefresh);
    socket.on('booking_deleted', handleRefresh);
    socket.on('room_unit_updated', fetchSupportData);

    return () => {
      socket.off('booking_updated', handleRefresh);
      socket.off('booking_deleted', handleRefresh);
      socket.off('room_unit_updated', fetchSupportData);
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
      const guestName = selectedBooking?.guestDetails ? `${selectedBooking.guestDetails.firstName || ''} ${selectedBooking.guestDetails.lastName || ''}`.trim() : 'Guest';
      const roomNum = (typeof selectedBooking?.roomUnit === 'object' && selectedBooking?.roomUnit !== null)
        ? (selectedBooking.roomUnit.roomNumber || '')
        : (selectedBooking?.roomUnit || '');
      const roomInfo = roomNum ? `(Room ${roomNum})` : '';
      
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
      setFbForm({ description: '', amount: '', paymentMode: 'Cash' });
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
        roomUnit: (walkInForm.immediateCheckIn || walkInForm.customStatus === 'Checked-In') ? walkInForm.roomUnit : null,
        checkInDate: walkInForm.checkInDate,
        checkOutDate: walkInForm.checkOutDate,
        financials: walkInForm.financials,
        paymentMode: walkInForm.paymentMode || 'Cash',
        source: walkInForm.source,
        otaPlatform: walkInForm.otaPlatform,
        otaReferenceId: walkInForm.otaReferenceId,
        roomPlan: walkInForm.roomPlan,
        immediateCheckIn: walkInForm.immediateCheckIn,
        status: walkInForm.isHistorical ? (walkInForm.customStatus || 'Confirmed') : (walkInForm.immediateCheckIn ? 'Checked-In' : 'Confirmed'),
        paymentDate: walkInForm.paymentDate || walkInForm.checkInDate,
        bookingDate: walkInForm.checkInDate
      };

      await axios.post(`${API_BASE}/api/bookings/walk-in`, payload);
      
      // Record Advance Payment in Finance if exists
      if (walkInForm.financials.amountPaid > 0) {
          const selectedMode = walkInForm.paymentMode || 'Cash';
          await axios.post(`${API_BASE}/api/finance/transactions`, {
            type: 'Income',
            category: 'Room Rent',
            amount: Number(walkInForm.financials.amountPaid),
            description: `Walk-in Advance (${walkInForm.source}) - ${walkInForm.guestDetails.firstName} ${walkInForm.guestDetails.lastName}`,
            paymentMode: selectedMode,
            date: walkInForm.paymentDate ? new Date(walkInForm.paymentDate) : new Date(walkInForm.checkInDate),
            recordedBy: isSuperAdmin ? 'SuperAdmin' : 'FrontDesk'
          });
      }

      setIsWalkInOpen(false);
      fetchData();
      // Reset form state
      setWalkInForm({
        guestDetails: { firstName: '', lastName: '', phone: '', email: '', idProof: '', adults: 2, children: 0 },
        roomCategory: '',
        roomUnit: '',
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        financials: { roomTariff: 0, amountPaid: 0, totalAmount: 0, balance: 0 },
        paymentMode: 'Cash',
        source: 'Walk-in',
        otaPlatform: '',
        otaReferenceId: '',
        roomPlan: 'EP',
        immediateCheckIn: false,
        isHistorical: false,
        customStatus: 'Confirmed',
        paymentDate: ''
      });
    } catch (err) {
      alert('Failed to register walk-in: ' + (err.response?.data?.message || err.message));
    }
  };

  // Super Admin: Delete Booking & Cleanup Duplicate
  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('⚠️ Super Admin Action: Permanently delete this booking record? If this was an active or duplicate booking, the associated room unit will be immediately freed.')) {
      return;
    }
    try {
      await axios.delete(`${API_BASE}/api/bookings/${bookingId}`);
      setIsDetailOpen(false);
      setSelectedBooking(null);
      fetchData();
      alert('Booking permanently removed.');
    } catch (err) {
      alert('Failed to delete booking: ' + (err.response?.data?.message || err.message));
    }
  };

  // Super Admin & Admin: Open Edit Booking Modal
  const openEditBookingModal = (booking) => {
    setEditBookingForm({
      firstName: booking.guestDetails?.firstName || '',
      lastName: booking.guestDetails?.lastName || '',
      phone: booking.guestDetails?.phone || '',
      email: booking.guestDetails?.email || '',
      idProof: booking.guestDetails?.idProof || '',
      adults: booking.guestDetails?.adults || 1,
      children: booking.guestDetails?.children || 0,
      roomCategory: booking.roomCategory?._id || booking.roomCategory || '',
      roomUnit: booking.roomUnit?._id || booking.roomUnit || '',
      checkInDate: booking.checkInDate ? new Date(booking.checkInDate).toISOString().split('T')[0] : '',
      checkOutDate: booking.checkOutDate ? new Date(booking.checkOutDate).toISOString().split('T')[0] : '',
      roomPlan: booking.roomPlan || 'EP',
      roomTariff: booking.financials?.roomTariff || 0,
      totalAmount: booking.financials?.totalAmount || 0,
      amountPaid: booking.financials?.amountPaid || 0,
      status: booking.status || 'Confirmed',
      source: booking.source || 'Walk-in',
      otaPlatform: booking.otaPlatform || '',
      otaReferenceId: booking.otaReferenceId || ''
    });
    setIsEditBookingOpen(true);
  };

  // Super Admin & Admin: Save Edited Booking Details
  const handleEditBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      const payload = {
        guestDetails: {
          firstName: editBookingForm.firstName,
          lastName: editBookingForm.lastName,
          phone: editBookingForm.phone,
          email: editBookingForm.email,
          idProof: editBookingForm.idProof,
          adults: Number(editBookingForm.adults),
          children: Number(editBookingForm.children)
        },
        checkInDate: editBookingForm.checkInDate,
        checkOutDate: editBookingForm.checkOutDate,
        roomCategory: editBookingForm.roomCategory,
        roomUnit: editBookingForm.roomUnit || null,
        roomPlan: editBookingForm.roomPlan,
        status: editBookingForm.status,
        source: editBookingForm.source,
        otaPlatform: editBookingForm.otaPlatform,
        otaReferenceId: editBookingForm.otaReferenceId,
        financials: {
          roomTariff: Number(editBookingForm.roomTariff),
          totalAmount: Number(editBookingForm.totalAmount),
          amountPaid: Number(editBookingForm.amountPaid),
          balance: Math.max(0, Number(editBookingForm.totalAmount) - Number(editBookingForm.amountPaid))
        }
      };

      const res = await axios.put(`${API_BASE}/api/bookings/${selectedBooking._id}`, payload);
      setSelectedBooking(res.data);
      setIsEditBookingOpen(false);
      fetchData();
      alert('Booking details successfully updated.');
    } catch (err) {
      alert('Failed to update booking: ' + (err.response?.data?.message || err.message));
    }
  };

  // Financial Management: Add Payment Entry
  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      const res = await axios.post(`${API_BASE}/api/bookings/${selectedBooking._id}/payment`, {
        amount: Number(newPaymentForm.amount),
        mode: newPaymentForm.mode,
        note: newPaymentForm.note,
        date: newPaymentForm.date ? new Date(newPaymentForm.date) : new Date(),
        staff: user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'FrontDesk'
      });

      // Record in Finance Transactions as well
      await axios.post(`${API_BASE}/api/finance/transactions`, {
        type: 'Income',
        category: 'Room Rent',
        amount: Number(newPaymentForm.amount),
        description: `Payment Added (${newPaymentForm.mode}) - ${selectedBooking.guestDetails?.firstName} ${selectedBooking.guestDetails?.lastName}`,
        paymentMode: newPaymentForm.mode,
        date: newPaymentForm.date ? new Date(newPaymentForm.date) : new Date(),
        recordedBy: isSuperAdmin ? 'SuperAdmin' : 'FrontDesk'
      });

      setSelectedBooking(res.data);
      setNewPaymentForm({
        amount: '',
        mode: 'Cash',
        note: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
      alert('Payment record added.');
    } catch (err) {
      alert('Failed to add payment: ' + (err.response?.data?.message || err.message));
    }
  };

  // Super Admin: Change Payment Mode or Amount of Existing Entry
  const handleEditPaymentMode = async (index, currentPayment) => {
    const newMode = prompt(`Change Payment Mode for entry #${index + 1} (currently: ${currentPayment.mode}):\nType: Cash, Online, Card, or Bank Transfer`, currentPayment.mode);
    if (!newMode) return;
    const newAmountStr = prompt(`Verify Amount (₹):`, currentPayment.amount);
    const newAmount = newAmountStr ? Number(newAmountStr) : currentPayment.amount;

    try {
      const res = await axios.put(`${API_BASE}/api/bookings/${selectedBooking._id}/payment/${index}`, {
        mode: newMode,
        amount: newAmount
      });
      setSelectedBooking(res.data);
      fetchData();
      alert('Payment record updated.');
    } catch (err) {
      alert('Failed to update payment: ' + (err.response?.data?.message || err.message));
    }
  };

  // Super Admin: Remove Erroneous or Duplicate Payment Entry
  const handleDeletePayment = async (index, payment) => {
    if (!window.confirm(`⚠️ Super Admin: Delete payment entry of ₹${payment.amount} (${payment.mode})? Net balance and total paid will be recalculated.`)) {
      return;
    }
    try {
      const res = await axios.delete(`${API_BASE}/api/bookings/${selectedBooking._id}/payment/${index}`);
      setSelectedBooking(res.data);
      fetchData();
      alert('Payment entry removed.');
    } catch (err) {
      alert('Failed to delete payment entry: ' + (err.response?.data?.message || err.message));
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
                <div className="mb-6 bg-rose-600 text-white p-4 rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl border-2 border-rose-800">
                    <div className="flex items-center gap-4">
                        <AlertTriangle size={32} className="shrink-0" />
                        <div>
                            <p className="font-black text-lg">{selectedBooking.checkoutError}</p>
                            <p className="text-xs uppercase font-bold opacity-90">
                              Please collect full pending balance before checkout {isSuperAdmin ? 'or use Super Admin Manager Override' : ''}.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button 
                            onClick={() => {
                                setPaymentForm({ amount: selectedBooking.financials?.balance || 0, mode: 'Cash' });
                                setIsCollectPaymentOpen(true);
                            }}
                            className="bg-white text-rose-700 hover:bg-rose-50 px-4 py-2.5 rounded-sm font-black text-xs uppercase shadow transition-all"
                        >
                            Collect Balance
                        </button>
                        {isSuperAdmin && (
                            <button 
                                onClick={() => handleCheckOut(selectedBooking._id, true)}
                                className="bg-rose-950 hover:bg-black text-white border border-rose-400/50 px-4 py-2.5 rounded-sm font-black text-xs uppercase transition-all"
                            >
                                Manager Override
                            </button>
                        )}
                    </div>
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
                                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-emerald-900">₹{p.amount?.toLocaleString()} — <span className="bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">{p.mode}</span></p>
                                            <p className="text-[9px] text-emerald-600 font-bold uppercase">{new Date(p.timestamp).toLocaleString()} | By: {p.staff} {p.note ? `| Note: ${p.note}` : ''}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-emerald-700 uppercase">Verified</span>
                                        {isSuperAdmin && (
                                            <div className="flex items-center gap-1">
                                                <button 
                                                    type="button"
                                                    onClick={() => handleEditPaymentMode(i, p)} 
                                                    className="px-2 py-1 text-[9px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 rounded border border-amber-300 uppercase transition-all"
                                                    title="Change Mode or Amount"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDeletePayment(i, p)} 
                                                    className="px-2 py-1 text-[9px] font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 rounded border border-rose-300 uppercase transition-all"
                                                    title="Delete this payment entry"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
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

                        {/* Super Admin Exclusive Feature Suite (Hidden for Normal Admin) */}
                        {isSuperAdmin && (
                            <div className="pt-3 border-t-2 border-dashed border-amber-300/80 mt-2 space-y-2.5 bg-amber-50/70 p-3 rounded-sm border border-amber-200 animate-in fade-in duration-200">
                                <div className="flex items-center gap-1.5 text-amber-900 text-[10px] font-black uppercase tracking-widest pb-1 border-b border-amber-200">
                                    <ShieldCheck size={14} className="text-amber-600" />
                                    <span>Super Admin Elevated Controls</span>
                                </div>
                                <ActionButton 
                                    icon={<Edit3 size={18} />} 
                                    label="Edit Booking Details" 
                                    color="bg-blue-600 hover:bg-blue-700" 
                                    onClick={() => openEditBookingModal(selectedBooking)}
                                />
                                <ActionButton 
                                    icon={<CreditCard size={18} />} 
                                    label="Manage Payments & Modes" 
                                    color="bg-purple-700 hover:bg-purple-800" 
                                    onClick={() => setIsManagePaymentsOpen(true)}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleDeleteBooking(selectedBooking._id)}
                                    className="w-full flex items-center justify-center gap-2 bg-red-800 hover:bg-red-900 text-white p-3.5 rounded-sm font-black text-xs uppercase tracking-wider shadow-lg border border-red-700 hover:scale-[1.01] active:scale-[0.99] transition-all"
                                >
                                    <Trash2 size={16} /> Delete Booking (Super Admin)
                                </button>
                            </div>
                        )}
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
                   <InputField 
                     label="Check-In" 
                     type="date" 
                     value={walkInForm.checkInDate} 
                     min={!isSuperAdmin ? new Date().toISOString().split('T')[0] : undefined}
                     onChange={v => setWalkInForm({...walkInForm, checkInDate: v})} 
                   />
                   <InputField label="Check-Out" type="date" value={walkInForm.checkOutDate} onChange={v => setWalkInForm({...walkInForm, checkOutDate: v})} />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <InputField label="Adults" type="number" value={walkInForm.guestDetails.adults} onChange={v => setWalkInForm({...walkInForm, guestDetails: {...walkInForm.guestDetails, adults: Number(v)}})} />
                  <InputField label="Children" type="number" value={walkInForm.guestDetails.children} onChange={v => setWalkInForm({...walkInForm, guestDetails: {...walkInForm.guestDetails, children: Number(v)}})} />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <InputField label="Advance Paid (₹)" type="number" value={walkInForm.financials.amountPaid} onChange={v => setWalkInForm({...walkInForm, financials: {...walkInForm.financials, amountPaid: Number(v)}})} required={false} />
                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Advance Payment Mode</label>
                      <select 
                        className="w-full border-2 border-slate-200 p-3 text-sm focus:border-[#1A2B48] transition-all font-semibold focus:outline-none"
                        value={walkInForm.paymentMode || 'Cash'}
                        onChange={e => setWalkInForm({...walkInForm, paymentMode: e.target.value})}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Online">Online / UPI</option>
                        <option value="OTA">OTA (MakeMyTrip / Agoda / Booking.com)</option>
                        <option value="Card">Credit/Debit Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                  </div>
               </div>
               <div className="grid grid-cols-1 gap-6">
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
                   
                   {/* Historical Entry Toggle: Restricted to Super Admin Only */}
                   {isSuperAdmin && (
                       <div className="flex flex-col justify-end animate-in fade-in duration-200">
                           <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-amber-50/70 transition-colors border border-dashed border-amber-400 rounded-sm bg-amber-50/50">
                               <input 
                                   type="checkbox" 
                                   checked={walkInForm.isHistorical} 
                                   onChange={e => setWalkInForm({
                                     ...walkInForm, 
                                     isHistorical: e.target.checked,
                                     paymentDate: e.target.checked ? walkInForm.checkInDate : ''
                                   })} 
                                   className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
                               />
                               <div className="flex flex-col">
                                   <span className="text-[10px] font-black uppercase text-amber-900 flex items-center gap-1.5">
                                       <ShieldCheck size={13} className="text-amber-600" /> Historical / Past-Date Entry
                                   </span>
                                   <span className="text-[9px] text-amber-700">Super Admin: add booking for past dates & backdated payments</span>
                               </div>
                           </label>
                       </div>
                   )}
                </div>

                {/* Historical Settings: Restricted to Super Admin Only */}
                {isSuperAdmin && walkInForm.isHistorical && (
                   <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wider">
                         <CalendarCheck size={16} /> Past Record Management Settings (Super Admin Exclusive)
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-[10px] font-black text-amber-800 uppercase mb-2">Historical Booking Status</label>
                            <select 
                               className="w-full border-2 border-amber-200 p-3 text-sm focus:border-amber-600 transition-all font-semibold bg-white focus:outline-none"
                               value={walkInForm.customStatus || 'Confirmed'}
                               onChange={e => setWalkInForm({...walkInForm, customStatus: e.target.value})}
                            >
                               <option value="Confirmed">Confirmed (Reserved)</option>
                               <option value="Checked-In">Checked-In (Occupied)</option>
                               <option value="Checked-Out">Checked-Out (Past Completed Stay)</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-amber-800 uppercase mb-2">Payment Received Date</label>
                            <input 
                               type="date"
                               className="w-full border-2 border-amber-200 p-3 text-sm focus:border-amber-600 transition-all font-semibold bg-white focus:outline-none"
                               value={walkInForm.paymentDate || walkInForm.checkInDate}
                               onChange={e => setWalkInForm({...walkInForm, paymentDate: e.target.value})}
                            />
                         </div>
                      </div>
                   </div>
                )}

                {(walkInForm.immediateCheckIn || walkInForm.customStatus === 'Checked-In') && (
                   <div className="animate-in slide-in-from-top-2 duration-200 space-y-2">
                       <label className="block text-[10px] font-black text-slate-400 uppercase">Assign Room Unit</label>
                       <select 
                           className="w-full border-2 border-slate-200 p-3 text-sm focus:border-[#1A2B48] transition-all font-semibold focus:outline-none" 
                           value={walkInForm.roomUnit} 
                           onChange={e => setWalkInForm({...walkInForm, roomUnit: e.target.value})} 
                           required={walkInForm.immediateCheckIn || walkInForm.customStatus === 'Checked-In'}
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
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Payment Mode (If Paid Now)</label>
                <select 
                  className="w-full border p-3 text-sm focus:outline-none focus:border-amber-500 font-semibold"
                  value={fbForm.paymentMode || 'Cash'}
                  onChange={e => setFbForm({...fbForm, paymentMode: e.target.value})}
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online / UPI</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={() => addCharge(selectedBooking._id, fbForm.description, Number(fbForm.amount), 'F&B')}
                  className="w-full bg-[#1A2B48] text-white py-3 font-black uppercase text-xs shadow-md hover:bg-[#253d66]"
                >
                  Add to Room Bill (Pay Later)
                </button>
                <div className="flex items-center gap-2 py-1">
                  <div className="h-px bg-slate-200 flex-grow"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">OR</span>
                  <div className="h-px bg-slate-200 flex-grow"></div>
                </div>
                <button 
                  onClick={async () => {
                    if(!fbForm.amount || Number(fbForm.amount) <= 0) return;
                    try {
                      const selectedMode = fbForm.paymentMode || 'Cash';
                      // 1. Add to bill first
                      await addCharge(selectedBooking._id, fbForm.description, Number(fbForm.amount), 'F&B');
                      // 2. Immediately collect payment with chosen mode
                      await collectPayment(selectedBooking._id, Number(fbForm.amount), selectedMode);
                      setIsFBModalOpen(false);
                      setFbForm({ description: '', amount: '', paymentMode: 'Cash' });
                    } catch (err) { console.error(err); }
                  }}
                  className="w-full bg-emerald-600 text-white py-4 font-black uppercase text-xs shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard size={14} /> Paid Now ({fbForm.paymentMode || 'Cash'})
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
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentForm({...paymentForm, mode: 'Cash'})}
                    className={`p-3 rounded-sm border-2 font-black text-xs uppercase flex flex-col items-center gap-1.5 transition-all ${
                      paymentForm.mode === 'Cash' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-md' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <IndianRupee size={18} />
                    <span className="text-[11px]">Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentForm({...paymentForm, mode: 'Online'})}
                    className={`p-3 rounded-sm border-2 font-black text-xs uppercase flex flex-col items-center gap-1.5 transition-all ${
                      paymentForm.mode === 'Online' ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard size={18} />
                    <span className="text-[11px]">Online / UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentForm({...paymentForm, mode: 'OTA'})}
                    className={`p-3 rounded-sm border-2 font-black text-xs uppercase flex flex-col items-center gap-1.5 transition-all ${
                      paymentForm.mode === 'OTA' ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-md' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Tag size={18} />
                    <span className="text-[11px]">OTA Portal</span>
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

      {/* Super Admin Exclusive: Edit Booking Details Modal */}
      {isSuperAdmin && isEditBookingOpen && (
        <div className="fixed inset-0 bg-[#1A2B48]/95 z-[120] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-sm p-8 shadow-2xl border-t-8 border-blue-600 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-[#1A2B48] uppercase tracking-wide">Edit Booking Record</h3>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">Administrative Access</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Modify guest details, reservation dates, room assignment, or financial totals.</p>
              </div>
              <button onClick={() => setIsEditBookingOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditBookingSubmit} className="space-y-6">
              {/* Guest Details */}
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">1. Guest Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="First Name" value={editBookingForm.firstName} onChange={v => setEditBookingForm({...editBookingForm, firstName: v})} />
                  <InputField label="Last Name" value={editBookingForm.lastName} onChange={v => setEditBookingForm({...editBookingForm, lastName: v})} />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <InputField label="Phone" value={editBookingForm.phone} onChange={v => setEditBookingForm({...editBookingForm, phone: v})} />
                  <InputField label="Email" type="email" value={editBookingForm.email} onChange={v => setEditBookingForm({...editBookingForm, email: v})} required={false} />
                  <InputField label="ID Proof Number" value={editBookingForm.idProof} onChange={v => setEditBookingForm({...editBookingForm, idProof: v})} required={false} />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <InputField label="Adults" type="number" value={editBookingForm.adults} onChange={v => setEditBookingForm({...editBookingForm, adults: v})} />
                  <InputField label="Children" type="number" value={editBookingForm.children} onChange={v => setEditBookingForm({...editBookingForm, children: v})} />
                </div>
              </div>

              {/* Stay & Room Details */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">2. Stay & Room Allocation</h4>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Check-In Date" type="date" value={editBookingForm.checkInDate} onChange={v => setEditBookingForm({...editBookingForm, checkInDate: v})} />
                  <InputField label="Check-Out Date" type="date" value={editBookingForm.checkOutDate} onChange={v => setEditBookingForm({...editBookingForm, checkOutDate: v})} />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Room Category</label>
                    <select 
                      className="w-full border-2 border-slate-200 p-3 text-sm focus:border-blue-600 transition-all font-semibold focus:outline-none"
                      value={editBookingForm.roomCategory}
                      onChange={e => setEditBookingForm({...editBookingForm, roomCategory: e.target.value})}
                      required
                    >
                      <option value="">-- Choose Category --</option>
                      {roomCategories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Assigned Unit (Room #)</label>
                    <select 
                      className="w-full border-2 border-slate-200 p-3 text-sm focus:border-blue-600 transition-all font-semibold focus:outline-none"
                      value={editBookingForm.roomUnit}
                      onChange={e => setEditBookingForm({...editBookingForm, roomUnit: e.target.value})}
                    >
                      <option value="">-- Unassigned / None --</option>
                      {availableUnits
                        .filter(u => {
                          if (!u.category || !editBookingForm.roomCategory) return true;
                          const uCatId = (u.category?._id || u.category).toString();
                          const bCatId = editBookingForm.roomCategory.toString();
                          return uCatId === bCatId || u._id === editBookingForm.roomUnit;
                        })
                        .map(u => (
                          <option key={u._id} value={u._id}>
                            Room {u.roomNumber} ({u.status})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Room Plan</label>
                    <select 
                      className="w-full border-2 border-slate-200 p-3 text-sm focus:border-blue-600 transition-all font-semibold focus:outline-none"
                      value={editBookingForm.roomPlan}
                      onChange={e => setEditBookingForm({...editBookingForm, roomPlan: e.target.value})}
                    >
                      <option value="EP">EP — European Plan</option>
                      <option value="CP">CP — Continental Plan</option>
                      <option value="MAP">MAP — Modified American</option>
                      <option value="AP">AP — American Plan</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status & Source */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">3. Status & Channel</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Booking Status</label>
                    <select 
                      className="w-full border-2 border-slate-200 p-3 text-sm focus:border-blue-600 transition-all font-semibold focus:outline-none font-bold"
                      value={editBookingForm.status}
                      onChange={e => setEditBookingForm({...editBookingForm, status: e.target.value})}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Checked-In">Checked-In</option>
                      <option value="Checked-Out">Checked-Out</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Booking Source</label>
                    <select 
                      className="w-full border-2 border-slate-200 p-3 text-sm focus:border-blue-600 transition-all font-semibold focus:outline-none"
                      value={editBookingForm.source}
                      onChange={e => setEditBookingForm({...editBookingForm, source: e.target.value})}
                    >
                      <option value="Walk-in">Walk-in</option>
                      <option value="Website">Website</option>
                      <option value="Booking.com">Booking.com</option>
                      <option value="MakeMyTrip">MakeMyTrip</option>
                      <option value="Goibibo">Goibibo</option>
                      <option value="Agoda">Agoda</option>
                      <option value="Expedia">Expedia</option>
                      <option value="Airbnb">Airbnb</option>
                      <option value="OTA">OTA</option>
                    </select>
                  </div>
                  <InputField label="OTA Ref / Booking ID" value={editBookingForm.otaReferenceId} onChange={v => setEditBookingForm({...editBookingForm, otaReferenceId: v})} required={false} />
                </div>
              </div>

              {/* Financial Overrides */}
              <div className="border-t pt-4 bg-slate-50 p-4 rounded-sm">
                <h4 className="text-xs font-black uppercase text-slate-600 tracking-wider mb-3">4. Financial Adjustments</h4>
                <div className="grid grid-cols-3 gap-4">
                  <InputField label="Room Tariff Rate (₹)" type="number" value={editBookingForm.roomTariff} onChange={v => setEditBookingForm({...editBookingForm, roomTariff: v})} />
                  <InputField label="Total Booking Amount (₹)" type="number" value={editBookingForm.totalAmount} onChange={v => setEditBookingForm({...editBookingForm, totalAmount: v})} />
                  <InputField label="Total Amount Paid (₹)" type="number" value={editBookingForm.amountPaid} onChange={v => setEditBookingForm({...editBookingForm, amountPaid: v})} />
                </div>
                <div className="mt-3 flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Recalculated Due Balance:</span>
                  <span className={(Number(editBookingForm.totalAmount) - Number(editBookingForm.amountPaid)) > 0 ? 'text-rose-600 font-black' : 'text-emerald-600 font-black'}>
                    ₹{Math.max(0, Number(editBookingForm.totalAmount) - Number(editBookingForm.amountPaid)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setIsEditBookingOpen(false)} className="flex-1 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 text-xs font-black uppercase shadow-xl transition-all">
                  Save Booking Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Exclusive: Manage Payments & Cash vs Online Modal */}
      {isSuperAdmin && isManagePaymentsOpen && selectedBooking && (
        <div className="fixed inset-0 bg-[#1A2B48]/95 z-[120] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-sm p-8 shadow-2xl border-t-8 border-purple-600 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-[#1A2B48] uppercase tracking-wide">Manage Financial Transactions</h3>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">Payment Controls</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Guest: <span className="font-bold text-slate-800">{selectedBooking.guestDetails?.firstName} {selectedBooking.guestDetails?.lastName}</span> | 
                  Room: <span className="font-bold text-slate-800">{selectedBooking.roomUnit?.roomNumber || 'N/A'}</span>
                </p>
              </div>
              <button onClick={() => setIsManagePaymentsOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm text-center">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Gross Total</span>
                <span className="text-xl font-black text-slate-800">₹{selectedBooking.financials?.totalAmount?.toLocaleString()}</span>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-sm text-center">
                <span className="text-[10px] font-black uppercase text-emerald-600 block mb-1">Total Paid</span>
                <span className="text-xl font-black text-emerald-700">₹{selectedBooking.financials?.amountPaid?.toLocaleString()}</span>
              </div>
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-sm text-center">
                <span className="text-[10px] font-black uppercase text-rose-500 block mb-1">Current Balance Due</span>
                <span className="text-xl font-black text-rose-600">₹{selectedBooking.financials?.balance?.toLocaleString()}</span>
              </div>
            </div>

            {/* Existing Payments Table */}
            <div className="mb-8">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-3 flex items-center justify-between">
                <span>Recorded Payment History ({selectedBooking.financials?.paymentHistory?.length || 0})</span>
                {isSuperAdmin && <span className="text-[10px] font-bold text-amber-600">★ Super Admin Editing Enabled</span>}
              </h4>
              <div className="border border-slate-200 rounded-sm overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Mode</th>
                      <th className="p-3">Staff / Note</th>
                      {isSuperAdmin && <th className="p-3 text-right">Super Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedBooking.financials?.paymentHistory?.length || 0) === 0 ? (
                      <tr><td colSpan={isSuperAdmin ? 6 : 5} className="p-4 text-center text-slate-400 italic">No payments logged yet.</td></tr>
                    ) : (
                      selectedBooking.financials?.paymentHistory?.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-400 font-bold">{i + 1}</td>
                          <td className="p-3 font-semibold">{new Date(p.timestamp).toLocaleDateString('en-GB')} {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="p-3 font-black text-emerald-700">₹{p.amount?.toLocaleString()}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              p.mode === 'Cash' ? 'bg-emerald-100 text-emerald-800' :
                              p.mode === 'Online' || p.mode === 'UPI' || p.mode === 'Online / UPI' ? 'bg-blue-100 text-blue-800' :
                              p.mode === 'OTA' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                              p.mode === 'Card' ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-800'
                            }`}>
                              {p.mode}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">
                            <div>{p.staff}</div>
                            {p.note && <div className="text-[10px] text-slate-400 italic">{p.note}</div>}
                          </td>
                          {isSuperAdmin && (
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleEditPaymentMode(i, p)}
                                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold text-[10px] uppercase border border-amber-300 transition-all"
                                  title="Change mode (Cash/Online) or amount"
                                >
                                  Edit Mode
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePayment(i, p)}
                                  className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded font-bold text-[10px] uppercase border border-rose-300 transition-all"
                                  title="Delete payment entry"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Payment Form */}
            <div className="border-t pt-6 bg-slate-50 p-6 rounded-sm">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-4 flex items-center gap-2">
                <Plus size={16} /> Add / Record Payment Entry
              </h4>
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <InputField 
                    label="Payment Amount (₹)" 
                    type="number" 
                    value={newPaymentForm.amount} 
                    onChange={v => setNewPaymentForm({...newPaymentForm, amount: v})} 
                    placeholder="e.g. 2000"
                  />
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Payment Mode</label>
                    <select 
                      className="w-full border-2 border-slate-200 p-3 text-sm focus:border-purple-600 transition-all font-semibold focus:outline-none bg-white"
                      value={newPaymentForm.mode}
                      onChange={e => setNewPaymentForm({...newPaymentForm, mode: e.target.value})}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online">Online / UPI</option>
                      <option value="OTA">OTA Channel Settlement</option>
                      <option value="Card">Credit/Debit Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Other">Other Mode</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Payment Date</label>
                    <input 
                      type="date"
                      className="w-full border-2 border-slate-200 p-3 text-sm focus:border-purple-600 transition-all font-semibold focus:outline-none bg-white"
                      value={newPaymentForm.date}
                      onChange={e => setNewPaymentForm({...newPaymentForm, date: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1">
                  <InputField 
                    label="Transaction Note / Reference (Optional)" 
                    value={newPaymentForm.note} 
                    onChange={v => setNewPaymentForm({...newPaymentForm, note: v})} 
                    required={false}
                    placeholder="e.g. Received via GPay / Handed to Front Desk"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white py-4 font-black uppercase text-xs shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <DollarSign size={16} /> Record Payment & Sync Accounts
                </button>
              </form>
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

const InputField = ({ label, value, onChange, type = "text", required = true, min, max, placeholder }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">{label}</label>
    <input 
      type={type} 
      value={value} 
      min={min} 
      max={max} 
      placeholder={placeholder} 
      onChange={e => onChange(e.target.value)} 
      className="w-full border-2 border-slate-200 p-3 text-sm focus:border-[#1A2B48] transition-all focus:outline-none" 
      required={required} 
    />
  </div>
);

const ChevronRight = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6"/>
    </svg>
);

export default FrontDeskManagement;
