import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import { Lock, Mail, Phone, MapPin, Star, Plus } from 'lucide-react';
import axios from 'axios';
import config from '../config';
import { useAuth } from '@/lib/AuthContext';
import LoginModal from '@/components/layout/LoginModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { format } from 'date-fns';

const API_BASE = config.API_URL;

const Booking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '--Select--',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    specialRequests: '',
    roomCategory: '',
    checkInDate: '',
    checkOutDate: '',
    paymentMethod: 'Pay at Hotel',
    acceptTerms: false,
    adults: 1,
    children: 0,
    infants: 0,
    plan: 'EP' // EP, CP, MAP, AP
  });
  
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 1))
  });

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
    } else {
        // Force login modal
        setIsLoginModalOpen(true);
    }
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchRooms = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/rooms`);
        setRooms(res.data);
        if (res.data.length > 0) {
          const defaultRoomId = location.state?.roomId || res.data[0]._id;
          setFormData(prev => ({ ...prev, roomCategory: defaultRoomId }));
          setSelectedRoom(res.data.find(r => r._id === defaultRoomId) || res.data[0]);
        }
      } catch (err) {
        console.error('Error fetching rooms:', err);
      }
    };
    fetchRooms();
  }, []);

  // Update formData when dateRange changes
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
        setFormData(prev => ({
            ...prev,
            checkInDate: format(dateRange.from, 'yyyy-MM-dd'),
            checkOutDate: format(dateRange.to, 'yyyy-MM-dd')
        }));
    }
  }, [dateRange]);

  useEffect(() => {
    if (formData.roomCategory) {
        const room = rooms.find(r => r._id === formData.roomCategory);
        setSelectedRoom(room);
    }
    
    if (formData.roomCategory && formData.checkInDate && formData.checkOutDate) {
        const checkIn = new Date(formData.checkInDate);
        const checkOut = new Date(formData.checkOutDate);
        if (checkIn < checkOut) {
            axios.post(`${API_BASE}/api/inventory/calculate-price`, {
                roomCategory: formData.roomCategory,
                checkInDate: formData.checkInDate,
                checkOutDate: formData.checkOutDate
            }).then(res => setCalculatedPrice(res.data))
              .catch(err => console.error(err));
        } else {
            setCalculatedPrice(null);
        }
    } else {
        setCalculatedPrice(null);
    }
  }, [formData.roomCategory, formData.checkInDate, formData.checkOutDate, rooms]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const loadRazorpayScript = () => {
      return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
      });
  };

  const handleRazorpayPayment = async (bookingId, amount) => {
      const res = await loadRazorpayScript();
      if (!res) {
          setStatus('Razorpay SDK failed to load. Are you online?');
          setLoading(false);
          return;
      }

      try {
          // Create Order on Backend
          const orderRes = await axios.post(`${API_BASE}/api/bookings/create-order`, {
              amount: amount,
              receipt: bookingId
          });
          
          const options = {
              key: config.RAZORPAY_KEY, 
              amount: orderRes.data.amount,
              currency: orderRes.data.currency,
              name: "Hotel Bhopal Inn",
              description: "Room Booking Transaction",
              order_id: orderRes.data.id,
              handler: async function (response) {
                  try {
                      // Verify Payment
                      const verifyRes = await axios.post(`${API_BASE}/api/bookings/verify-payment`, {
                          razorpay_order_id: response.razorpay_order_id,
                          razorpay_payment_id: response.razorpay_payment_id,
                          razorpay_signature: response.razorpay_signature,
                          bookingId: bookingId
                      });
                      
                      if (verifyRes.data.success) {
                          setStatus('Booking Confirmed & Payment Successful!');
                          setTimeout(() => navigate('/my-bookings'), 2000);
                      }
                  } catch (err) {
                      console.error('Payment verification failed', err);
                      setStatus('Payment verification failed. Please contact support.');
                  }
              },
              prefill: {
                  name: `${formData.firstName} ${formData.lastName}`,
                  email: formData.email,
                  contact: formData.phone
              },
              theme: { color: "#0A192F" }
          };

          const paymentObject = new window.Razorpay(options);
          paymentObject.open();
          setLoading(false);

      } catch (err) {
          console.error(err);
          setStatus('Failed to initiate payment.');
          setLoading(false);
      }
  };

  const calculateExtraCharges = () => {
      let extra = 0;
      const nights = calculatedPrice?.nights || 1;
      
      // Adult charges based on plan
      const adultRate = formData.plan === 'EP' ? 400 : (formData.plan === 'CP' ? 800 : 1000);
      if (formData.adults > 1) {
          extra += (formData.adults - 1) * adultRate * nights;
      }
      
      // Child (5-11)
      if (formData.children > 0) {
          extra += formData.children * 300 * nights;
      }
      
      return extra;
  };

  // Base Room Price adjustment based on plan
  const getBaseRoomPrice = () => {
      let base = calculatedPrice?.totalPrice || selectedRoom?.details?.startingPrice || 0;
      
      // Plan adjustments (approximate based on user table)
      if (formData.plan === 'CP') {
          const nights = calculatedPrice?.nights || 1;
          base += 400 * nights; 
      } else if (formData.plan === 'MAP') {
          const nights = calculatedPrice?.nights || 1;
          base += 800 * nights;
      } else if (formData.plan === 'AP') {
          const nights = calculatedPrice?.nights || 1;
          base += 1200 * nights;
      }
      
      return base;
  };

  const finalRoomPrice = getBaseRoomPrice();
  const extraCharges = calculateExtraCharges();
  const finalPrice = finalRoomPrice + extraCharges;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
        setIsLoginModalOpen(true);
        setStatus('Please sign in to complete your booking.');
        return;
    }
    
    if (!formData.acceptTerms) {
        setStatus('Please accept the terms and policies.');
        return;
    }
    
    setLoading(true);
    setStatus('');
    
    try {
      const payload = {
        user: user ? user._id : null,
        guestDetails: {
          title: formData.title !== '--Select--' ? formData.title : '',
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          specialRequests: formData.specialRequests,
          occupancy: {
              adults: formData.adults,
              children: formData.children,
              infants: formData.infants
          },
          plan: formData.plan
        },
        roomCategory: formData.roomCategory,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        source: 'Website',
        financials: {
           totalAmount: finalPrice,
           amountPaid: 0,
           balance: finalPrice,
           paymentMode: formData.paymentMethod === 'Razorpay' ? 'Pending' : 'Pay at Hotel',
           extraCharges: [
               { description: `Extra Persons (${formData.adults-1} Adult, ${formData.children} Child)`, amount: extraCharges, source: 'Booking' }
           ]
        }
      };

      const res = await axios.post(`${API_BASE}/api/bookings`, payload);
      
      if (formData.paymentMethod === 'Razorpay') {
          handleRazorpayPayment(res.data._id, finalPrice);
      } else {
          // Send Notifications via Backend
          try {
              await axios.post(`${API_BASE}/api/bookings/${res.data._id}/notify`);
          } catch (nErr) {
              console.warn('Notification failed', nErr);
          }
          
          setStatus('Booking Request Sent Successfully! You can pay at the hotel.');
          setLoading(false);
          setTimeout(() => navigate('/my-bookings'), 2000);
      }
      
    } catch (err) {
      console.error(err);
      setStatus('Failed to send booking request. Please try again.');
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <header className="fixed top-0 z-[200] w-full">
        <TopBar />
        <Navbar />
      </header>

      <main className="flex-grow pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-6xl">
            
            {status.includes('Successfully') ? (
                 <div className="bg-white p-12 text-center shadow-md border border-green-200">
                     <h2 className="text-3xl text-green-600 mb-4 font-serif">Success!</h2>
                     <p>{status}</p>
                     <p className="text-sm text-slate-500 mt-4">Redirecting you to your bookings...</p>
                 </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column - Guest Information */}
                    <div className="flex-grow">
                        <div className="bg-[#fcf8f2] border border-[#e6d9c6] p-4 flex justify-between items-center mb-6">
                            <span className="text-sm text-slate-700">Not ready to submit your reservation?</span>
                            <button className="bg-[#665038] text-white px-4 py-2 text-xs font-bold uppercase hover:bg-[#4a3928]">
                                Save for Later
                            </button>
                        </div>

                        <div className="mb-6 flex items-center gap-4">
                            <h2 className="text-xl font-serif text-[#665038] font-bold">Guest Information</h2>
                            <span className="text-slate-400">- OR -</span>
                            {!user && (
                                <button 
                                    onClick={() => setIsLoginModalOpen(true)}
                                    className="bg-[#665038] text-white px-4 py-2 text-xs font-bold flex items-center gap-2 hover:bg-[#4a3928]"
                                >
                                    <Lock size={14} /> Sign In To Book Faster
                                </button>
                            )}
                            {user && <span className="text-sm text-green-600 font-bold flex items-center gap-2"><Lock size={14}/> Signed in securely as {user.firstName}</span>}
                        </div>

                        {/* Date Selection Area */}
                        <div className="bg-white border border-slate-200 p-6 shadow-sm mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select Your Stay Dates</label>
                                    <DateRangePicker date={dateRange} setDate={setDateRange} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Meal Plan</label>
                                    <select name="plan" value={formData.plan} onChange={handleChange} className="w-full border border-slate-300 p-3 text-xs focus:outline-none focus:border-[#BFA37E]">
                                        <option value="EP">Room Only (EP)</option>
                                        <option value="CP">Breakfast (CP)</option>
                                        <option value="MAP">Half Board (MAP)</option>
                                    </select>
                                </div>
                                <div className="bg-slate-50 p-3 text-center border border-dashed border-slate-300">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</div>
                                    <div className="text-lg font-serif text-[#0A192F]">{calculatedPrice?.nights || 1} Nights</div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-100">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Adults (12+ yrs)</label>
                                    <select name="adults" value={formData.adults} onChange={handleChange} className="w-full border border-slate-300 p-2 text-xs">
                                        {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                    <p className="text-[9px] text-slate-400 mt-1">₹{formData.plan === 'EP' ? 400 : (formData.plan === 'CP' ? 800 : 1000)} per extra adult</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Children (5-11 yrs)</label>
                                    <select name="children" value={formData.children} onChange={handleChange} className="w-full border border-slate-300 p-2 text-xs">
                                        {[0,1,2].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                    <p className="text-[9px] text-slate-400 mt-1">₹300 per child (with mattress)</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Below 5 yrs</label>
                                    <select name="infants" value={formData.infants} onChange={handleChange} className="w-full border border-slate-300 p-2 text-xs">
                                        {[0,1,2].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                    <p className="text-[9px] text-emerald-600 mt-1 uppercase font-bold">Complimentary</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 shadow-sm">
                            <div className="mb-8 border-b border-slate-100 pb-8">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
                                    ROOM : {selectedRoom?.title || 'Loading...'}
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                                    <div className="md:col-span-1">
                                        <label className="block text-xs text-red-500 mb-1">Title *</label>
                                        <select name="title" value={formData.title} onChange={handleChange} className="w-full border border-slate-300 p-2 text-sm">
                                            <option>--Select--</option>
                                            <option>Mr.</option>
                                            <option>Mrs.</option>
                                            <option>Ms.</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs text-red-500 mb-1">First Name *</label>
                                        <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required className="w-full border border-slate-300 p-2 text-sm" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs text-red-500 mb-1">Last Name *</label>
                                        <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required className="w-full border border-slate-300 p-2 text-sm" />
                                    </div>
                                    <div className="md:col-span-1 pt-6">
                                        <button type="button" className="text-[#665038] text-xs font-bold flex items-center gap-1 hover:underline">
                                            Special Requests <Plus size={12}/>
                                        </button>
                                        <input type="text" name="specialRequests" placeholder="Any special requests?" value={formData.specialRequests} onChange={handleChange} className="w-full border border-slate-300 p-2 text-xs mt-2" />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8 border-b border-slate-100 pb-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-xs text-red-500 mb-1">Mobile *</label>
                                        <div className="flex">
                                            <select className="border border-slate-300 p-2 text-sm border-r-0 bg-slate-50">
                                                <option>+91</option>
                                                <option>+1</option>
                                            </select>
                                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full border border-slate-300 p-2 text-sm" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-red-500 mb-1">Email *</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail size={16} className="text-slate-400" />
                                            </div>
                                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full border border-slate-300 p-2 pl-10 text-sm" />
                                        </div>
                                        <p className="text-[10px] text-[#665038] mt-1">Your voucher will be sent to this email address</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Selection */}
                            <div className="mb-8 border-b border-slate-100 pb-8">
                                <h3 className="text-sm font-bold text-[#0A192F] mb-4 uppercase">Payment Method</h3>
                                <div className="flex flex-col gap-4">
                                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input 
                                            type="radio" 
                                            name="paymentMethod" 
                                            value="Razorpay" 
                                            checked={formData.paymentMethod === 'Razorpay'} 
                                            onChange={handleChange}
                                            className="w-4 h-4 text-[#8B735B]"
                                        />
                                        <div>
                                            <div className="font-bold text-sm text-[#0A192F]">Pay Online (Razorpay)</div>
                                            <div className="text-xs text-slate-500">Securely pay now via UPI, Credit/Debit Card, or Netbanking.</div>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input 
                                            type="radio" 
                                            name="paymentMethod" 
                                            value="Pay at Hotel" 
                                            checked={formData.paymentMethod === 'Pay at Hotel'} 
                                            onChange={handleChange}
                                            className="w-4 h-4 text-[#8B735B]"
                                        />
                                        <div>
                                            <div className="font-bold text-sm text-[#0A192F]">Pay at Hotel</div>
                                            <div className="text-xs text-slate-500">Reserve your room now and pay when you arrive.</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Terms & Conditions Section */}
                            <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-sm">
                                <h3 className="text-sm font-black text-[#0A192F] mb-4 uppercase tracking-widest flex items-center gap-2">
                                    <Star size={16} className="text-[#BFA37E]" /> Terms & Conditions
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] leading-relaxed text-slate-600">
                                    <div>
                                        <p className="font-bold text-[#0A192F] uppercase mb-1">Cancellation Policy</p>
                                        <p>No refund within 0–3 days of check-in. Full refund if cancelled 4+ days in advance.</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#0A192F] uppercase mb-1">No Show</p>
                                        <p>No refund applicable in case of a no-show.</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#0A192F] uppercase mb-1">Refund Processing</p>
                                        <p>Refunds processed within 7 working days from date of initiation.</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#0A192F] uppercase mb-1">Group Bookings</p>
                                        <p>Standard 7-day cancellation policy applies to group bookings and peak date reservations.</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#0A192F] uppercase mb-1">Peak Season</p>
                                        <p>Minimum 2-night stay. MAP mandatory. No same-day reservations at B2B rates.</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#0A192F] uppercase mb-1">Check-In / Out</p>
                                        <p>Early check-in and late check-out subject to availability and additional charge.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} className="w-4 h-4 text-[#665038] border-slate-300 rounded" />
                                    <span className="text-sm text-slate-700">I acknowledge and accept the Terms of all Policy. <span className="text-red-500">*</span></span>
                                </label>
                            </div>

                            {status && !status.includes('Successfully') && <p className="text-red-500 text-sm font-bold mb-4">{status}</p>}

                            <div className="flex justify-end gap-4">
                                <button type="submit" disabled={loading} className="bg-[#0A192F] text-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#8B735B] transition-all disabled:opacity-70">
                                    {loading ? 'Processing...' : (formData.paymentMethod === 'Razorpay' ? `Pay ₹${finalPrice}` : 'Confirm Booking')}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column - Booking Summary */}
                    <div className="w-full lg:w-[350px]">
                        <div className="bg-white border border-slate-200 shadow-sm sticky top-36">
                            <div className="p-4 border-b border-slate-200 bg-slate-50">
                                <h3 className="text-lg font-bold text-slate-800">Your booking summary</h3>
                            </div>
                            
                            <div className="p-4 border-b border-slate-200">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-[#665038] font-bold text-lg leading-tight">Hotel Bhopal Inn<br/><span className="text-sm font-normal text-slate-500">By Ten On Ten Stays</span></h4>
                                    <div className="flex text-yellow-400">
                                        <Star size={14} fill="currentColor" />
                                        <Star size={14} fill="currentColor" />
                                        <Star size={14} fill="currentColor" />
                                    </div>
                                </div>
                                <a 
                                    href="https://maps.google.com/?q=2/213,+Danish+Nagar,+Bagmugaliya,+Bhopal,+Madhya+Pradesh+462026" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-slate-600 flex items-center gap-2 mb-1 hover:text-[#BFA37E] transition-colors"
                                >
                                    <MapPin size={12}/> 2/213, Danish Nagar, Bhopal, India
                                </a>
                                <div className="flex flex-col gap-1 mt-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reservations & Support</p>
                                    <a href="tel:+916267276957" className="text-xs text-[#665038] hover:underline flex items-center gap-2"><Phone size={12}/> +91 62672 76957</a>
                                    <a href="tel:+919630252729" className="text-xs text-[#665038] hover:underline flex items-center gap-2"><Phone size={12}/> +91 96302 52729</a>
                                    <a href="https://wa.me/916267276957" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-sm font-bold w-fit mt-1 flex items-center gap-1">WhatsApp Support Available</a>
                                </div>
                            </div>

                            <div className="p-4 border-b border-slate-200 flex justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Check-In</p>
                                    <p className="text-sm text-slate-600">{formData.checkInDate}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Check-Out</p>
                                    <p className="text-sm text-slate-600">{formData.checkOutDate}</p>
                                </div>
                            </div>
                            
                            <div className="p-4 border-b border-slate-200">
                                <p className="text-sm font-bold text-slate-800 mb-2">{calculatedPrice?.nights || 1} Night Stay</p>
                            </div>

                            <div className="p-4 bg-slate-50 border-b border-slate-200">
                                <h4 className="text-sm font-bold text-slate-800 mb-4">Rooms & Rates</h4>
                                
                                <div className="mb-4">
                                    <p className="text-xs font-bold text-slate-800">Room 1 :</p>
                                    <p className="text-xs text-slate-600">Rateplan : {selectedRoom?.title || 'Loading...'}</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Plan: {formData.plan === 'EP' ? 'Room Only' : (formData.plan === 'CP' ? 'Breakfast Included' : 'Half Board (MAP)')}</p>
                                </div>

                                <div className="border border-slate-300 rounded overflow-hidden">
                                    <div className="flex justify-between p-2 border-b border-slate-300 bg-white">
                                        <span className="text-xs text-slate-600">Base Room Charges</span>
                                        <span className="text-xs text-slate-800">₹{finalRoomPrice.toLocaleString()}</span>
                                    </div>
                                    {extraCharges > 0 && (
                                        <div className="flex justify-between p-2 border-b border-slate-300 bg-white">
                                            <span className="text-xs text-slate-600">Extra Person Charges</span>
                                            <span className="text-xs text-[#665038] font-bold">₹{extraCharges.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between p-2 bg-slate-100/50">
                                        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-tighter">Gross Total (Tax Inc.)</span>
                                        <span className="text-xs text-slate-800 font-black">₹{finalPrice.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-[#0A192F] text-white flex justify-between items-center">
                                <span className="font-bold text-sm">Total Amount</span>
                                <span className="font-bold text-xl text-[#BFA37E]">₹{finalPrice}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </main>

      <Footer />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
};

export default Booking;
