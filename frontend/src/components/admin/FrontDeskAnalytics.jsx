import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import config from '../../config';
import { 
  Calendar as CalendarIcon, Copy, Share2, Check, IndianRupee, 
  DoorClosed, UserCheck, CheckCircle2, TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, ArrowLeft, 
  RefreshCw, Zap, Activity, Globe, Tag, CheckCircle, Clock, AlertTriangle, Printer, BarChart3, Filter, X, ChevronRight, Sparkles, Download
} from 'lucide-react';

const API_BASE = config.API_URL;

const FrontDeskAnalytics = ({ onClose }) => {
  // Navigation Tabs: 'daily' or 'monthly'
  const [activeTab, setActiveTab] = useState('daily');

  // Daily State
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [preparedBy, setPreparedBy] = useState(() => {
    return localStorage.getItem('staffName') || 'Front Desk Manager';
  });

  const [analyticsData, setAnalyticsData] = useState({
    date: selectedDate,
    formattedDate: '',
    checkIns: 0,
    occupiedRooms: 0,
    totalRooms: 16,
    vacantRooms: 0,
    vacantByCategory: {
      'Balcony Deluxe': { total: 4, occupied: 0, vacant: 4, roomNumbers: ['101', '102', '201', '202'] },
      'Double Deluxe': { total: 8, occupied: 0, vacant: 8, roomNumbers: ['103', '104', '105', '106', '203', '204', '205', '206'] },
      'Super Deluxe': { total: 4, occupied: 0, vacant: 4, roomNumbers: ['107', '108', '207', '208'] }
    },
    readingDifference: {
      cashSale: 0,
      onlineSale: 0,
      otaSale: 0,
      otaTotal: 0,
      otaApproved: 0,
      otaPending: 0,
      otaApprovedCount: 0,
      otaPendingCount: 0,
      totalSale: 0,
      cashExpenses: 0,
      openingBalanceCounter: 0,
      cashBalanceCounter: 0
    }
  });

  // Monthly State
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [monthlyData, setMonthlyData] = useState(null);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [monthlyCopied, setMonthlyCopied] = useState(false);

  // OTA Review & Approval Modal State
  const [otaModalOpen, setOtaModalOpen] = useState(false);
  const [otaScope, setOtaScope] = useState('date'); // 'date' | 'all'
  const [otaFilterStatus, setOtaFilterStatus] = useState('all'); // 'all' | 'pending' | 'approved'
  const [otaData, setOtaData] = useState({
    transactions: [],
    otaTotal: 0,
    otaApproved: 0,
    otaPending: 0,
    pendingCount: 0,
    approvedCount: 0
  });
  const [loadingOta, setLoadingOta] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch daily analytics
  useEffect(() => {
    fetchAnalytics(selectedDate);
  }, [selectedDate]);

  // Fetch monthly analytics when tab or month changes
  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchMonthlyReport(selectedMonth);
    }
  }, [activeTab, selectedMonth]);

  // Real-time socket updates for live data synchronization
  useEffect(() => {
    const socket = io(API_BASE);
    const handleUpdate = () => {
      fetchAnalytics(selectedDate);
      if (activeTab === 'monthly') {
        fetchMonthlyReport(selectedMonth);
      }
      if (otaModalOpen) {
        fetchOtaTransactions(selectedDate, otaScope, otaFilterStatus);
      }
    };
    socket.on('finance_updated', handleUpdate);
    socket.on('booking_deleted', handleUpdate);
    socket.on('booking_updated', handleUpdate);
    socket.on('amendment_deleted', handleUpdate);
    return () => {
      socket.off('finance_updated', handleUpdate);
      socket.off('booking_deleted', handleUpdate);
      socket.off('booking_updated', handleUpdate);
      socket.off('amendment_deleted', handleUpdate);
      socket.disconnect();
    };
  }, [selectedDate, selectedMonth, activeTab, otaModalOpen, otaScope, otaFilterStatus]);

  const fetchAnalytics = async (dateStr) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/finance/analytics-date?date=${dateStr}`);
      if (res.data) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async (monthStr) => {
    setLoadingMonth(true);
    try {
      const res = await axios.get(`${API_BASE}/api/finance/monthly-report?month=${monthStr}`);
      if (res.data) {
        setMonthlyData(res.data);
      }
    } catch (err) {
      console.error('Error fetching monthly report:', err);
    } finally {
      setLoadingMonth(false);
    }
  };

  const fetchOtaTransactions = async (dateStr, scope = 'date', status = 'all') => {
    setLoadingOta(true);
    try {
      let url = `${API_BASE}/api/finance/ota-transactions?status=${status}`;
      if (scope === 'date' && dateStr) {
        url += `&date=${dateStr}`;
      }
      const res = await axios.get(url);
      setOtaData(res.data);
    } catch (err) {
      console.error('Error fetching OTA transactions:', err);
    } finally {
      setLoadingOta(false);
    }
  };

  const handleOpenOtaModal = (preferredScope = 'date') => {
    setOtaScope(preferredScope);
    setOtaModalOpen(true);
    fetchOtaTransactions(selectedDate, preferredScope, otaFilterStatus);
  };

  const handleScopeChange = (newScope) => {
    setOtaScope(newScope);
    fetchOtaTransactions(selectedDate, newScope, otaFilterStatus);
  };

  const handleStatusFilterChange = (newStatus) => {
    setOtaFilterStatus(newStatus);
    fetchOtaTransactions(selectedDate, otaScope, newStatus);
  };

  const handleApproveOta = async (txId) => {
    try {
      setActionLoadingId(txId);
      const staff = localStorage.getItem('staffName') || 'Manager';
      await axios.post(`${API_BASE}/api/finance/ota-transactions/${txId}/approve`, {
        approvedBy: staff
      });
      // Refetch
      await fetchOtaTransactions(selectedDate, otaScope, otaFilterStatus);
      await fetchAnalytics(selectedDate);
      if (activeTab === 'monthly') {
        fetchMonthlyReport(selectedMonth);
      }
    } catch (err) {
      alert('Failed to approve transaction: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveAllOta = async () => {
    if (!window.confirm(`Approve all ${otaData.pendingCount} pending OTA transactions? These balances will immediately be credited into Total Sales.`)) {
      return;
    }
    try {
      setLoadingOta(true);
      const staff = localStorage.getItem('staffName') || 'Manager';
      const pendingIds = otaData.transactions.filter(t => !t.approved).map(t => t._id);
      await axios.post(`${API_BASE}/api/finance/ota-transactions/approve-all`, {
        transactionIds: pendingIds,
        approvedBy: staff
      });
      await fetchOtaTransactions(selectedDate, otaScope, otaFilterStatus);
      await fetchAnalytics(selectedDate);
      if (activeTab === 'monthly') {
        fetchMonthlyReport(selectedMonth);
      }
      alert('All pending OTA transactions approved and credited successfully!');
    } catch (err) {
      alert('Failed to batch approve: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingOta(false);
    }
  };

  const handlePreparedByChange = (e) => {
    const val = e.target.value;
    setPreparedBy(val);
    localStorage.setItem('staffName', val);
  };

  // Helper to format date cleanly like "9th August 2026"
  const getFormattedDateHeading = (dStr) => {
    if (!dStr) return '';
    const dateObj = new Date(dStr);
    const day = dateObj.getDate();
    let nth = 'th';
    if (day === 1 || day === 21 || day === 31) nth = 'st';
    else if (day === 2 || day === 22) nth = 'nd';
    else if (day === 3 || day === 23) nth = 'rd';

    const monthStr = dateObj.toLocaleDateString('en-US', { month: 'long' });
    const yearStr = dateObj.getFullYear();
    return `Date: ${day}${nth} ${monthStr} ${yearStr}`;
  };

  // Daily Summary Text for clipboard
  const buildSummaryReportText = () => {
    const rd = analyticsData.readingDifference || {};
    const cat = analyticsData.vacantByCategory || {};
    const meter = analyticsData.meterAnalytics || {};
    
    return `=== HOTEL BHOPAL INN - FRONT DESK ANALYTICS REPORT ===
