import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/config';
import { socket } from '@/lib/socket';
import { useAuth } from '@/lib/AuthContext';
import { 
    FileEdit, MessageSquare, Send, CheckCircle, Clock, 
    AlertTriangle, ShieldAlert, IndianRupee, CreditCard, 
    Smartphone, Globe, Check, RefreshCw, X, Calendar, User, 
    Bed, ArrowRight, CheckCheck, Info, Tag, Trash2
} from 'lucide-react';

const API_BASE = config.API_URL;

const AmendmentsManagement = ({ isSuperAdmin: propIsSuperAdmin } = {}) => {
    const { user, isSuperAdmin: authIsSuperAdmin } = useAuth();
    const isSuperAdmin = propIsSuperAdmin !== undefined ? propIsSuperAdmin : authIsSuperAdmin;
    const [amendments, setAmendments] = useState([]);
    const [filterStatus, setFilterStatus] = useState('active'); // 'active', 'all', 'Resolved'
    const [loading, setLoading] = useState(true);
    const [activeAmendment, setActiveAmendment] = useState(null);

    // Chat / Message state
    const [replyText, setReplyText] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);

    // Collect Payment Modal state
    const [collectModalOpen, setCollectModalOpen] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        mode: 'Cash',
        note: ''
    });
    const [submittingPayment, setSubmittingPayment] = useState(false);

    // Edit Booking Details Modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [roomCategories, setRoomCategories] = useState([]);
    const [availableUnits, setAvailableUnits] = useState([]);
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        roomCategory: '',
        roomUnit: '',
        roomTariff: '',
        checkInDate: '',
        checkOutDate: '',
        updateNote: ''
    });
    const [submittingEdit, setSubmittingEdit] = useState(false);

    // Success notification banner
    const [alertBanner, setAlertBanner] = useState(null);

    const showNotification = (msg, type = 'success') => {
        setAlertBanner({ msg, type });
        setTimeout(() => setAlertBanner(null), 4000);
    };

    const fetchAmendments = async () => {
        try {
            setLoading(true);
            const statusParam = filterStatus === 'active' ? '?status=active' : (filterStatus === 'all' ? '' : `?status=${filterStatus}`);
            const res = await axios.get(`${API_BASE}/api/amendments${statusParam}`);
            setAmendments(res.data);
            
            if (activeAmendment) {
                const updated = res.data.find(a => a._id === activeAmendment._id);
                if (updated) setActiveAmendment(updated);
            } else if (res.data.length > 0) {
                setActiveAmendment(res.data[0]);
            } else {
                setActiveAmendment(null);
            }
        } catch (err) {
            console.error('Error fetching amendments:', err);
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
            setRoomCategories(roomsRes.data || []);
            setAvailableUnits(unitsRes.data || []);
        } catch (err) {
            console.error('Error fetching support data:', err);
        }
    };

    useEffect(() => {
        fetchAmendments();
        fetchSupportData();

        const handleUpdate = () => {
            fetchAmendments();
        };

        socket.on('amendment_created', handleUpdate);
        socket.on('amendment_updated', handleUpdate);
        socket.on('amendment_deleted', handleUpdate);
        socket.on('booking_deleted', handleUpdate);
        socket.on('finance_updated', handleUpdate);

        return () => {
            socket.off('amendment_created', handleUpdate);
            socket.off('amendment_updated', handleUpdate);
            socket.off('amendment_deleted', handleUpdate);
            socket.off('booking_deleted', handleUpdate);
            socket.off('finance_updated', handleUpdate);
        };
    }, [filterStatus]);

    // Send chat reply to Super Admin
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !activeAmendment) return;

        try {
            setSendingMsg(true);
            const res = await axios.post(`${API_BASE}/api/amendments/${activeAmendment._id}/messages`, {
                text: replyText.trim()
            });
            setActiveAmendment(res.data);
            setReplyText('');
            showNotification('Message sent to Super Admin.');
            fetchAmendments();
        } catch (err) {
            alert('Failed to send message: ' + (err.response?.data?.message || err.message));
        } finally {
            setSendingMsg(false);
        }
    };

    // Open Collect Payment Modal
    const handleOpenCollect = (amendment) => {
        setActiveAmendment(amendment);
        setPaymentForm({
            amount: amendment.balanceDue > 0 ? amendment.balanceDue.toString() : '',
            mode: 'Cash',
            note: ''
        });
        setCollectModalOpen(true);
    };

    // Submit Collect Payment
    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
            alert('Please enter a valid payment amount.');
            return;
        }

        try {
            setSubmittingPayment(true);
            const res = await axios.post(`${API_BASE}/api/amendments/${activeAmendment._id}/collect-payment`, {
                amount: Number(paymentForm.amount),
                mode: paymentForm.mode,
                note: paymentForm.note
            });

            setActiveAmendment(res.data.amendment);
            setCollectModalOpen(false);

            if (paymentForm.mode === 'OTA') {
                showNotification(`OTA payment of ₹${Number(paymentForm.amount).toLocaleString('en-IN')} recorded (Pending manager approval in Front Desk Analytics).`);
            } else {
                showNotification(`Payment of ₹${Number(paymentForm.amount).toLocaleString('en-IN')} collected via ${paymentForm.mode} and added to Total Sales!`);
            }
            fetchAmendments();
        } catch (err) {
            alert('Failed to collect payment: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmittingPayment(false);
        }
    };

    // Open Edit Booking Modal
    const handleOpenEditBooking = (amendment) => {
        setActiveAmendment(amendment);
        const b = amendment.booking;
        if (!b) {
            alert('Booking record is not available.');
            return;
        }

        setEditForm({
            firstName: b.guestDetails?.firstName || '',
            lastName: b.guestDetails?.lastName || '',
            email: b.guestDetails?.email || '',
            phone: b.guestDetails?.phone || '',
            roomCategory: b.roomCategory?._id || b.roomCategory || '',
            roomUnit: b.roomUnit?._id || b.roomUnit || '',
            roomTariff: b.financials?.roomTariff || '',
            checkInDate: b.checkInDate ? new Date(b.checkInDate).toISOString().split('T')[0] : '',
            checkOutDate: b.checkOutDate ? new Date(b.checkOutDate).toISOString().split('T')[0] : '',
            updateNote: ''
        });
        setEditModalOpen(true);
    };

    // Submit Booking Edits
    const handleSubmitEditBooking = async (e) => {
        e.preventDefault();
        try {
            setSubmittingEdit(true);
            const res = await axios.put(`${API_BASE}/api/amendments/${activeAmendment._id}/booking-details`, {
                guestDetails: {
                    firstName: editForm.firstName,
                    lastName: editForm.lastName,
                    email: editForm.email,
                    phone: editForm.phone
                },
                roomCategory: editForm.roomCategory || undefined,
                roomUnit: editForm.roomUnit || undefined,
                roomTariff: editForm.roomTariff ? Number(editForm.roomTariff) : undefined,
                checkInDate: editForm.checkInDate,
                checkOutDate: editForm.checkOutDate,
                updateNote: editForm.updateNote
            });

            setActiveAmendment(res.data.amendment);
            setEditModalOpen(false);
            showNotification('Booking details updated successfully under amendment authority.');
            fetchAmendments();
        } catch (err) {
            alert('Failed to update booking: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmittingEdit(false);
        }
    };

    // Mark Resolved
    const handleResolve = async (amendment) => {
        const reason = window.prompt('Add a completion note for Super Admin (optional):', 'Requested balance collected & audit verified.');
        if (reason === null) return;

        try {
            const res = await axios.post(`${API_BASE}/api/amendments/${amendment._id}/resolve`, {
                note: reason
            });
            setActiveAmendment(res.data);
            showNotification('Amendment marked as Resolved.');
            fetchAmendments();
        } catch (err) {
            alert('Failed to resolve amendment: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteAmendment = async (amendment, e) => {
        if (e) e.stopPropagation();
        const guest = amendment.guestName || 'this reservation';
        if (!window.confirm(`⚠️ PERMANENT FRONT DESK DELETION\n\nDelete this amendment and permanently remove the booking for "${guest}" from Front Desk?\n\n- The booking will be completely deleted from Front Desk.\n- Any assigned room will be freed immediately.\n- Any amendment collections will be deducted from daily sales.`)) {
            return;
        }

        try {
            const res = await axios.delete(`${API_BASE}/api/amendments/${amendment._id}`);
            showNotification(res.data?.message || 'Booking permanently deleted from Front Desk.');
            if (activeAmendment?._id === amendment._id) {
                setActiveAmendment(null);
            }
            fetchAmendments();
        } catch (err) {
            alert('Failed to delete: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="space-y-5">
            {/* Top Bar / Header */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
                        <FileEdit size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">Audit Amendments & Delegated Actions</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Super Admin financial audit delegation. Settle pending dues, reply to instructions, and edit authorized bookings.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Filter Tabs */}
                    <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-bold uppercase tracking-wider">
                        <button
                            onClick={() => setFilterStatus('active')}
                            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                                filterStatus === 'active' ? 'bg-white text-purple-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Active Tasks
                        </button>
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterStatus('Resolved')}
                            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                                filterStatus === 'Resolved' ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Resolved
                        </button>
                    </div>

                    <button
                        onClick={fetchAmendments}
                        className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Notification Banner */}
            {alertBanner && (
                <div className={`px-4 py-3 rounded-lg text-xs font-bold flex items-center justify-between border animate-in fade-in ${
                    alertBanner.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                    <div className="flex items-center gap-2">
                        <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                        <span>{alertBanner.msg}</span>
                    </div>
                    <button onClick={() => setAlertBanner(null)} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>
            )}

            {/* Main Content Grid: Left List (40%) / Right Workspace (60%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left Column: List of Amendments */}
                <div className="lg:col-span-5 space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Orders ({amendments.length})
                        </span>
                        {filterStatus === 'active' && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Delegated Access Active
                            </span>
                        )}
                    </div>

                    {loading && amendments.length === 0 ? (
                        <div className="bg-white rounded-xl p-10 text-center border border-slate-200">
                            <RefreshCw size={20} className="animate-spin text-amber-500 mx-auto mb-2" />
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading amendments...</p>
                        </div>
                    ) : amendments.length === 0 ? (
                        <div className="bg-white rounded-xl p-10 text-center border border-dashed border-slate-200">
                            <CheckCheck size={28} className="text-emerald-500 mx-auto mb-2" />
                            <h4 className="text-sm font-bold text-slate-700">No Pending Amendments</h4>
                            <p className="text-xs text-slate-400 mt-1">
                                {filterStatus === 'active' ? 'All financial audit amendments have been resolved!' : 'No amendment records found.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                            {amendments.map((amend) => {
                                const isSelected = activeAmendment && activeAmendment._id === amend._id;
                                const isActionReq = amend.status === 'Pending Admin Action';

                                return (
                                    <div
                                        key={amend._id}
                                        onClick={() => setActiveAmendment(amend)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                                            isSelected 
                                                ? 'bg-purple-50/60 border-purple-500 shadow-sm ring-1 ring-purple-500' 
                                                : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-xs'
                                        }`}
                                    >
                                        {/* Status Tag & Date */}
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
                                                isActionReq ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                                                amend.status === 'Admin Responded' ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' :
                                                amend.status === 'Resolved' ? 'bg-emerald-100 text-emerald-900' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {isActionReq && <AlertTriangle size={10} />}
                                                {amend.status}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                                                {new Date(amend.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>

                                        {/* Guest & Balance Due */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-sm font-bold text-slate-900 truncate">{amend.guestName}</h4>
                                                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{amend.roomInfo || 'Room'}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-[9px] uppercase font-bold text-slate-400 block whitespace-nowrap">Balance Due</span>
                                                <span className={`text-sm font-black whitespace-nowrap ${amend.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    ₹{(amend.balanceDue || 0).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Super Admin Message Snippet */}
                                        <div className="mt-2.5 p-2 bg-amber-50/80 rounded-lg border border-amber-200 text-xs text-amber-950 font-medium flex items-start gap-1.5">
                                            <ShieldAlert size={13} className="text-amber-700 shrink-0 mt-0.5" />
                                            <p className="truncate text-[11px] font-sans">"{amend.superAdminNote}"</p>
                                        </div>

                                        {/* Messages Count Badge & Delete */}
                                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                                            <span className="flex items-center gap-1 font-semibold text-[10px]">
                                                <MessageSquare size={11} className="text-slate-400" />
                                                {amend.messages?.length || 0} messages
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => handleDeleteAmendment(amend, e)}
                                                    className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                                                    title="Delete this amendment"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                                <span className="text-purple-700 font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider">
                                                    Open <ArrowRight size={10} />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Column: Active Amendment Detailed Workspace (60%) */}
                <div className="lg:col-span-7">
                    {activeAmendment ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[calc(100vh-230px)] overflow-hidden">
                            
                            {/* Workspace Header - Redesigned into 2 clean lines, perfectly aligned */}
                            <div className="bg-slate-900 text-white p-4 shrink-0 border-b border-slate-800 space-y-3">
                                {/* Line 1: Reference Info & Delete Action */}
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-[#BFA37E] uppercase tracking-widest whitespace-nowrap">
                                            Ref #{activeAmendment._id.slice(-8)}
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${
                                            activeAmendment.status === 'Closed' ? 'bg-slate-700 text-slate-300' :
                                            activeAmendment.status === 'Resolved' ? 'bg-emerald-600 text-white' :
                                            activeAmendment.status === 'Admin Responded' ? 'bg-indigo-600 text-white' :
                                            'bg-amber-500 text-white'
                                        }`}>
                                            {activeAmendment.status}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => handleDeleteAmendment(activeAmendment)}
                                        className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 whitespace-nowrap"
                                        title="Permanently delete this booking record from Front Desk and remove amendment"
                                    >
                                        <Trash2 size={12} /> Delete Record (Front Desk)
                                    </button>
                                </div>

                                {/* Line 2: Full Guest Name & Room Info */}
                                <div>
                                    <h3 className="text-lg font-bold text-white tracking-wide">
                                        {activeAmendment.guestName}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                                        {activeAmendment.roomInfo || 'Room Details'}
                                    </p>
                                </div>

                                {/* Line 3: Delegated Action Toolbar - Exactly the 3 requested buttons */}
                                {activeAmendment.status !== 'Closed' && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 flex-wrap">
                                        <button
                                            onClick={() => handleOpenCollect(activeAmendment)}
                                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap active:scale-95"
                                        >
                                            <IndianRupee size={13} /> Collect Balance
                                        </button>

                                        <button
                                            onClick={() => handleOpenEditBooking(activeAmendment)}
                                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap active:scale-95"
                                        >
                                            <FileEdit size={13} /> Edit Booking
                                        </button>

                                        <button
                                            onClick={() => handleResolve(activeAmendment)}
                                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap active:scale-95 border border-slate-700"
                                            title="Mark Resolved"
                                        >
                                            <CheckCheck size={13} /> Resolve
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Super Admin Instruction Alert Banner */}
                            <div className="bg-amber-50/90 border-b border-amber-200 p-3.5 shrink-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5 whitespace-nowrap">
                                        <ShieldAlert size={13} className="text-amber-700 shrink-0" />
                                        Super Admin Instructions:
                                    </span>
                                    <span className="text-[10px] text-amber-700 font-semibold whitespace-nowrap">
                                        By {activeAmendment.createdBy || 'Super Admin'}
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-amber-950 whitespace-pre-wrap leading-relaxed">
                                    {activeAmendment.superAdminNote}
                                </p>
                            </div>

                            {/* Booking Financial Snapshot Strip */}
                            <div className="bg-purple-50/60 border-b border-purple-100 px-4 py-2.5 grid grid-cols-3 gap-3 text-xs shrink-0">
                                <div>
                                    <span className="text-[9px] uppercase font-bold text-slate-500 block whitespace-nowrap">Total Bill</span>
                                    <span className="font-bold text-slate-900 whitespace-nowrap text-sm">
                                        ₹{(activeAmendment.booking?.financials?.totalAmount || 0).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[9px] uppercase font-bold text-emerald-700 block whitespace-nowrap">Paid So Far</span>
                                    <span className="font-bold text-emerald-700 whitespace-nowrap text-sm">
                                        ₹{(activeAmendment.booking?.financials?.amountPaid || 0).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[9px] uppercase font-bold text-rose-600 block whitespace-nowrap">Balance Due</span>
                                    <span className="font-black text-rose-600 whitespace-nowrap text-sm">
                                        ₹{(activeAmendment.balanceDue || 0).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            {/* Conversation Thread */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center pb-1">
                                    Conversation & Receipts
                                </div>

                                {activeAmendment.messages?.map((msg, idx) => {
                                    const isSuper = msg.sender === 'SuperAdmin';
                                    const isSys = msg.sender === 'System';

                                    if (isSys) {
                                        return (
                                            <div key={idx} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-950 mx-2 font-medium">
                                                <div className="font-bold flex items-center gap-1.5 text-emerald-800 text-[11px] mb-0.5">
                                                    <CheckCircle size={13} className="shrink-0" />
                                                    <span>{msg.senderName}</span>
                                                </div>
                                                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                                <span className="text-[9px] text-emerald-600 mt-1 block">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-xl text-xs max-w-[85%] ${
                                                isSuper 
                                                    ? 'bg-purple-50 border border-purple-200 text-purple-950 mr-auto' 
                                                    : 'bg-indigo-600 text-white ml-auto shadow-xs'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3 mb-1 text-[10px] font-bold opacity-90">
                                                <span className="whitespace-nowrap">
                                                    {isSuper ? '👑 Super Admin' : '👤 You (Staff Admin)'}
                                                </span>
                                                <span className={`whitespace-nowrap font-normal ${isSuper ? 'text-purple-600' : 'text-indigo-200'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="whitespace-pre-wrap leading-relaxed font-sans">{msg.text}</p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Chat Reply Input Bar */}
                            {activeAmendment.status !== 'Closed' ? (
                                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type an update or response to Super Admin..."
                                        className="flex-1 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-600"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!replyText.trim() || sendingMsg}
                                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                                    >
                                        <Send size={13} /> Send
                                    </button>
                                </form>
                            ) : (
                                <div className="p-3 bg-slate-100 text-center text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
                                    Amendment Closed — Delegated Access Terminated
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-dashed border-slate-200 h-96 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                            <Info size={32} className="mb-2 text-slate-300" />
                            <p className="text-xs font-bold uppercase tracking-wider">Select an amendment from the list to view instructions and take action.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* MODAL 1: Collect Pending Balance */}
            {collectModalOpen && activeAmendment && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-4 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                    <IndianRupee size={15} /> Collect Pending Balance
                                </h3>
                                <p className="text-xs text-emerald-200 mt-0.5 truncate max-w-xs">
                                    {activeAmendment.guestName} ({activeAmendment.roomInfo})
                                </p>
                            </div>
                            <button onClick={() => setCollectModalOpen(false)} className="text-white/80 hover:text-white p-1">✕</button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmitPayment} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Collection Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-base font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                                />
                                <div className="text-[11px] text-slate-500 mt-1 flex justify-between items-center">
                                    <span>Remaining: ₹{(activeAmendment.balanceDue || 0).toLocaleString('en-IN')}</span>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentForm({ ...paymentForm, amount: activeAmendment.balanceDue.toString() })}
                                        className="text-emerald-700 font-bold hover:underline"
                                    >
                                        Pay Full
                                    </button>
                                </div>
                            </div>

                            {/* Payment Mode Selector */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Payment Mode
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'Cash', label: 'Cash', icon: IndianRupee },
                                        { id: 'Online', label: 'Online / UPI', icon: Smartphone },
                                        { id: 'OTA', label: 'OTA Portal', icon: Globe }
                                    ].map((m) => {
                                        const Icon = m.icon;
                                        const isSel = paymentForm.mode === m.id;
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setPaymentForm({ ...paymentForm, mode: m.id })}
                                                className={`p-2.5 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                                                    isSel 
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                                                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                                                }`}
                                            >
                                                <Icon size={15} />
                                                <span className="whitespace-nowrap">{m.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {paymentForm.mode === 'OTA' && (
                                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                                    <Info size={14} className="text-amber-700 shrink-0 mt-0.5" />
                                    <span>OTA collection will be queued for approval in Front Desk Analytics before adding to Total Sales.</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Reference / Note
                                </label>
                                <input
                                    type="text"
                                    value={paymentForm.note}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                                    placeholder="e.g. MMT Ref # / UPI Tx ID / Counter cash"
                                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-600"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCollectModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingPayment}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
                                >
                                    <Check size={13} /> Record Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: Edit Booking Details */}
            {editModalOpen && activeAmendment && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-4 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                    <FileEdit size={15} /> Delegated Booking Modification
                                </h3>
                                <p className="text-xs text-indigo-200 mt-0.5">
                                    Authorized under Ref #{activeAmendment._id.slice(-8)}
                                </p>
                            </div>
                            <button onClick={() => setEditModalOpen(false)} className="text-white/80 hover:text-white p-1">✕</button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmitEditBooking} className="p-5 space-y-3.5 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.firstName}
                                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.lastName}
                                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Room Category</label>
                                    <select
                                        value={editForm.roomCategory}
                                        onChange={(e) => setEditForm({ ...editForm, roomCategory: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                                    >
                                        <option value="">Select Category</option>
                                        {roomCategories.map((c) => (
                                            <option key={c._id} value={c._id}>
                                                {c.title || c.category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Assign Room Unit</label>
                                    <select
                                        value={editForm.roomUnit}
                                        onChange={(e) => setEditForm({ ...editForm, roomUnit: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                                    >
                                        <option value="">None / Unassigned</option>
                                        {availableUnits.map((u) => (
                                            <option key={u._id} value={u._id}>
                                                Room {u.roomNumber} ({u.status})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Total Room Tariff (₹)</label>
                                    <input
                                        type="number"
                                        value={editForm.roomTariff}
                                        onChange={(e) => setEditForm({ ...editForm, roomTariff: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Reason / Note</label>
                                    <input
                                        type="text"
                                        value={editForm.updateNote}
                                        onChange={(e) => setEditForm({ ...editForm, updateNote: e.target.value })}
                                        placeholder="Reason for change"
                                        className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Check-in Date</label>
                                    <input
                                        type="date"
                                        value={editForm.checkInDate}
                                        onChange={(e) => setEditForm({ ...editForm, checkInDate: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Check-out Date</label>
                                    <input
                                        type="date"
                                        value={editForm.checkOutDate}
                                        onChange={(e) => setEditForm({ ...editForm, checkOutDate: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingEdit}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
                                >
                                    <Check size={13} /> Update Details
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AmendmentsManagement;
