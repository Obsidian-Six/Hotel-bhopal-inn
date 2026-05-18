import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { 
  RefreshCw, Calendar, CheckCircle2, XCircle, 
  ExternalLink, Globe, HelpCircle, Activity, 
  ChevronRight, Users, Sparkles
} from 'lucide-react';

const API_BASE = config.API_URL;

const OTAChannelManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, roomsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/bookings`),
        axios.get(`${API_BASE}/api/rooms`)
      ]);
      
      // Filter bookings belonging to OTAs
      const otaBookings = bookingsRes.data.filter(
        b => b.source === 'Booking.com' || b.source === 'MakeMyTrip'
      );
      setBookings(otaBookings);
      setRooms(roomsRes.data);
    } catch (err) {
      console.error('Error fetching OTA data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await axios.post(`${API_BASE}/api/ota/sync-ical`);
      setSyncResult(res.data.stats);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Get Room Category title by ID
  const getRoomTitle = (id) => {
    const r = rooms.find(room => room._id === id);
    return r ? r.title : 'Unknown Room';
  };

  return (
    <div className="space-y-8 font-sans pb-20">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-[#F1E9DA] pb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#000000] flex items-center gap-3">
            <Globe className="text-[#BFA37E]" size={28} />
            OTA Channel Manager
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">
            Control automated 1-Way iCal inventory sync for Booking.com & MakeMyTrip
          </p>
        </div>
        
        <button 
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 bg-[#000000] text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[#BFA37E] disabled:opacity-50 transition-all shadow-xl"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Synchronizing...' : 'Sync Calendars Now'}
        </button>
      </div>

      {/* Sync Results Banner */}
      {syncResult && (
        <div className="bg-[#FDFBF7] border-l-4 border-[#BFA37E] p-6 shadow-sm flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4">
            <Sparkles className="text-[#BFA37E] animate-bounce" size={24} />
            <div>
              <h4 className="text-xs font-black uppercase text-[#1A2B48]">Synchronization Complete</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                Processed: <span className="text-[#000000]">{syncResult.processed}</span> | 
                Created blocks: <span className="text-emerald-600">{syncResult.created}</span> | 
                Cancelled: <span className="text-rose-600">{syncResult.cancelled}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSyncResult(null)} 
            className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#000000]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Channel Connections Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Booking.com Connection status */}
        <div className="bg-white border border-[#F1E9DA] p-6 rounded-sm shadow-sm flex flex-col justify-between group hover:border-[#BFA37E] transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-800 px-3 py-1 rounded-sm">
                Active iCal Connection
              </span>
              <h3 className="text-lg font-black text-[#1A2B48] mt-3">Booking.com Integration</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">
                Imports calendar events from Booking.com Extranet to automatically block inventory here.
              </p>
            </div>
            <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Globe size={18} className="text-blue-700" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Synchronized Hourly
            </span>
            <span className="text-[9px] font-black uppercase text-blue-700 font-mono">
              {bookings.filter(b => b.source === 'Booking.com').length} Dates Blocked
            </span>
          </div>
        </div>

        {/* MakeMyTrip Connection status */}
        <div className="bg-white border border-[#F1E9DA] p-6 rounded-sm shadow-sm flex flex-col justify-between group hover:border-[#BFA37E] transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider bg-orange-50 text-orange-800 px-3 py-1 rounded-sm">
                Active iCal Connection
              </span>
              <h3 className="text-lg font-black text-[#1A2B48] mt-3">MakeMyTrip Integration</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">
                Imports calendar events from MakeMyTrip to automatically block inventory here.
              </p>
            </div>
            <div className="h-10 w-10 bg-orange-50 rounded-full flex items-center justify-center">
              <Globe size={18} className="text-orange-700" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Synchronized Hourly
            </span>
            <span className="text-[9px] font-black uppercase text-orange-700 font-mono">
              {bookings.filter(b => b.source === 'MakeMyTrip').length} Dates Blocked
            </span>
          </div>
        </div>
      </div>

      {/* Reservation Tracking List */}
      <div className="bg-white rounded-sm shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-[#1A2B48] p-5 flex justify-between items-center">
          <div>
            <h2 className="text-white text-xs font-bold uppercase tracking-widest">Imported OTA Blocked Inventory</h2>
            <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider mt-1">Calendar reservations blocking local room inventory</p>
          </div>
          <span className="text-white/40 text-[9px] font-black uppercase font-mono bg-white/5 px-3 py-1 rounded-sm">
            {bookings.length} reservations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[#1A2B48] text-[9px] font-black uppercase tracking-widest border-b border-slate-200">
                <th className="px-6 py-4">OTA Channel</th>
                <th className="px-6 py-4">Assigned Room Type</th>
                <th className="px-6 py-4">Reserved Window</th>
                <th className="px-6 py-4">Unique iCal UID</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-slate-400 uppercase font-black tracking-widest">
                    Fetching Synced Calendars...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-slate-400 font-bold uppercase tracking-widest border-b">
                    No OTA reservations synced yet. configure iCal links in Room Management to begin.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking._id} className="border-b hover:bg-[#FDFBF7]/50 transition-colors group">
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider ${
                        booking.source === 'Booking.com' ? 'bg-blue-50 text-blue-800' : 'bg-orange-50 text-orange-800'
                      }`}>
                        {booking.source}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">{getRoomTitle(booking.roomCategory)}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Category ID: {booking.roomCategory}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-semibold">
                      <div className="flex items-center gap-2 text-[#1A2B48]">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{formatDate(booking.checkInDate)}</span>
                        <span className="text-slate-400">→</span>
                        <span>{formatDate(booking.checkOutDate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-mono text-[9px] text-slate-400 bg-slate-50 px-2 py-1 select-all font-bold">
                        {booking.otaReferenceId || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase shadow-sm flex items-center justify-center gap-1.5 w-28 mx-auto ${
                        booking.status === 'Confirmed' ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'
                      }`}>
                        {booking.status === 'Confirmed' ? (
                          <>
                            <CheckCircle2 size={10} /> Active Block
                          </>
                        ) : (
                          <>
                            <XCircle size={10} /> Cancelled
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guide/Instructions Footer */}
      <div className="bg-slate-50 border border-slate-200 p-8 rounded-sm">
        <h4 className="text-xs font-black uppercase text-[#1A2B48] flex items-center gap-2 mb-4">
          <HelpCircle size={16} className="text-[#BFA37E]" />
          iCal OTA Sync Guide & FAQ
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] font-bold uppercase leading-relaxed text-slate-500">
          <div>
            <h5 className="text-[#BFA37E] font-black mb-1">1. How do I import OTA bookings?</h5>
            <p className="mb-4 text-slate-400 font-medium">
              Go to **Room Management** in this CMS. Edit a room type, paste the export calendar link provided by Booking.com Extranet / MakeMyTrip, and click Save. The system will automatically import all bookings in the background.
            </p>
            
            <h5 className="text-[#BFA37E] font-black mb-1">2. How often does sync happen?</h5>
            <p className="text-slate-400 font-medium">
              Synchronization is fully automated and runs **hourly** in the background. You can also trigger an instant sync by clicking the **"Sync Calendars Now"** button on this page.
            </p>
          </div>
          <div>
            <h5 className="text-[#BFA37E] font-black mb-1">3. What does 1-Way Sync mean?</h5>
            <p className="mb-4 text-slate-400 font-medium">
              It means bookings made on Booking.com and MakeMyTrip will block rooms on your website. However, website bookings will **not** block rooms on Booking.com or MakeMyTrip (meaning they remain completely open for OTA bookings).
            </p>
            
            <h5 className="text-[#BFA37E] font-black mb-1">4. Can I see customer details?</h5>
            <p className="text-slate-400 font-medium">
              Standard iCal feeds only include blocked dates and the OTA ID. Direct contact details (like phone/email) will not be synced. Your front desk staff can update guest contact cards manually during check-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTAChannelManagement;