${getFormattedDateHeading(selectedDate)}
Prepared By: ${preparedBy}

--- ROOM OCCUPANCY STATS ---
• Total Checkin Rooms: ${analyticsData.checkIns}
• Occupied Rooms: ${analyticsData.occupiedRooms}
• Total Vacant Rooms: ${analyticsData.vacantRooms}

--- VACANT ROOMS BY TYPE ---
• Balcony Deluxe (Rooms: 101, 102, 201, 202): ${cat['Balcony Deluxe']?.vacant || 0} Vacant / ${cat['Balcony Deluxe']?.total || 4} Total
• Double Deluxe (Rooms: 103..106, 203..206): ${cat['Double Deluxe']?.vacant || 0} Vacant / ${cat['Double Deluxe']?.total || 8} Total
• Super Deluxe (Rooms: 107, 108, 207, 208): ${cat['Super Deluxe']?.vacant || 0} Vacant / ${cat['Super Deluxe']?.total || 4} Total

--- TODAY'S READING DIFFERENCE ---
• Cash Sale: ₹${(rd.cashSale || 0).toLocaleString('en-IN')}
• Online Sale (PhonePe/UPI/Card): ₹${(rd.onlineSale || 0).toLocaleString('en-IN')}
• OTA Total (MMT/Agoda/Booking.com): ₹${(rd.otaTotal || 0).toLocaleString('en-IN')}
• OTA Approved (Credited to Sales): ₹${(rd.otaApproved || 0).toLocaleString('en-IN')}
• OTA Pending Verification: ₹${(rd.otaPending || 0).toLocaleString('en-IN')}
• Total Sale: ₹${(rd.totalSale || 0).toLocaleString('en-IN')}
• Cash Expenses: ₹${(rd.cashExpenses || 0).toLocaleString('en-IN')}
• Opening Balance at Counter: ₹${(rd.openingBalanceCounter || 0).toLocaleString('en-IN')}
• Cash Balance at Counter: ₹${(rd.cashBalanceCounter || 0).toLocaleString('en-IN')}

