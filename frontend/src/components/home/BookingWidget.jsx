import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Home, Search } from 'lucide-react';

const BookingWidget = () => {
  return (
    <div className="relative z-30 container mx-auto px-4 -mt-16 lg:-mt-24">
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="bg-white p-6 lg:p-2 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-sm"
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center">
          
          {/* Check In */}
          <div className="flex-1 px-6 py-4 border-b lg:border-b-0 lg:border-r border-slate-100 group">
            <label className="flex items-center gap-2 text-[10px] font-bold text-[#BFA37E] uppercase tracking-widest mb-2 group-hover:text-[#0A192F] transition-colors">
              <Calendar size={12} /> Check In
            </label>
            <input 
              type="date" 
              className="w-full bg-transparent text-[#0A192F] text-sm font-bold focus:outline-none appearance-none cursor-pointer"
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Check Out */}
          <div className="flex-1 px-6 py-4 border-b lg:border-b-0 lg:border-r border-slate-100 group">
            <label className="flex items-center gap-2 text-[10px] font-bold text-[#BFA37E] uppercase tracking-widest mb-2 group-hover:text-[#0A192F] transition-colors">
              <Calendar size={12} /> Check Out
            </label>
            <input 
              type="date" 
              className="w-full bg-transparent text-[#0A192F] text-sm font-bold focus:outline-none appearance-none cursor-pointer"
              defaultValue={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
            />
          </div>

          {/* Guests */}
          <div className="flex-1 px-6 py-4 border-b lg:border-b-0 lg:border-r border-slate-100 group">
            <label className="flex items-center gap-2 text-[10px] font-bold text-[#BFA37E] uppercase tracking-widest mb-2 group-hover:text-[#0A192F] transition-colors">
              <Users size={12} /> Guests
            </label>
            <select className="w-full bg-transparent text-[#0A192F] text-sm font-bold focus:outline-none cursor-pointer appearance-none">
              <option>1 Guest</option>
              <option>2 Guests</option>
              <option>3 Guests</option>
              <option>4 Guests</option>
            </select>
          </div>

          {/* Room Type */}
          <div className="flex-1 px-6 py-4 border-b lg:border-b-0 lg:border-r border-slate-100 group">
            <label className="flex items-center gap-2 text-[10px] font-bold text-[#BFA37E] uppercase tracking-widest mb-2 group-hover:text-[#0A192F] transition-colors">
              <Home size={12} /> Room Type
            </label>
            <select className="w-full bg-transparent text-[#0A192F] text-sm font-bold focus:outline-none cursor-pointer appearance-none">
              <option>All Rooms</option>
              <option>Standard Deluxe</option>
              <option>Balcony Deluxe</option>
              <option>Super Deluxe</option>
            </select>
          </div>

          {/* Search Button */}
          <button className="lg:w-64 bg-[#BFA37E] text-white py-6 lg:py-10 px-8 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#0A192F] transition-all duration-500">
            <Search size={16} />
            Check Availability
          </button>

        </div>
      </motion.div>
      <p className="text-center mt-6 text-[10px] md:text-xs font-bold text-[#0A192F]/60 uppercase tracking-widest">
        Best rate guaranteed when you book direct. No commission, no hidden charges.
      </p>
    </div>
  );
};

export default BookingWidget;
