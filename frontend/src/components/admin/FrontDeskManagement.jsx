import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import config from '../../config';
import { 
  X, CheckCircle2, IndianRupee, Printer, LogOut, 
  Plus, Info, ArrowRight, User, Calendar, CreditCard, AlertTriangle, History, FastForward, Coffee, TrendingUp, BarChart3, CalendarPlus, Zap, Activity, Bed,
  Trash2, Edit3, ShieldCheck, DollarSign, CalendarCheck, Tag, FileEdit,
  MessageCircle, Share2, Download, Copy, Check, ExternalLink,
  Utensils, Search, Minus, CheckSquare, ClipboardCheck, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { socket } from '@/lib/socket';
import FrontDeskAnalytics from './FrontDeskAnalytics';

const API_BASE = config.API_URL;

const WhatsAppIcon = ({ size = 16, className = "" }) => (
  <svg 
    viewBox="0 0 448 512" 
    width={size} 
    height={size} 
    className={className} 
    fill="currentColor"
  >
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.7-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.2-3.2-5.6-.3-8.6 2.5-11.3 2.5-2.5 5.6-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.6-9.3 1.9-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.3 5.7 23.7 9.1 31.7 11.7 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
  </svg>
);

const FrontDeskManagement = ({ isSuperAdmin: propIsSuperAdmin, role = 'Admin' } = {}) => {
  const { user, isSuperAdmin: authIsSuperAdmin } = useAuth();
  const isSuperAdmin = propIsSuperAdmin !== undefined ? propIsSuperAdmin : authIsSuperAdmin;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ checkIns: 0, checkOuts: 0, inHouse: 0, available: 0 });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isBookingTypeSelectOpen, setIsBookingTypeSelectOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isExtendStayOpen, setIsExtendStayOpen] = useState(false);
  const [extendForm, setExtendForm] = useState({ newCheckOutDate: '', additionalTariff: '' });

  // WhatsApp Confirmation Modal State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppData, setWhatsAppData] = useState(null);
  const [whatsAppCustomMsg, setWhatsAppCustomMsg] = useState('');
  const [copiedWhatsAppText, setCopiedWhatsAppText] = useState(false);

  const [isCollectPaymentOpen, setIsCollectPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', mode: 'Cash' });
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Amendment Request State
  const [isAmendModalOpen, setIsAmendModalOpen] = useState(false);
  const [amendBooking, setAmendBooking] = useState(null);
  const [amendReason, setAmendReason] = useState('');
  const [submittingAmend, setSubmittingAmend] = useState(false);

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
  const [editingMeterId, setEditingMeterId] = useState(null);
  const [meterForm, setMeterForm] = useState({
    date: new Date().toISOString().split('T')[0],
    reading: '',
    notes: ''
  });
  const [meterReadings, setMeterReadings] = useState([]);

  // Food Bill & Restaurant Ordering State (Requirement 2)
  const [isFoodBillOpen, setIsFoodBillOpen] = useState(false);
  const [foodTargetBookingId, setFoodTargetBookingId] = useState('');
  const [menuCategories, setMenuCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [foodActiveCategory, setFoodActiveCategory] = useState('All');
  const [foodOrderCart, setFoodOrderCart] = useState([]);
  const [foodOrderNotes, setFoodOrderNotes] = useState('');
  const [isSubmittingFoodBill, setIsSubmittingFoodBill] = useState(false);

  // Mandatory Room Inspection Workflow State (Requirement 3)
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [inspectionBooking, setInspectionBooking] = useState(null);
  const [inspectionForm, setInspectionForm] = useState({
    inspected: 'Yes',
    inspectedBy: 'Vishal Singh',
    customInspectorName: '',
    issueFound: 'No',
    issueDescription: '',
    damageCharge: '',
    addDamageToBill: true,
    remarks: '',
    override: false
  });
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);

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

  // Walk-in / Advance form state
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
    paymentDate: '',
    bookingType: 'Immediate',
    numberOfRooms: 1,
    voucherUrl: ''
  });

  // Past guests for autofill (Requirement 4)
  const [showGuestSuggestions, setShowGuestSuggestions] = useState(false);

  const pastGuests = useMemo(() => {
    const map = new Map();
    (bookings || []).forEach(b => {
      const g = b.guestDetails;
      if (g && g.firstName && g.firstName.trim()) {
        const key = `${(g.firstName || '').trim().toLowerCase()}_${(g.lastName || '').trim().toLowerCase()}_${(g.phone || '').trim()}`;
        if (!map.has(key)) {
          map.set(key, {
            firstName: g.firstName.trim(),
            lastName: (g.lastName || '').trim(),
            phone: (g.phone || '').trim(),
            email: (g.email || '').trim(),
            idProof: (g.idProof || '').trim()
          });
        }
      }
    });
    return Array.from(map.values());
  }, [bookings]);

  const guestSuggestions = useMemo(() => {
    const query = (walkInForm.guestDetails?.firstName || '').trim().toLowerCase();
    if (!query || query.length < 1) return [];
    return pastGuests.filter(g => 
      g.firstName.toLowerCase().includes(query) ||
      g.lastName.toLowerCase().includes(query) ||
      (g.phone && g.phone.includes(query))
    ).slice(0, 6);
  }, [pastGuests, walkInForm.guestDetails?.firstName]);

  const handleSelectPastGuest = (guest) => {
    setWalkInForm(prev => ({
      ...prev,
      guestDetails: {
        ...prev.guestDetails,
        firstName: guest.firstName,
        lastName: guest.lastName,
        phone: guest.phone || prev.guestDetails.phone,
        email: guest.email || prev.guestDetails.email,
        idProof: guest.idProof || prev.guestDetails.idProof
      }
    }));
    setShowGuestSuggestions(false);
  };

  // Helper: Format date for WhatsApp message (e.g. 14Sep2026, 16Sep2026)
  const formatWhatsAppDate = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string' && dateVal.includes('-')) {
      const parts = dateVal.split('T')[0].split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${String(d).padStart(2, '0')}${months[m]}${y}`;
      }
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}${months[d.getMonth()]}${d.getFullYear()}`;
  };

  // Helper: Generate structured WhatsApp confirmation text (Requirement 6)
  const generateWhatsAppMessage = (data, customVoucher) => {
    if (!data) return '';
    const firstName = data.guestDetails?.firstName || '';
    const lastName = data.guestDetails?.lastName || '';
    const guestName = `${firstName} ${lastName}`.trim() || data.guestName || 'Guest';

    const bookingDateStr = formatWhatsAppDate(data.bookingDate || data.createdAt || new Date());
    const checkInDateStr = formatWhatsAppDate(data.checkInDate);
    const checkOutDateStr = formatWhatsAppDate(data.checkOutDate);

    let roomName = 'Double Deluxe Room';
    if (data.roomCategory) {
      if (typeof data.roomCategory === 'object' && (data.roomCategory.title || data.roomCategory.category)) {
        roomName = data.roomCategory.title || data.roomCategory.category;
      } else {
        const foundCat = (roomCategories || []).find(c => c._id === data.roomCategory);
        if (foundCat) roomName = foundCat.title || foundCat.category;
      }
    }

    const noOfRooms = data.numberOfRooms || 1;
    const advancePaid = Number(data.financials?.amountPaid ?? (data.amountPaid ?? 0));
    const totalAmount = Number(data.financials?.totalAmount ?? (data.totalAmount ?? (data.financials?.roomTariff ?? 0)));
    const paymentDue = Math.max(0, totalAmount - advancePaid);

    const voucherUrl = customVoucher || data.voucherUrl || (data.otaReferenceId ? `https://ingoibibo.app.link/${data.otaReferenceId}` : (typeof window !== 'undefined' ? `${window.location.origin}/my-bookings?id=${data._id || ''}` : 'https://hotelbhopalinn.com'));

    return `Congratulation Your Booking is Confirmed !! 
Hotel Bhopal Inn by Ten On Ten Stays, Bhopal

Booking Details:

Guest Name: ${guestName}
Booking Date: ${bookingDateStr}
Check-In Date: ${checkInDateStr} 
Check-Out Date: ${checkOutDateStr}
Room Type:  ${roomName} 
No of Rooms: ${noOfRooms}
Payment Advance: ${advancePaid}
Payment Due: ${paymentDue}
Total Amount: ${totalAmount}


View Voucher: ${voucherUrl}

Payment Policy: 
${advancePaid > 0 ? `₹${advancePaid}` : '₹0'} received, remaining ${paymentDue > 0 ? `₹${paymentDue}` : '₹0'} need to pay at check-in time.


Cancellation Policy:
No refund or amendment within 30 days of check-in.
100% refund if canceled before 30 days.

Terms:
•⁠  ⁠Decoration and Extra bed charges separetly
•⁠  ⁠Anything which is not mentioned will be additional charged 
•⁠  ⁠Outside food not allowed
•⁠  ⁠Check-in: 11:00 AM | Check-out: 10:00 AM
•⁠  ⁠Early check-in / Late check-out with extra charges and depends on previous day occupancy
Please honor this confirmed booking – rejecting it will attract penalty and may impact your future business

 Hotel Location: https://maps.google.com/?q=2/213,+Danish+Nagar,+BBagmugaliya,+Bhopal,+Madhya+Pradesh+462026 (D2-214, Danish Nagar, HoshangabadRoad, Bhopal)`;
  };

  const openWhatsAppModalForBooking = (booking) => {
    if (!booking) return;
    setWhatsAppData(booking);
    setWhatsAppCustomMsg(generateWhatsAppMessage(booking));
    setCopiedWhatsAppText(false);
    setIsWhatsAppModalOpen(true);
  };

  const handleSendWhatsApp = () => {
    if (!whatsAppData) return;
    const phone = whatsAppData.guestDetails?.phone || whatsAppData.phone || '';
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    else if (cleanPhone.startsWith('0') && cleanPhone.length === 11) cleanPhone = '91' + cleanPhone.slice(1);

    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsAppCustomMsg)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsAppCustomMsg)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyWhatsAppText = async () => {
    try {
      await navigator.clipboard.writeText(whatsAppCustomMsg);
      setCopiedWhatsAppText(true);
      setTimeout(() => setCopiedWhatsAppText(false), 2500);
    } catch (err) {
      alert('Message copied to clipboard!');
    }
  };

  const handleDownloadBrochureImage = () => {
    const link = document.createElement('a');
    link.href = '/hotel_announcement.png';
    link.download = 'Hotel_Bhopal_Inn_Brochure.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyImageToClipboard = async () => {
    try {
      const response = await fetch('/hotel_announcement.png');
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      alert('Brochure image copied to clipboard! You can paste (Ctrl+V) directly into WhatsApp chat.');
    } catch (err) {
      handleDownloadBrochureImage();
    }
  };

  // Calculate Walk-in Financials dynamically based on stay duration and number of rooms
  useEffect(() => {
    const checkIn = new Date(walkInForm.checkInDate);
    const checkOut = new Date(walkInForm.checkOutDate);
    const diffTime = checkOut - checkIn;
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const rooms = Math.max(1, Number(walkInForm.numberOfRooms) || 1);
    const calculatedTotal = (Number(walkInForm.financials.roomTariff) || 0) * nights * rooms;
    const calculatedBalance = Math.max(0, calculatedTotal - (Number(walkInForm.financials.amountPaid) || 0));

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
  }, [walkInForm.checkInDate, walkInForm.checkOutDate, walkInForm.financials.roomTariff, walkInForm.financials.amountPaid, walkInForm.numberOfRooms]);

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

  const handleCheckOut = (id, override = false) => {
    const booking = bookings.find(b => b._id === id) || selectedBooking;
    if (booking) {
      openInspectionModal(booking, override);
    } else {
      alert('Selected booking not found for checkout.');
    }
  };

  const collectPayment = async (id, amount, mode) => {
    if(!amount || amount <= 0 || isSubmittingPayment) return;
    try {
      setIsSubmittingPayment(true);
      // 1. Record in Booking History and create linked Finance Transaction via backend
      await axios.post(`${API_BASE}/api/bookings/${id}/collect-payment`, { 
        amount: Number(amount), 
        mode,
        staff: 'Admin_Staff' 
      });

      fetchData();
      const updated = (await axios.get(`${API_BASE}/api/bookings`)).data.find(b => b._id === id);
      setSelectedBooking(updated);
    } catch (err) {
      console.error('Payment sync error:', err);
      alert('Payment collection failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingPayment(false);
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
    if (isSubmittingWalkIn) return;
    try {
      setIsSubmittingWalkIn(true);
      const isAdvance = walkInForm.bookingType === 'Advance';
      const todayStr = new Date().toISOString().split('T')[0];

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
        paymentDate: isAdvance ? walkInForm.checkInDate : (walkInForm.paymentDate || walkInForm.checkInDate),
        bookingDate: todayStr,
        bookingType: walkInForm.bookingType || (walkInForm.immediateCheckIn ? 'Immediate' : 'Walk-in'),
        numberOfRooms: walkInForm.numberOfRooms ? Number(walkInForm.numberOfRooms) : 1,
        voucherUrl: walkInForm.voucherUrl || ''
      };

      const res = await axios.post(`${API_BASE}/api/bookings/walk-in`, payload);

      setIsWalkInOpen(false);
      fetchData();
      
      const createdBooking = res.data;
      if (isAdvance) {
        openWhatsAppModalForBooking({
          ...createdBooking,
          bookingDate: todayStr,
          numberOfRooms: walkInForm.numberOfRooms || 1,
          voucherUrl: walkInForm.voucherUrl
        });
      } else {
        alert('Walk-in registered and guest checked-in successfully!');
      }

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
        paymentDate: '',
        bookingType: 'Immediate',
        numberOfRooms: 1,
        voucherUrl: ''
      });
    } catch (err) {
      alert('Failed to register booking: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingWalkIn(false);
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

  // Submit Amendment Request to Super Admin
  const handleRequestAmendment = async (e) => {
    e.preventDefault();
    if (!amendBooking || !amendReason.trim()) {
      alert('Please provide a reason or explanation for the amendment.');
      return;
    }

    try {
      setSubmittingAmend(true);
      const token = localStorage.getItem('token') || (user && user.token);
      const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      await axios.post(
        `${API_BASE}/api/amendments/request`,
        {
          bookingId: amendBooking._id,
          reason: amendReason.trim()
        },
        authHeader
      );

      alert(`Amendment request submitted to Super Admin for ${amendBooking.guestDetails?.firstName} ${amendBooking.guestDetails?.lastName}!\n\nSuper Admin will review your request in their portal. Once approved (✓), you will be able to edit or delete this entry in the Amendments section.`);
      setIsAmendModalOpen(false);
      setAmendBooking(null);
      setAmendReason('');
    } catch (err) {
      alert('Failed to submit amendment request: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingAmend(false);
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

  const handleEditMeterClick = (r) => {
    const formattedDate = r.dateStr || (r.date ? new Date(r.date).toISOString().split('T')[0] : '');
    setMeterForm({
      date: formattedDate,
      reading: r.reading,
      notes: r.notes || ''
    });
    setEditingMeterId(r._id);
  };

  const handleCancelMeterEdit = () => {
    setEditingMeterId(null);
    setMeterForm({
      date: new Date().toISOString().split('T')[0],
      reading: '',
      notes: ''
    });
  };

  const handleDeleteMeter = async (id) => {
    if (!window.confirm('Delete this electricity meter reading entry?')) return;
    try {
      await axios.delete(`${API_BASE}/api/finance/meter-reading/${id}`);
      alert('Meter reading deleted.');
      if (editingMeterId === id) handleCancelMeterEdit();
      fetchMeterReadings();
    } catch (err) {
      alert('Failed to delete reading: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleMeterSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMeterId) {
        await axios.put(`${API_BASE}/api/finance/meter-reading/${editingMeterId}`, {
          date: meterForm.date,
          reading: Number(meterForm.reading),
          notes: meterForm.notes,
          recordedBy: (user && user.name) || 'Front Desk'
        });
        alert('Electricity meter reading updated successfully!');
      } else {
        await axios.post(`${API_BASE}/api/finance/meter-reading`, {
          date: meterForm.date,
          reading: Number(meterForm.reading),
          notes: meterForm.notes,
          recordedBy: (user && user.name) || 'Front Desk'
        });
        alert('Electricity meter reading saved successfully!');
      }
      handleCancelMeterEdit();
      fetchMeterReadings();
    } catch (err) {
      console.error(err);
      alert('Failed to save meter reading: ' + (err.response?.data?.message || err.message));
    }
  };

  // Requirement 2: Default Fallback Menu Catalog for Front Desk Food Billing
  const DEFAULT_MENU_CATEGORIES = [
    { _id: 'cat_starters', name: 'Starters & Snacks' },
    { _id: 'cat_main', name: 'Main Course' },
    { _id: 'cat_breads', name: 'Breads & Rotis' },
    { _id: 'cat_rice', name: 'Rice & Biryani' },
    { _id: 'cat_beverages', name: 'Beverages & Drinks' },
    { _id: 'cat_desserts', name: 'Desserts' }
  ];

  const DEFAULT_MENU_ITEMS = [
    // Starters & Snacks
    { _id: 'item_1', name: 'Paneer Tikka (6 Pcs)', category: { _id: 'cat_starters', name: 'Starters & Snacks' }, cost: 240, isVeg: true, description: 'Cottage cheese marinated in spices and grilled in tandoor' },
    { _id: 'item_2', name: 'Veg Crispy', category: { _id: 'cat_starters', name: 'Starters & Snacks' }, cost: 180, isVeg: true, description: 'Crisp fried mixed vegetables tossed in sweet and spicy sauce' },
    { _id: 'item_3', name: 'French Fries', category: { _id: 'cat_starters', name: 'Starters & Snacks' }, cost: 110, isVeg: true, description: 'Golden crispy salted potato fries' },
    { _id: 'item_4', name: 'Veg Pakoda Platter', category: { _id: 'cat_starters', name: 'Starters & Snacks' }, cost: 140, isVeg: true, description: 'Assorted seasonal vegetable fritters served with mint chutney' },
    { _id: 'item_5', name: 'Hara Bhara Kabab', category: { _id: 'cat_starters', name: 'Starters & Snacks' }, cost: 190, isVeg: true, description: 'Spiced spinach, green peas and potato patties' },
    { _id: 'item_6', name: 'Cheese Grilled Sandwich', category: { _id: 'cat_starters', name: 'Starters & Snacks' }, cost: 130, isVeg: true, description: 'Toasted bread filled with molten cheese and spices' },
    { _id: 'item_7', name: 'Veg Club Sandwich', category: { _id: 'cat_starters', name: 'Starters & Snacks' }, cost: 140, isVeg: true, description: 'Double decker toasted sandwich with cucumber, tomato and cheese' },

    // Main Course
    { _id: 'item_8', name: 'Paneer Butter Masala', category: { _id: 'cat_main', name: 'Main Course' }, cost: 260, isVeg: true, description: 'Cubes of cottage cheese in rich makhani gravy' },
    { _id: 'item_9', name: 'Kadhai Paneer', category: { _id: 'cat_main', name: 'Main Course' }, cost: 270, isVeg: true, description: 'Paneer tossed with bell peppers and roasted ground spices' },
    { _id: 'item_10', name: 'Dal Makhani', category: { _id: 'cat_main', name: 'Main Course' }, cost: 210, isVeg: true, description: 'Slow cooked black lentils with fresh cream and butter' },
    { _id: 'item_11', name: 'Dal Tadka (Yellow Dal)', category: { _id: 'cat_main', name: 'Main Course' }, cost: 160, isVeg: true, description: 'Yellow lentils tempered with cumin, garlic and dried chili' },
    { _id: 'item_12', name: 'Mix Vegetable Handi', category: { _id: 'cat_main', name: 'Main Course' }, cost: 190, isVeg: true, description: 'Melange of garden fresh vegetables in aromatic Indian gravy' },
    { _id: 'item_13', name: 'Malai Kofta', category: { _id: 'cat_main', name: 'Main Course' }, cost: 280, isVeg: true, description: 'Dumplings of paneer and potato in luscious cashew gravy' },
    { _id: 'item_14', name: 'Sev Tamatar', category: { _id: 'cat_main', name: 'Main Course' }, cost: 160, isVeg: true, description: 'Traditional spicy Malwa tomato curry topped with ratlami sev' },
    { _id: 'item_15', name: 'Kaju Curry', category: { _id: 'cat_main', name: 'Main Course' }, cost: 310, isVeg: true, description: 'Roasted whole cashew nuts in creamy onion tomato sauce' },

    // Breads & Rotis
    { _id: 'item_16', name: 'Butter Tandoori Roti', category: { _id: 'cat_breads', name: 'Breads & Rotis' }, cost: 25, isVeg: true, description: 'Freshly baked wheat bread with butter' },
    { _id: 'item_17', name: 'Plain Tandoori Roti', category: { _id: 'cat_breads', name: 'Breads & Rotis' }, cost: 20, isVeg: true, description: 'Freshly baked whole wheat flatbread' },
    { _id: 'item_18', name: 'Butter Naan', category: { _id: 'cat_breads', name: 'Breads & Rotis' }, cost: 55, isVeg: true, description: 'Leavened soft flatbread brushed with butter' },
    { _id: 'item_19', name: 'Garlic Naan', category: { _id: 'cat_breads', name: 'Breads & Rotis' }, cost: 75, isVeg: true, description: 'Clay oven bread infused with chopped roasted garlic' },
    { _id: 'item_20', name: 'Lachha Paratha', category: { _id: 'cat_breads', name: 'Breads & Rotis' }, cost: 50, isVeg: true, description: 'Flaky layered whole wheat flatbread' },

    // Rice & Biryani
    { _id: 'item_21', name: 'Steamed Basmati Rice', category: { _id: 'cat_rice', name: 'Rice & Biryani' }, cost: 120, isVeg: true, description: 'Fragrant long grain white rice' },
    { _id: 'item_22', name: 'Jeera Rice', category: { _id: 'cat_rice', name: 'Rice & Biryani' }, cost: 150, isVeg: true, description: 'Basmati rice tempered with roasted cumin seeds and ghee' },
    { _id: 'item_23', name: 'Veg Pulao', category: { _id: 'cat_rice', name: 'Rice & Biryani' }, cost: 180, isVeg: true, description: 'Rice cooked with diced vegetables and mild whole spices' },
    { _id: 'item_24', name: 'Special Veg Dum Biryani', category: { _id: 'cat_rice', name: 'Rice & Biryani' }, cost: 240, isVeg: true, description: 'Layered basmati rice with spiced vegetables, served with raita' },

    // Beverages & Drinks
    { _id: 'item_25', name: 'Special Masala Chai', category: { _id: 'cat_beverages', name: 'Beverages & Drinks' }, cost: 30, isVeg: true, description: 'Freshly brewed tea with ginger, cardamom and milk' },
    { _id: 'item_26', name: 'Hot Coffee', category: { _id: 'cat_beverages', name: 'Beverages & Drinks' }, cost: 50, isVeg: true, description: 'Frothy hot coffee with milk' },
    { _id: 'item_27', name: 'Cold Coffee with Ice Cream', category: { _id: 'cat_beverages', name: 'Beverages & Drinks' }, cost: 100, isVeg: true, description: 'Chilled blended coffee topped with vanilla ice cream' },
    { _id: 'item_28', name: 'Fresh Lime Soda (Sweet/Salt)', category: { _id: 'cat_beverages', name: 'Beverages & Drinks' }, cost: 60, isVeg: true, description: 'Refreshing sparkling lime drink' },
    { _id: 'item_29', name: 'Packaged Mineral Water (1L)', category: { _id: 'cat_beverages', name: 'Beverages & Drinks' }, cost: 25, isVeg: true, description: 'Sealed purified drinking water bottle' },
    { _id: 'item_30', name: 'Soft Drink Can / Bottle', category: { _id: 'cat_beverages', name: 'Beverages & Drinks' }, cost: 45, isVeg: true, description: 'Chilled cold drink (Coke, Sprite, Thums Up)' },

    // Desserts
    { _id: 'item_31', name: 'Gulab Jamun (2 Pcs)', category: { _id: 'cat_desserts', name: 'Desserts' }, cost: 70, isVeg: true, description: 'Hot khoya dumplings soaked in fragrant sugar syrup' },
    { _id: 'item_32', name: 'Rasgulla (2 Pcs)', category: { _id: 'cat_desserts', name: 'Desserts' }, cost: 70, isVeg: true, description: 'Spongy cottage cheese balls in light sugar syrup' },
    { _id: 'item_33', name: 'Vanilla / Butterscotch Ice Cream', category: { _id: 'cat_desserts', name: 'Desserts' }, cost: 60, isVeg: true, description: 'Two scoops of premium ice cream' }
  ];

  const fetchMenuData = async () => {
    try {
      const [catRes, itemRes] = await Promise.all([
        axios.get(`${API_BASE}/api/menu/categories`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/menu/items`).catch(() => ({ data: [] }))
      ]);

      const fetchedCats = Array.isArray(catRes.data) && catRes.data.length > 0 ? catRes.data : DEFAULT_MENU_CATEGORIES;
      const fetchedItems = Array.isArray(itemRes.data) && itemRes.data.length > 0 ? itemRes.data : DEFAULT_MENU_ITEMS;

      setMenuCategories(fetchedCats);
      setMenuItems(fetchedItems);
    } catch (err) {
      console.error('Error loading menu:', err);
      setMenuCategories(DEFAULT_MENU_CATEGORIES);
      setMenuItems(DEFAULT_MENU_ITEMS);
    }
  };

  const openFoodBillModal = (booking = null) => {
    if (booking) {
      setFoodTargetBookingId(booking._id);
    } else {
      const checkedInList = bookings.filter(b => b.status === 'Checked-In');
      if (checkedInList.length > 0) {
        setFoodTargetBookingId(checkedInList[0]._id);
      } else if (bookings.length > 0) {
        setFoodTargetBookingId(bookings[0]._id);
      } else {
        setFoodTargetBookingId('');
      }
    }
    setFoodSearchQuery('');
    setFoodActiveCategory('All');
    setFoodOrderCart([]);
    setFoodOrderNotes('');
    setIsFoodBillOpen(true);
    fetchMenuData();
  };

  const getFoodItemQuantity = (itemId) => {
    const found = foodOrderCart.find(c => (c.item._id || c.item.name) === itemId);
    return found ? found.quantity : 0;
  };

  const addFoodItemToCart = (item) => {
    const idToMatch = item._id || item.name;
    setFoodOrderCart(prev => {
      const existing = prev.find(c => (c.item._id || c.item.name) === idToMatch);
      if (existing) {
        return prev.map(c => (c.item._id || c.item.name) === idToMatch ? { ...c, quantity: c.quantity + 1 } : c);
      } else {
        return [...prev, { item, quantity: 1 }];
      }
    });
  };

  const removeFoodItemFromCart = (item) => {
    const idToMatch = item._id || item.name;
    setFoodOrderCart(prev => {
      const existing = prev.find(c => (c.item._id || c.item.name) === idToMatch);
      if (!existing) return prev;
      if (existing.quantity > 1) {
        return prev.map(c => (c.item._id || c.item.name) === idToMatch ? { ...c, quantity: c.quantity - 1 } : c);
      } else {
        return prev.filter(c => (c.item._id || c.item.name) !== idToMatch);
      }
    });
  };

  const handleFoodBillSubmit = async (e) => {
    e.preventDefault();
    if (!foodTargetBookingId) {
      alert('Please select an active in-house room/guest to attach the food bill.');
      return;
    }
    if (foodOrderCart.length === 0) {
      alert('Please add at least one menu item to the food bill.');
      return;
    }

    try {
      setIsSubmittingFoodBill(true);
      const totalAmount = foodOrderCart.reduce((sum, c) => sum + ((c.item.cost || c.item.price || 0) * c.quantity), 0);
      const itemsText = foodOrderCart.map(c => `${c.item.name} (x${c.quantity})`).join(', ');
      const description = `Food Bill: ${itemsText}${foodOrderNotes ? ' [Notes: ' + foodOrderNotes + ']' : ''}`;

      await axios.post(`${API_BASE}/api/bookings/${foodTargetBookingId}/add-charge`, {
        description,
        amount: totalAmount,
        source: 'F&B'
      });

      alert(`✅ Food bill of ₹${totalAmount.toLocaleString()} successfully added to Room Bill!`);
      setIsFoodBillOpen(false);
      setFoodOrderCart([]);
      setFoodOrderNotes('');
      fetchData();
      if (selectedBooking && selectedBooking._id === foodTargetBookingId) {
        const updated = (await axios.get(`${API_BASE}/api/bookings`)).data.find(b => b._id === foodTargetBookingId);
        if (updated) setSelectedBooking(updated);
      }
    } catch (err) {
      alert('Failed to add food bill: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingFoodBill(false);
    }
  };

  // Mandatory Room Inspection Modal Handlers (Requirement 3)
  const openInspectionModal = (booking, isOverride = false) => {
    if (!booking) return;
    setInspectionBooking(booking);
    setInspectionForm({
      inspected: 'Yes',
      inspectedBy: 'Vishal Singh',
      customInspectorName: '',
      issueFound: 'No',
      issueDescription: '',
      damageCharge: '',
      addDamageToBill: true,
      remarks: '',
      override: isOverride
    });
    setIsInspectionModalOpen(true);
  };

  const handleInspectionCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!inspectionBooking) return;

    if (inspectionForm.inspected !== 'Yes') {
      alert('⚠️ Mandatory Room Inspection Required: You must complete the room inspection before checking out.');
      return;
    }

    const inspectorName = inspectionForm.inspectedBy === 'Other' 
      ? inspectionForm.customInspectorName.trim() 
      : inspectionForm.inspectedBy;

    if (!inspectorName) {
      alert('Please specify the staff member who inspected the room.');
      return;
    }

    const hasIssue = inspectionForm.issueFound === 'Yes';
    if (hasIssue && !inspectionForm.issueDescription.trim()) {
      alert('Please enter details of the damaged or missing items found.');
      return;
    }

    const damageChargeNum = hasIssue && inspectionForm.damageCharge ? Number(inspectionForm.damageCharge) : 0;

    try {
      setIsSubmittingCheckout(true);
      await axios.post(`${API_BASE}/api/bookings/${inspectionBooking._id}/check-out`, {
        override: inspectionForm.override,
        inspection: {
          inspected: true,
          inspectedBy: inspectorName,
          issueFound: hasIssue,
          issueDescription: hasIssue ? inspectionForm.issueDescription.trim() : '',
          damageCharge: damageChargeNum,
          remarks: inspectionForm.remarks.trim()
        },
        addDamageCharge: inspectionForm.addDamageToBill
      });

      alert(`✅ Checkout Successful!\n\nRoom unit has been marked as "Dirty" for Housekeeping inspection and cleaning.\nRoom will NOT become available until marked clean by Housekeeping.`);
      setIsInspectionModalOpen(false);
      setInspectionBooking(null);
      setIsDetailOpen(false);
      setSelectedBooking(null);
      fetchData();
      fetchSupportData();
    } catch (err) {
      if (err.response?.data?.requiresOverride) {
        const bal = err.response.data.balance;
        alert(`⚠️ BALANCE DUE: ₹${bal.toLocaleString()}\n\nGuest has an outstanding balance (including any damage charges).\nPlease collect the balance before finalizing checkout, or have Super Admin authorize Manager Override.`);
        setIsInspectionModalOpen(false);
        fetchData();
        const updated = (await axios.get(`${API_BASE}/api/bookings`)).data.find(b => b._id === inspectionBooking._id);
        if (updated) setSelectedBooking(updated);
      } else {
        alert('Checkout failed: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setIsSubmittingCheckout(false);
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
    <div className="space-y-6 font-sans p-6 bg-slate-50 rounded-2xl">
      {/* Top Operations Tracker Bar: Electricity Meter & Food Bill */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 border border-amber-500/40 shadow-md rounded-sm gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-600 rounded">
            <Zap size={20} className="fill-amber-500" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-[#1A2B48] tracking-wider">Property Operations & F&B Services</h3>
            <p className="text-[10px] text-slate-500 font-semibold">Record daily kWh meter readings & process guest food bills</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => openFoodBillModal()}
            className="bg-[#1A2B48] hover:bg-[#253d66] text-white px-5 py-2.5 rounded-sm text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-95 border border-slate-700"
          >
            <Utensils size={14} className="text-amber-400" /> 🍽️ Food Bill
          </button>
          <button 
            onClick={() => setIsMeterModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2.5 rounded-sm text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-95"
          >
            <Zap size={14} className="fill-slate-950" /> Meter Readings
          </button>
        </div>
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

          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {isSuperAdmin && (
              <button 
                onClick={() => setIsAnalyticsOpen(true)} 
                className="h-10 px-4 bg-[#BFA37E] hover:bg-[#a68d6d] text-slate-950 rounded-sm text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all hover:scale-105 active:scale-95 whitespace-nowrap shrink-0"
              >
                <TrendingUp size={15} />
                <span>Analytics</span>
              </button>
            )}
            <button 
              onClick={() => openFoodBillModal()} 
              className="h-10 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-sm text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all hover:scale-105 active:scale-95 whitespace-nowrap shrink-0"
              title="Create Food Bill & Restaurant Order"
            >
              <Utensils size={15} />
              <span>Food Bill</span>
            </button>
            <button 
              onClick={() => setIsBookingTypeSelectOpen(true)} 
              className="h-10 px-4 bg-white hover:bg-slate-100 text-[#1A2B48] rounded-sm text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all hover:scale-105 active:scale-95 whitespace-nowrap shrink-0"
            >
              <Plus size={16} />
              <span>New Walk-In</span>
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
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAmendBooking(booking);
                          setAmendReason('');
                          setIsAmendModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-amber-500/10 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-300 rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-xs"
                        title="Request amendment for this entry"
                      >
                        <FileEdit size={11} />
                        <span>Amend</span>
                      </button>
                      <button className="text-slate-300 group-hover:text-[#1A2B48] transition-colors"><ChevronRight size={20}/></button>
                    </div>
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

                    {/* Checkout & Room Inspection Clearance Details (Displayed directly after Bill Section on Left Side) */}
                    <div className="border border-slate-200 rounded-sm overflow-hidden bg-white shadow-xs">
                        <div className="bg-[#1A2B48] text-white p-3 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <ClipboardCheck size={16} className="text-amber-400 shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    Checkout & Room Inspection Clearance Details
                                </span>
                            </div>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                selectedBooking.status === 'Checked Out' 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-amber-400 text-slate-900'
                            }`}>
                                {selectedBooking.status === 'Checked Out' ? 'Checked Out' : 'Active In-House'}
                            </span>
                        </div>

                        <div className="p-4 space-y-3 bg-slate-50/60">
                            {/* Key Fields Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div className="bg-white p-2.5 rounded border border-slate-200">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Room Inspection</span>
                                    <span className={`font-black text-xs ${
                                        selectedBooking.roomInspection?.inspected ? 'text-emerald-700' : (selectedBooking.status === 'Checked Out' ? 'text-slate-700' : 'text-amber-600')
                                    }`}>
                                        {selectedBooking.roomInspection?.inspected ? '✓ Yes (Completed)' : (selectedBooking.status === 'Checked Out' ? 'Completed' : 'Pending Checkout')}
                                    </span>
                                </div>

                                <div className="bg-white p-2.5 rounded border border-slate-200">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Inspected By</span>
                                    <span className="font-black text-xs text-slate-800">
                                        {selectedBooking.roomInspection?.inspectedBy || (selectedBooking.status === 'Checked Out' ? 'Front Desk Staff' : '—')}
                                    </span>
                                </div>

                                <div className="bg-white p-2.5 rounded border border-slate-200">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Any Issue Found</span>
                                    <span className={`font-black text-xs ${
                                        selectedBooking.roomInspection?.issueFound ? 'text-rose-600' : 'text-emerald-700'
                                    }`}>
                                        {selectedBooking.roomInspection?.issueFound ? '⚠️ Yes (Issues Found)' : '✅ No (All Clear)'}
                                    </span>
                                </div>

                                <div className="bg-white p-2.5 rounded border border-slate-200">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Checkout Timestamp</span>
                                    <span className="font-bold text-[11px] text-slate-700 block truncate">
                                        {selectedBooking.actualCheckOutTime 
                                            ? new Date(selectedBooking.actualCheckOutTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                                            : (selectedBooking.status === 'Checked Out' ? 'Completed' : 'Not Checked Out')}
                                    </span>
                                </div>
                            </div>

                            {/* Damage / Missing Items Callout */}
                            {selectedBooking.roomInspection?.issueDescription && (
                                <div className="bg-rose-50 border border-rose-200 p-3 rounded text-xs space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <AlertTriangle size={13} className="text-rose-600" />
                                            Damaged / Missing Items Mentioned
                                        </span>
                                        {selectedBooking.roomInspection?.damageCharge > 0 && (
                                            <span className="text-xs font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                                                Damage Charge: ₹{Number(selectedBooking.roomInspection.damageCharge).toLocaleString('en-IN')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-800 font-semibold">{selectedBooking.roomInspection.issueDescription}</p>
                                </div>
                            )}

                            {/* Inspection Remarks if present */}
                            {selectedBooking.roomInspection?.remarks && (
                                <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded text-xs">
                                    <span className="text-[9px] font-black text-amber-800 uppercase block mb-0.5">Staff Remarks:</span>
                                    <p className="text-slate-700 italic">"{selectedBooking.roomInspection.remarks}"</p>
                                </div>
                            )}

                            {/* Housekeeping status notice */}
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                                <span className="font-semibold">
                                    Room Unit Post-Checkout: <strong className="text-amber-700">Marked as Dirty (Sent to Housekeeping)</strong>
                                </span>
                                <span>Assigned Unit: <strong className="text-slate-800">{selectedBooking.roomUnit?.roomNumber || 'Assigned Room'}</strong></span>
                            </div>
                        </div>
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
                            icon={<Utensils size={18} />} 
                            label="🍽️ Food Bill & Menu Order" 
                            color="bg-amber-600 hover:bg-amber-700" 
                            onClick={() => openFoodBillModal(selectedBooking)}
                        />
                        <ActionButton 
                            icon={<LogOut size={18} />} 
                            label="Complete Checkout" 
                            color="bg-rose-600" 
                            onClick={() => handleCheckOut(selectedBooking._id)}
                            disabled={selectedBooking.status !== 'Checked-In'}
                        />
                        <ActionButton 
                            icon={<FileEdit size={18} />} 
                            label="Amend / Request Super Admin Access" 
                            color="bg-amber-600 hover:bg-amber-700" 
                            onClick={() => {
                                setAmendBooking(selectedBooking);
                                setAmendReason('');
                                setIsAmendModalOpen(true);
                            }}
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

      {/* Select Booking Mode Modal: Immediate vs Advance */}
      {isBookingTypeSelectOpen && (
        <div className="fixed inset-0 bg-[#1A2B48]/90 z-[120] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-sm p-8 shadow-2xl border-t-8 border-[#BFA37E]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-[#1A2B48] uppercase tracking-wide">
                  Select Registration Type
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Choose whether the guest is checking in immediately or reserving in advance.
                </p>
              </div>
              <button 
                onClick={() => setIsBookingTypeSelectOpen(false)} 
                className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={20}/>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 my-4">
              {/* Immediate Booking Card */}
              <button
                type="button"
                onClick={() => {
                  setIsBookingTypeSelectOpen(false);
                  const todayStr = new Date().toISOString().split('T')[0];
                  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                  setWalkInForm({
                    guestDetails: { firstName: '', lastName: '', phone: '', email: '', idProof: '', adults: 2, children: 0 },
                    roomCategory: '',
                    roomUnit: '',
                    checkInDate: todayStr,
                    checkOutDate: tomorrowStr,
                    financials: { roomTariff: 0, amountPaid: 0, totalAmount: 0, balance: 0 },
                    paymentMode: 'Cash',
                    source: 'Walk-in',
                    otaPlatform: '',
                    otaReferenceId: '',
                    roomPlan: 'EP',
                    immediateCheckIn: true,
                    isHistorical: false,
                    customStatus: 'Checked-In',
                    paymentDate: '',
                    bookingType: 'Immediate',
                    numberOfRooms: 1,
                    voucherUrl: ''
                  });
                  setIsWalkInOpen(true);
                }}
                className="aspect-square p-6 border-2 border-slate-200 hover:border-emerald-500 rounded-xl hover:bg-emerald-50/40 transition-all group flex flex-col items-center justify-center text-center cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="w-16 h-16 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap size={32} />
                </div>
                <h4 className="text-base font-black text-slate-900 uppercase tracking-wide">Immediate Booking</h4>
              </button>

              {/* Advance Booking Card */}
              <button
                type="button"
                onClick={() => {
                  setIsBookingTypeSelectOpen(false);
                  const todayStr = new Date().toISOString().split('T')[0];
                  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                  const dayAfterTomorrowStr = new Date(Date.now() + 172800000).toISOString().split('T')[0];
                  setWalkInForm({
                    guestDetails: { firstName: '', lastName: '', phone: '', email: '', idProof: '', adults: 2, children: 0 },
                    roomCategory: '',
                    roomUnit: '',
                    checkInDate: tomorrowStr,
                    checkOutDate: dayAfterTomorrowStr,
                    financials: { roomTariff: 0, amountPaid: 0, totalAmount: 0, balance: 0 },
                    paymentMode: 'Cash',
                    source: 'Walk-in',
                    otaPlatform: '',
                    otaReferenceId: '',
                    roomPlan: 'EP',
                    immediateCheckIn: false,
                    isHistorical: false,
                    customStatus: 'Confirmed',
                    paymentDate: tomorrowStr,
                    bookingType: 'Advance',
                    numberOfRooms: 1,
                    voucherUrl: ''
                  });
                  setIsWalkInOpen(true);
                }}
                className="aspect-square p-6 border-2 border-slate-200 hover:border-[#1A2B48] rounded-xl hover:bg-slate-50 transition-all group flex flex-col items-center justify-center text-center cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="w-16 h-16 rounded-xl bg-[#1A2B48] text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CalendarCheck size={32} />
                </div>
                <h4 className="text-base font-black text-slate-900 uppercase tracking-wide">Advance Booking</h4>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Walk-In / Advance Booking Modal */}
      {isWalkInOpen && (
        <div className="fixed inset-0 bg-[#1A2B48]/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-sm p-8 shadow-2xl border-t-8 border-[#BFA37E] my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-[#1A2B48] uppercase tracking-tight">
                    {walkInForm.bookingType === 'Advance' ? 'New Advance Booking Registration' : 'New Walk-In Registration'}
                  </h3>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded whitespace-nowrap shrink-0 ${
                    walkInForm.bookingType === 'Advance' 
                      ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {walkInForm.bookingType === 'Advance' ? '📅 Advance Mode' : '⚡ Immediate Mode'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {walkInForm.bookingType === 'Advance' 
                    ? 'Reserve rooms for future stay. Advance money collected reflects on check-in start date.' 
                    : 'Guest arriving now at Front Desk. Check-in and assign room unit immediately.'}
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const newType = walkInForm.bookingType === 'Advance' ? 'Immediate' : 'Advance';
                    const todayStr = new Date().toISOString().split('T')[0];
                    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                    const dayAfterTomorrowStr = new Date(Date.now() + 172800000).toISOString().split('T')[0];

                    setWalkInForm(prev => ({
                      ...prev,
                      bookingType: newType,
                      immediateCheckIn: newType === 'Immediate',
                      customStatus: newType === 'Immediate' ? 'Checked-In' : 'Confirmed',
                      checkInDate: newType === 'Immediate' ? todayStr : (prev.checkInDate || tomorrowStr),
                      checkOutDate: newType === 'Immediate' ? tomorrowStr : (prev.checkOutDate || dayAfterTomorrowStr),
                      paymentDate: newType === 'Advance' ? (prev.checkInDate || tomorrowStr) : ''
                    }));
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors whitespace-nowrap shrink-0"
                  title="Switch between Immediate and Advance modes"
                >
                  Switch to {walkInForm.bookingType === 'Advance' ? '⚡ Immediate' : '📅 Advance'}
                </button>
                <button onClick={() => setIsWalkInOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors shrink-0"><X size={20}/></button>
              </div>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">First Name</label>
                    <input
                      type="text"
                      value={walkInForm.guestDetails.firstName}
                      onFocus={() => setShowGuestSuggestions(true)}
                      onChange={e => {
                        setWalkInForm({
                          ...walkInForm, 
                          guestDetails: { ...walkInForm.guestDetails, firstName: e.target.value }
                        });
                        setShowGuestSuggestions(true);
                      }}
                      placeholder="e.g. Rahul"
                      className="w-full border-2 border-slate-200 p-3 text-sm focus:border-[#1A2B48] transition-all focus:outline-none font-semibold text-slate-800"
                      required
                    />
                    {showGuestSuggestions && guestSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-[#1A2B48] shadow-2xl rounded-sm z-[150] max-h-56 overflow-y-auto">
                        <div className="p-2 bg-slate-100 text-[10px] font-black uppercase text-slate-500 border-b flex justify-between items-center">
                          <span>Previous Guests Found ({guestSuggestions.length})</span>
                          <span className="text-emerald-700 font-bold">Click to Autofill</span>
                        </div>
                        {guestSuggestions.map((g, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectPastGuest(g)}
                            className="w-full text-left p-2.5 hover:bg-emerald-50 border-b border-slate-100 transition-colors flex items-center justify-between group"
                          >
                            <div>
                              <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">
                                {g.firstName} {g.lastName}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                📞 {g.phone || 'No phone'} {g.idProof ? `• ID: ${g.idProof}` : ''}
                              </div>
                            </div>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black uppercase group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                              Autofill ➔
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">No. of Rooms</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="20"
                        className="w-full border-2 border-slate-200 p-3 text-sm focus:border-[#1A2B48] transition-all font-semibold focus:outline-none" 
                        value={walkInForm.numberOfRooms || 1} 
                        onChange={e => setWalkInForm({...walkInForm, numberOfRooms: Math.max(1, parseInt(e.target.value) || 1)})} 
                        required
                      />
                  </div>
                  <div>
                      <InputField label="ID Proof Number" value={walkInForm.guestDetails.idProof} onChange={v => setWalkInForm({...walkInForm, guestDetails: {...walkInForm.guestDetails, idProof: v}})} required={false} />
                  </div>
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

                {(walkInForm.immediateCheckIn || walkInForm.customStatus === 'Checked-In' || walkInForm.bookingType === 'Advance') && (
                   <div className="animate-in slide-in-from-top-2 duration-200 space-y-2">
                       <div className="flex justify-between items-center">
                          <label className="block text-[10px] font-black text-slate-400 uppercase">
                            Assign Room Unit {walkInForm.bookingType === 'Advance' ? '(Optional in advance — can assign upon arrival)' : ''}
                          </label>
                          {walkInForm.bookingType === 'Advance' && walkInForm.roomUnit && (
                            <button 
                              type="button" 
                              onClick={() => setWalkInForm({...walkInForm, roomUnit: ''})}
                              className="text-[10px] text-slate-400 hover:text-rose-600 underline font-semibold"
                            >
                              Clear Unit
                            </button>
                          )}
                       </div>
                       <select 
                           className="w-full border-2 border-slate-200 p-3 text-sm focus:border-[#1A2B48] transition-all font-semibold focus:outline-none" 
                           value={walkInForm.roomUnit} 
                           onChange={e => setWalkInForm({...walkInForm, roomUnit: e.target.value})} 
                           required={walkInForm.immediateCheckIn || walkInForm.customStatus === 'Checked-In'}
                       >
                           <option value="">{walkInForm.bookingType === 'Advance' ? '-- Assign Later upon Check-In --' : '-- Choose Room Unit --'}</option>
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
                     <span>No. of Rooms:</span>
                     <span>{walkInForm.numberOfRooms || 1} Room(s)</span>
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

               <button 
                 type="submit" 
                 className={`w-full text-white py-5 font-black uppercase text-xs shadow-xl transition-all ${
                   walkInForm.bookingType === 'Advance' ? 'bg-[#1A2B48] hover:bg-[#253d66]' : 'bg-emerald-600 hover:bg-emerald-700'
                 }`}
               >
                 {walkInForm.bookingType === 'Advance' 
                   ? 'Confirm Advance Booking & Prepare WhatsApp Voucher' 
                   : 'Create Registration Entry'}
               </button>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Booking Confirmation Modal */}
      {isWhatsAppModalOpen && whatsAppData && (
        <div className="fixed inset-0 bg-[#1A2B48]/95 z-[120] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-sm shadow-2xl border-t-8 border-[#25D366] max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md">
                  <WhatsAppIcon size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    WhatsApp Booking Voucher
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black uppercase">
                      Ready to Send
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Guest: <span className="font-bold text-slate-800">{whatsAppData.guestDetails?.firstName} {whatsAppData.guestDetails?.lastName}</span> | Mobile: <span className="font-bold text-slate-800">{whatsAppData.guestDetails?.phone || whatsAppData.phone}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsWhatsAppModalOpen(false)} 
                className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={20}/>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Column: Formatted Message Text Editor */}
                <div className="md:col-span-7 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Dynamic WhatsApp Message Text
                    </label>
                    <button
                      type="button"
                      onClick={handleCopyWhatsAppText}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
                    >
                      {copiedWhatsAppText ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      <span>{copiedWhatsAppText ? 'Copied!' : 'Copy Text'}</span>
                    </button>
                  </div>

                  <textarea
                    rows="15"
                    value={whatsAppCustomMsg}
                    onChange={(e) => setWhatsAppCustomMsg(e.target.value)}
                    className="w-full border-2 border-slate-200 p-3 text-xs font-mono leading-relaxed rounded-sm focus:outline-none focus:border-[#25D366] bg-slate-50 text-slate-800"
                    placeholder="Message preview..."
                  />
                  <p className="text-[10px] text-slate-400">
                    💡 You can customize or edit any line in the text above before sending to the guest.
                  </p>
                </div>

                {/* Right Column: Hotel Location & Booking Info */}
                <div className="md:col-span-5 space-y-4">
                  <div className="border border-slate-200 rounded-sm p-4 bg-slate-50 space-y-3 text-xs">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      Booking Summary
                    </span>
                    <div className="space-y-1.5 font-semibold text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Guest:</span>
                        <span className="font-bold text-slate-900">{whatsAppData.guestDetails?.firstName} {whatsAppData.guestDetails?.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Phone:</span>
                        <span className="font-bold text-slate-900">{whatsAppData.guestDetails?.phone || whatsAppData.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Check-In:</span>
                        <span className="font-bold text-slate-900">{formatDate(whatsAppData.checkInDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Check-Out:</span>
                        <span className="font-bold text-slate-900">{formatDate(whatsAppData.checkOutDate)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Advance Paid:</span>
                        <span className="font-black text-emerald-700">₹{(whatsAppData.financials?.amountPaid || whatsAppData.amountPaid || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Amount:</span>
                        <span className="font-black text-slate-900">₹{(whatsAppData.financials?.totalAmount || whatsAppData.totalAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-sm p-4 bg-white space-y-2 text-xs">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      Hotel Location
                    </span>
                    <p className="font-bold text-slate-800">
                      Hotel Bhopal Inn by Ten On Ten Stays
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      D2-214, Danish Nagar, Hoshangabad Road, Bhopal
                    </p>
                    <a
                      href="https://maps.google.com/?q=2/213,+Danish+Nagar,+BBagmugaliya,+Bhopal,+Madhya+Pradesh+462026"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold underline"
                    >
                      <ExternalLink size={12} /> Open in Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer CTA */}
            <div className="bg-slate-50 border-t px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-black uppercase text-slate-500 hover:text-slate-800 transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCopyWhatsAppText}
                  className="flex-1 sm:flex-initial px-5 py-3 border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 rounded-sm text-xs font-black uppercase flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Copy size={16} />
                  <span>{copiedWhatsAppText ? 'Copied!' : 'Copy Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex-1 sm:flex-initial px-6 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-sm text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  <WhatsAppIcon size={18} />
                  <span>Send via WhatsApp</span>
                </button>
              </div>
            </div>
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
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  {editingMeterId ? (
                    <span className="text-xs font-black uppercase text-amber-900 bg-amber-100 px-3 py-1 rounded border border-amber-300 flex items-center gap-1.5 shadow-sm">
                      <Edit3 size={13} className="text-amber-700" /> Editing Reading ({meterForm.date})
                    </span>
                  ) : (
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">New Reading Entry</h4>
                  )}
                </div>
                {editingMeterId && (
                  <button
                    type="button"
                    onClick={handleCancelMeterEdit}
                    className="text-[11px] font-black uppercase text-rose-600 hover:text-rose-800 bg-white px-2.5 py-1 rounded border border-rose-200 shadow-sm transition-all"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

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

              <button 
                type="submit" 
                className={`w-full ${editingMeterId ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-slate-950'} py-4 font-black uppercase text-xs shadow-lg transition-all flex items-center justify-center gap-2`}
              >
                <Zap size={16} className={editingMeterId ? 'fill-white' : 'fill-slate-950'} />
                {editingMeterId ? 'Update Electricity Reading (Save Changes)' : 'Save Electricity Reading'}
              </button>
            </form>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Recently Logged Meter Readings</h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Click "Edit" to modify any reading</span>
              </div>
              <div className="border border-slate-200 rounded-sm overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500 border-b">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Reading (kWh)</th>
                      <th className="p-3">Notes</th>
                      <th className="p-3">Recorded By</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {meterReadings.length === 0 ? (
                      <tr><td colSpan="5" className="p-4 text-center text-slate-400 italic">No meter readings recorded yet.</td></tr>
                    ) : (
                      meterReadings.map(r => (
                        <tr key={r._id} className={`hover:bg-slate-50 transition-colors ${editingMeterId === r._id ? 'bg-amber-50/80 font-bold' : ''}`}>
                          <td className="p-3 font-bold">{r.dateStr || (r.date ? new Date(r.date).toLocaleDateString('en-GB') : '---')}</td>
                          <td className="p-3 font-black text-amber-600">{r.reading} kWh</td>
                          <td className="p-3 text-slate-500 max-w-[120px] truncate" title={r.notes}>{r.notes || '-'}</td>
                          <td className="p-3 text-slate-500">{r.recordedBy}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditMeterClick(r)}
                                className="px-2.5 py-1 text-[10px] font-black uppercase rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-all flex items-center gap-1 shadow-sm"
                                title="Edit this meter reading"
                              >
                                <Edit3 size={11} /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMeter(r._id)}
                                className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all"
                                title="Delete this reading"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
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

      {/* Requirement 2: Front Desk Food Bill & Restaurant Ordering Modal */}
      {isFoodBillOpen && (
        <div className="fixed inset-0 bg-[#1A2B48]/95 z-[160] flex items-center justify-center p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl rounded-sm shadow-2xl border-t-8 border-amber-500 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-700 rounded border border-amber-500/20">
                  <Utensils size={22} className="text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-[#1A2B48] uppercase tracking-wide">Food Bill & Room Service</h3>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded border border-amber-200 uppercase">
                      Front Desk & Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Select room, browse menu categories, and add charges directly to guest room folio
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsFoodBillOpen(false)} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Target Room / In-House Guest Selection Bar */}
            <div className="px-6 py-3.5 bg-amber-50/60 border-b border-amber-200/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[11px] font-black text-[#1A2B48] uppercase tracking-wider whitespace-nowrap">
                  Attach Bill To Room:
                </span>
                <select
                  value={foodTargetBookingId}
                  onChange={(e) => setFoodTargetBookingId(e.target.value)}
                  className="bg-white border-2 border-amber-300 text-[#1A2B48] text-xs font-black px-3 py-2 rounded-sm outline-none focus:border-amber-600 w-full sm:w-80 shadow-sm cursor-pointer"
                >
                  <option value="">-- Choose In-House Room / Guest --</option>
                  {bookings.map(b => (
                    <option key={b._id} value={b._id}>
                      Room {b.roomUnit?.roomNumber || '---'} — {b.guestDetails?.firstName} {b.guestDetails?.lastName} ({b.status})
                    </option>
                  ))}
                </select>
              </div>

              {foodTargetBookingId && (
                <div className="text-xs text-slate-600 font-bold flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-amber-200 shadow-sm">
                  <span className="text-[10px] uppercase text-slate-400">Current Balance:</span>
                  <span className="text-rose-600 font-black">
                    ₹{(bookings.find(b => b._id === foodTargetBookingId)?.financials?.balance || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Search Bar & Category Dropdown Bar */}
            <div className="p-4 bg-white border-b border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search dishes, starters, breads, snacks, beverages (e.g. Paneer, Naan, Chai)..."
                    value={foodSearchQuery}
                    onChange={(e) => setFoodSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 text-sm font-bold text-[#1A2B48] placeholder-slate-400 rounded-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />
                  {foodSearchQuery && (
                    <button 
                      onClick={() => setFoodSearchQuery('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Dropdown */}
                <div className="w-full sm:w-64">
                  <select
                    value={foodActiveCategory}
                    onChange={(e) => setFoodActiveCategory(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 text-xs font-black uppercase text-[#1A2B48] py-2.5 px-3 rounded-sm outline-none focus:border-amber-500 cursor-pointer transition-all"
                  >
                    <option value="All">All Categories ({menuItems.length})</option>
                    {menuCategories.map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Quick Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <button
                  type="button"
                  onClick={() => setFoodActiveCategory('All')}
                  className={`px-3 py-1 rounded text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                    foodActiveCategory === 'All'
                      ? 'bg-[#1A2B48] text-white shadow'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Items
                </button>
                {menuCategories.map(cat => {
                  const isActive = foodActiveCategory === cat._id;
                  return (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => setFoodActiveCategory(cat._id)}
                      className={`px-3 py-1 rounded text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Two-Column Layout: Menu Items Catalogue & Live Bill Cart */}
            <div className="flex-1 grid grid-cols-12 overflow-hidden min-h-0">
              {/* Left Column: Menu Items Grid */}
              <div className="col-span-12 md:col-span-7 lg:col-span-8 p-4 overflow-y-auto border-r border-slate-200 bg-slate-50 space-y-3 max-h-[50vh] md:max-h-[55vh]">
                {(() => {
                  const filtered = menuItems.filter(item => {
                    const matchCategory = foodActiveCategory === 'All' || 
                      (item.category && (item.category._id === foodActiveCategory || item.category.name === foodActiveCategory || item.category === foodActiveCategory));
                    
                    const q = foodSearchQuery.trim().toLowerCase();
                    const matchQuery = !q || 
                      (item.name && item.name.toLowerCase().includes(q)) ||
                      (item.description && item.description.toLowerCase().includes(q)) ||
                      (item.category && item.category.name && item.category.name.toLowerCase().includes(q));

                    return matchCategory && matchQuery;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-8 text-center bg-white rounded border border-dashed border-slate-300">
                        <Utensils size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs font-black uppercase text-slate-500">No dishes match your filter</p>
                        <p className="text-[11px] text-slate-400 mt-1">Try another category or clear your search query.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filtered.map(item => {
                        const idKey = item._id || item.name;
                        const qtyInCart = getFoodItemQuantity(idKey);
                        const catName = item.category?.name || 'Menu';
                        const price = item.cost || item.price || 0;

                        return (
                          <div 
                            key={idKey} 
                            className={`p-3.5 bg-white border rounded-sm transition-all shadow-sm flex flex-col justify-between ${
                              qtyInCart > 0 ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20' : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-3 h-3 rounded-xs border flex items-center justify-center shrink-0 ${
                                    item.isVeg !== false ? 'border-emerald-600' : 'border-rose-600'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      item.isVeg !== false ? 'bg-emerald-600' : 'bg-rose-600'
                                    }`}></span>
                                  </span>
                                  <h4 className="text-xs font-black text-[#1A2B48] leading-tight">
                                    {item.name}
                                  </h4>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                                  {catName}
                                </span>
                              </div>
                              {item.description && (
                                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 mb-2 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                              <span className="text-sm font-black text-amber-700">
                                ₹{price.toLocaleString()}
                              </span>

                              {/* Quantity Selector (+ / -) */}
                              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => removeFoodItemFromCart(item)}
                                  disabled={qtyInCart === 0}
                                  className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-all ${
                                    qtyInCart > 0 
                                      ? 'bg-white hover:bg-rose-50 text-rose-700 shadow-sm border border-slate-200' 
                                      : 'text-slate-300 cursor-not-allowed'
                                  }`}
                                  title="Decrease quantity"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="w-6 text-center text-xs font-black text-[#1A2B48]">
                                  {qtyInCart}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => addFoodItemToCart(item)}
                                  className="w-6 h-6 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center font-bold text-xs shadow-sm transition-all"
                                  title="Add to bill"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Right Column: Live Order Summary & Bill Folio */}
              <div className="col-span-12 md:col-span-5 lg:col-span-4 p-5 bg-white flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-[55vh]">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-[#1A2B48] tracking-wider">
                        Order Folio Summary
                      </span>
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {foodOrderCart.reduce((acc, c) => acc + c.quantity, 0)} Items
                      </span>
                    </div>
                    {foodOrderCart.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFoodOrderCart([])}
                        className="text-[10px] font-bold text-rose-600 hover:underline uppercase"
                      >
                        Reset Cart
                      </button>
                    )}
                  </div>

                  {/* Cart Items List */}
                  <div className="space-y-2 max-h-[22vh] overflow-y-auto pr-1">
                    {foodOrderCart.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 italic text-xs border border-dashed rounded bg-slate-50">
                        Click "+" on any item to add to this food bill.
                      </div>
                    ) : (
                      foodOrderCart.map(({ item, quantity }) => {
                        const price = item.cost || item.price || 0;
                        const lineTotal = price * quantity;
                        return (
                          <div key={item._id || item.name} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-200 text-xs">
                            <div className="flex-1 pr-2">
                              <span className="font-bold text-[#1A2B48] block leading-tight">{item.name}</span>
                              <span className="text-[10px] text-slate-500 font-semibold">₹{price} × {quantity}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-[#1A2B48]">₹{lineTotal}</span>
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => removeFoodItemFromCart(item)}
                                  className="w-5 h-5 bg-white border rounded text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold text-[10px]"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => addFoodItemToCart(item)}
                                  className="w-5 h-5 bg-amber-500 text-slate-950 rounded flex items-center justify-center font-bold text-[10px]"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Special Kitchen Notes */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                      Kitchen / Delivery Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Less spicy, send extra chutney/plates"
                      value={foodOrderNotes}
                      onChange={(e) => setFoodOrderNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs font-medium p-2.5 rounded-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Bill Subtotal & Submit Action */}
                <div className="pt-4 border-t border-slate-200 space-y-3 mt-4">
                  <div className="bg-slate-50 p-3 rounded-sm border border-slate-200 space-y-1">
                    <div className="flex justify-between text-xs text-slate-500 font-bold">
                      <span>Items Subtotal:</span>
                      <span>₹{foodOrderCart.reduce((sum, c) => sum + ((c.item.cost || c.item.price || 0) * c.quantity), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-[#1A2B48] pt-1 border-t border-slate-200">
                      <span>Total Food Bill:</span>
                      <span className="text-amber-700 text-base">
                        ₹{foodOrderCart.reduce((sum, c) => sum + ((c.item.cost || c.item.price || 0) * c.quantity), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleFoodBillSubmit}
                    disabled={isSubmittingFoodBill || foodOrderCart.length === 0 || !foodTargetBookingId}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-slate-950 py-3.5 rounded-sm text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Utensils size={15} />
                    {isSubmittingFoodBill 
                      ? 'Adding Bill...' 
                      : `Add to Room Bill (₹${foodOrderCart.reduce((sum, c) => sum + ((c.item.cost || c.item.price || 0) * c.quantity), 0).toLocaleString()})`
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requirement 3: Mandatory Room Inspection & Checkout Clearance Modal */}
      {isInspectionModalOpen && inspectionBooking && (
        <div className="fixed inset-0 bg-[#1A2B48]/95 z-[170] flex items-center justify-center p-4 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-xl rounded-sm shadow-2xl p-7 border-t-8 border-rose-600 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-800 rounded border border-rose-200">
                  <ClipboardCheck size={24} className="text-rose-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1A2B48] uppercase tracking-wide">
                    Mandatory Room Inspection
                  </h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">
                    Pre-checkout verification & housekeeping clearance
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsInspectionModalOpen(false)} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Room Summary Header Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm mb-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Room Assigned</span>
                <span className="text-base font-black text-[#1A2B48]">
                  Room {inspectionBooking.roomUnit?.roomNumber || '---'} ({inspectionBooking.roomCategory?.title || 'Standard'})
                </span>
                <span className="text-xs text-slate-600 font-bold block mt-0.5">
                  Guest: {inspectionBooking.guestDetails?.firstName} {inspectionBooking.guestDetails?.lastName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Current Folio Balance</span>
                <span className="text-base font-black text-rose-600">
                  ₹{(inspectionBooking.financials?.balance || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleInspectionCheckoutSubmit} className="space-y-5">
              {/* Field 1: Room Inspection: Yes / No */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-[#1A2B48] tracking-wider">
                  1. Room Inspection Completed? <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInspectionForm({ ...inspectionForm, inspected: 'Yes' })}
                    className={`py-3 px-4 rounded text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-2 transition-all ${
                      inspectionForm.inspected === 'Yes'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckSquare size={16} /> Yes (Inspected)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectionForm({ ...inspectionForm, inspected: 'No' })}
                    className={`py-3 px-4 rounded text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-2 transition-all ${
                      inspectionForm.inspected === 'No'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle size={16} /> No (Not Inspected)
                  </button>
                </div>

                {inspectionForm.inspected === 'No' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs font-bold flex items-center gap-2 mt-2">
                    <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                    <span>MANDATORY REQUIREMENT: Room inspection must be completed before finalizing checkout. Checkout cannot proceed without inspection.</span>
                  </div>
                )}
              </div>

              {/* Field 2: Inspected By: Staff Member Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-[#1A2B48] tracking-wider">
                  2. Inspected By (Staff Member) <span className="text-rose-600">*</span>
                </label>
                <select
                  value={inspectionForm.inspectedBy}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, inspectedBy: e.target.value })}
                  className="w-full bg-white border-2 border-slate-200 text-xs font-bold text-[#1A2B48] p-3 rounded-sm outline-none focus:border-[#1A2B48] cursor-pointer"
                  required
                >
                  <option value="Vishal Singh">1. Vishal Singh</option>
                  <option value="Abhi">2. Abhi</option>
                  <option value="Aneesh">3. Aneesh</option>
                  <option value="Sonu">4. Sonu</option>
                  <option value="Vishal">5. Vishal</option>
                  <option value="Other">6. Other (Enter Staff Name)</option>
                </select>

                {inspectionForm.inspectedBy === 'Other' && (
                  <div className="pt-1.5">
                    <input
                      type="text"
                      placeholder="Enter staff member's full name..."
                      value={inspectionForm.customInspectorName}
                      onChange={(e) => setInspectionForm({ ...inspectionForm, customInspectorName: e.target.value })}
                      className="w-full bg-white border-2 border-amber-300 text-xs font-bold p-3 rounded-sm outline-none focus:border-amber-600"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Field 3: Any Issue Found: Yes / No */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-[#1A2B48] tracking-wider">
                  3. Any Issue / Damage Found? <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInspectionForm({ ...inspectionForm, issueFound: 'No', damageCharge: '' })}
                    className={`py-3 px-4 rounded text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-2 transition-all ${
                      inspectionForm.issueFound === 'No'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 size={16} /> No (Room is All Clear)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectionForm({ ...inspectionForm, issueFound: 'Yes' })}
                    className={`py-3 px-4 rounded text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-2 transition-all ${
                      inspectionForm.issueFound === 'Yes'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle size={16} /> Yes (Damage / Missing Items)
                  </button>
                </div>
              </div>

              {/* Conditional Fields if Issue Found is Yes */}
              {inspectionForm.issueFound === 'Yes' && (
                <div className="p-4 bg-rose-50/70 border-2 border-rose-200 rounded-sm space-y-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-rose-900 mb-1">
                      Damaged / Missing Items Description <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Broken kettle, missing bath towel, torn bedsheet, AC remote missing"
                      value={inspectionForm.issueDescription}
                      onChange={(e) => setInspectionForm({ ...inspectionForm, issueDescription: e.target.value })}
                      className="w-full bg-white border border-rose-300 text-xs font-semibold p-3 rounded-sm outline-none focus:border-rose-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-rose-900 mb-1">
                      Damage Charges (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={inspectionForm.damageCharge}
                      onChange={(e) => setInspectionForm({ ...inspectionForm, damageCharge: e.target.value })}
                      className="w-full bg-white border border-rose-300 text-sm font-black p-3 rounded-sm outline-none focus:border-rose-600 text-rose-700"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-rose-900 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={inspectionForm.addDamageToBill}
                      onChange={(e) => setInspectionForm({ ...inspectionForm, addDamageToBill: e.target.checked })}
                      className="w-4 h-4 text-rose-600 rounded border-rose-300"
                    />
                    <span>Automatically add damage charge to guest room bill</span>
                  </label>
                </div>
              )}

              {/* Field 4: Remarks / Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-[#1A2B48] tracking-wider">
                  4. Remarks / Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Keycard returned, mini-bar checked, AC powered off..."
                  value={inspectionForm.remarks}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, remarks: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold p-3 rounded-sm outline-none focus:border-[#1A2B48]"
                />
              </div>

              {/* Informational Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px] font-semibold flex items-center gap-2">
                <Info size={16} className="text-amber-600 shrink-0" />
                <span>
                  Notice: Finalizing checkout will move this room into <b>"Dirty"</b> status. It will NOT become available until Housekeeping completes cleaning and marks it clean.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInspectionModalOpen(false)}
                  className="flex-1 py-3.5 text-xs font-black uppercase text-slate-500 hover:text-slate-800 bg-slate-100 rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCheckout || inspectionForm.inspected !== 'Yes'}
                  className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider rounded-sm shadow-xl transition-all ${
                    inspectionForm.inspected === 'Yes'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmittingCheckout ? 'Processing...' : 'Confirm Inspection & Finalize Checkout'}
                </button>
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

      {/* Request Amendment Modal */}
      {isAmendModalOpen && amendBooking && (
        <div className="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-sm shadow-2xl overflow-hidden border-t-4 border-amber-500">
            <div className="bg-[#1A2B48] p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-black uppercase tracking-wide flex items-center gap-2">
                  <FileEdit size={18} className="text-amber-400" />
                  <span>Request Entry Amendment</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Submit request to Super Admin to unlock edit/delete access
                </p>
              </div>
              <button 
                onClick={() => setIsAmendModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRequestAmendment} className="p-6 space-y-4 text-xs">
              {/* Booking Summary Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Guest Name</span>
                  <span className="font-black text-slate-800 text-sm">
                    {amendBooking.guestDetails?.firstName} {amendBooking.guestDetails?.lastName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Room</span>
                  <span className="font-bold text-slate-700">
                    {amendBooking.roomUnit?.roomNumber || '---'} ({amendBooking.roomCategory?.title || 'Standard'})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tariff</span>
                  <span className="font-bold text-slate-800">
                    ₹{(amendBooking.financials?.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Amount Paid</span>
                  <span className="font-black text-emerald-700">
                    ₹{(amendBooking.financials?.amountPaid || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Balance Due</span>
                  <span className={`font-black ${amendBooking.financials?.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{(amendBooking.financials?.balance || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Reason Explanation */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase mb-1.5">
                  Explain the Mistake / Reason for Amendment <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={amendReason}
                  onChange={(e) => setAmendReason(e.target.value)}
                  placeholder="e.g. Wrong tariff entered: should be ₹2,500 instead of ₹2,000. Or wrong payment mode recorded. Please allow editing."
                  className="w-full p-3 border border-slate-300 rounded-sm font-medium text-slate-800 focus:outline-none focus:border-amber-600 leading-relaxed"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  This message will appear directly in the Super Admin's review portal with Tick (✓) and Cross (✕) approval actions.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAmendModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500 uppercase hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAmend}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-sm font-black text-xs uppercase tracking-wider shadow transition-all"
                >
                  {submittingAmend ? 'Submitting...' : 'Submit Request to Super Admin'}
                </button>
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