--- ELECTRICITY METER READING SUMMARY ---
• Yesterday Meter: ${meter.yesterday?.recorded ? meter.yesterday.reading + ' kWh' : 'Not Recorded'}
• Today Meter: ${meter.today?.recorded ? meter.today.reading + ' kWh' : 'Not Updated'}
• Difference (Consumption): ${meter.difference !== null && meter.difference !== undefined ? meter.difference + ' kWh' : 'Not Calculated'}
=================================================`;
  };

  const handleCopy = async () => {
    try {
      const text = buildSummaryReportText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    const text = buildSummaryReportText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Hotel Bhopal Inn Analytics - ${selectedDate}`,
          text: text
        });
      } catch (err) {
        console.log('Share canceled or failed:', err);
      }
    } else {
      handleCopy();
      alert('Report copied to clipboard! You can now paste and share via WhatsApp or Email.');
    }
  };

  // Monthly Summary Text for clipboard
  const buildMonthlyReportText = () => {
    if (!monthlyData) return '';
    const ms = monthlyData.summary || {};
    return `=== HOTEL BHOPAL INN - MONTHLY FINANCIAL AUDIT REPORT ===
Month: ${monthlyData.formattedHeading}
Generated By: ${preparedBy}

--- MONTHLY EXECUTIVE FINANCIALS ---
• Total Monthly Sales: ₹${(ms.totalSale || 0).toLocaleString('en-IN')}
• Cash Sales: ₹${(ms.cashSale || 0).toLocaleString('en-IN')}
• Online Sales: ₹${(ms.onlineSale || 0).toLocaleString('en-IN')}
• Approved OTA Sales: ₹${(ms.otaApproved || 0).toLocaleString('en-IN')}
• Pending Unapproved OTA: ₹${(ms.otaPending || 0).toLocaleString('en-IN')}
• Total Operational Expenses: ₹${(ms.totalExpenses || 0).toLocaleString('en-IN')}

--- OCCUPANCY PERFORMANCE ---
• Average Monthly Occupancy: ${ms.occupancyRate || 0}%
• Total Bookings Checked-In: ${ms.totalCheckIns || 0}
• Total Room Nights Sold: ${ms.totalRoomNights || 0} / ${ms.totalPossibleRoomNights || 0} Nights
=================================================`;
  };

  const handleCopyMonthly = async () => {
    try {
      const text = buildMonthlyReportText();
      await navigator.clipboard.writeText(text);
      setMonthlyCopied(true);
      setTimeout(() => setMonthlyCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy monthly report:', err);
    }
  };

  const handleDownloadDailyExcel = () => {
    try {
      const heading = getFormattedDateHeading(selectedDate);
      const rd = analyticsData.readingDifference || {};
      const cat = analyticsData.vacantByCategory || {};
      const meter = analyticsData.meterReading || {};

      const tableHtml = `
        <table>
          <tr>
            <td colspan="6" class="header-title" style="font-size: 16pt; font-weight: bold; color: #1A2B48; text-align: center;">
              HOTEL BHOPAL INN - FRONT DESK ANALYTICS & AUDIT
            </td>
          </tr>
          <tr>
            <td colspan="6" class="header-sub" style="font-size: 10pt; color: #64748B; text-align: center;">
              ${heading} | Date: ${selectedDate} | Prepared By: ${preparedBy}
            </td>
          </tr>
          <tr><td colspan="6"></td></tr>

          <!-- ROOM OCCUPANCY & INVENTORY -->
          <tr>
            <td colspan="6" class="section-header" style="font-size: 12pt; font-weight: bold; background-color: #F1F5F9; color: #0F172A; padding: 8px 12px; border: 1px solid #CBD5E1;">
              1. ROOM OCCUPANCY & INVENTORY
            </td>
          </tr>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <th style="border: 1px solid #718096; padding: 6px;">Total Hotel Rooms</th>
            <th style="border: 1px solid #718096; padding: 6px;">Total Check-Ins</th>
            <th style="border: 1px solid #718096; padding: 6px;">Currently Occupied</th>
            <th style="border: 1px solid #718096; padding: 6px;">Total Vacant Rooms</th>
            <th colspan="2" style="border: 1px solid #718096; padding: 6px;">Occupancy Rate</th>
          </tr>
          <tr>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-weight: bold;">${analyticsData.totalRooms || 16}</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; color: #065F46; font-weight: bold;">${analyticsData.checkIns || 0}</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-weight: bold;">${analyticsData.occupiedRooms || 0}</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; color: #1E40AF; font-weight: bold;">${analyticsData.vacantRooms || 0}</td>
            <td colspan="2" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-weight: bold;">
              ${Math.round(((analyticsData.occupiedRooms || 0) / (analyticsData.totalRooms || 16)) * 100)}%
            </td>
          </tr>
          <tr><td colspan="6"></td></tr>

          <!-- VACANT ROOMS BREAKDOWN -->
          <tr>
            <td colspan="6" class="section-header" style="font-size: 12pt; font-weight: bold; background-color: #EFF6FF; color: #1E40AF; padding: 8px 12px; border: 1px solid #CBD5E1;">
              2. VACANT ROOMS BY CATEGORY
            </td>
          </tr>
          <tr style="background-color: #1E40AF; color: #ffffff; font-weight: bold;">
            <th style="border: 1px solid #718096; padding: 6px;">Room Category</th>
            <th style="border: 1px solid #718096; padding: 6px; text-align: center;">Total Units</th>
            <th style="border: 1px solid #718096; padding: 6px; text-align: center;">Occupied Units</th>
            <th style="border: 1px solid #718096; padding: 6px; text-align: center;">Vacant Units</th>
            <th colspan="2" style="border: 1px solid #718096; padding: 6px;">Assigned Room Numbers</th>
          </tr>
          ${['Balcony Deluxe', 'Double Deluxe', 'Super Deluxe'].map(cName => {
            const item = cat[cName] || {};
            return `
              <tr>
                <td style="border: 1px solid #CBD5E1; padding: 6px; font-weight: bold;">${cName}</td>
                <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${item.total || 0}</td>
                <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${item.occupied || 0}</td>
                <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-weight: bold; color: #1E40AF;">${item.vacant || 0}</td>
                <td colspan="2" style="border: 1px solid #CBD5E1; padding: 6px;">${(item.roomNumbers || []).join(', ')}</td>
              </tr>
            `;
          }).join('')}
          <tr><td colspan="6"></td></tr>

          <!-- READING DIFFERENCES / FINANCIALS -->
          <tr>
            <td colspan="6" class="section-header" style="font-size: 12pt; font-weight: bold; background-color: #ECFDF5; color: #065F46; padding: 8px 12px; border: 1px solid #CBD5E1;">
              3. TODAY'S FINANCIAL READING DIFFERENCE
            </td>
          </tr>
          <tr style="background-color: #065F46; color: #ffffff; font-weight: bold;">
            <th colspan="3" style="border: 1px solid #718096; padding: 6px;">Revenue / Cashflow Component</th>
            <th colspan="3" style="border: 1px solid #718096; padding: 6px; text-align: right;">Amount (₹)</th>
          </tr>
          <tr>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px;">Cash Sale</td>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #065F46;">₹${Number(rd.cashSale || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px;">Online Sale (PhonePe / UPI / Card / Bank)</td>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #1E40AF;">₹${Number(rd.onlineSale || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px;">OTA Total (MMT / Booking.com / Agoda)</td>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #B45309;">₹${Number(rd.otaTotal || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px;">OTA Approved (Credited to Sales)</td>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #065F46;">₹${Number(rd.otaApproved || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px;">OTA Pending Verification</td>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #DC2626;">₹${Number(rd.otaPending || 0).toLocaleString()}</td>
          </tr>
          <tr style="background-color: #F1F5F9; font-weight: bold; border-top: 2px solid #64748B;">
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px; font-size: 11pt;">TOTAL DAY SALES:</td>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-size: 11pt; color: #1A2B48;">₹${Number(rd.totalSale || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px; color: #991B1B;">Cash Expenses</td>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #991B1B;">₹${Number(rd.cashExpenses || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px;">Opening Counter Cash Balance</td>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold;">₹${Number(rd.openingBalanceCounter || 0).toLocaleString()}</td>
          </tr>
          <tr style="background-color: #FEF3C7; font-weight: bold;">
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px;">Closing Counter Cash Balance:</td>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-size: 11pt; color: #92400E;">₹${Number(rd.cashBalanceCounter || 0).toLocaleString()}</td>
          </tr>
          <tr><td colspan="6"></td></tr>

          <!-- ELECTRICITY METER -->
          <tr>
            <td colspan="6" class="section-header" style="font-size: 12pt; font-weight: bold; background-color: #FEF3C7; color: #92400E; padding: 8px 12px; border: 1px solid #CBD5E1;">
              4. ELECTRICITY METER CONSUMPTION
            </td>
          </tr>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <th colspan="2" style="border: 1px solid #718096; padding: 6px;">Yesterday Meter</th>
            <th colspan="2" style="border: 1px solid #718096; padding: 6px;">Today Meter</th>
            <th colspan="2" style="border: 1px solid #718096; padding: 6px;">Difference (Consumption)</th>
          </tr>
          <tr>
            <td colspan="2" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${meter.yesterday?.reading || '-'} kWh</td>
            <td colspan="2" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${meter.today?.reading || '-'} kWh</td>
            <td colspan="2" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-weight: bold; color: #92400E;">${meter.difference !== null && meter.difference !== undefined ? meter.difference + ' kWh' : '-'}</td>
          </tr>
        </table>
      `;

      const template = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Daily Analytics</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
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
      link.download = `Hotel_Bhopal_Inn_Daily_Analytics_${selectedDate}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export daily excel:', err);
      alert('Failed to export Excel report: ' + err.message);
    }
  };

  const handleDownloadMonthlyExcel = () => {
    try {
      if (!monthlyData) return;
      const ms = monthlyData.summary || {};
      const breakdown = monthlyData.dailyBreakdown || [];

      const tableHtml = `
        <table>
          <tr>
            <td colspan="10" class="header-title" style="font-size: 16pt; font-weight: bold; color: #1A2B48; text-align: center;">
              HOTEL BHOPAL INN - MONTHLY FINANCIAL & OCCUPANCY AUDIT
            </td>
          </tr>
          <tr>
            <td colspan="10" class="header-sub" style="font-size: 10pt; color: #64748B; text-align: center;">
              Month: ${monthlyData.formattedHeading || selectedMonth} | Generated By: ${preparedBy} | Generated At: ${new Date().toLocaleString()}
            </td>
          </tr>
          <tr><td colspan="10"></td></tr>

          <!-- EXECUTIVE FINANCIAL SUMMARY (5 KPIS - NO NET MARGIN) -->
          <tr>
            <td colspan="10" class="section-header" style="font-size: 12pt; font-weight: bold; background-color: #F1F5F9; color: #0F172A; padding: 8px 12px; border: 1px solid #CBD5E1;">
              1. EXECUTIVE FINANCIAL TOTALS
            </td>
          </tr>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <th colspan="2" style="border: 1px solid #718096; padding: 6px;">Total Monthly Sales</th>
            <th colspan="2" style="border: 1px solid #718096; padding: 6px;">Cash Sales</th>
            <th colspan="2" style="border: 1px solid #718096; padding: 6px;">Online Sales</th>
            <th colspan="2" style="border: 1px solid #718096; padding: 6px;">Approved OTA Sales</th>
            <th colspan="2" style="border: 1px solid #718096; padding: 6px;">Total Expenses</th>
          </tr>
          <tr>
            <td colspan="2" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-size: 12pt; font-weight: bold; color: #1E40AF;">
              ₹${Number(ms.totalSale || 0).toLocaleString()}
            </td>
            <td colspan="2" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-size: 12pt; font-weight: bold; color: #065F46;">
              ₹${Number(ms.cashSale || 0).toLocaleString()}
            </td>
            <td colspan="2" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-size: 12pt; font-weight: bold; color: #1D4ED8;">
              ₹${Number(ms.onlineSale || 0).toLocaleString()}
            </td>
            <td colspan="2" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-size: 12pt; font-weight: bold; color: #B45309;">
              ₹${Number(ms.otaApproved || 0).toLocaleString()}
            </td>
            <td colspan="2" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-size: 12pt; font-weight: bold; color: #991B1B;">
              ₹${Number(ms.totalExpenses || 0).toLocaleString()}
            </td>
          </tr>
          <tr><td colspan="10"></td></tr>

          <!-- OCCUPANCY PERFORMANCE -->
          <tr>
            <td colspan="10" class="section-header" style="font-size: 12pt; font-weight: bold; background-color: #EFF6FF; color: #1E40AF; padding: 8px 12px; border: 1px solid #CBD5E1;">
              2. OCCUPANCY PERFORMANCE
            </td>
          </tr>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <th colspan="3" style="border: 1px solid #718096; padding: 6px;">Average Occupancy Rate</th>
            <th colspan="3" style="border: 1px solid #718096; padding: 6px;">Total Checked-In Bookings</th>
            <th colspan="4" style="border: 1px solid #718096; padding: 6px;">Total Room Nights Sold</th>
          </tr>
          <tr>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-weight: bold; color: #1E40AF;">
              ${ms.occupancyRate || 0}%
            </td>
            <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-weight: bold;">
              ${ms.totalCheckIns || 0} Bookings
            </td>
            <td colspan="4" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-weight: bold;">
              ${ms.totalRoomNights || 0} / ${ms.totalPossibleRoomNights || 0} Nights
            </td>
          </tr>
          <tr><td colspan="10"></td></tr>

          <!-- DAY-BY-DAY TABLE -->
          <tr>
            <td colspan="10" class="section-header" style="font-size: 12pt; font-weight: bold; background-color: #1A2B48; color: #FFFFFF; padding: 8px 12px; border: 1px solid #CBD5E1;">
              3. DAY-BY-DAY AUDIT BREAKDOWN (${breakdown.length} Days Analyzed)
            </td>
          </tr>
          <tr style="background-color: #2D3748; color: #ffffff; font-weight: bold;">
            <th style="border: 1px solid #718096; padding: 6px; width: 110px; text-align: center;">Date</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 60px; text-align: center;">Day</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 80px; text-align: center;">Check-Ins</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 100px; text-align: right;">Cash Sale</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 100px; text-align: right;">Online Sale</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 100px; text-align: right;">OTA Total</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 100px; text-align: right;">OTA Approved</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 110px; text-align: right;">Total Sale</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 100px; text-align: right;">Expenses</th>
            <th style="border: 1px solid #718096; padding: 6px; width: 110px; text-align: right;">Net Cashflow</th>
          </tr>
          ${breakdown.map((d, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-weight: bold;">${d.dateStr}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${d.dayOfWeek}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${d.checkIns}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #065F46;">₹${Number(d.cashSale || 0).toLocaleString()}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #1D4ED8;">₹${Number(d.onlineSale || 0).toLocaleString()}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #B45309;">₹${Number(d.otaTotal || 0).toLocaleString()}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #B45309;">₹${Number(d.otaApproved || 0).toLocaleString()}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #1A2B48; background-color: #F1F5F9;">₹${Number(d.totalSale || 0).toLocaleString()}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #991B1B;">₹${Number(d.expenses || 0).toLocaleString()}</td>
              <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: ${d.netCashflow >= 0 ? '#065F46' : '#991B1B'};">₹${Number(d.netCashflow || 0).toLocaleString()}</td>
            </tr>
          `).join('')}
          <tr style="font-weight: bold; background-color: #E2E8F0; border-top: 2px solid #64748B;">
            <td colspan="2" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">MONTHLY TOTALS</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${ms.totalCheckIns || 0}</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #065F46;">₹${Number(ms.cashSale || 0).toLocaleString()}</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #1D4ED8;">₹${Number(ms.onlineSale || 0).toLocaleString()}</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #B45309;">₹${Number(ms.otaTotal || 0).toLocaleString()}</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #B45309;">₹${Number(ms.otaApproved || 0).toLocaleString()}</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #1A2B48;">₹${Number(ms.totalSale || 0).toLocaleString()}</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #991B1B;">₹${Number(ms.totalExpenses || 0).toLocaleString()}</td>
            <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #065F46;">₹${Number(ms.netProfit || 0).toLocaleString()}</td>
          </tr>
        </table>
      `;

      const template = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Monthly Audit</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
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
      link.download = `Hotel_Bhopal_Inn_Monthly_Audit_${selectedMonth}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export monthly excel:', err);
      alert('Failed to export Monthly Excel: ' + err.message);
    }
  };

  const rd = analyticsData.readingDifference || {};
  const cat = analyticsData.vacantByCategory || {};
  const mSummary = monthlyData?.summary || {};

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header & Navigation Bar - Redesigned into 2 clean lines */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          {/* Line 1: Title & System Identification */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3.5">
              {onClose && (
                <button 
                  onClick={onClose}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-all border border-slate-300 shrink-0"
                  title="Go Back"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-[#1A2B48] text-white">
                    Front Desk Intelligence
                  </span>
                  <span className="text-xs text-slate-500 font-bold">• High Security & Accuracy</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-[#1A2B48] mt-1">
                  Hotel Front Desk Analytics & Financial Audit
                </h1>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Ledger Connected
            </div>
          </div>

          {/* Line 2: Mode Switcher Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto sm:min-w-[440px]">
              <button
                onClick={() => setActiveTab('daily')}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'daily'
                    ? 'bg-[#1A2B48] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <CalendarIcon size={15} />
                <span>Daily Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab('monthly')}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'monthly'
                    ? 'bg-[#1A2B48] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <BarChart3 size={15} />
                <span>Monthly Audit Report</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {activeTab === 'daily' 
                ? 'Inspecting single-day guest check-ins, room vacancies & counter differences' 
                : 'Inspecting whole-month revenue, aggregated OTA settlements & occupancy performance'}
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: DAILY ANALYTICS                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'daily' && (
          <>
            {/* Dynamic Interactive Calendar Bar - Redesigned into 2 clean lines */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              {/* Line 1: Header and Description */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 text-[#1A2B48] rounded-lg border border-slate-200 shrink-0">
                    <CalendarIcon size={22} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#1A2B48] uppercase tracking-wider">Dynamic Calendar Date Picker</h2>
                    <p className="text-xs text-slate-500 font-medium">Select any date to inspect exact occupancy & financial reading differences</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-600 bg-slate-100 px-3 py-1 rounded border border-slate-200">
                    Audit Date
                  </span>
                </div>
              </div>

              {/* Line 2: Controls Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5">
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-50 border-2 border-slate-200 focus:border-[#1A2B48] text-slate-900 px-3.5 py-2 rounded-lg text-sm font-bold outline-none cursor-pointer transition-all shadow-inner"
                />
                <button 
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-3.5 py-2 bg-[#1A2B48] hover:bg-[#253d66] text-xs font-bold uppercase tracking-wider text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap active:scale-95"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Today
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all whitespace-nowrap active:scale-95"
                  title="Copy Daily Report"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all whitespace-nowrap active:scale-95"
                  title="Share via WhatsApp or Web"
                >
                  <Share2 size={14} />
                  <span>Share</span>
                </button>

                <button
                  onClick={handleDownloadDailyExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all whitespace-nowrap active:scale-95"
                  title="Download Daily Report in Excel sheet format (.xls)"
                >
                  <Download size={14} />
                  <span>Export Excel</span>
                </button>
              </div>

              {/* Formatted Date Banner */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-lg sm:text-xl font-serif font-black text-[#1A2B48] tracking-wide">
                  {getFormattedDateHeading(selectedDate)}
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-600 bg-white px-3 py-1 rounded border border-slate-200 shadow-xs whitespace-nowrap">
                  Audit Date Selected
                </span>
              </div>
            </div>

            {/* Section 1: Room Occupancy Analytics Cards */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-6 bg-[#1A2B48] rounded-full"></div>
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-700 whitespace-nowrap">
                  Section 1: Room Occupancy & Vacancy Analytics
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Check-ins Today */}
                <div className="bg-white border-2 border-emerald-200 p-6 rounded-xl shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all">
                  <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-600 group-hover:scale-110 transition-transform">
                    <UserCheck size={80} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 whitespace-nowrap">
                    Check-ins Today
                  </span>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-3 whitespace-nowrap">Total Checkin Rooms</p>
                  <p className="text-4xl font-black text-slate-900 mt-1 tracking-tight whitespace-nowrap">
                    {analyticsData.checkIns} <span className="text-xs font-bold text-slate-500">Rooms</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium whitespace-nowrap">Bookings checked-in on this date</p>
                </div>

                {/* Occupied Rooms */}
                <div className="bg-white border-2 border-amber-200 p-6 rounded-xl shadow-sm relative overflow-hidden group hover:border-amber-400 transition-all">
                  <div className="absolute top-0 right-0 p-6 opacity-10 text-amber-600 group-hover:scale-110 transition-transform">
                    <DoorClosed size={80} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 whitespace-nowrap">
                    Active Guests
                  </span>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-3 whitespace-nowrap">Occupied Rooms</p>
                  <p className="text-4xl font-black text-slate-900 mt-1 tracking-tight whitespace-nowrap">
                    {analyticsData.occupiedRooms} <span className="text-xs font-bold text-slate-500">Occupied</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium whitespace-nowrap">Currently occupied rooms with people</p>
                </div>

                {/* Vacant Rooms Overall */}
                <div className="bg-white border-2 border-sky-200 p-6 rounded-xl shadow-sm relative overflow-hidden group hover:border-sky-400 transition-all">
                  <div className="absolute top-0 right-0 p-6 opacity-10 text-sky-600 group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={80} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-800 bg-sky-50 px-2.5 py-1 rounded border border-sky-200 whitespace-nowrap">
                    Available Capacity
                  </span>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-3 whitespace-nowrap">Total Vacant Rooms</p>
                  <p className="text-4xl font-black text-slate-900 mt-1 tracking-tight whitespace-nowrap">
                    {analyticsData.vacantRooms} <span className="text-xs font-bold text-slate-500">Vacant</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium whitespace-nowrap">Still vacant rooms across all types</p>
                </div>
              </div>

              {/* Breakdown by Room Type */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#1A2B48] flex items-center gap-2 whitespace-nowrap">
                  <DoorClosed size={16} /> Still Vacant Rooms in Each Type of Rooms (Exact Inventory breakdown)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Balcony Deluxe */}
                  <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-bold text-[#1A2B48] text-sm whitespace-nowrap">Balcony Deluxe</h5>
                      <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300 whitespace-nowrap">
                        {cat['Balcony Deluxe']?.vacant || 0} Vacant
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Room Numbers: <span className="text-slate-800 font-bold">101, 102, 201, 202</span></p>
                    <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-200">
                      <span className="text-slate-500 whitespace-nowrap">Occupied: {cat['Balcony Deluxe']?.occupied || 0}</span>
                      <span className="text-slate-500 font-bold whitespace-nowrap">Total: {cat['Balcony Deluxe']?.total || 4}</span>
                    </div>
                  </div>

                  {/* Double Deluxe */}
                  <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-bold text-[#1A2B48] text-sm whitespace-nowrap">Double Deluxe</h5>
                      <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300 whitespace-nowrap">
                        {cat['Double Deluxe']?.vacant || 0} Vacant
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Room Numbers: <span className="text-slate-800 font-bold">103..106, 203..206</span></p>
                    <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-200">
                      <span className="text-slate-500 whitespace-nowrap">Occupied: {cat['Double Deluxe']?.occupied || 0}</span>
                      <span className="text-slate-500 font-bold whitespace-nowrap">Total: {cat['Double Deluxe']?.total || 8}</span>
                    </div>
                  </div>

                  {/* Super Deluxe */}
                  <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-bold text-[#1A2B48] text-sm whitespace-nowrap">Super Deluxe</h5>
                      <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300 whitespace-nowrap">
                        {cat['Super Deluxe']?.vacant || 0} Vacant
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Room Numbers: <span className="text-slate-800 font-bold">107, 108, 207, 208</span></p>
                    <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-200">
                      <span className="text-slate-500 whitespace-nowrap">Occupied: {cat['Super Deluxe']?.occupied || 0}</span>
                      <span className="text-slate-500 font-bold whitespace-nowrap">Total: {cat['Super Deluxe']?.total || 4}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Financial Desk Output — Today's Reading Difference */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-6 bg-emerald-600 rounded-full"></div>
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-700 whitespace-nowrap">
                  Section 2: Today's Reading Difference (Finance Desk Analytics)
                </h3>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
                  <div>
                    <h4 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-2 whitespace-nowrap">
                      <IndianRupee className="text-emerald-700" size={22} /> Today's Reading Difference Summary
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold whitespace-nowrap">
                      Verified mathematical reconciliation: Cash + Online + Approved OTA = Total Sale
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleOpenOtaModal('date')}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all hover:scale-[1.02] whitespace-nowrap"
                  >
                    <Globe size={15} />
                    <span>Review & Approve OTA ({rd.otaPending > 0 ? `₹${(rd.otaPending || 0).toLocaleString()} Pending` : 'Reconciled'})</span>
                  </button>
                </div>

                {/* Sales & Expenses Grid: e.1, e.2, e.3.a, e.3.b, e.4, e.5 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  {/* e.1 Cash Sale */}
                  <div className="bg-emerald-50/60 p-5 rounded-xl border-2 border-emerald-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider whitespace-nowrap">e.1 Manual Cash</span>
                      <ArrowDownRight className="text-emerald-700" size={16} />
                    </div>
                    <p className="text-xs text-slate-600 font-bold uppercase whitespace-nowrap">Cash Sale</p>
                    <p className="text-2xl font-black text-emerald-950 whitespace-nowrap">
                      ₹{(rd.cashSale || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">Physical cash collected</p>
                  </div>

                  {/* e.2 Online Sale */}
                  <div className="bg-blue-50/60 p-5 rounded-xl border-2 border-blue-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider whitespace-nowrap">e.2 Online Digital</span>
                      <TrendingUp className="text-blue-700" size={16} />
                    </div>
                    <p className="text-xs text-slate-600 font-bold uppercase whitespace-nowrap">Online Sale</p>
                    <p className="text-2xl font-black text-blue-950 whitespace-nowrap">
                      ₹{(rd.onlineSale || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">PhonePe, UPI, Card</p>
                  </div>

                  {/* e.3.a OTA Pending / Unapproved */}
                  <div className="bg-amber-50/70 p-5 rounded-xl border-2 border-amber-300 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider whitespace-nowrap">e.3.a OTA Pending</span>
                      <Globe className="text-amber-700" size={16} />
                    </div>
                    <p className="text-xs text-slate-600 font-bold uppercase whitespace-nowrap">OTA Pending (Unapproved)</p>
                    <p className="text-2xl font-black text-amber-950 whitespace-nowrap">
                      ₹{(rd.otaPending || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                      {(rd.otaPending || 0) === 0 ? '✓ Reset to ₹0 (All Approved)' : `${rd.otaPendingCount || 0} pending approval`}
                    </p>
                  </div>

                  {/* e.3.b OTA Approved */}
                  <div className="bg-gradient-to-br from-amber-50 to-emerald-50/70 p-5 rounded-xl border-2 border-emerald-400 space-y-2 relative group hover:shadow-md transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider whitespace-nowrap">e.3.b OTA Approved</span>
                      <CheckCircle className="text-emerald-600" size={16} />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-emerald-800 font-bold uppercase whitespace-nowrap">OTA Approved</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
                        {rd.otaApprovedCount || 0} Approved
                      </span>
                    </div>
                    <p className="text-2xl font-black text-emerald-950 whitespace-nowrap">
                      ₹{(rd.otaApproved || 0).toLocaleString('en-IN')}
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-700 font-bold whitespace-nowrap">
                        {(rd.otaPending || 0) > 0 ? `₹${(rd.otaPending || 0).toLocaleString()} pending` : 'Verified 100%'}
                      </span>
                      <button
                        onClick={() => handleOpenOtaModal('date')}
                        className="text-[10px] font-black uppercase text-amber-700 hover:text-amber-900 underline whitespace-nowrap"
                      >
                        Approve ➔
                      </button>
                    </div>
                  </div>

                  {/* e.4 Total Sale */}
                  <div className="bg-indigo-50/70 p-5 rounded-xl border-2 border-indigo-200 space-y-2 relative overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider whitespace-nowrap">e.4 Total Sales</span>
                      <Wallet className="text-indigo-700" size={16} />
                    </div>
                    <p className="text-xs text-slate-600 font-bold uppercase whitespace-nowrap">Total Sale</p>
                    <p className="text-2xl font-black text-indigo-950 whitespace-nowrap">
                      ₹{(rd.totalSale || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">Cash + Online + Approved OTA</p>
                  </div>

                  {/* e.5 Cash Expenses */}
                  <div className="bg-rose-50/60 p-5 rounded-xl border-2 border-rose-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-rose-900 tracking-wider whitespace-nowrap">e.5 Cash Spent</span>
                      <ArrowUpRight className="text-rose-700" size={16} />
                    </div>
                    <p className="text-xs text-slate-600 font-bold uppercase whitespace-nowrap">Cash Expenses</p>
                    <p className="text-2xl font-black text-rose-950 whitespace-nowrap">
                      ₹{(rd.cashExpenses || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">Total hotel expenditures</p>
                  </div>
                </div>

                {/* Counter Balances Highlight Cards */}
                <div className="bg-slate-50 p-6 md:p-8 rounded-xl border-2 border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-sm relative">
                  <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 md:pr-8">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 bg-white px-3 py-1 rounded border border-slate-300 whitespace-nowrap">
                      Counter Opening Balance
                    </span>
                    <p className="text-xs font-bold text-slate-600 uppercase mt-2 whitespace-nowrap">Opening Balance at Counter</p>
                    <p className="text-4xl font-black text-[#1A2B48] whitespace-nowrap">
                      ₹{(rd.openingBalanceCounter || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold whitespace-nowrap">
                      Carried forward automatically from previous day's closing
                    </p>
                  </div>

                  <div className="space-y-2 md:pl-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900 bg-emerald-100 px-3 py-1 rounded border border-emerald-300 whitespace-nowrap">
                      Counter Closing Balance
                    </span>
                    <p className="text-xs font-bold text-slate-600 uppercase mt-2 whitespace-nowrap">Cash Balance at Counter</p>
                    <p className="text-4xl font-black text-emerald-700 whitespace-nowrap">
                      ₹{(rd.cashBalanceCounter || 0).toLocaleString('en-IN')}
                    </p>
                    <div className="bg-white p-3 rounded text-[11px] text-slate-700 font-semibold mt-2 border border-slate-200 whitespace-nowrap">
                      <span className="text-slate-500 font-bold">Formula:</span> Opening (₹{(rd.openingBalanceCounter || 0).toLocaleString()}) + Total Sales (₹{(rd.totalSale || 0).toLocaleString()}) - Expenses (₹{(rd.cashExpenses || 0).toLocaleString()})
                    </div>
                  </div>
                </div>

                {/* Electricity Meter Reading Difference Summary */}
                <div className="bg-amber-50/50 p-6 md:p-8 rounded-xl border-2 border-amber-200 space-y-6 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-amber-200 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-100 text-amber-900 rounded-lg border border-amber-300">
                        <Zap size={24} className="fill-amber-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-serif font-black text-[#1A2B48] flex items-center gap-2 whitespace-nowrap">
                          Electricity Meter Reading Difference Summary
                        </h4>
                        <p className="text-xs text-slate-500 font-semibold whitespace-nowrap">Daily kWh meter reading comparison & consumption tracking</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
                        analyticsData.meterAnalytics?.today?.recorded ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}>
                        {analyticsData.meterAnalytics?.today?.recorded ? 'Today Updated' : 'Today: Not Updated'}
                      </span>
                    </div>
                  </div>

                  {/* Missed Dates Warning Alert */}
                  {analyticsData.meterAnalytics?.missedDates && analyticsData.meterAnalytics.missedDates.length > 0 && (
                    <div className="bg-amber-100 border border-amber-300 p-4 rounded-lg flex items-center gap-3 text-amber-950 text-xs font-semibold">
                      <Activity size={20} className="text-amber-700 shrink-0" />
                      <div>
                        <span className="font-bold uppercase tracking-wider block whitespace-nowrap">Missed Meter Reading(s) Detected:</span>
                        <span>No readings recorded on: {analyticsData.meterAnalytics.missedDates.join(', ')}. Consumption calculated from prior reading on {analyticsData.meterAnalytics.yesterday?.dateStr}.</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Yesterday Meter */}
                    <div className="bg-white p-5 rounded-xl border border-amber-200 space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider whitespace-nowrap">Yesterday Meter Reading</span>
                      <p className="text-3xl font-black text-slate-900 whitespace-nowrap">
                        {analyticsData.meterAnalytics?.yesterday?.recorded ? `${analyticsData.meterAnalytics.yesterday.reading} kWh` : 'Not Recorded'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                        {analyticsData.meterAnalytics?.yesterday?.recorded ? `Recorded for Date: ${analyticsData.meterAnalytics.yesterday.dateStr}` : 'No previous reading date'}
                      </p>
                    </div>

                    {/* Today Meter */}
                    <div className="bg-white p-5 rounded-xl border border-amber-200 space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider whitespace-nowrap">Today Meter Reading</span>
                      <p className={`text-3xl font-black whitespace-nowrap ${analyticsData.meterAnalytics?.today?.recorded ? 'text-amber-700' : 'text-slate-400'}`}>
                        {analyticsData.meterAnalytics?.today?.recorded ? `${analyticsData.meterAnalytics.today.reading} kWh` : 'Not Updated'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                        {analyticsData.meterAnalytics?.today?.recorded ? `Recorded for Date: ${analyticsData.meterAnalytics.today.dateStr}` : 'Enter reading via Front Desk to update'}
                      </p>
                    </div>

                    {/* Difference / Consumption */}
                    <div className="bg-white p-5 rounded-xl border border-emerald-300 space-y-2">
                      <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider whitespace-nowrap">Meter Difference (Consumption)</span>
                      <p className="text-3xl font-black text-emerald-700 whitespace-nowrap">
                        {analyticsData.meterAnalytics?.difference !== null && analyticsData.meterAnalytics?.difference !== undefined ? `${analyticsData.meterAnalytics.difference} kWh` : 'Not Calculated'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                        {analyticsData.meterAnalytics?.difference !== null ? 'Difference between Today & Yesterday reading' : 'Awaiting today\'s meter reading update'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Prepared By Person Entry */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1A2B48] whitespace-nowrap">Audit Verification</span>
                <h4 className="text-lg font-bold text-slate-900 whitespace-nowrap">Prepared By Signature</h4>
                <p className="text-xs text-slate-500 font-semibold whitespace-nowrap">Name of person/staff member generating and verifying this analytics entry</p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-sm font-bold text-slate-700 whitespace-nowrap">Prepared By:</span>
                <input 
                  type="text"
                  value={preparedBy}
                  onChange={handlePreparedByChange}
                  placeholder="Enter Staff Name..."
                  className="bg-slate-50 border-2 border-slate-200 focus:border-[#1A2B48] text-slate-900 px-4 py-2.5 rounded-lg text-sm font-bold outline-none transition-all w-full md:w-64 whitespace-nowrap"
                />
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: MONTHLY FINANCIAL AUDIT REPORT                                    */}
        {/* ========================================================================= */}
        {activeTab === 'monthly' && (
          <div className="space-y-8">
            {/* Month Selector & Controls Bar - Redesigned into 2 clean lines */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              {/* Line 1: Title & Description */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-900 rounded-lg border border-indigo-200 shrink-0">
                    <BarChart3 size={22} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#1A2B48] uppercase tracking-wider">Monthly Financial & Occupancy Audit</h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Aggregated revenue, OTA settlements, expenditures and day-by-day audit breakdown
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold uppercase tracking-widest text-indigo-900 bg-indigo-50 px-3 py-1 rounded border border-indigo-200 self-start sm:self-auto">
                  Monthly Audit Mode
                </span>
              </div>

              {/* Line 2: Controls Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5">
                <input 
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 text-slate-900 px-3.5 py-2 rounded-lg text-sm font-bold outline-none cursor-pointer transition-all shadow-inner"
                />

                <button 
                  onClick={() => fetchMonthlyReport(selectedMonth)}
                  className="px-3.5 py-2 bg-indigo-900 hover:bg-indigo-950 text-xs font-bold uppercase tracking-wider text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap active:scale-95"
                >
                  <RefreshCw size={14} className={loadingMonth ? 'animate-spin' : ''} /> Refresh
                </button>

                <button
                  onClick={handleCopyMonthly}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all whitespace-nowrap active:scale-95"
                  title="Copy Monthly Summary"
                >
                  {monthlyCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{monthlyCopied ? 'Copied!' : 'Copy Summary'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all whitespace-nowrap active:scale-95"
                  title="Print Monthly Report"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>

                <button
                  onClick={handleDownloadMonthlyExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all whitespace-nowrap active:scale-95"
                  title="Download Monthly Audit Report in Excel sheet format (.xls)"
                >
                  <Download size={14} />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>

            {/* Month Header Banner */}
            <div className="bg-gradient-to-r from-[#1A2B48] to-indigo-950 p-6 rounded-xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300 block">
                  Official Monthly Ledger Audit
                </span>
                <h3 className="text-2xl md:text-3xl font-serif font-black tracking-wide mt-1">
                  {monthlyData?.formattedHeading || 'Monthly Audit'}
                </h3>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/15 whitespace-nowrap">
                  <span className="text-white/60 block text-[10px] uppercase font-bold">Total Days Analyzed</span>
                  <span className="text-lg font-black text-white">{monthlyData?.dailyBreakdown?.length || 0} Days</span>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/15 whitespace-nowrap">
                  <span className="text-white/60 block text-[10px] uppercase font-bold">Occupancy Rate</span>
                  <span className="text-lg font-black text-emerald-400">{mSummary.occupancyRate || 0}%</span>
                </div>
              </div>
            </div>

            {/* Section A: Monthly Executive Financial Cards (5 Cards - Net Margin Removed) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-6 bg-indigo-700 rounded-full"></div>
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-700">
                  Monthly Financial Totals & Cashflow Reconciliation
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 1. Total Month Sale */}
                <div className="bg-indigo-50/80 p-5 rounded-xl border-2 border-indigo-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider">Total Revenue</span>
                    <Wallet className="text-indigo-700" size={16} />
                  </div>
                  <p className="text-xs text-slate-600 font-bold uppercase">Total Monthly Sales</p>
                  <p className="text-2xl font-black text-indigo-950">
                    ₹{(mSummary.totalSale || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold">Cash + Online + Approved OTA</p>
                </div>

                {/* 2. Cash Sale */}
                <div className="bg-emerald-50/80 p-5 rounded-xl border-2 border-emerald-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider">Physical Cash</span>
                    <ArrowDownRight className="text-emerald-700" size={16} />
                  </div>
                  <p className="text-xs text-slate-600 font-bold uppercase">Cash Sales</p>
                  <p className="text-2xl font-black text-emerald-950">
                    ₹{(mSummary.cashSale || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold">Direct counter cash</p>
                </div>

                {/* 3. Online Sale */}
                <div className="bg-blue-50/80 p-5 rounded-xl border-2 border-blue-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">Digital UPI</span>
                    <TrendingUp className="text-blue-700" size={16} />
                  </div>
                  <p className="text-xs text-slate-600 font-bold uppercase">Online Sales</p>
                  <p className="text-2xl font-black text-blue-950">
                    ₹{(mSummary.onlineSale || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold">PhonePe, Card, Bank</p>
                </div>

                {/* 4. OTA Approved */}
                <div className="bg-amber-50/80 p-5 rounded-xl border-2 border-amber-300 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider">OTA Portals</span>
                    <Globe className="text-amber-700" size={16} />
                  </div>
                  <p className="text-xs text-slate-600 font-bold uppercase">Approved OTA</p>
                  <p className="text-2xl font-black text-amber-950">
                    ₹{(mSummary.otaApproved || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Total: ₹{(mSummary.otaTotal || 0).toLocaleString()}
                  </p>
                </div>

                {/* 5. Total Expenses */}
                <div className="bg-rose-50/80 p-5 rounded-xl border-2 border-rose-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-rose-900 tracking-wider">Operational Cost</span>
                    <ArrowUpRight className="text-rose-700" size={16} />
                  </div>
                  <p className="text-xs text-slate-600 font-bold uppercase">Total Expenses</p>
                  <p className="text-2xl font-black text-rose-950">
                    ₹{(mSummary.totalExpenses || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold">All verified hotel costs</p>
                </div>
              </div>
            </div>

            {/* Section B: Monthly Occupancy & Room Nights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Occupancy Rate Bar Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Efficiency Metric</span>
                  <span className="text-xs font-black text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200 whitespace-nowrap">
                    {mSummary.occupancyRate || 0}% Occupancy
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-700 uppercase whitespace-nowrap">Monthly Room Occupancy</h4>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, mSummary.occupancyRate || 0)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 font-semibold whitespace-nowrap">
                  Sold {mSummary.totalRoomNights || 0} out of {mSummary.totalPossibleRoomNights || 0} total room nights
                </p>
              </div>

              {/* Total Check-Ins */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 whitespace-nowrap">
                    Guest Traffic
                  </span>
                  <UserCheck className="text-emerald-600" size={20} />
                </div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mt-2 whitespace-nowrap">Total Check-In Bookings</h4>
                <p className="text-3xl font-black text-slate-900 whitespace-nowrap">
                  {mSummary.totalCheckIns || 0} <span className="text-xs font-bold text-slate-500">Bookings</span>
                </p>
                <p className="text-xs text-slate-500 font-semibold whitespace-nowrap">Direct walk-ins + OTA portal arrivals</p>
              </div>

              {/* OTA Pending Receivable Alert Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 whitespace-nowrap">
                    OTA Reconciliation
                  </span>
                  <Globe className="text-amber-600" size={20} />
                </div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mt-2 whitespace-nowrap">Pending OTA Verification</h4>
                <p className="text-3xl font-black text-amber-800 whitespace-nowrap">
                  ₹{(mSummary.otaPending || 0).toLocaleString('en-IN')}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Unapproved OTA settlements</span>
                  <button
                    onClick={() => handleOpenOtaModal('all')}
                    className="text-xs font-black uppercase text-amber-700 hover:text-amber-900 underline whitespace-nowrap"
                  >
                    Open Review ➔
                  </button>
                </div>
              </div>
            </div>

            {/* Section C: Day-by-Day Monthly Audit Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-900 text-white p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-indigo-300 whitespace-nowrap">
                    Day-by-Day Financial & Occupancy Breakdown ({monthlyData?.formattedHeading})
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 whitespace-nowrap">
                    Click any day row or the Inspect button to drill into that day's front desk ledger
                  </p>
                </div>

                <div className="text-xs text-slate-400 font-semibold whitespace-nowrap">
                  Audit Period: 1st to {monthlyData?.dailyBreakdown?.length || 30}th
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
                      <th className="px-4 py-3.5 whitespace-nowrap">Date</th>
                      <th className="px-3 py-3.5 text-center whitespace-nowrap">Day</th>
                      <th className="px-3 py-3.5 text-center whitespace-nowrap">Check-Ins</th>
                      <th className="px-4 py-3.5 text-right whitespace-nowrap">Cash Sale</th>
                      <th className="px-4 py-3.5 text-right whitespace-nowrap">Online Sale</th>
                      <th className="px-4 py-3.5 text-right whitespace-nowrap">OTA Total</th>
                      <th className="px-4 py-3.5 text-right whitespace-nowrap">OTA Approved</th>
                      <th className="px-4 py-3.5 text-right whitespace-nowrap text-indigo-900 font-black">Total Sale</th>
                      <th className="px-4 py-3.5 text-right whitespace-nowrap text-rose-600">Expenses</th>
                      <th className="px-4 py-3.5 text-right whitespace-nowrap">Net Cashflow</th>
                      <th className="px-4 py-3.5 text-center whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {loadingMonth ? (
                      <tr>
                        <td colSpan="11" className="p-12 text-center text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">
                          <RefreshCw size={20} className="animate-spin inline-block mr-2 text-indigo-600" />
                          Generating monthly audit breakdown...
                        </td>
                      </tr>
                    ) : monthlyData?.dailyBreakdown?.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="p-12 text-center text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">
                          No audit data found for {selectedMonth}.
                        </td>
                      </tr>
                    ) : (
                      monthlyData?.dailyBreakdown?.map((day, idx) => {
                        const isWeekend = day.dayOfWeek === 'Sat' || day.dayOfWeek === 'Sun';
                        const isSelectedDate = day.dateStr === selectedDate;

                        return (
                          <tr 
                            key={day.dateStr}
                            className={`transition-colors ${
                              isSelectedDate 
                                ? 'bg-indigo-50/70 font-semibold' 
                                : idx % 2 === 0 
                                ? 'bg-white hover:bg-slate-50' 
                                : 'bg-slate-50/50 hover:bg-slate-100/60'
                            }`}
                          >
                            <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                              {day.dateStr}
                            </td>
                            <td className="px-3 py-3 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                isWeekend ? 'bg-purple-100 text-purple-900 border border-purple-200' : 'text-slate-600'
                              }`}>
                                {day.dayOfWeek}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center font-bold text-slate-800 whitespace-nowrap">
                              {day.checkIns > 0 ? (
                                <span className="bg-emerald-100 text-emerald-900 font-black px-2 py-0.5 rounded-full text-[11px]">
                                  {day.checkIns}
                                </span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-emerald-800 whitespace-nowrap">
                              ₹{day.cashSale.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-blue-800 whitespace-nowrap">
                              ₹{day.onlineSale.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-amber-700 whitespace-nowrap">
                              ₹{day.otaTotal.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-amber-800 whitespace-nowrap">
                              ₹{day.otaApproved.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-indigo-950 bg-indigo-50/30 whitespace-nowrap">
                              ₹{day.totalSale.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-rose-600 whitespace-nowrap">
                              ₹{day.expenses.toLocaleString('en-IN')}
                            </td>
                            <td className={`px-4 py-3 text-right font-black whitespace-nowrap ${
                              day.netCashflow >= 0 ? 'text-teal-700' : 'text-rose-600'
                            }`}>
                              ₹{day.netCashflow.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedDate(day.dateStr);
                                  setActiveTab('daily');
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-[#1A2B48] hover:text-white text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded transition-colors whitespace-nowrap"
                                title="Inspect this date in Daily View"
                              >
                                View ➔
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* Totals Summary Footer */}
                  {monthlyData?.dailyBreakdown && monthlyData.dailyBreakdown.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-700">
                        <td className="px-4 py-4 whitespace-nowrap uppercase tracking-wider">MONTH TOTAL</td>
                        <td className="px-3 py-4 text-center whitespace-nowrap">{monthlyData.dailyBreakdown.length}d</td>
                        <td className="px-3 py-4 text-center whitespace-nowrap text-emerald-400">{mSummary.totalCheckIns || 0}</td>
                        <td className="px-4 py-4 text-right whitespace-nowrap text-emerald-400">₹{(mSummary.cashSale || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 text-right whitespace-nowrap text-blue-300">₹{(mSummary.onlineSale || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 text-right whitespace-nowrap text-amber-300">₹{(mSummary.otaTotal || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 text-right whitespace-nowrap text-amber-400">₹{(mSummary.otaApproved || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 text-right whitespace-nowrap text-white text-sm bg-indigo-900">₹{(mSummary.totalSale || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 text-right whitespace-nowrap text-rose-300">₹{(mSummary.totalExpenses || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 text-right whitespace-nowrap text-teal-300 text-sm">₹{(mSummary.netProfit || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 text-center whitespace-nowrap text-[10px] text-slate-400">AUDITED</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Footer Statement */}
        <div className="text-center text-xs text-slate-500 py-4 border-t border-slate-200 whitespace-nowrap">
          Hotel Bhopal Inn CMS Intelligence Engine • All calculations strictly match system ledger & room units.
        </div>

      </div>

      {/* ========================================================================= */}
      {/* OTA TRANSACTIONS REVIEW & APPROVAL MODAL                                  */}
      {/* ========================================================================= */}
      {otaModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 p-5 text-white flex justify-between items-center shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="text-amber-300" size={20} />
                  <h3 className="text-base font-bold uppercase tracking-wider whitespace-nowrap">
                    OTA Portal Transactions Reconciliation
                  </h3>
                </div>
                <p className="text-xs text-amber-200 mt-1 whitespace-nowrap">
                  Verify MMT, Agoda, Booking.com & Goibibo payments before crediting into Total Sales
                </p>
              </div>

              <button 
                onClick={() => setOtaModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scope and Filter Tabs */}
            <div className="bg-amber-50/70 border-b border-amber-200 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Scope:</span>
                <button
                  onClick={() => handleScopeChange('date')}
                  className={`px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap ${
                    otaScope === 'date' 
                      ? 'bg-amber-700 text-white shadow-xs' 
                      : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Selected Date ({selectedDate})
                </button>
                <button
                  onClick={() => handleScopeChange('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap ${
                    otaScope === 'all' 
                      ? 'bg-amber-700 text-white shadow-xs' 
                      : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  All Pending (Across Dates)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Status:</span>
                <select
                  value={otaFilterStatus}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-md px-3 py-1.5 outline-none whitespace-nowrap"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending Approval Only</option>
                  <option value="approved">Approved Only</option>
                </select>

                {otaData.pendingCount > 0 && (
                  <button
                    onClick={handleApproveAllOta}
                    className="ml-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-md shadow-sm transition-all whitespace-nowrap flex items-center gap-1.5"
                  >
                    <CheckCircle size={14} /> Approve All ({otaData.pendingCount})
                  </button>
                )}
              </div>
            </div>

            {/* Reconciliation Snapshot Strip */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-3 gap-4 text-center shrink-0">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block whitespace-nowrap">Total OTA Received</span>
                <span className="text-lg font-black text-amber-800 whitespace-nowrap">₹{(otaData.otaTotal || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-xs">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block whitespace-nowrap">Approved in Sales (Count)</span>
                <span className="text-lg font-black text-emerald-700 whitespace-nowrap">
                  ₹{(otaData.otaApproved || 0).toLocaleString('en-IN')}
                  <span className="text-xs font-semibold text-emerald-600 block">
                    {otaData.approvedCount || 0} item(s) approved
                  </span>
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-rose-200 shadow-xs">
                <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block whitespace-nowrap">Pending Approval (Resets to ₹0)</span>
                <span className="text-lg font-black text-rose-600 whitespace-nowrap">
                  ₹{(otaData.otaPending || 0).toLocaleString('en-IN')}
                  <span className="text-xs font-semibold text-rose-500 block">
                    {(otaData.otaPending || 0) === 0 ? '✓ Reset to ₹0' : `${otaData.pendingCount || 0} items pending`}
                  </span>
                </span>
              </div>
            </div>

            {/* Transactions Table Body */}
            <div className="p-0 overflow-y-auto flex-1">
              {loadingOta ? (
                <div className="p-16 text-center text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">
                  <RefreshCw size={24} className="animate-spin inline-block mr-2 text-amber-600" />
                  Loading OTA portal transactions...
                </div>
              ) : otaData.transactions.length === 0 ? (
                <div className="p-16 text-center text-slate-400 font-medium">
                  <Globe size={40} className="mx-auto mb-2 opacity-30 text-amber-600" />
                  <p className="font-bold text-slate-700 whitespace-nowrap">No OTA transactions found for this selection.</p>
                  <p className="text-xs text-slate-500 mt-1 whitespace-nowrap">Try toggling to "All Pending (Across Dates)" to check pending items.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 sticky top-0">
                      <th className="px-4 py-3 whitespace-nowrap">#</th>
                      <th className="px-4 py-3 whitespace-nowrap">Date / Time</th>
                      <th className="px-4 py-3 whitespace-nowrap">Guest / Booking Ref</th>
                      <th className="px-4 py-3 whitespace-nowrap">Channel</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Amount</th>
                      <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {otaData.transactions.map((tx, idx) => {
                      const isPending = !tx.approved;
                      const isActing = actionLoadingId === tx._id;

                      return (
                        <tr key={tx._id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="px-4 py-3.5 text-slate-400 font-bold whitespace-nowrap">{idx + 1}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="font-bold text-slate-800">
                              {new Date(tx.date || tx.createdAt).toLocaleDateString('en-GB')}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(tx.date || tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="font-bold text-slate-900 truncate max-w-[220px]">
                              {tx.guestName || tx.description}
                            </div>
                            {tx.bookingRef && (
                              <div className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">
                                Ref: #{tx.bookingRef.slice(-8)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] uppercase">
                              {tx.paymentMode || 'OTA'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-black text-sm text-slate-900 whitespace-nowrap">
                            ₹{(Number(tx.amount) || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            {isPending ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 shadow-2xs">
                                <Clock size={11} /> Pending Approval
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1 shadow-2xs">
                                <CheckCircle size={11} /> Approved
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            {isPending ? (
                              <button
                                onClick={() => handleApproveOta(tx._id)}
                                disabled={isActing}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded transition-all shadow-xs inline-flex items-center gap-1 whitespace-nowrap"
                              >
                                {isActing ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                                Approve & Credit
                              </button>
                            ) : (
                              <span className="text-emerald-700 font-bold text-xs whitespace-nowrap">
                                Verified ✓
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-between items-center text-xs shrink-0">
              <span className="text-slate-500 font-semibold whitespace-nowrap">
                Only approved OTA entries are added into Total Sales and Counter Closing Balances.
              </span>
              <button
                onClick={() => setOtaModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default FrontDeskAnalytics;
