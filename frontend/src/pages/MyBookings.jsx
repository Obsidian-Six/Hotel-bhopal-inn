import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import { useAuth } from '@/lib/AuthContext';
import axios from 'axios';
import config from '../config';
import { Calendar, CreditCard, Hotel } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = config.API_URL;

const MyBookings = () => {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchBookings = async () => {
      if (!user) {
          setLoading(false);
          return;
      }
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE}/api/bookings/my-bookings?t=${new Date().getTime()}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setBookings(res.data);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        if (err.response?.status === 401) {
            // Token is invalid or user no longer exists
            logout();
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user]);

  if (!user) {
      return (
          <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
              <header className="fixed top-0 z-[200] w-full"><TopBar /><Navbar /></header>
              <main className="flex-grow pt-40 pb-24 flex items-center justify-center">
                  <div className="text-center">
                      <h2 className="text-3xl font-serif text-[#000000] mb-4">Please log in</h2>
                      <p className="text-slate-600 mb-6">You need to be logged in to view your bookings.</p>
                      <Link to="/" className="bg-[#8B735B] text-white px-8 py-3 rounded text-sm font-bold uppercase tracking-widest hover:bg-[#725e4a]">Go Home</Link>
                  </div>
              </main>
              <Footer />
          </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <header className="fixed top-0 z-[200] w-full">
        <TopBar />
        <Navbar />
      </header>

      <main className="flex-grow pt-40 pb-24">
        <div className="container mx-auto px-4 max-w-5xl">
            <div className="mb-12">
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-serif text-[#000000] tracking-wide mb-2"
                >
                    My Bookings
                </motion.h1>
                <p className="text-slate-600">Manage your past and upcoming stays with us.</p>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading your reservations...</div>
            ) : bookings.length === 0 ? (
                <div className="bg-white p-12 text-center border border-slate-200 shadow-sm">
                    <Hotel size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-serif text-[#000000] mb-2">No bookings found</h3>
                    <p className="text-slate-500 mb-6">Looks like you haven't made any reservations yet.</p>
                    <Link to="/booking" className="bg-[#000000] text-white px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#8B735B] transition-all">Book a Room</Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {bookings.map((booking) => (
                        <motion.div 
                            key={booking._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row"
                        >
                            <div className="w-full md:w-1/3 bg-slate-50 p-6 border-r border-slate-100 flex flex-col justify-center">
                                <h4 className="text-[#8B735B] font-bold text-lg mb-1">{booking.roomCategory?.title || booking.roomCategory?.category || 'Room'}</h4>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Booking ID: {booking._id.substring(0, 8)}</p>
                                
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 bg-[#BFA37E]/5 p-3 rounded-sm border border-[#BFA37E]/20">
                                        <Calendar size={20} className="text-[#BFA37E] mt-1" />
                                        <div>
                                            <p className="text-[10px] font-black text-[#BFA37E] uppercase tracking-tighter">CHECK-IN</p>
                                            <p className="text-lg font-serif font-bold text-[#000000]">{new Date(booking.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            <p className="text-[11px] font-black text-[#000000] bg-[#BFA37E]/20 px-2 py-0.5 rounded-full inline-block mt-1">FROM 12:00 PM</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 bg-slate-100 p-3 rounded-sm border border-slate-200">
                                        <Calendar size={20} className="text-slate-400 mt-1" />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">CHECK-OUT</p>
                                            <p className="text-lg font-serif font-bold text-[#000000]">{new Date(booking.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            <p className="text-[11px] font-black text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full inline-block mt-1">UNTIL 11:00 AM</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="w-full md:w-2/3 p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className={`inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm mb-2 ${
                                                booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'Checked-In' ? 'bg-blue-100 text-blue-800' :
                                                booking.status === 'Checked-Out' ? 'bg-gray-100 text-gray-800' :
                                                booking.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {booking.status}
                                            </span>
                                            <h5 className="font-bold text-[#000000] mb-1">{booking.guestDetails?.firstName} {booking.guestDetails?.lastName}</h5>
                                            {booking.roomUnit && (
                                                <div className="flex items-center gap-1.5 text-[#8B735B] font-bold text-xs uppercase tracking-wider">
                                                    <Hotel size={12} />
                                                    Room {booking.roomUnit.roomNumber}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-700">Total Amount</p>
                                            <p className="text-xl font-serif text-[#000000]">₹{booking.financials?.totalAmount?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Bill Breakdown */}
                                    <div className="bg-slate-50 p-4 rounded-sm border border-slate-100 mb-4">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-200 pb-1">Bill Details</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Room Tariff</span>
                                                <span className="font-medium text-slate-700">₹{booking.financials?.roomTariff?.toLocaleString()}</span>
                                            </div>
                                            {booking.financials?.extraCharges?.map((charge, i) => (
                                                <div key={i} className="flex justify-between text-xs">
                                                    <span className="text-slate-500">{charge.description}</span>
                                                    <span className="font-medium text-slate-700">+₹{charge.amount?.toLocaleString()}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between text-xs pt-2 border-t border-slate-200">
                                                <span className="font-bold text-slate-700 uppercase tracking-tighter">Grand Total</span>
                                                <span className="font-bold text-[#000000]">₹{booking.financials?.totalAmount?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-sm">
                                        <CreditCard size={16} className={booking.financials?.balance <= 0 ? 'text-green-600' : 'text-orange-500'} />
                                        <span className="font-bold text-slate-700">Payment Status: </span>
                                        <span className={booking.financials?.balance <= 0 ? 'text-green-600 font-bold' : 'text-orange-500 font-bold'}>
                                            {booking.financials?.balance <= 0 ? 'Paid' : (booking.financials?.amountPaid > 0 ? `Partially Paid (Bal: ₹${booking.financials.balance?.toLocaleString()})` : 'Pending / Pay at Hotel')}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-6">
                                    <button 
                                        onClick={() => window.print()}
                                        className="text-[#8B735B] text-[10px] font-bold uppercase tracking-widest hover:underline flex items-center gap-2"
                                    >
                                        Download Invoice / Print
                                    </button>

                                    {(booking.status === 'Confirmed' || booking.status === 'Checked-In') && (
                                        <ExtensionPanel booking={booking} onUpdate={() => window.location.reload()} />
                                    )}
                                </div>

                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

const ExtensionPanel = ({ booking, onUpdate }) => {
    const [show, setShow] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [loading, setLoading] = useState(false);

    const roomTariff = booking.financials?.roomTariff / ((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24)) || 2000;

    const calculateExtra = () => {
        if (!newDate) return 0;
        const currentOut = new Date(booking.checkOutDate);
        const extendedOut = new Date(newDate);
        const diffDays = Math.ceil((extendedOut - currentOut) / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays * roomTariff : 0;
    };

    const handleExtend = async () => {
        const extra = calculateExtra();
        if (extra <= 0) return alert('Please select a date after your current check-out date');

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE}/api/bookings/${booking._id}/extend`, {
                newCheckOutDate: newDate,
                additionalAmount: extra
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Booking extended successfully!');
            onUpdate();
        } catch (err) {
            alert('Failed to extend booking');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return (
        <button 
            onClick={() => setShow(true)}
            className="bg-[#000000] text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-[#8B735B] transition-all rounded-sm"
        >
            Extend Stay
        </button>
    );

    return (
        <div className="flex flex-col sm:flex-row items-end gap-4 p-4 bg-slate-50 border border-slate-200 rounded-sm w-full mt-4">
            <div className="flex-grow">
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">New Check-Out Date</label>
                <input 
                    type="date" 
                    min={new Date(new Date(booking.checkOutDate).getTime() + 86400000).toISOString().split('T')[0]}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2 text-xs font-bold focus:outline-none focus:border-[#8B735B]"
                />
            </div>
            <div className="text-right whitespace-nowrap min-w-[120px]">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Extra to Pay</p>
                <p className="text-lg font-serif text-[#000000]">₹{calculateExtra().toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={handleExtend}
                    disabled={loading || !newDate}
                    className="bg-green-600 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-green-700 transition-all rounded-sm disabled:opacity-50"
                >
                    {loading ? 'Processing...' : 'Pay & Extend'}
                </button>
                <button 
                    onClick={() => setShow(false)}
                    className="bg-slate-200 text-slate-600 px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-300 transition-all rounded-sm"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default MyBookings;

