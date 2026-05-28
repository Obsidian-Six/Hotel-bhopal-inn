import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import TopBar from '@/components/layout/TopBar';
import Footer from '@/components/layout/Footer';
import { 
  Users, Info, ChevronLeft, ChevronRight, 
  Check, MessageCircle, Star, Utensils, 
  ShieldCheck, Clock, Coffee, Wind, Wifi, Tv, ThermometerSun, X, Maximize2,
  DoorOpen, ParkingCircle, MapPin
} from 'lucide-react';

const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 448 512" className={className} fill="currentColor">
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.7-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.2-3.2-5.6-.3-8.6 2.5-11.3 2.5-2.5 5.6-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.6-9.3 1.9-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.3 5.7 23.7 9.1 31.7 11.7 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
  </svg>
);

const API_BASE = config.API_URL;

const RoomDetail = () => {
  const { category } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [currentReview, setCurrentReview] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const descriptionRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchRoom = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/rooms/${category}`);
        setRoom(res.data);
      } catch (err) {
        console.error('Error fetching room:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/reviews`);
        setReviews(res.data);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    };

    fetchRoom();
    fetchReviews();
  }, [category]);

  // Auto-slide reviews
  useEffect(() => {
    if (reviews.length > 1) {
      const timer = setInterval(() => {
        setCurrentReview((prev) => (prev + 1) % reviews.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [reviews]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-[#8B735B]/20 border-t-[#8B735B] rounded-full animate-spin"></div>
    </div>
  );

  if (!room) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h2 className="text-2xl font-serif text-[#000000] mb-4">Room not found</h2>
        <Link to="/rooms" className="text-[#8B735B] font-bold uppercase tracking-widest underline">Back to Rooms</Link>
      </div>
    </div>
  );

  const getFullUrl = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop';
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
  };

  const getAmenityData = (amenity) => {
    const a = amenity.toLowerCase();
    if (a.includes('ac') || a.includes('air')) return { icon: Wind, label: amenity, title: 'Air conditioning', desc: 'Stay cool and comfortable with central cooling.' };
    if (a.includes('wi-fi') || a.includes('wifi') || a.includes('internet')) return { icon: Wifi, label: amenity, title: 'High-speed Wi-Fi', desc: 'Stay connected with reliable internet access.' };
    if (a.includes('water') || a.includes('hot')) return { icon: ThermometerSun, label: amenity, title: 'Hot water', desc: '24/7 hot and cold water availability.' };
    if (a.includes('tv') || a.includes('television')) return { icon: Tv, label: amenity, title: 'Premium TV', desc: 'Enjoy your favorite shows on a large flat-screen TV.' };
    if (a.includes('coffee') || a.includes('tea') || a.includes('kettle')) return { icon: Coffee, label: amenity, title: 'Tea & Coffee', desc: 'In-room refreshment kit provided.' };
    if (a.includes('room service') || a.includes('service')) return { icon: Utensils, label: amenity, title: 'Room Service', desc: 'Delicious food delivered to your door.' };
    if (a.includes('toiletries') || a.includes('bathroom')) return { icon: ShieldCheck, label: amenity, title: 'Free Toiletries', desc: 'Complimentary essentials for your comfort.' };
    if (a.includes('bed') || a.includes('linen') || a.includes('interior')) return { icon: Star, label: amenity, title: 'Premium Linen', desc: 'High-quality bedding for a restful sleep.' };
    if (a.includes('family')) return { icon: Users, label: amenity, title: 'Family Friendly', desc: 'Suitable for guests traveling with family.' };
    if (a.includes('parking')) return { icon: ParkingCircle, label: amenity, title: 'Free Parking', desc: 'Complimentary parking space for all guests.' };
    if (a.includes('support') || a.includes('24x7') || a.includes('clock') || a.includes('service')) return { icon: Clock, label: amenity, title: '24/7 Support', desc: 'Round-the-clock assistance at your service.' };
    if (a.includes('check-in')) return { icon: DoorOpen, label: amenity, title: 'Self check-in', desc: 'Check yourself in with the lockbox.' };
    if (a.includes('quiet')) return { icon: MapPin, label: amenity, title: 'Peace and quiet', desc: 'Guests say this home is in a quiet area.' };
    
    return { icon: Info, label: amenity, title: amenity, desc: 'Quality amenity provided for your stay.' };
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <header className="fixed top-0 z-[200] w-full">
        <TopBar />
        <Navbar />
      </header>

      <main className="flex-grow">
        {/* Hero Section - Image 1 Reference */}
        <section className="relative min-h-screen lg:min-h-[125vh] flex items-center justify-center overflow-hidden pt-20">
          <img 
            src={getFullUrl(room.images[0])} 
            alt={room.title} 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          
          <div className="relative z-10 text-center px-4 max-w-6xl mt-20">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white text-xs lg:text-sm font-bold uppercase tracking-[0.6em] mb-4"
            >
              Hotel Bhopal Inn
            </motion.p>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-8xl font-serif text-white mb-8 md:mb-12 uppercase leading-tight tracking-wide"
            >
              {room.title}
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center mb-8"
            >
              <div className="flex items-center gap-4">
                {room.details?.cutPrice > 0 && (
                  <span className="text-xl md:text-2xl font-serif text-white/50 line-through decoration-white/30">₹{room.details.cutPrice.toLocaleString()}</span>
                )}
                <span className="text-3xl md:text-5xl font-serif font-bold text-white">
                  ₹{(room.details?.startingPrice || 0).toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-white/60 font-bold uppercase tracking-[0.3em] mt-2 italic">Per Night Starting</span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link 
                to="/booking" state={{ roomId: room._id }}
                className="bg-white text-[#000000] px-12 py-5 text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-[#8B735B] hover:text-white transition-all shadow-2xl inline-block rounded-full"
              >
                Reserve This Room
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Info Bar - Image 2 Reference */}
        <section className="bg-[#4A4A4A] py-6 text-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-white/60" />
                <span className="text-sm font-medium tracking-wide">Sleeps {room.details.maxOccupancy}</span>
              </div>
            </div>
            <button 
              onClick={() => descriptionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="border border-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-[#4A4A4A] transition-all rounded-full"
            >
              More Info
            </button>
          </div>
        </section>

        {/* Room Description & Slider - Redesigned to match Explore Page structure */}
        <section ref={descriptionRef} className="py-24 bg-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
            {/* Desktop View (lg+) */}
            <div className="hidden lg:flex flex-row gap-16 items-start">
              {/* Left: Image Slider & Thumbnails */}
              <div className="w-1/2 space-y-6">
                <div className="relative group aspect-[4/3] overflow-hidden bg-slate-100">
                  <img 
                    src={getFullUrl(room.images?.[currentImg])} 
                    className="w-full h-full object-cover transition-all duration-700 cursor-zoom-in" 
                    alt={room.title} 
                    onClick={() => setShowZoom(true)}
                  />
                  
                  <button 
                    onClick={() => setShowZoom(true)}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[#000000] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                  >
                    <Maximize2 size={18} />
                  </button>
                  
                  {/* Slider Controls */}
                  <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setCurrentImg(prev => (prev - 1 + (room.images?.length || 0)) % (room.images?.length || 1))}
                      className="w-10 h-10 bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-[#8B735B] transition-all"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      onClick={() => setCurrentImg(prev => (prev + 1) % (room.images?.length || 1))}
                      className="w-10 h-10 bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-[#8B735B] transition-all"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>
                
                {/* Thumbnails */}
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {room.images?.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentImg(idx)}
                      className={`w-24 h-16 flex-shrink-0 border-2 transition-all ${currentImg === idx ? 'border-[#8B735B] scale-105' : 'border-transparent grayscale opacity-50'}`}
                    >
                      <img src={getFullUrl(img)} className="w-full h-full object-cover" alt="" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Content */}
              <div className="w-1/2 flex flex-col">
                <div className="mb-8">
                  <h2 className="text-4xl font-serif text-[#000000] uppercase tracking-wide mb-4">Room Description</h2>
                  <div className="h-[1px] w-12 bg-[#8B735B]"></div>
                </div>

                <div className="mb-8">
                  {room.details?.cutPrice > 0 && (
                    <div className="text-lg font-serif text-slate-400 line-through decoration-slate-400/60 mb-1">₹{room.details.cutPrice.toLocaleString()}</div>
                  )}
                  <div className="flex items-baseline gap-4">
                    <span className="text-5xl font-serif font-bold text-[#000000]">
                      ₹{(room.details?.startingPrice || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-normal uppercase tracking-[0.2em] italic">Per Night Starting</span>
                  </div>
                </div>

                <p className="text-slate-600 text-lg leading-relaxed font-light mb-10">
                  {room.description || "Spacious and well-appointed, our rooms offer a king-size bed, air conditioning, premium linen, and all essential amenities for a comfortable stay."}
                </p>

                <div className="mb-12">
                  <Link 
                    to="/booking" state={{ roomId: room._id }}
                    className="bg-[#8B735B] text-white px-12 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#725e4a] transition-all shadow-lg inline-block rounded-sm"
                  >
                    Reserve This Room
                  </Link>
                </div>

                <div className="h-[1px] w-full bg-slate-100 mb-10"></div>

                {/* Detailed Amenities List - Dynamic from CMS */}
                <div className="space-y-8">
                  {(room.amenities || []).slice(0, 3).map((amenityStr, idx) => {
                    const amenity = getAmenityData(amenityStr);
                    return (
                      <div key={idx} className="flex items-start gap-5 group">
                        <div className="text-slate-600 group-hover:text-[#8B735B] transition-colors mt-1">
                          <amenity.icon size={26} strokeWidth={1.5} />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-black leading-tight mb-1">{amenity.title}</h4>
                          <p className="text-sm text-slate-500">{amenity.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mobile View (<lg) */}
            <div className="lg:hidden flex flex-col space-y-8">
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden group">
                <img 
                  src={getFullUrl(room.images?.[currentImg])} 
                  className="w-full h-full object-cover" 
                  alt={room.title} 
                />
                <button 
                  onClick={() => setShowZoom(true)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-black shadow-lg"
                >
                  <Maximize2 size={18} />
                </button>
                
                {/* Dots for slider */}
                <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                  {room.images?.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentImg(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${currentImg === idx ? 'bg-white scale-125' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col space-y-6">
                <h3 className="text-3xl font-serif text-black uppercase tracking-wide">
                  {room.title}
                </h3>
                
                <p className="text-slate-500 text-base leading-relaxed">
                  {room.description}
                </p>

                {/* Amenity Tags */}
                <div className="flex flex-wrap gap-2">
                  {(room.amenities || []).slice(0, 4).map((amenity, idx) => (
                    <span key={idx} className="inline-flex items-center px-4 py-2 border border-slate-200 text-xs font-medium text-slate-600 rounded-sm">
                      {amenity}
                    </span>
                  ))}
                </div>

                {/* Price */}
                <div className="flex flex-col pt-2">
                  {room.details?.cutPrice > 0 && (
                    <span className="text-base font-serif text-slate-400 line-through mb-1">₹{room.details.cutPrice.toLocaleString()}</span>
                  )}
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-serif font-bold text-black">
                      ₹{(room.details?.startingPrice || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-normal uppercase tracking-widest italic">Starting Price</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <Link 
                    to="/booking" state={{ roomId: room._id }}
                    className="flex-grow bg-[#8B735B] text-white py-4 text-xs font-bold uppercase tracking-widest text-center hover:bg-[#725e4a] transition-all rounded-sm"
                  >
                    Book Now
                  </Link>
                  <button 
                    onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                    className="flex-grow border border-black text-black py-4 text-xs font-bold uppercase tracking-widest text-center hover:bg-black hover:text-white transition-all rounded-sm"
                  >
                    Contact Us
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Amenities - Image 3 Reference */}
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-4 lg:px-8 max-w-7xl text-center">
            <div className="space-y-4 mb-20">
              <h2 className="text-4xl lg:text-6xl font-serif text-[#000000] uppercase tracking-wide">Amenities</h2>
              <div className="h-[1px] w-24 bg-[#8B735B] mx-auto"></div>
              <p className="text-slate-500 max-w-2xl mx-auto mt-6">Our rooms are well appointed with amenities that ensure a comfortable and productive stay</p>
            </div>

            <div className="flex flex-wrap justify-center gap-8 md:gap-12 max-w-6xl mx-auto">
              {room.amenities && room.amenities.length > 0 ? (
                room.amenities.map((amenity, idx) => {
                  const { icon: Icon, label } = getAmenityData(amenity);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-4 group text-center min-w-[120px]">
                      <div className="w-16 h-16 flex items-center justify-center bg-white shadow-sm rounded-full text-[#000000] group-hover:bg-[#8B735B] group-hover:text-white transition-all border border-slate-100 mx-auto">
                        <Icon size={28} strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-slate-600 group-hover:text-[#000000] transition-colors leading-tight max-w-[120px]">
                          {label}
                          </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="col-span-full text-slate-400 italic">No specific amenities listed for this room.</p>
              )}
            </div>
          </div>
        </section>

        {/* Testimonial - Dynamic Slider */}
        <section className="bg-black py-24 text-white text-center min-h-[400px] flex items-center">
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
            <AnimatePresence mode="wait">
              {reviews.length > 0 ? (
                <motion.div
                  key={currentReview}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex justify-center gap-1 mb-8">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={24} fill="white" className="text-white" />
                    ))}
                  </div>
                  <p className="text-xl md:text-2xl font-light italic leading-relaxed mb-12">
                    "{reviews[currentReview].text}"
                  </p>
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold tracking-widest uppercase">{reviews[currentReview].name}</h4>
                    <div className="flex justify-center gap-2 mt-4">
                      {reviews.map((_, idx) => (
                        <button 
                          key={idx}
                          onClick={() => setCurrentReview(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${currentReview === idx ? 'bg-white scale-125' : 'bg-white/40'}`}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex justify-center items-center h-40">
                  <p className="text-white/50 text-sm italic">
                    {reviews.length === 0 ? "No guest reviews available yet." : "Loading guest reviews..."}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>
        <section className="py-24 bg-white border-t border-slate-100">
          <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
            {/* Header Section */}
            <div className="flex flex-col items-center text-center mb-16">
              <div className="flex items-center gap-2 mb-4">
                {/* Dark Laurel Wreath Left */}
                <svg viewBox="0 0 24 24" className="w-16 h-16 text-[#222222]">
                  <path fill="currentColor" d="M7 16c.1.4-.4 1.1-1.3 1.5-1.1.4-2.1.4-2.3.2-.2-.2.1-1.1.9-2 1-1 2.2-1.7 2.7-1.4.5.3.3 1.3.3 1.7zm1.3-4.5c.1.4-.6 1-1.6 1.4-1.1.4-2.1.2-2.3-.1-.2-.3.3-1.2 1.3-1.9 1-1 2.3-1.3 2.8-.9.5.4.1 1.2-.2 1.5zm2-4.5c.1.4-.8.8-2 1.1-1.2.3-2.1 0-2.3-.4-.2-.4.6-1.1 1.8-1.5 1.2-.4 2.5-.4 2.8 0 .3.4.1.7-.3.8z"/>
                </svg>
                <span className="text-8xl font-bold text-[#222222] tracking-tighter">5.0</span>
                {/* Dark Laurel Wreath Right */}
                <svg viewBox="0 0 24 24" className="w-16 h-16 text-[#222222] transform scale-x-[-1]">
                  <path fill="currentColor" d="M7 16c.1.4-.4 1.1-1.3 1.5-1.1.4-2.1.4-2.3.2-.2-.2.1-1.1.9-2 1-1 2.2-1.7 2.7-1.4.5.3.3 1.3.3 1.7zm1.3-4.5c.1.4-.6 1-1.6 1.4-1.1.4-2.1.2-2.3-.1-.2-.3.3-1.2 1.3-1.9 1-1 2.3-1.3 2.8-.9.5.4.1 1.2-.2 1.5zm2-4.5c.1.4-.8.8-2 1.1-1.2.3-2.1 0-2.3-.4-.2-.4.6-1.1 1.8-1.5 1.2-.4 2.5-.4 2.8 0 .3.4.1.7-.3.8z"/>
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-[#222222] mb-1">Guest favourite</h3>
              <p className="text-[#666666] max-w-lg mx-auto text-[17px] leading-tight font-normal">
                This home is a guest favourite based on<br />ratings, reviews and reliability
              </p>
              <button className="text-[#717171] text-sm underline mt-3 hover:text-black transition-colors font-medium">How reviews work</button>
            </div>

            {/* Ratings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-0 border-t border-slate-100 py-8">
              {[
                { label: 'Overall rating', value: '', bars: [90, 15, 0, 0, 0] },
                { label: 'Cleanliness', value: '4.6', icon: (
                    <svg viewBox="0 0 32 32" className="w-8 h-8 text-[#222222]">
                        <path fill="none" stroke="currentColor" strokeWidth="2" d="M22 6c0-2.2-1.8-4-4-4s-4 1.8-4 4v2h8V6zm-8 4v16c0 2.2 1.8 4 4 4s4-1.8 4-4V10h-8zM8 12c-1.1 0-2 .9-2 2s.9 2 2 2h2v-4H8zm0 8c-1.1 0-2 .9-2 2s.9 2 2 2h2v-4H8z" />
                    </svg>
                ) },
                { label: 'Accuracy', value: '4.9', icon: (
                    <svg viewBox="0 0 32 32" className="w-8 h-8 text-[#222222]">
                        <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
                        <path fill="none" stroke="currentColor" strokeWidth="2" d="M10 16l4 4 8-8" />
                    </svg>
                ) },
                { label: 'Check-in', value: '4.9', icon: (
                    <svg viewBox="0 0 32 32" className="w-8 h-8 text-[#222222]">
                        <path fill="none" stroke="currentColor" strokeWidth="2" d="M12 18c-3.3 0-6-2.7-6-6s2.7-6 6-6s6 2.7 6 6s-2.7 6-6 6zm6-6h8v4h-4v4h-4v-8z" />
                    </svg>
                ) },
                { label: 'Communication', value: '4.8', icon: (
                    <svg viewBox="0 0 32 32" className="w-8 h-8 text-[#222222]">
                        <path fill="none" stroke="currentColor" strokeWidth="2" d="M4 6h24v16H12l-6 6V22H4V6z" />
                    </svg>
                ) },
                { label: 'Location', value: '4.9', icon: (
                    <svg viewBox="0 0 32 32" className="w-8 h-8 text-[#222222]">
                        <path fill="none" stroke="currentColor" strokeWidth="2" d="M4 6v22l8-4l8 4l8-4V2l-8 4l-8-4l-8 4z" />
                    </svg>
                ) },
                { label: 'Value', value: '4.8', icon: (
                    <svg viewBox="0 0 32 32" className="w-8 h-8 text-[#222222]">
                        <path fill="none" stroke="currentColor" strokeWidth="2" d="M6 6h10l10 10l-10 10l-10-10V6z" />
                        <circle cx="10" cy="10" r="2" fill="currentColor" />
                    </svg>
                ) }
              ].map((item, idx) => (
                <div key={idx} className={`flex flex-col items-start px-6 py-4 h-full ${idx !== 0 ? 'border-l border-slate-100' : ''}`}>
                  <h4 className="text-[14px] font-semibold text-[#222222] mb-1">{item.label}</h4>
                  {item.bars ? (
                    <div className="w-full space-y-2.5 pt-1">
                      {item.bars.map((bar, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[11px] text-[#222222] w-2 leading-none">{5-i}</span>
                          <div className="flex-grow h-[3px] bg-[#EBEBEB] rounded-full overflow-hidden">
                            <div className="h-full bg-[#222222]" style={{ width: `${bar}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-8 mt-1">
                      <span className="text-xl font-bold text-[#222222]">{item.value}</span>
                      <div className="text-[#222222] mt-auto">
                        {item.icon}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Zoom Modal */}
        <AnimatePresence>
          {showZoom && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4 lg:p-12"
              onClick={() => setShowZoom(false)}
            >
              <button 
                onClick={() => setShowZoom(false)}
                className="absolute top-8 right-8 text-white hover:text-[#BFA37E] transition-colors z-10"
              >
                <X size={40} />
              </button>
              
              <div className="relative w-full h-full flex items-center justify-center">
                <img 
                  src={getFullUrl(room.images[currentImg])} 
                  className="max-w-full max-h-full object-contain shadow-2xl" 
                  alt="Room zoom" 
                  onClick={(e) => e.stopPropagation()}
                />
                
                <div className="absolute inset-x-0 bottom-8 flex justify-center gap-4">
                  {room.images.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setCurrentImg(idx); }}
                      className={`w-3 h-3 rounded-full transition-all ${currentImg === idx ? 'bg-white scale-125' : 'bg-white/30'}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Elements */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 z-[210]">
        <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#000000] shadow-xl hover:bg-[#8B735B] hover:text-white transition-all"><Star size={20} /></button>
        <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#000000] shadow-xl hover:bg-[#8B735B] hover:text-white transition-all"><Info size={20} /></button>
      </div>


      <Footer />
    </div>
  );
};

export default RoomDetail;
