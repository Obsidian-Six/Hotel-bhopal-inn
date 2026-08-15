import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { 
  Calendar as CalendarIcon, Copy, Share2, Check, IndianRupee, 
  DoorClosed, UserCheck, CheckCircle2, TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, ArrowLeft, RefreshCw, Zap, Activity
} from 'lucide-react';

const API_BASE = config.API_URL;

const FrontDeskAnalytics = ({ onClose }) => {
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
      totalSale: 0,
      cashExpenses: 0,
      openingBalanceCounter: 0,
      cashBalanceCounter: 0
    }
  });

  useEffect(() => {
    fetchAnalytics(selectedDate);
  }, [selectedDate]);

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
• Total Sale: ₹${(rd.totalSale || 0).toLocaleString('en-IN')}
• Cash Expenses: ₹${(rd.cashExpenses || 0).toLocaleString('en-IN')}
• Opening Balance at Counter (from 10th Aug 2026): ₹${(rd.openingBalanceCounter || 0).toLocaleString('en-IN')}
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

  const rd = analyticsData.readingDifference || {};
  const cat = analyticsData.vacantByCategory || {};

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Navigation & Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            {onClose && (
              <button 
                onClick={onClose}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-all border border-slate-300"
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
              <h1 className="text-2xl md:text-3xl font-serif font-black tracking-wide text-[#1A2B48] mt-1">
                Hotel Front Desk Analytics & Financial Audit
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Copy Report Button */}
            <button
              onClick={handleCopy}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-[#1A2B48] hover:bg-[#253d66] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all active:scale-95"
              title="Copy Analytics Report to Clipboard"
            >
              {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
              <span>{copied ? 'Copied Report!' : 'Copy Report'}</span>
            </button>

            {/* Share Report Button */}
            <button
              onClick={handleShare}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all active:scale-95"
              title="Share Analytics via Web Share or WhatsApp"
            >
              <Share2 size={18} />
              <span>Share Report</span>
            </button>
          </div>
        </div>

        {/* Dynamic Interactive Calendar Bar */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-100 text-[#1A2B48] rounded-lg border border-slate-200">
                <CalendarIcon size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1A2B48] uppercase tracking-wider">Dynamic Calendar Date Picker</h2>
                <p className="text-xs text-slate-500 font-semibold">Select any date to inspect exact occupancy & financial reading differences</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border-2 border-slate-200 focus:border-[#1A2B48] text-slate-900 px-4 py-2.5 rounded-lg text-sm font-bold outline-none cursor-pointer transition-all shadow-inner"
              />
              <button 
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-4 py-2.5 bg-[#1A2B48] hover:bg-[#253d66] text-xs font-bold uppercase tracking-wider text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Today
              </button>
            </div>
          </div>

          {/* Formatted Date Banner */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center">
            <span className="text-xl md:text-2xl font-serif font-black text-[#1A2B48] tracking-wide">
              {getFormattedDateHeading(selectedDate)}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600 bg-white px-3 py-1 rounded border border-slate-200 shadow-xs">
              Audit Date Selected
            </span>
          </div>
        </div>

        {/* Section 1: Room Occupancy Analytics Cards */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-[#1A2B48] rounded-full"></div>
            <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-700">Section 1: Room Occupancy & Vacancy Analytics</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Check-ins Today */}
            <div className="bg-white border-2 border-emerald-200 p-6 rounded-xl shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-600 group-hover:scale-110 transition-transform">
                <UserCheck size={80} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Check-ins Today
              </span>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-3">Total Checkin Rooms</p>
              <p className="text-4xl font-black text-slate-900 mt-1 tracking-tight">
                {analyticsData.checkIns} <span className="text-xs font-bold text-slate-500">Rooms</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">Bookings checked-in on this date</p>
            </div>

            {/* Occupied Rooms */}
            <div className="bg-white border-2 border-amber-200 p-6 rounded-xl shadow-sm relative overflow-hidden group hover:border-amber-400 transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-10 text-amber-600 group-hover:scale-110 transition-transform">
                <DoorClosed size={80} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                Active Guests
              </span>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-3">Occupied Rooms</p>
              <p className="text-4xl font-black text-slate-900 mt-1 tracking-tight">
                {analyticsData.occupiedRooms} <span className="text-xs font-bold text-slate-500">Occupied</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">Currently occupied rooms with people</p>
            </div>

            {/* Vacant Rooms Overall */}
            <div className="bg-white border-2 border-sky-200 p-6 rounded-xl shadow-sm relative overflow-hidden group hover:border-sky-400 transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-10 text-sky-600 group-hover:scale-110 transition-transform">
                <CheckCircle2 size={80} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-800 bg-sky-50 px-2.5 py-1 rounded border border-sky-200">
                Available Capacity
              </span>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-3">Total Vacant Rooms</p>
              <p className="text-4xl font-black text-slate-900 mt-1 tracking-tight">
                {analyticsData.vacantRooms} <span className="text-xs font-bold text-slate-500">Vacant</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">Still vacant rooms across all types</p>
            </div>
          </div>

          {/* Breakdown by Room Type */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#1A2B48] flex items-center gap-2">
              <DoorClosed size={16} /> Still Vacant Rooms in Each Type of Rooms (Exact Inventory breakdown)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Balcony Deluxe */}
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-bold text-[#1A2B48] text-sm">Balcony Deluxe</h5>
                  <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                    {cat['Balcony Deluxe']?.vacant || 0} Vacant
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Room Numbers: <span className="text-slate-800 font-bold">101, 102, 201, 202</span></p>
                <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-200">
                  <span className="text-slate-500">Occupied: {cat['Balcony Deluxe']?.occupied || 0}</span>
                  <span className="text-slate-500 font-bold">Total: {cat['Balcony Deluxe']?.total || 4}</span>
                </div>
              </div>

              {/* Double Deluxe */}
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-bold text-[#1A2B48] text-sm">Double Deluxe</h5>
                  <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                    {cat['Double Deluxe']?.vacant || 0} Vacant
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Room Numbers: <span className="text-slate-800 font-bold">103, 104, 105, 106, 203, 204, 205, 206</span></p>
                <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-200">
                  <span className="text-slate-500">Occupied: {cat['Double Deluxe']?.occupied || 0}</span>
                  <span className="text-slate-500 font-bold">Total: {cat['Double Deluxe']?.total || 8}</span>
                </div>
              </div>

              {/* Super Deluxe */}
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-bold text-[#1A2B48] text-sm">Super Deluxe</h5>
                  <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                    {cat['Super Deluxe']?.vacant || 0} Vacant
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Room Numbers: <span className="text-slate-800 font-bold">107, 108, 207, 208</span></p>
                <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-200">
                  <span className="text-slate-500">Occupied: {cat['Super Deluxe']?.occupied || 0}</span>
                  <span className="text-slate-500 font-bold">Total: {cat['Super Deluxe']?.total || 4}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Financial Desk Output — Today's Reading Difference */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-emerald-600 rounded-full"></div>
            <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-700">
              Section 2: Today's Reading Difference (Finance Desk Analytics)
            </h3>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
              <div>
                <h4 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-2">
                  <IndianRupee className="text-emerald-700" size={22} /> Today's Reading Difference Summary
                </h4>
                <p className="text-xs text-slate-500 font-semibold">Complete mathematical breakdown of Cash Sales, Online Sales, Expenses & Counter Balances</p>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
                Verified Formula Calculations
              </span>
            </div>

            {/* Sales & Expenses Grid (e.1, e.2, e.3, e.4) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* e.1 Cash Sale */}
              <div className="bg-emerald-50/60 p-5 rounded-xl border-2 border-emerald-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider">e.1 Manual Cash</span>
                  <ArrowDownRight className="text-emerald-700" size={16} />
                </div>
                <p className="text-xs text-slate-600 font-bold uppercase">Cash Sale</p>
                <p className="text-2xl md:text-3xl font-black text-emerald-950">
                  ₹{(rd.cashSale || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">Cash received manually today</p>
              </div>

              {/* e.2 Online Sale */}
              <div className="bg-blue-50/60 p-5 rounded-xl border-2 border-blue-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">e.2 Online PhonePe/UPI</span>
                  <TrendingUp className="text-blue-700" size={16} />
                </div>
                <p className="text-xs text-slate-600 font-bold uppercase">Online Sale</p>
                <p className="text-2xl md:text-3xl font-black text-blue-950">
                  ₹{(rd.onlineSale || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">Cash received online via PhonePe/UPI/Card</p>
              </div>

              {/* e.3 Total Sale */}
              <div className="bg-indigo-50/60 p-5 rounded-xl border-2 border-indigo-200 space-y-2 relative overflow-hidden">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider">e.3 Combined Sales</span>
                  <Wallet className="text-indigo-700" size={16} />
                </div>
                <p className="text-xs text-slate-600 font-bold uppercase">Total Sale</p>
                <p className="text-2xl md:text-3xl font-black text-indigo-950">
                  ₹{(rd.totalSale || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">Total sum of Cash Sale + Online Sale</p>
              </div>

              {/* e.4 Cash Expenses */}
              <div className="bg-rose-50/60 p-5 rounded-xl border-2 border-rose-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-rose-900 tracking-wider">e.4 Cash Spent</span>
                  <ArrowUpRight className="text-rose-700" size={16} />
                </div>
                <p className="text-xs text-slate-600 font-bold uppercase">Cash Expenses</p>
                <p className="text-2xl md:text-3xl font-black text-rose-950">
                  ₹{(rd.cashExpenses || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">Cash used for financial expenses today</p>
              </div>
            </div>

            {/* e.5 Counter Balances Highlight Cards */}
            <div className="bg-slate-50 p-6 md:p-8 rounded-xl border-2 border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-sm relative">
              <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 md:pr-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 bg-white px-3 py-1 rounded border border-slate-300">
                  Counter Opening Balance (e.5)
                </span>
                <p className="text-xs font-bold text-slate-600 uppercase mt-2">Opening Balance at Counter</p>
                <p className="text-4xl font-black text-[#1A2B48]">
                  ₹{(rd.openingBalanceCounter || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-slate-500 font-semibold">
                  Previous day's closing counter balance (carried forward automatically)
                </p>
              </div>

              <div className="space-y-2 md:pl-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900 bg-emerald-100 px-3 py-1 rounded border border-emerald-300">
                  Counter Closing Balance (e.5)
                </span>
                <p className="text-xs font-bold text-slate-600 uppercase mt-2">Cash Balance at Counter</p>
                <p className="text-4xl font-black text-emerald-700">
                  ₹{(rd.cashBalanceCounter || 0).toLocaleString('en-IN')}
                </p>
                <div className="bg-white p-3 rounded text-[11px] text-slate-700 font-semibold mt-2 border border-slate-200">
                  <span className="text-slate-500 font-bold">Formula:</span> Opening Balance + Today Total Payments - Expenses = ₹{(rd.openingBalanceCounter || 0).toLocaleString()} + ₹{(rd.totalSale || 0).toLocaleString()} - ₹{(rd.cashExpenses || 0).toLocaleString()}
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
                    <h4 className="text-lg font-serif font-black text-[#1A2B48] flex items-center gap-2">
                      Electricity Meter Reading Difference Summary
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold">Daily kWh meter reading comparison & consumption tracking</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
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
                    <span className="font-bold uppercase tracking-wider block">Missed Meter Reading(s) Detected:</span>
                    <span>No readings recorded on: {analyticsData.meterAnalytics.missedDates.join(', ')}. Consumption calculated from prior reading on {analyticsData.meterAnalytics.yesterday?.dateStr}.</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Yesterday Meter */}
                <div className="bg-white p-5 rounded-xl border border-amber-200 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Yesterday Meter Reading</span>
                  <p className="text-3xl font-black text-slate-900">
                    {analyticsData.meterAnalytics?.yesterday?.recorded ? `${analyticsData.meterAnalytics.yesterday.reading} kWh` : 'Not Recorded'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    {analyticsData.meterAnalytics?.yesterday?.recorded ? `Recorded for Date: ${analyticsData.meterAnalytics.yesterday.dateStr}` : 'No previous reading date'}
                  </p>
                </div>

                {/* Today Meter */}
                <div className="bg-white p-5 rounded-xl border border-amber-200 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Today Meter Reading</span>
                  <p className={`text-3xl font-black ${analyticsData.meterAnalytics?.today?.recorded ? 'text-amber-700' : 'text-slate-400'}`}>
                    {analyticsData.meterAnalytics?.today?.recorded ? `${analyticsData.meterAnalytics.today.reading} kWh` : 'Not Updated'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    {analyticsData.meterAnalytics?.today?.recorded ? `Recorded for Date: ${analyticsData.meterAnalytics.today.dateStr}` : 'Enter reading via Front Desk to update'}
                  </p>
                </div>

                {/* Difference / Consumption */}
                <div className="bg-white p-5 rounded-xl border border-emerald-300 space-y-2">
                  <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Meter Difference (Consumption)</span>
                  <p className="text-3xl font-black text-emerald-700">
                    {analyticsData.meterAnalytics?.difference !== null && analyticsData.meterAnalytics?.difference !== undefined ? `${analyticsData.meterAnalytics.difference} kWh` : 'Not Calculated'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold">
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
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1A2B48]">Audit Verification</span>
            <h4 className="text-lg font-bold text-slate-900">Prepared By Signature</h4>
            <p className="text-xs text-slate-500 font-semibold">Name of person/staff member generating and verifying this analytics entry</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-sm font-bold text-slate-700 whitespace-nowrap">Prepared By:</span>
            <input 
              type="text"
              value={preparedBy}
              onChange={handlePreparedByChange}
              placeholder="Enter Staff Name..."
              className="bg-slate-50 border-2 border-slate-200 focus:border-[#1A2B48] text-slate-900 px-4 py-2.5 rounded-lg text-sm font-bold outline-none transition-all w-full md:w-64"
            />
          </div>
        </div>

        {/* Bottom Footer Statement */}
        <div className="text-center text-xs text-slate-500 py-4 border-t border-slate-200">
          Hotel Bhopal Inn CMS Intelligence Engine • All calculations strictly match system ledger & room units.
        </div>

      </div>
    </div>
  );
};

export default FrontDeskAnalytics;
