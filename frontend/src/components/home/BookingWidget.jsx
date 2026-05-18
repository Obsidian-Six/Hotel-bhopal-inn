import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Home, Search, Plus, Minus, ChevronDown, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { format } from 'date-fns';

const BookingWidget = () => {
  const navigate = useNavigate();
  const [showGuests, setShowGuests] = useState(false);
  const [guests, setGuests] = useState({
    adults: 2,
    children: 0,
    rooms: 1
  });
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(Date.now() + 86400000)
  });
  const [roomType, setRoomType] = useState('All Rooms');
  const guestRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (guestRef.current && !guestRef.current.contains(event.target)) {
        setShowGuests(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (!dateRange.from || !dateRange.to) return;
    
    navigate('/booking', { 
      state: { 
        checkIn: format(dateRange.from, 'yyyy-MM-dd'), 
        checkOut: format(dateRange.to, 'yyyy-MM-dd'),
        adults: guests.adults,
        children: guests.children,
        rooms: guests.rooms,
        roomType: roomType
      } 
    });
  };

  const updateCount = (type, delta) => {
    setGuests(prev => ({
      ...prev,
      [type]: Math.max(type === 'adults' || type === 'rooms' ? 1 : 0, prev[type] + delta)
    }));
  };

  return (
    <div className="relative z-30 container mx-auto px-4 -mt-16 lg:-mt-24">
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="bg-white p-6 lg:p-0 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-sm overflow-visible"
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center">
          
          {/* Stay Dates (Combined Check-in & Check-out) */}
          <div className="flex-[1.8] px-4 lg:px-8 py-6 border-b lg:border-b-0 lg:border-r border-slate-100 group">
            <label className="flex items-center gap-2 text-[10px] font-bold text-[#BFA37E] uppercase tracking-widest mb-3 group-hover:text-black transition-colors">
              <CalendarDays size={12} /> Stay Dates
            </label>
            <DateRangePicker 
              date={dateRange} 
              setDate={setDateRange} 
              className="border-none p-0 h-auto"
            />
          </div>

          {/* Guests Popover (Image 2 style) */}
          <div className="flex-[1.5] px-4 lg:px-8 py-6 border-b lg:border-b-0 lg:border-r border-slate-100 group relative" ref={guestRef}>
            <label className="flex items-center gap-2 text-[10px] font-bold text-[#BFA37E] uppercase tracking-widest mb-3 group-hover:text-black transition-colors">
              <Users size={12} /> Guests
            </label>
            <div 
              onClick={() => setShowGuests(!showGuests)}
              className="w-full flex items-center justify-between text-black text-sm font-bold cursor-pointer"
            >
              <span className="whitespace-nowrap">{guests.adults} Adults · {guests.children} Children · {guests.rooms} {guests.rooms > 1 ? 'Rooms' : 'Room'}</span>
              <ChevronDown size={14} className={`transition-transform ${showGuests ? 'rotate-180' : ''} shrink-0 ml-2`} />
            </div>

            <AnimatePresence>
              {showGuests && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 lg:left-auto lg:right-0 top-full mt-2 w-full lg:w-80 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-6 z-50 border border-slate-100 rounded-lg"
                >
                  <div className="space-y-4">
                    {/* Adults Row */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-black uppercase tracking-wider">Adults</span>
                      <div className="flex items-center justify-between w-32 px-3 py-2 border border-slate-200 rounded-md">
                        <button 
                          onClick={() => updateCount('adults', -1)} 
                          className="text-blue-400 hover:text-blue-600 transition-colors"
                        >
                          <Minus size={16}/>
                        </button>
                        <span className="font-bold text-sm">{guests.adults}</span>
                        <button 
                          onClick={() => updateCount('adults', 1)} 
                          className="text-blue-400 hover:text-blue-600 transition-colors"
                        >
                          <Plus size={16}/>
                        </button>
                      </div>
                    </div>

                    {/* Children Row */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-black uppercase tracking-wider">Children</span>
                      <div className="flex items-center justify-between w-32 px-3 py-2 border border-slate-200 rounded-md">
                        <button 
                          onClick={() => updateCount('children', -1)} 
                          className="text-slate-300 hover:text-slate-500 transition-colors"
                        >
                          <Minus size={16}/>
                        </button>
                        <span className="font-bold text-sm">{guests.children}</span>
                        <button 
                          onClick={() => updateCount('children', 1)} 
                          className="text-blue-400 hover:text-blue-600 transition-colors"
                        >
                          <Plus size={16}/>
                        </button>
                      </div>
                    </div>

                    {/* Rooms Row */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-black uppercase tracking-wider">Rooms</span>
                      <div className="flex items-center justify-between w-32 px-3 py-2 border border-slate-200 rounded-md">
                        <button 
                          onClick={() => updateCount('rooms', -1)} 
                          className="text-slate-300 hover:text-slate-500 transition-colors"
                        >
                          <Minus size={16}/>
                        </button>
                        <span className="font-bold text-sm">{guests.rooms}</span>
                        <button 
                          onClick={() => updateCount('rooms', 1)} 
                          className="text-blue-400 hover:text-blue-600 transition-colors"
                        >
                          <Plus size={16}/>
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={() => setShowGuests(false)}
                      className="w-full py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-black/80 transition-all rounded-md mt-2"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Room Type */}
          <div className="flex-1 px-4 lg:px-8 py-6 border-b lg:border-b-0 lg:border-r border-slate-100 group">
            <label className="flex items-center gap-2 text-[10px] font-bold text-[#BFA37E] uppercase tracking-widest mb-3 group-hover:text-black transition-colors">
              <Home size={12} /> Room Type
            </label>
            <div className="relative">
              <select 
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full bg-transparent text-black text-sm font-bold focus:outline-none cursor-pointer appearance-none pr-8"
              >
                <option>All Rooms</option>
                <option>Standard Deluxe</option>
                <option>Balcony Deluxe</option>
                <option>Super Deluxe</option>
              </select>
              <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>
          </div>

          {/* Search Button (Image 3 style) */}
          <button 
            onClick={handleSearch}
            className="lg:w-72 bg-[#BFA37E] text-white py-6 lg:py-14 px-10 flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-[0.3em] hover:bg-black transition-all duration-500"
          >
            <Search size={18} />
            <div className="flex flex-col items-start leading-none">
                <span>Check</span>
                <span className="mt-1">Availability</span>
            </div>
          </button>

        </div>
      </motion.div>
      <div className="pt-6 pb-6 lg:pt-8 lg:pb-8 flex justify-center items-center">
        <p className="text-center text-[10px] md:text-xs font-bold text-black/60 uppercase tracking-[0.2em]">
          Best rate guaranteed when you book direct. No commission, no hidden charges.
        </p>
      </div>
    </div>
  );
};

export default BookingWidget;
