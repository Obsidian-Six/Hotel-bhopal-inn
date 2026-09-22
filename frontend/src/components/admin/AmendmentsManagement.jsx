import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/config';
import { socket } from '@/lib/socket';
import { useAuth } from '@/lib/AuthContext';
import { 
    FileEdit, Check, X, Eye, ShieldCheck, User, Calendar, 
    Bed, ArrowRight, Trash2, Edit3, Lock, CheckCircle2, 
    AlertCircle, Search, RefreshCw, MessageSquare, IndianRupee,
    Phone, Mail, Tag, ShieldAlert
} from 'lucide-react';

const API_BASE = config.API_URL;

const AmendmentsManagement = ({ isSuperAdmin: propIsSuperAdmin } = {}) => {
    const { user, isSuperAdmin: authIsSuperAdmin } = useAuth();
    const isSuperAdmin = propIsSuperAdmin !== undefined ? propIsSuperAdmin : authIsSuperAdmin;

    const [amendments, setAmendments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'approved', 'completed', 'rejected'
    const [searchQuery, setSearchQuery] = useState('');

    // View Entry Modal (Super Admin & Staff)
    const [viewingAmendment, setViewingAmendment] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Edit Entry Modal (Staff Admin after approval)
    const [editingAmendment, setEditingAmendment] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        roomCategory: '',
        roomUnit: '',
        checkInDate: '',
        checkOutDate: '',
        roomPlan: 'EP',
        totalAmount: '',
        amountPaid: '',
        paymentMode: 'Cash',
        note: ''
    });
    const [roomCategories, setRoomCategories] = useState([]);
    const [availableUnits, setAvailableUnits] = useState([]);
    const [submittingEdit, setSubmittingEdit] = useState(false);

    // Reject Modal state (Super Admin)
    const [rejectingAmendment, setRejectingAmendment] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    // Toast alert banner
    const [alertBanner, setAlertBanner] = useState(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token') || (user && user.token);
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    };

    const showNotification = (msg, type = 'success') => {
        setAlertBanner({ msg, type });
        setTimeout(() => setAlertBanner(null), 4500);
    };

    const fetchAmendments = async () => {
        try {
            setLoading(true);
            const statusQuery = filterStatus === 'all' ? '' : `?status=${filterStatus}`;
            const res = await axios.get(`${API_BASE}/api/amendments${statusQuery}`, getAuthHeaders());
            setAmendments(res.data || []);
        } catch (err) {
            console.error('Error fetching amendments:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSupportData = async () => {
        try {
            const [roomsRes, unitsRes] = await Promise.all([
                axios.get(`${API_BASE}/api/rooms`, getAuthHeaders()),
                axios.get(`${API_BASE}/api/inventory/units`, getAuthHeaders())
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

        const handleRealtimeUpdate = () => {
            fetchAmendments();
        };

        socket.on('amendment_requested', handleRealtimeUpdate);
        socket.on('amendment_created', handleRealtimeUpdate);
        socket.on('amendment_approved', handleRealtimeUpdate);
        socket.on('amendment_rejected', handleRealtimeUpdate);
        socket.on('amendment_updated', handleRealtimeUpdate);
        socket.on('amendment_deleted', handleRealtimeUpdate);
        socket.on('booking_updated', handleRealtimeUpdate);
        socket.on('booking_deleted', handleRealtimeUpdate);

        return () => {
            socket.off('amendment_requested', handleRealtimeUpdate);
            socket.off('amendment_created', handleRealtimeUpdate);
            socket.off('amendment_approved', handleRealtimeUpdate);
            socket.off('amendment_rejected', handleRealtimeUpdate);
            socket.off('amendment_updated', handleRealtimeUpdate);
            socket.off('amendment_deleted', handleRealtimeUpdate);
            socket.off('booking_updated', handleRealtimeUpdate);
            socket.off('booking_deleted', handleRealtimeUpdate);
        };
    }, [filterStatus]);

    // Super Admin: Approve Request (Tick Mark)
    const handleApprove = async (amendment) => {
        if (!window.confirm(`Grant edit & delete access to staff admin for ${amendment.guestName || 'this entry'}?`)) {
            return;
        }

        try {
            const res = await axios.put(
                `${API_BASE}/api/amendments/${amendment._id}/approve`,
                { note: 'Approved by Super Admin' },
                getAuthHeaders()
            );
            showNotification(`Access granted for ${amendment.guestName}. Staff admin can now edit or delete this entry.`);
            if (isViewModalOpen) setIsViewModalOpen(false);
            fetchAmendments();
        } catch (err) {
            alert('Failed to approve: ' + (err.response?.data?.message || err.message));
        }
    };

    // Super Admin: Open Reject Modal (Wrong Mark)
    const handleOpenReject = (amendment) => {
        setRejectingAmendment(amendment);
        setRejectReason('');
        setIsRejectModalOpen(true);
    };

    // Super Admin: Submit Rejection
    const handleConfirmReject = async (e) => {
        e.preventDefault();
        if (!rejectingAmendment) return;

        try {
            await axios.put(
                `${API_BASE}/api/amendments/${rejectingAmendment._id}/reject`,
                { note: rejectReason.trim() || 'Declined by Super Admin' },
                getAuthHeaders()
            );
            showNotification(`Amendment request for ${rejectingAmendment.guestName} has been declined.`, 'error');
            setIsRejectModalOpen(false);
            setRejectingAmendment(null);
            if (isViewModalOpen) setIsViewModalOpen(false);
            fetchAmendments();
        } catch (err) {
            alert('Failed to reject: ' + (err.response?.data?.message || err.message));
        }
    };

    // View Entire Entry (Super Admin or Staff)
    const handleOpenView = (amendment) => {
        setViewingAmendment(amendment);
        setIsViewModalOpen(true);
    };

    // Staff Admin: Open Edit Modal (after Super Admin approved)
    const handleOpenEdit = (amendment) => {
        setEditingAmendment(amendment);

        if (amendment.entryType === 'Transaction') {
            setEditForm({
                firstName: amendment.entrySnapshot?.description || amendment.guestName || '',
                lastName: '',
                phone: '',
                email: '',
                roomCategory: '',
                roomUnit: '',
                checkInDate: amendment.entrySnapshot?.checkInDate ? new Date(amendment.entrySnapshot.checkInDate).toISOString().split('T')[0] : '',
                checkOutDate: '',
                roomPlan: 'EP',
                totalAmount: amendment.entrySnapshot?.totalAmount !== undefined ? amendment.entrySnapshot.totalAmount : '',
                amountPaid: amendment.entrySnapshot?.amountPaid !== undefined ? amendment.entrySnapshot.amountPaid : '',
                paymentMode: amendment.entrySnapshot?.paymentMode || 'Cash',
                note: ''
            });
            setIsEditModalOpen(true);
            return;
        }

        const guest = amendment.booking?.guestDetails || amendment.entrySnapshot?.guestDetails || {};
        const fin = amendment.booking?.financials || {};

        setEditForm({
            firstName: guest.firstName || '',
            lastName: guest.lastName || '',
            phone: guest.phone || '',
            email: guest.email || '',
            roomCategory: amendment.booking?.roomCategory?._id || amendment.booking?.roomCategory || '',
            roomUnit: amendment.booking?.roomUnit?._id || amendment.booking?.roomUnit || '',
            checkInDate: (amendment.booking?.checkInDate || amendment.entrySnapshot?.checkInDate) ? new Date(amendment.booking?.checkInDate || amendment.entrySnapshot?.checkInDate).toISOString().split('T')[0] : '',
            checkOutDate: (amendment.booking?.checkOutDate || amendment.entrySnapshot?.checkOutDate) ? new Date(amendment.booking?.checkOutDate || amendment.entrySnapshot?.checkOutDate).toISOString().split('T')[0] : '',
            roomPlan: amendment.booking?.roomPlan || 'EP',
            totalAmount: fin.totalAmount !== undefined ? fin.totalAmount : (amendment.entrySnapshot?.totalAmount || ''),
            amountPaid: fin.amountPaid !== undefined ? fin.amountPaid : (amendment.entrySnapshot?.amountPaid || ''),
            paymentMode: fin.paymentMode || amendment.entrySnapshot?.paymentMode || 'Cash',
            note: ''
        });
        setIsEditModalOpen(true);
    };

    // Staff Admin: Submit Edit
    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        if (!editingAmendment) return;

        try {
            setSubmittingEdit(true);

            const payload = editingAmendment.entryType === 'Transaction'
                ? {
                    description: editForm.firstName ? editForm.firstName.trim() : (editingAmendment.entrySnapshot?.description || 'Ledger Entry'),
                    amount: editForm.totalAmount !== '' ? Number(editForm.totalAmount) : undefined,
                    paymentMode: editForm.paymentMode,
                    date: editForm.checkInDate || undefined
                }
                : {
                    guestDetails: {
                        firstName: editForm.firstName,
                        lastName: editForm.lastName,
                        phone: editForm.phone,
                        email: editForm.email
                    },
                    roomCategory: editForm.roomCategory || undefined,
                    roomUnit: editForm.roomUnit || undefined,
                    checkInDate: editForm.checkInDate,
                    checkOutDate: editForm.checkOutDate,
                    roomPlan: editForm.roomPlan,
                    totalAmount: editForm.totalAmount !== '' ? Number(editForm.totalAmount) : undefined,
                    amountPaid: editForm.amountPaid !== '' ? Number(editForm.amountPaid) : undefined,
                    paymentMode: editForm.paymentMode,
                    note: editForm.note
                };

            const res = await axios.put(
                `${API_BASE}/api/amendments/${editingAmendment._id}/execute-edit`,
                payload,
                getAuthHeaders()
            );

            showNotification('Entry updated successfully! Balances and sales collections have been recalculated.');
            setIsEditModalOpen(false);
            setEditingAmendment(null);
            fetchAmendments();
        } catch (err) {
            alert('Failed to update entry: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmittingEdit(false);
        }
    };

    // Staff Admin: Permanently Delete Entry (after Super Admin approved)
    const handleDeleteEntry = async (amendment) => {
        const title = amendment.entryType === 'Transaction' ? `this financial transaction (${amendment.guestName})` : `the booking for "${amendment.guestName || 'this booking'}"`;
        if (!window.confirm(
            `⚠️ PERMANENT ENTRY DELETION\n\nAre you sure you want to permanently delete/void ${title}?\n\n- The entry will be permanently removed.\n- Associated collections will be recalculated.`
        )) {
            return;
        }

        try {
            const res = await axios.delete(
                `${API_BASE}/api/amendments/${amendment._id}/execute-delete`,
                getAuthHeaders()
            );
            showNotification(res.data?.message || 'Entry permanently deleted.');
            fetchAmendments();
        } catch (err) {
            alert('Failed to delete entry: ' + (err.response?.data?.message || err.message));
        }
    };

    // Super Admin: Clear amendment history record
    const handleClearRecord = async (id) => {
        if (!window.confirm('Remove this amendment record from history?')) return;
        try {
            await axios.delete(`${API_BASE}/api/amendments/${id}`, getAuthHeaders());
            showNotification('Record removed.');
            fetchAmendments();
        } catch (err) {
            alert('Failed to remove record: ' + (err.response?.data?.message || err.message));
        }
    };

    // Filter by search query
    const filteredAmendments = amendments.filter(a => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (a.guestName || '').toLowerCase().includes(q) ||
            (a.roomInfo || '').toLowerCase().includes(q) ||
            (a.requestReason || '').toLowerCase().includes(q) ||
            (a.requestedByName || '').toLowerCase().includes(q)
        );
    });

    const pendingCount = amendments.filter(a => a.status === 'Pending').length;
    const approvedCount = amendments.filter(a => a.status === 'Approved').length;

    return (
        <div className="space-y-6">
            {/* Notification Banner */}
            {alertBanner && (
                <div className={`p-4 rounded-sm border shadow-md flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-2 ${
                    alertBanner.type === 'error' 
                        ? 'bg-rose-50 border-rose-200 text-rose-900' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                    {alertBanner.type === 'error' ? <AlertCircle size={20} className="shrink-0 text-rose-600" /> : <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />}
                    <span className="text-xs font-bold">{alertBanner.msg}</span>
                </div>
            )}

            {/* Header */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-sm flex items-center justify-center font-bold shrink-0 ${
                        isSuperAdmin ? 'bg-purple-100 text-purple-700' : 'bg-[#BFA37E]/20 text-[#BFA37E]'
                    }`}>
                        {isSuperAdmin ? <ShieldCheck size={24} /> : <FileEdit size={24} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black tracking-tight text-[#1A2B48] uppercase">
                                {isSuperAdmin ? 'Super Admin Amendment Control Portal' : 'Front Desk Amendment Requests'}
                            </h2>
                            {isSuperAdmin ? (
                                <span className="bg-purple-900 text-purple-200 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest">
                                    Super Admin Only
                                </span>
                            ) : (
                                <span className="bg-slate-100 text-slate-700 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest">
                                    Staff Desk
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                            {isSuperAdmin 
                                ? 'Review staff amendment requests. Approve access (✓) to authorize editing or deletion of wrong entries, or reject (✕).' 
                                : 'Track requests submitted to Super Admin. When access is granted (✓), you can edit or delete that entry only.'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button 
                        onClick={fetchAmendments} 
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                        title="Refresh list"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Filters and Search Bar */}
            <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Status Tabs */}
                <div className="flex flex-wrap items-center gap-1 text-xs font-bold uppercase tracking-wider">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-3 py-1.5 rounded-sm transition-all ${
                            filterStatus === 'all' ? 'bg-[#1A2B48] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        All ({amendments.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('pending')}
                        className={`px-3 py-1.5 rounded-sm transition-all flex items-center gap-1.5 ${
                            filterStatus === 'pending' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <span>Pending</span>
                        {pendingCount > 0 && (
                            <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilterStatus('approved')}
                        className={`px-3 py-1.5 rounded-sm transition-all flex items-center gap-1.5 ${
                            filterStatus === 'approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <span>Access Granted</span>
                        {approvedCount > 0 && (
                            <span className="bg-emerald-800 text-emerald-100 text-[9px] px-1.5 py-0.2 rounded-full font-black">
                                {approvedCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilterStatus('completed')}
                        className={`px-3 py-1.5 rounded-sm transition-all ${
                            filterStatus === 'completed' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        Completed
                    </button>
                    <button
                        onClick={() => setFilterStatus('rejected')}
                        className={`px-3 py-1.5 rounded-sm transition-all ${
                            filterStatus === 'rejected' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        Declined
                    </button>
                </div>

                {/* Search Input */}
                <div className="relative w-full md:w-72">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search guest, room, reason..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-sm text-xs font-medium focus:outline-none focus:border-[#1A2B48]"
                    />
                </div>
            </div>

            {/* Content List */}
            {loading ? (
                <div className="bg-white p-12 text-center text-slate-400 uppercase font-bold tracking-widest text-xs border rounded-sm">
                    Loading Amendment Records...
                </div>
            ) : filteredAmendments.length === 0 ? (
                <div className="bg-white p-12 text-center border rounded-sm space-y-3">
                    <FileEdit size={36} className="mx-auto text-slate-300" />
                    <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">No Amendment Requests Found</p>
                    <p className="text-xs text-slate-400">
                        {isSuperAdmin 
                            ? 'No staff amendment requests currently match this filter.' 
                            : 'When you spot an incorrect entry in Front Desk, click "Amend" to request Super Admin approval.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredAmendments.map((amendment) => {
                        const isPending = amendment.status === 'Pending';
                        const isApproved = amendment.status === 'Approved';
                        const isRejected = amendment.status === 'Rejected';
                        const isCompleted = amendment.status === 'Completed';

                        return (
                            <div 
                                key={amendment._id}
                                className={`bg-white rounded-sm border transition-all p-5 shadow-xs ${
                                    isApproved 
                                        ? 'border-emerald-300 ring-1 ring-emerald-200 bg-emerald-50/20' 
                                        : isPending 
                                            ? 'border-amber-300 bg-amber-50/10' 
                                            : 'border-slate-200'
                                }`}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    {/* Left: Customer & Room Info */}
                                    <div className="space-y-2 flex-grow min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-base font-black text-[#1A2B48] flex items-center gap-1.5">
                                                <User size={16} className="text-[#BFA37E]" />
                                                {amendment.guestName || 'Unnamed Guest'}
                                            </span>
                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                {amendment.roomInfo || 'Room Unassigned'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-mono">
                                                Ref #{amendment._id.slice(-6).toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Admin Message Box */}
                                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                                <MessageSquare size={12} className="text-amber-600" />
                                                <span>Reason Entered by Admin:</span>
                                            </div>
                                            <p className="text-xs font-semibold text-slate-800 italic">
                                                "{amendment.requestReason}"
                                            </p>
                                        </div>

                                        {/* Metadata */}
                                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-medium">
                                            <span>Requested by: <strong className="text-slate-800">{amendment.requestedByName || 'Staff Admin'}</strong></span>
                                            <span>•</span>
                                            <span>Date: <strong className="text-slate-800">{new Date(amendment.createdAt).toLocaleString()}</strong></span>
                                            {amendment.entrySnapshot?.totalAmount !== undefined && (
                                                <>
                                                    <span>•</span>
                                                    <span>Entry Total: <strong>₹{amendment.entrySnapshot.totalAmount.toLocaleString()}</strong></span>
                                                    <span>•</span>
                                                    <span>Paid: <strong>₹{amendment.entrySnapshot.amountPaid.toLocaleString()}</strong></span>
                                                    <span>•</span>
                                                    <span>Balance: <strong className={amendment.entrySnapshot.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}>₹{amendment.entrySnapshot.balance.toLocaleString()}</strong></span>
                                                </>
                                            )}
                                        </div>

                                        {/* Rejection / Action Note */}
                                        {amendment.superAdminAction?.note && (
                                            <div className="text-xs text-slate-600 bg-white border border-slate-200 p-2 rounded-sm inline-block">
                                                <span className="font-bold text-slate-700">Super Admin Note: </span>
                                                <span>{amendment.superAdminAction.note}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Middle: Status Badge */}
                                    <div className="shrink-0 flex items-center">
                                        {isPending && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-sm text-xs font-black uppercase tracking-wider">
                                                <Lock size={14} className="text-amber-700" />
                                                <span>Pending Super Admin Approval</span>
                                            </div>
                                        )}
                                        {isApproved && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-sm text-xs font-black uppercase tracking-wider animate-pulse">
                                                <CheckCircle2 size={14} className="text-emerald-700" />
                                                <span>Access Granted (Can Edit/Delete)</span>
                                            </div>
                                        )}
                                        {isRejected && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-900 border border-rose-300 rounded-sm text-xs font-black uppercase tracking-wider">
                                                <X size={14} className="text-rose-700" />
                                                <span>Declined by Super Admin</span>
                                            </div>
                                        )}
                                        {isCompleted && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-900 border border-blue-300 rounded-sm text-xs font-black uppercase tracking-wider">
                                                <Check size={14} className="text-blue-700" />
                                                <span>Completed ({amendment.completedAction || 'Executed'})</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="shrink-0 flex flex-wrap items-center gap-2">
                                        {/* Super Admin Actions */}
                                        {isSuperAdmin ? (
                                            <>
                                                {/* Tick Mark (Approve) */}
                                                <button
                                                    onClick={() => handleApprove(amendment)}
                                                    disabled={isApproved || isCompleted}
                                                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-sm font-black text-xs uppercase shadow transition-all flex items-center gap-1"
                                                    title="Approve & Grant Access (Tick Mark)"
                                                >
                                                    <Check size={18} strokeWidth={3} />
                                                    <span className="hidden sm:inline">Approve</span>
                                                </button>

                                                {/* Wrong Mark (Reject) */}
                                                <button
                                                    onClick={() => handleOpenReject(amendment)}
                                                    disabled={isRejected || isCompleted}
                                                    className="p-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-sm font-black text-xs uppercase shadow transition-all flex items-center gap-1"
                                                    title="Reject Request (Wrong Mark)"
                                                >
                                                    <X size={18} strokeWidth={3} />
                                                    <span className="hidden sm:inline">Reject</span>
                                                </button>

                                                {/* View Button */}
                                                <button
                                                    onClick={() => handleOpenView(amendment)}
                                                    className="px-3 py-2.5 bg-[#1A2B48] hover:bg-[#263c63] text-white rounded-sm font-black text-xs uppercase shadow transition-all flex items-center gap-1.5"
                                                    title="View Entire Entry"
                                                >
                                                    <Eye size={16} />
                                                    <span>View</span>
                                                </button>

                                                {/* Clear Record */}
                                                {(isCompleted || isRejected) && (
                                                    <button
                                                        onClick={() => handleClearRecord(amendment._id)}
                                                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-colors"
                                                        title="Remove from history"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            /* Staff Admin Actions */
                                            <>
                                                {/* View Button */}
                                                <button
                                                    onClick={() => handleOpenView(amendment)}
                                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-sm font-bold text-xs uppercase transition-all flex items-center gap-1.5"
                                                >
                                                    <Eye size={15} />
                                                    <span>View Details</span>
                                                </button>

                                                {/* When Super Admin Approved Access: Edit & Delete unlock for this entry only */}
                                                {isApproved && (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenEdit(amendment)}
                                                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-black text-xs uppercase shadow transition-all flex items-center gap-1.5"
                                                        >
                                                            <Edit3 size={15} />
                                                            <span>Edit Entry</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEntry(amendment)}
                                                            className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-sm font-black text-xs uppercase shadow transition-all flex items-center gap-1.5"
                                                        >
                                                            <Trash2 size={15} />
                                                            <span>Delete Entry</span>
                                                        </button>
                                                    </>
                                                )}

                                                {isPending && (
                                                    <span className="text-[11px] text-amber-700 font-bold italic">
                                                        Awaiting Super Admin access...
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* VIEW ENTIRE ENTRY MODAL */}
            {isViewModalOpen && viewingAmendment && (
                <div className="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-3xl rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="bg-[#1A2B48] p-5 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-wide flex items-center gap-2">
                                    <Eye size={20} className="text-[#BFA37E]" />
                                    <span>Entire Entry Details — {viewingAmendment.guestName}</span>
                                </h3>
                                <p className="text-xs text-slate-300 font-medium mt-0.5">
                                    Amendment Ref: #{viewingAmendment._id.slice(-6).toUpperCase()} • Requested by {viewingAmendment.requestedByName}
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsViewModalOpen(false)}
                                className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Request Message Callout */}
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-sm">
                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-900 mb-1">
                                    <MessageSquare size={14} className="text-amber-700" />
                                    <span>Admin's Explanation / Reason for Amendment:</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-800">
                                    "{viewingAmendment.requestReason}"
                                </p>
                            </div>

                            {viewingAmendment.entryType === 'Transaction' ? (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-[#1A2B48] uppercase tracking-wider border-b pb-1">
                                        Financial Ledger Entry Snapshot
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                        <div className="p-3 bg-slate-50 border rounded-sm">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Ledger Type</span>
                                            <p className="font-black text-slate-800 text-sm mt-0.5">{viewingAmendment.entrySnapshot?.type || 'Finance'} Ledger</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 border rounded-sm">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Category</span>
                                            <p className="font-bold text-slate-800 mt-0.5">{viewingAmendment.entrySnapshot?.category || '-'}</p>
                                        </div>
                                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm">
                                            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Amount</span>
                                            <p className="font-black text-emerald-800 text-base mt-0.5">₹{(viewingAmendment.entrySnapshot?.totalAmount || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 border rounded-sm">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Payment Mode</span>
                                            <p className="font-bold text-slate-800 mt-0.5">{viewingAmendment.entrySnapshot?.paymentMode || 'Cash'}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                        <div className="p-3 bg-slate-50 border rounded-sm">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Description</span>
                                            <p className="font-medium text-slate-800 mt-0.5">{viewingAmendment.entrySnapshot?.description || viewingAmendment.guestName}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 border rounded-sm">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Recorded / Approved By</span>
                                            <p className="font-bold text-slate-800 mt-0.5">{viewingAmendment.entrySnapshot?.recordedBy || viewingAmendment.entrySnapshot?.approvedBy || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Guest Details */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black text-[#1A2B48] uppercase tracking-wider border-b pb-1">
                                            1. Guest Information
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                            <div className="p-3 bg-slate-50 border rounded-sm">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Guest Name</span>
                                                <p className="font-black text-slate-800 text-sm mt-0.5">{viewingAmendment.guestName}</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 border rounded-sm">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone</span>
                                                <p className="font-bold text-slate-800 mt-0.5">
                                                    {viewingAmendment.booking?.guestDetails?.phone || viewingAmendment.entrySnapshot?.guestDetails?.phone || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-slate-50 border rounded-sm">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Email</span>
                                                <p className="font-bold text-slate-800 truncate mt-0.5">
                                                    {viewingAmendment.booking?.guestDetails?.email || viewingAmendment.entrySnapshot?.guestDetails?.email || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-slate-50 border rounded-sm">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block">ID Proof</span>
                                                <p className="font-bold text-slate-800 mt-0.5">
                                                    {viewingAmendment.booking?.guestDetails?.idProof || 'Not Provided'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Room & Stay Details */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black text-[#1A2B48] uppercase tracking-wider border-b pb-1">
                                            2. Room & Stay Details
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                            <div className="p-3 bg-slate-50 border rounded-sm">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Room Category</span>
                                                <p className="font-black text-slate-800 mt-0.5">
                                                    {viewingAmendment.booking?.roomCategory?.title || viewingAmendment.entrySnapshot?.roomCategory || 'Standard'}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-slate-50 border rounded-sm">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Unit</span>
                                                <p className="font-black text-[#1A2B48] text-base mt-0.5">
                                                    {viewingAmendment.booking?.roomUnit?.roomNumber || viewingAmendment.entrySnapshot?.roomNumber || 'None'}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-slate-50 border rounded-sm">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Check-In Date</span>
                                                <p className="font-bold text-slate-800 mt-0.5">
                                                    {new Date(viewingAmendment.booking?.checkInDate || viewingAmendment.entrySnapshot?.checkInDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-slate-50 border rounded-sm">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Check-Out Date</span>
                                                <p className="font-bold text-slate-800 mt-0.5">
                                                    {new Date(viewingAmendment.booking?.checkOutDate || viewingAmendment.entrySnapshot?.checkOutDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financials & Balances */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black text-[#1A2B48] uppercase tracking-wider border-b pb-1">
                                            3. Financial Snapshot & Balances
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                            <div className="p-4 bg-slate-50 border rounded-sm">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Gross Total Tariff</span>
                                                <p className="text-lg font-black text-slate-800 mt-1">
                                                    ₹{(viewingAmendment.booking?.financials?.totalAmount ?? viewingAmendment.entrySnapshot?.totalAmount ?? 0).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-sm">
                                                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Amount Paid</span>
                                                <p className="text-lg font-black text-emerald-800 mt-1">
                                                    ₹{(viewingAmendment.booking?.financials?.amountPaid ?? viewingAmendment.entrySnapshot?.amountPaid ?? 0).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-sm">
                                                <span className="text-[10px] font-bold text-rose-700 uppercase block">Balance Due</span>
                                                <p className="text-lg font-black text-rose-700 mt-1">
                                                    ₹{(viewingAmendment.booking?.financials?.balance ?? viewingAmendment.entrySnapshot?.balance ?? 0).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-slate-50 border rounded-sm">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Payment Mode</span>
                                                <p className="text-sm font-black text-slate-800 mt-1">
                                                    {viewingAmendment.booking?.financials?.paymentMode || viewingAmendment.entrySnapshot?.paymentMode || 'Cash'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-slate-50 border-t flex items-center justify-between">
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 uppercase"
                            >
                                Close
                            </button>

                            {/* Super Admin Quick Actions inside View Modal */}
                            {isSuperAdmin && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleApprove(viewingAmendment)}
                                        disabled={viewingAmendment.status === 'Approved' || viewingAmendment.status === 'Completed'}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-sm font-black text-xs uppercase shadow flex items-center gap-1.5"
                                    >
                                        <Check size={16} strokeWidth={3} />
                                        <span>Grant Access (Tick)</span>
                                    </button>
                                    <button
                                        onClick={() => handleOpenReject(viewingAmendment)}
                                        disabled={viewingAmendment.status === 'Rejected' || viewingAmendment.status === 'Completed'}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-sm font-black text-xs uppercase shadow flex items-center gap-1.5"
                                    >
                                        <X size={16} strokeWidth={3} />
                                        <span>Decline Request (Cross)</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* REJECT MODAL (SUPER ADMIN) */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-[130] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-sm shadow-2xl overflow-hidden p-6 border-t-4 border-rose-600">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                                <X size={20} className="text-rose-600" />
                                <span>Decline Amendment Request</span>
                            </h3>
                            <button onClick={() => setIsRejectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleConfirmReject} className="space-y-4">
                            <p className="text-xs text-slate-600">
                                Declining this amendment request for <strong className="text-slate-900">{rejectingAmendment?.guestName}</strong> will deny edit/delete access to the staff admin.
                            </p>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                                    Reason for Declining (Optional note for staff admin):
                                </label>
                                <textarea
                                    rows={3}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="e.g. Booking is already audited; collect difference as extra charge instead."
                                    className="w-full p-2.5 border border-slate-300 rounded-sm text-xs focus:outline-none focus:border-rose-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsRejectModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-500 uppercase"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-sm text-xs font-black uppercase tracking-wider shadow"
                                >
                                    Confirm Decline
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT ENTRY MODAL (STAFF ADMIN AFTER SUPER ADMIN APPROVES ACCESS) */}
            {isEditModalOpen && editingAmendment && (
                <div className="fixed inset-0 bg-black/85 z-[130] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                        {/* Header */}
                        <div className="bg-blue-900 p-5 text-white flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-black uppercase tracking-wide">
                                        Edit Entry under Authorized Amendment
                                    </h3>
                                    <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
                                        Access Granted
                                    </span>
                                </div>
                                <p className="text-xs text-blue-200 mt-0.5">
                                    Guest: {editingAmendment.guestName} • Ref #{editingAmendment._id.slice(-6).toUpperCase()}
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-white/70 hover:text-white p-1 rounded-full"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Edit Form */}
                        <form onSubmit={handleSubmitEdit} className="p-6 overflow-y-auto space-y-4 flex-grow text-xs">
                            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-sm flex items-center gap-2 text-emerald-900">
                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                <span className="font-bold">
                                    Any changes made here will automatically adjust the booking, recalculate the balance, and sync daily sales & finance.
                                </span>
                            </div>

                            {editingAmendment?.entryType === 'Transaction' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Description / Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={editForm.firstName}
                                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                            className="w-full p-2.5 border border-slate-300 rounded-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Amount (₹)</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                step="any"
                                                value={editForm.totalAmount}
                                                onChange={(e) => setEditForm({ ...editForm, totalAmount: e.target.value })}
                                                className="w-full p-2.5 border border-slate-300 rounded-sm font-black text-slate-900 focus:outline-none focus:border-blue-600 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Payment Mode</label>
                                            <select
                                                value={editForm.paymentMode}
                                                onChange={(e) => setEditForm({ ...editForm, paymentMode: e.target.value })}
                                                className="w-full p-2.5 border border-slate-300 rounded-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                                            >
                                                {['Cash', 'Online', 'OTA', 'UPI', 'Card', 'Bank Transfer'].map((m) => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Transaction Date</label>
                                        <input
                                            type="date"
                                            value={editForm.checkInDate}
                                            onChange={(e) => setEditForm({ ...editForm, checkInDate: e.target.value })}
                                            className="w-full p-2.5 border border-slate-300 rounded-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Guest Names */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">First Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={editForm.firstName}
                                                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                                className="w-full p-2.5 border border-slate-300 rounded-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                value={editForm.lastName}
                                                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                                className="w-full p-2.5 border border-slate-300 rounded-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Phone</label>
                                            <input
                                                type="text"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                className="w-full p-2.5 border border-slate-300 rounded-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={editForm.email}
                                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                className="w-full p-2.5 border border-slate-300 rounded-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Room Category & Room Unit */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Room Category</label>
                                            <select
                                                value={editForm.roomCategory}
                                                onChange={(e) => setEditForm({ ...editForm, roomCategory: e.target.value })}
                                                className="w-full p-2.5 border border-slate-300 rounded-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                                            >
                                                <option value="">Select Category</option>
                                                {roomCategories.map((c) => (
                                                    <option key={c._id} value={c._id}>{c.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Room Unit / Number</label>
                                            <select
                                                value={editForm.roomUnit}
                                                onChange={(e) => setEditForm({ ...editForm, roomUnit: e.target.value })}
                                                className="w-full p-2.5 border border-slate-300 rounded-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                                            >
                                                <option value="">Keep current / Unassigned</option>
                                                {availableUnits.map((u) => (
                                                    <option key={u._id} value={u._id}>Room {u.roomNumber} ({u.status})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Check-In Date</label>
                                            <input
                                                type="date"
                                                value={editForm.checkInDate}
                                                onChange={(e) => setEditForm({ ...editForm, checkInDate: e.target.value })}
                                                className="w-full p-2.5 border border-slate-300 rounded-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Check-Out Date</label>
                                            <input
                                                type="date"
                                                value={editForm.checkOutDate}
                                                onChange={(e) => setEditForm({ ...editForm, checkOutDate: e.target.value })}
                                                className="w-full p-2.5 border border-slate-300 rounded-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Financials: Tariff, Amount Paid, Mode */}
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-3">
                                        <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                                            Financials & Dynamic Balance Recalculation
                                        </h5>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Total Tariff (₹)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    value={editForm.totalAmount}
                                                    onChange={(e) => setEditForm({ ...editForm, totalAmount: e.target.value })}
                                                    className="w-full p-2.5 border border-slate-300 rounded-sm font-black text-slate-900 focus:outline-none focus:border-blue-600"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Amount Paid (₹)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    value={editForm.amountPaid}
                                                    onChange={(e) => setEditForm({ ...editForm, amountPaid: e.target.value })}
                                                    className="w-full p-2.5 border border-slate-300 rounded-sm font-black text-emerald-700 focus:outline-none focus:border-blue-600"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Payment Mode</label>
                                                <select
                                                    value={editForm.paymentMode}
                                                    onChange={(e) => setEditForm({ ...editForm, paymentMode: e.target.value })}
                                                    className="w-full p-2.5 border border-slate-300 rounded-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                                                >
                                                    <option value="Cash">Cash</option>
                                                    <option value="UPI">UPI</option>
                                                    <option value="Card">Card</option>
                                                    <option value="Bank Transfer">Bank Transfer</option>
                                                    <option value="OTA">OTA</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Dynamic Balance Preview */}
                                        <div className="pt-2 flex justify-between items-center text-xs font-bold border-t">
                                            <span className="text-slate-600 uppercase tracking-wider">Recalculated Balance Due:</span>
                                            <span className={`text-base font-black ${
                                                (Number(editForm.totalAmount || 0) - Number(editForm.amountPaid || 0)) > 0 
                                                    ? 'text-rose-600' 
                                                    : 'text-emerald-600'
                                            }`}>
                                                ₹{Math.max(0, Number(editForm.totalAmount || 0) - Number(editForm.amountPaid || 0)).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Note */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                                    Amendment Note (Summary of correction made)
                                </label>
                                <input
                                    type="text"
                                    value={editForm.note}
                                    onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                                    placeholder="e.g. Corrected room tariff and added collected cash balance"
                                    className="w-full p-2.5 border border-slate-300 rounded-sm text-slate-800 focus:outline-none focus:border-blue-600"
                                />
                            </div>

                            {/* Footer Submit Buttons */}
                            <div className="flex justify-end gap-3 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-500 uppercase"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingEdit}
                                    className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-sm font-black text-xs uppercase tracking-wider shadow"
                                >
                                    {submittingEdit ? 'Saving Changes...' : 'Save & Update All Balances'}
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
