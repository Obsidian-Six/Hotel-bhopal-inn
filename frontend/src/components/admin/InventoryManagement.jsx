import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { Calendar, ChevronRight, Settings, Info, X, CalendarDays, CheckCircle2, AlertCircle, Ban } from 'lucide-react';
import { socket } from '@/lib/socket';

const API_BASE = config.API_URL;
const formatDateLocal = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const InventoryManagement = () => {
  const [data, setData] = useState({ rooms: [], dailyInventory: [], bookings: [] });
  const [startDate, setStartDate] = useState(formatDateLocal(new Date()));
  
  // Default to 14 days view
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 14);
  const [endDate, setEndDate] = useState(formatDateLocal(defaultEndDate));

  // Filters
  const [roomFilter, setRoomFilter] = useState('All rooms');

  // Inline Editing State
  const [editingCell, setEditingCell] = useState(null); // { roomId, date, field, value }

  // Bulk Edit Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  
  // Bulk Edit Form State
  const [bulkForm, setBulkForm] = useState({
    fromDate: '',
    toDate: '',
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    roomsToSell: '',
    price: '',
    status: '',
    blockedCount: ''
  });

  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryDate, setSummaryDate] = useState(new Date());
  const [selectedDayData, setSelectedDayData] = useState(null);

  useEffect(() => {
    fetchCalendarData();
    
    // Real-time updates
    socket.on('inventory_updated', fetchCalendarData);
    socket.on('booking_updated', fetchCalendarData);

    return () => {
        socket.off('inventory_updated', fetchCalendarData);
        socket.off('booking_updated', fetchCalendarData);
    };
  }, [startDate, endDate]);

  useEffect(() => {
    if (isSummaryOpen) {
        // Fetch full month data for summary
        const firstDay = formatDateLocal(new Date(summaryDate.getFullYear(), summaryDate.getMonth(), 1));
        const lastDay = formatDateLocal(new Date(summaryDate.getFullYear(), summaryDate.getMonth() + 1, 0));
        
        const fetchSummaryData = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/inventory/extranet-calendar?startDate=${firstDay}&endDate=${lastDay}`);
                setData(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchSummaryData();
    } else {
        fetchCalendarData();
    }
  }, [isSummaryOpen, summaryDate]);

  const fetchCalendarData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/inventory/extranet-calendar?startDate=${startDate}&endDate=${endDate}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openBulkEdit = (roomId) => {
    setSelectedRoomId(roomId);
    setBulkForm(prev => ({
        ...prev,
        fromDate: startDate,
        toDate: endDate,
        roomsToSell: '',
        price: '',
        status: '',
        blockedCount: ''
    }));
    setIsSidebarOpen(true);
  };

  const handleBulkSubmit = async (e) => {
      e.preventDefault();
      try {
          await axios.post(`${API_BASE}/api/inventory/bulk-edit`, {
              ...bulkForm,
              roomCategory: selectedRoomId
          });
          setIsSidebarOpen(false);
          fetchCalendarData();
          alert('Inventory updated successfully');
      } catch (err) {
          console.error(err);
          alert('Failed to update inventory');
      }
  };

  const toggleDay = (day) => {
      setBulkForm(prev => {
          if (prev.daysOfWeek.includes(day)) {
              return { ...prev, daysOfWeek: prev.daysOfWeek.filter(d => d !== day) };
          } else {
              return { ...prev, daysOfWeek: [...prev.daysOfWeek, day] };
          }
      });
  };

  const handleInlineSave = async (roomId, date, field, value) => {
      try {
          // date is a Date object, so we convert to ISO string first
          const dateStr = formatDateLocal(date);
          await axios.post(`${API_BASE}/api/inventory/bulk-edit`, {
              fromDate: dateStr,
              toDate: dateStr,
              daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              roomCategory: roomId,
              [field]: value === '' ? null : value
          });
          fetchCalendarData();
          setEditingCell(null);
      } catch (err) {
          console.error('Inline Save Error:', err);
          alert('Failed to update inventory');
      }
  };

  // Generate dates array for header
  const getDates = () => {
    let dates = [];
    let currDate = new Date(startDate);
    let lastDate = new Date(endDate);
    while (currDate <= lastDate) {
      dates.push(new Date(currDate));
      currDate.setDate(currDate.getDate() + 1);
    }
    return dates;
  };
  const datesList = getDates();

  const handlePrevRange = () => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) || 14;
      
      const newStart = new Date(start);
      newStart.setDate(newStart.getDate() - diff);
      const newEnd = new Date(end);
      newEnd.setDate(newEnd.getDate() - diff);
      
      setStartDate(formatDateLocal(newStart));
      setEndDate(formatDateLocal(newEnd));
  };

  const handleNextRange = () => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) || 14;
      
      const newStart = new Date(start);
      newStart.setDate(newStart.getDate() + diff);
      const newEnd = new Date(end);
      newEnd.setDate(newEnd.getDate() + diff);
      
      setStartDate(formatDateLocal(newStart));
      setEndDate(formatDateLocal(newEnd));
  };

  const getCellData = (roomId, date) => {
      const dateStr = formatDateLocal(date);
      
      const room = data.rooms.find(r => r._id === roomId);
      if (!room) return null;

      const override = data.dailyInventory.find(di => {
          const diDate = new Date(di.date).toISOString().split('T')[0];
          return (di.roomCategory === roomId || di.roomCategory?._id === roomId) && diDate === dateStr;
      });

      let netBookedCalculated = 0;
      data.bookings.forEach(b => {
          const bCategoryId = typeof b.roomCategory === 'object' ? b.roomCategory._id : b.roomCategory;
          if (bCategoryId === roomId) {
              const checkIn = new Date(b.checkInDate).toISOString().split('T')[0];
              const checkOut = new Date(b.checkOutDate).toISOString().split('T')[0];
              if (dateStr >= checkIn && dateStr < checkOut && b.status !== 'Cancelled') {
                  netBookedCalculated++;
              }
          }
      });

      return {
          status: override?.status || 'Bookable',
          roomsToSell: override?.roomsToSell !== null && override?.roomsToSell !== undefined ? override.roomsToSell : (room.details?.noOfRooms || 10),
          price: override?.price !== null && override?.price !== undefined ? override.price : room.details.startingPrice,
          netBooked: Math.max(override?.bookingsCount || 0, netBookedCalculated),
          blockedCount: override?.blockedCount || 0
      };
  };

    const getSummaryDayStatus = (date) => {
        const dateStr = formatDateLocal(date);
        let totalCapacity = 0;
        let totalOccupied = 0;

        data.rooms.forEach(room => {
            const override = data.dailyInventory.find(di => {
                const diDate = new Date(di.date).toISOString().split('T')[0];
                return di.roomCategory === room._id && diDate === dateStr;
            });

            const capacity = override?.roomsToSell !== null && override?.roomsToSell !== undefined ? override.roomsToSell : (room.details?.noOfRooms || 10);
            const blocked = override?.blockedCount || 0;
            
            let booked = 0;
            data.bookings.forEach(b => {
                if (b.roomCategory === room._id || b.roomCategory?._id === room._id) {
                    const checkIn = new Date(b.checkInDate).toISOString().split('T')[0];
                    const checkOut = new Date(b.checkOutDate).toISOString().split('T')[0];
                    if (dateStr >= checkIn && dateStr < checkOut && b.status !== 'Cancelled') {
                        booked++;
                    }
                }
            });

            totalCapacity += capacity;
            totalOccupied += Math.max(booked, override?.bookingsCount || 0) + blocked;
        });
        if (totalCapacity > 0 && totalOccupied >= totalCapacity) return 'Red';
        if (totalOccupied >= 5) return 'Yellow';
        return 'Green';
    };

  const openDayDetails = (date) => {
      const dateStr = formatDateLocal(date);
      const rows = data.rooms.map(room => {
          const cell = getCellData(room._id, date);
          const available = Math.max(0, cell.roomsToSell - cell.netBooked - cell.blockedCount);
          return {
              category: room.title,
              total: cell.roomsToSell,
              booked: cell.netBooked,
              blocked: cell.blockedCount,
              available: available,
              status: available > 0 ? 'Vacant' : 'Occupied'
          };
      });

      const total = rows.reduce((acc, curr) => ({
          total: acc.total + curr.total,
          booked: acc.booked + curr.booked,
          blocked: acc.blocked + curr.blocked,
          available: acc.available + curr.available
      }), { total: 0, booked: 0, blocked: 0, available: 0 });

      setSelectedDayData({ date: dateStr, rows, total });
  };

  const selectedRoom = data.rooms.find(r => r._id === selectedRoomId);

  return (
    <div className="relative h-full flex flex-col bg-white border border-slate-200">
        
        {/* Top Header Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4 bg-slate-50">
            <div className="flex items-center gap-4">
                <select 
                    value={roomFilter}
                    onChange={(e) => setRoomFilter(e.target.value)}
                    className="border border-slate-300 rounded px-3 py-2 text-sm text-[#0A192F] font-bold bg-white"
                >
                    <option>All rooms</option>
                    {data.rooms.map(room => (
                        <option key={room._id} value={room._id}>{room.title}</option>
                    ))}
                </select>
                <div className="flex items-center border border-slate-300 rounded bg-white overflow-hidden">
                    <button onClick={handlePrevRange} className="p-2 hover:bg-slate-50 border-r border-slate-200"><ChevronRight size={16} className="rotate-180" /></button>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 text-sm outline-none border-r border-slate-200" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 text-sm outline-none border-r border-slate-200" />
                    <button onClick={handleNextRange} className="p-2 hover:bg-slate-50"><ChevronRight size={16} /></button>
                </div>
            </div>
                <button 
                    onClick={() => setIsSummaryOpen(true)}
                    className="border border-[#0071C2] text-[#0071C2] hover:bg-[#0071C2]/5 p-2 rounded flex items-center gap-2"
                    title="Calendar Summary"
                >
                    <CalendarDays size={20} />
                    <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Live Status</span>
                </button>
                <button className="border border-[#0071C2] text-[#0071C2] hover:bg-[#0071C2]/5 px-4 py-2 rounded text-sm font-bold">
                    Availability settings
                </button>
            </div>
        
        {/* Main Calendar View */}
        <div className="flex-grow overflow-x-auto overflow-y-auto">
            {/* Header Row (Dates) */}
            <div className="flex min-w-max border-b border-slate-200 sticky top-0 bg-white z-10">
                <div className="w-64 min-w-[256px] border-r border-slate-200 p-4 bg-white flex flex-col justify-end">
                    <span className="text-sm font-bold text-slate-700">{new Date(startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
                {datesList.map(date => {
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    return (
                        <div key={date.toISOString()} className={`flex flex-col items-center justify-center w-16 min-w-[64px] border-r border-slate-200 py-2 ${isWeekend ? 'bg-slate-50' : 'bg-white'}`}>
                            <span className="text-xs text-slate-500 font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <span className="text-sm font-bold text-[#0A192F]">{date.getDate()}</span>
                        </div>
                    );
                })}
            </div>

            {/* Room Categories */}
            {data.rooms
                .filter(room => roomFilter === 'All rooms' || room._id === roomFilter)
                .map(room => (
                <div key={room._id} className="min-w-max border-b-[8px] border-slate-100">
                    
                    {/* Room Header & Bulk Edit */}
                    <div className="flex w-full sticky left-0 bg-white z-10 p-3 items-center justify-between border-b border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        <div>
                            <h3 className="font-bold text-[#0A192F]">{room.title} <span className="font-normal text-xs text-slate-500 ml-2">(Room ID: {room._id.slice(-6)})</span></h3>
                            <div className="text-[10px] text-orange-600 flex items-center gap-1 mt-1 font-bold">
                                <Info size={12} /> Add availability Data updates twice per day.
                            </div>
                        </div>
                        <button 
                            onClick={() => openBulkEdit(room._id)}
                            className="bg-[#0071C2] hover:bg-[#005a9e] text-white px-4 py-2 rounded text-sm font-bold transition-colors"
                        >
                            Bulk edit
                        </button>
                    </div>

                    {/* Matrix Rows */}
                    <div className="flex min-w-max text-sm">
                        
                        {/* Sidebar Labels */}
                        <div className="w-64 min-w-[256px] border-r border-slate-200 bg-white flex flex-col z-10 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <div className="h-8 border-b border-slate-200 px-3 flex items-center text-xs text-slate-600 font-medium">Room status</div>
                            <div className="h-8 border-b border-slate-200 px-3 flex items-center text-xs text-slate-600 font-medium">Rooms to sell</div>
                            <div className="h-8 border-b border-slate-200 px-3 flex items-center text-xs text-slate-600 font-medium">Net booked</div>
                            <div className="h-8 border-b border-slate-200 px-3 flex items-center text-xs text-slate-600 font-medium text-orange-600">Blocked</div>
                            <div className="h-12 border-b border-slate-200 px-3 flex flex-col justify-center text-xs text-[#0071C2]">
                                <div className="flex items-center justify-between group cursor-pointer" onClick={() => openBulkEdit(room._id)}>
                                    <span>Fully flexible</span>
                                    <span className="text-[10px] bg-[#0071C2]/10 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                                </div>
                                <div className="text-[10px] text-slate-500">x 2 Edit</div>
                            </div>
                        </div>

                        {/* Data Cells */}
                        {datesList.map(date => {
                            const cell = getCellData(room._id, date);
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                            const isBookable = cell.status === 'Bookable';

                            return (
                                <div key={date.toISOString()} className={`flex flex-col w-16 min-w-[64px] border-r border-slate-200 ${isWeekend ? 'bg-slate-50/50' : 'bg-white'}`}>
                                    {/* Room Status - Click to Toggle */}
                                    <div 
                                        onClick={() => handleInlineSave(room._id, date, 'status', isBookable ? 'Closed' : 'Bookable')}
                                        className={`h-8 border-b border-slate-200 flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors hover:opacity-80 ${isBookable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                    >
                                        {isBookable ? 'Bookable' : 'Closed'}
                                    </div>
                                    
                                    {/* Rooms to sell */}
                                    <div 
                                        className="h-8 border-b border-slate-200 flex items-center justify-center text-xs text-slate-700 font-bold hover:bg-slate-100 cursor-text transition-colors"
                                        onClick={() => setEditingCell({ roomId: room._id, date: date.toISOString(), field: 'roomsToSell', value: cell.roomsToSell })}
                                    >
                                        {editingCell?.roomId === room._id && editingCell?.date === date.toISOString() && editingCell?.field === 'roomsToSell' ? (
                                            <input 
                                                autoFocus
                                                type="number"
                                                className="w-full h-full text-center outline-none bg-blue-50"
                                                value={editingCell.value}
                                                onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                                onBlur={() => handleInlineSave(room._id, date, 'roomsToSell', editingCell.value === '' ? null : editingCell.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleInlineSave(room._id, date, 'roomsToSell', editingCell.value === '' ? null : editingCell.value)}
                                            />
                                        ) : cell.roomsToSell}
                                    </div>
                                    
                                    {/* Net Booked */}
                                    <div className="h-8 border-b border-slate-200 flex items-center justify-center text-xs">
                                        {cell.netBooked > 0 ? (
                                            <span className="bg-slate-600 text-white text-[10px] px-3 py-[2px] rounded-full font-bold">{cell.netBooked}</span>
                                        ) : null}
                                    </div>

                                    {/* Blocked */}
                                    <div 
                                        className="h-8 border-b border-slate-200 flex items-center justify-center text-xs text-orange-600 font-bold hover:bg-slate-100 cursor-text transition-colors"
                                        onClick={() => setEditingCell({ roomId: room._id, date: date.toISOString(), field: 'blockedCount', value: cell.blockedCount })}
                                    >
                                        {editingCell?.roomId === room._id && editingCell?.date === date.toISOString() && editingCell?.field === 'blockedCount' ? (
                                            <input 
                                                autoFocus
                                                type="number"
                                                className="w-full h-full text-center outline-none bg-orange-50"
                                                value={editingCell.value}
                                                onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                                onBlur={() => handleInlineSave(room._id, date, 'blockedCount', editingCell.value === '' ? null : editingCell.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleInlineSave(room._id, date, 'blockedCount', editingCell.value === '' ? null : editingCell.value)}
                                            />
                                        ) : cell.blockedCount > 0 ? (
                                            <span className="flex items-center gap-1"><Ban size={10} />{cell.blockedCount}</span>
                                        ) : 0}
                                    </div>
                                    
                                    {/* Price */}
                                    <div 
                                        className="h-12 border-b border-slate-200 flex items-center justify-center text-xs text-slate-700 hover:bg-slate-100 cursor-text transition-colors"
                                        onClick={() => setEditingCell({ roomId: room._id, date: date.toISOString(), field: 'price', value: cell.price })}
                                    >
                                        {editingCell?.roomId === room._id && editingCell?.date === date.toISOString() && editingCell?.field === 'price' ? (
                                            <div className="flex items-center px-1">
                                                <span className="text-[10px] mr-1">₹</span>
                                                <input 
                                                    autoFocus
                                                    type="number"
                                                    className="w-10 h-8 text-center outline-none bg-blue-50"
                                                    value={editingCell.value}
                                                    onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                                    onBlur={() => handleInlineSave(room._id, date, 'price', editingCell.value === '' ? null : editingCell.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleInlineSave(room._id, date, 'price', editingCell.value === '' ? null : editingCell.value)}
                                                />
                                            </div>
                                        ) : (
                                            <span>₹{cell.price}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>

        {/* Bulk Edit Sidebar Overlay */}
        {isSidebarOpen && (
            <div className="absolute inset-0 bg-black/20 z-40 flex justify-end">
                <div className="w-[450px] bg-white h-full shadow-[-4px_0_15px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                    
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <h2 className="text-2xl font-bold text-[#0A192F]">Bulk edit</h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500 hover:bg-slate-100 p-2 rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleBulkSubmit} className="flex-grow overflow-y-auto p-6 space-y-8">
                        {/* Dates */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-700 mb-1">From:</label>
                                <input type="date" value={bulkForm.fromDate} onChange={e => setBulkForm({...bulkForm, fromDate: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm focus:border-[#0071C2] focus:ring-1 focus:ring-[#0071C2] outline-none" required/>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Up to and including:</label>
                                <input type="date" value={bulkForm.toDate} onChange={e => setBulkForm({...bulkForm, toDate: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm focus:border-[#0071C2] focus:ring-1 focus:ring-[#0071C2] outline-none" required/>
                            </div>
                        </div>

                        {/* Days of Week */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">Which days of the week do you want to apply changes to?</label>
                            <div className="flex flex-wrap gap-4">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                    <label key={day} className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={bulkForm.daysOfWeek.includes(day)}
                                            onChange={() => toggleDay(day)}
                                            className="w-4 h-4 text-[#0071C2] rounded border-slate-300 focus:ring-[#0071C2]"
                                        />
                                        <span className="text-sm text-slate-700">{day}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Tabs (Visual only to match design) */}
                        <div className="border-b border-slate-200 flex gap-6">
                            <div className="border-b-2 border-[#0071C2] text-[#0071C2] pb-2 font-bold text-sm">
                                {selectedRoom?.title || 'Selected Room'}
                            </div>
                            <div className="text-[#0071C2] pb-2 font-medium text-sm hover:underline cursor-pointer">
                                Multiple room types
                            </div>
                        </div>

                        {/* Accordions */}
                        <div className="space-y-4">
                            {/* Rooms to sell */}
                            <div className="border border-slate-200 rounded p-4">
                                <h3 className="font-bold text-sm text-[#0A192F] mb-1">Rooms to sell</h3>
                                <p className="text-xs text-slate-500 mb-4">Update the number of rooms to sell for this room type</p>
                                <input 
                                    type="number" 
                                    value={bulkForm.roomsToSell} 
                                    onChange={e => setBulkForm({...bulkForm, roomsToSell: e.target.value})}
                                    placeholder="Enter number of rooms" 
                                    className="w-full border border-slate-300 rounded p-2 text-sm focus:border-[#0071C2] outline-none"
                                />
                            </div>

                            {/* Prices */}
                            <div className="border border-slate-200 rounded p-4">
                                <h3 className="font-bold text-sm text-[#0A192F] mb-1">Prices</h3>
                                <p className="text-xs text-slate-500 mb-4">Edit the prices of any rate plans for this room</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 font-bold border border-slate-300 rounded bg-slate-50 p-2">₹</span>
                                    <input 
                                        type="number" 
                                        value={bulkForm.price} 
                                        onChange={e => setBulkForm({...bulkForm, price: e.target.value})}
                                        placeholder="Enter new price" 
                                        className="flex-grow border border-slate-300 rounded p-2 text-sm focus:border-[#0071C2] outline-none"
                                    />
                                </div>
                            </div>

                            {/* Room status */}
                            <div className="border border-slate-200 rounded p-4">
                                <h3 className="font-bold text-sm text-[#0A192F] mb-1">Room status</h3>
                                <p className="text-xs text-slate-500 mb-4">Open or close this room</p>
                                <select 
                                    value={bulkForm.status} 
                                    onChange={e => setBulkForm({...bulkForm, status: e.target.value})}
                                    className="w-full border border-slate-300 rounded p-2 text-sm focus:border-[#0071C2] outline-none"
                                >
                                    <option value="">Don't change status</option>
                                    <option value="Bookable">Open (Bookable)</option>
                                    <option value="Closed">Close room</option>
                                </select>
                            </div>

                            {/* Block Rooms */}
                            <div className="border border-slate-200 rounded p-4">
                                <h3 className="font-bold text-sm text-[#0A192F] mb-1">Block Rooms</h3>
                                <p className="text-xs text-slate-500 mb-4">Mark rooms for maintenance or VIP hold</p>
                                <input 
                                    type="number" 
                                    value={bulkForm.blockedCount} 
                                    onChange={e => setBulkForm({...bulkForm, blockedCount: e.target.value})}
                                    placeholder="Number of rooms to block" 
                                    className="w-full border border-slate-300 rounded p-2 text-sm focus:border-[#0071C2] outline-none"
                                />
                            </div>
                        </div>

                    </form>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                        <button 
                            type="button"
                            onClick={() => {
                                if (window.confirm('Are you sure you want to clear all overrides for this date range?')) {
                                    axios.post(`${API_BASE}/api/inventory/bulk-edit`, {
                                        ...bulkForm,
                                        roomCategory: selectedRoomId,
                                        price: null,
                                        roomsToSell: null,
                                        status: 'Bookable'
                                    }).then(() => {
                                        setIsSidebarOpen(false);
                                        fetchCalendarData();
                                    });
                                }
                            }} 
                            className="text-red-600 hover:bg-red-50 px-4 py-2 rounded font-bold text-sm transition-colors"
                        >
                            Clear Overrides
                        </button>
                        <div className="flex gap-4">
                            <button onClick={() => setIsSidebarOpen(false)} className="px-6 py-2 rounded text-[#0071C2] hover:bg-[#0071C2]/10 font-bold text-sm transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleBulkSubmit} className="bg-[#0071C2] hover:bg-[#005a9e] text-white px-8 py-2 rounded font-bold text-sm transition-colors">
                                Save changes
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        )}

        {/* Summary Calendar Modal */}
        {isSummaryOpen && (
            <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-5xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                    <div className="p-4 bg-[#0A192F] text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold font-serif">ROOM INVENTORY — LIVE STATUS</h2>
                            <div className="h-6 w-[1px] bg-white/20"></div>
                            <span className="text-sm font-medium">Bhopal Inn</span>
                        </div>
                        <button onClick={() => { setIsSummaryOpen(false); setSelectedDayData(null); }} className="hover:bg-white/10 p-1 rounded transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
                        {/* Monthly Summary Calendar */}
                        <div className="flex-1">
                            <div className="bg-[#0A192F] text-white p-3 rounded-t-lg text-center font-bold text-lg mb-0.5">
                                {summaryDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </div>
                            <div className="grid grid-cols-7 text-center bg-teal-600 text-white text-xs font-bold py-2">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d}>{d}</div>)}
                            </div>
                            <div className="grid grid-cols-7 border-l border-t border-slate-100 bg-slate-50">
                                {Array.from({ length: 42 }).map((_, i) => {
                                    const firstDay = new Date(summaryDate.getFullYear(), summaryDate.getMonth(), 1);
                                    // Adjust for Monday start (JS 0=Sun, 1=Mon)
                                    const offset = (firstDay.getDay() + 6) % 7;
                                    const date = new Date(summaryDate.getFullYear(), summaryDate.getMonth(), i - offset + 1);
                                    const isCurrentMonth = date.getMonth() === summaryDate.getMonth();
                                    const status = isCurrentMonth ? getSummaryDayStatus(date) : null;

                                    return (
                                        <div 
                                            key={i} 
                                            onClick={() => isCurrentMonth && openDayDetails(date)}
                                            className={`
                                                h-16 border-r border-b border-slate-100 flex items-center justify-center cursor-pointer transition-all relative group
                                                ${!isCurrentMonth ? 'bg-slate-50/30' : ''}
                                                ${status === 'Green' ? 'bg-green-50 text-green-700 hover:bg-green-100' : ''}
                                                ${status === 'Red' ? 'bg-red-500 text-white font-bold hover:bg-red-600' : ''}
                                                ${status === 'Yellow' ? 'bg-orange-400 text-white font-bold hover:bg-orange-500' : ''}
                                            `}
                                        >
                                            <span className="text-sm z-10">{isCurrentMonth ? date.getDate() : ''}</span>
                                            {isCurrentMonth && (
                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/5 transition-opacity"></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-4 flex gap-4 text-xs font-bold text-slate-600">
                                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> &lt; 5 Bookings</div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Full</div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-400 rounded-sm"></div> 5+ Bookings</div>
                            </div>
                        </div>

                        {/* Selected Day Live Status Table */}
                        <div className="w-full md:w-[400px]">
                            {selectedDayData ? (
                                <div className="border border-slate-200 rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                                    <div className="bg-[#0A192F] text-white p-3 text-sm font-bold flex justify-between">
                                        <span>LIVE STATUS | {new Date(selectedDayData.date).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-[#EBF5FB] text-[#0A192F] font-bold">
                                                <tr>
                                                    <th className="p-3 border-b border-slate-200">Room Category</th>
                                                    <th className="p-3 border-b border-slate-200 text-center">Total</th>
                                                    <th className="p-3 border-b border-slate-200 text-center">Booked</th>
                                                    <th className="p-3 border-b border-slate-200 text-center">Available</th>
                                                    <th className="p-3 border-b border-slate-200 text-center">Blocked</th>
                                                    <th className="p-3 border-b border-slate-200">OTA Sync</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-[#F4FAFE]">
                                                {selectedDayData.rows.map((row, idx) => (
                                                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-100 transition-colors">
                                                        <td className="p-3 font-medium">{row.category}</td>
                                                        <td className="p-3 text-center">{row.total}</td>
                                                        <td className="p-3 text-center">{row.booked}</td>
                                                        <td className="p-3 text-center">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.available > 0 ? 'bg-teal-600 text-white' : 'bg-red-500 text-white'}`}>
                                                                {row.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-center text-orange-600 font-bold">{row.blocked}</td>
                                                        <td className="p-3">
                                                            {row.category.includes('Family') ? (
                                                                <span className="bg-orange-400 text-white px-3 py-0.5 rounded-full text-[10px] font-bold">Partial</span>
                                                            ) : (
                                                                <span className="flex items-center gap-1">Synced <CheckCircle2 size={10} className="text-teal-600" /></span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-white font-bold border-t-2 border-[#0A192F]">
                                                    <td className="p-3 uppercase">TOTAL</td>
                                                    <td className="p-3 text-center">{selectedDayData.total.total}</td>
                                                    <td className="p-3 text-center">{selectedDayData.total.booked}</td>
                                                    <td className="p-3 text-center text-teal-600">{selectedDayData.total.available} Free</td>
                                                    <td className="p-3 text-center text-orange-600">{selectedDayData.total.blocked}</td>
                                                    <td className="p-3"></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 p-8 text-center">
                                    <AlertCircle size={48} className="mb-4 opacity-20" />
                                    <p className="font-medium">Select a day on the calendar to view live inventory status</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                        <button 
                            onClick={() => { setIsSummaryOpen(false); setSelectedDayData(null); }}
                            className="bg-[#0A192F] text-white px-6 py-2 rounded font-bold text-sm hover:bg-[#162a4a] transition-colors"
                        >
                            Close View
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default InventoryManagement;
