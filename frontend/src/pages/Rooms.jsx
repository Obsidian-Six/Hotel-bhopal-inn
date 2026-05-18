import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import config from '../config';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import { 
  Wifi, Wind, ThermometerSun, 
  Tv, UtensilsCrossed, Waves, Check, 
  MessageCircle, Star, Info, ShieldCheck, 
  Clock, Coffee, MapPin, Instagram, X, Maximize2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = config.API_URL;

const RoomCard = ({ room, onZoom }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const getFullUrl = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop';
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white group flex flex-col h-full"
    >
      <div className="relative overflow-hidden aspect-[4/3] mb-6 block">
        <Link to={`/rooms/${room.category}`}>
          <img 
            src={getFullUrl(room.images[0])} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            alt={room.title} 
          />
        </Link>
        <button 
          onClick={() => onZoom(room)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[#000000] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 hover:bg-[#8B735B] hover:text-white"
        >
          <Maximize2 size={18} />
        </button>
      </div>
      
      <div className="flex flex-col flex-grow space-y-4">
        <h3 className="text-2xl lg:text-3xl font-serif text-[#000000] uppercase tracking-wide min-h-[4rem] lg:min-h-[5rem] flex items-center">
          {room.title}
        </h3>
        
        <div className="flex-grow">
          <p className={`text-slate-500 text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
            {room.description}
          </p>
          {room.description && room.description.length > 120 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[10px] font-black uppercase tracking-widest text-[#8B735B] hover:text-[#725e4a] transition-colors mt-2 block"
            >
              {isExpanded ? 'Read Less —' : 'Read More +'}
            </button>
          )}
        </div>

        <div className="flex flex-col pt-4 border-t border-slate-100">
          {room.details?.cutPrice > 0 && (
            <span className="text-sm font-serif text-slate-400 line-through decoration-slate-400/60">₹{room.details.cutPrice.toLocaleString()}</span>
          )}
          <span className="text-2xl font-serif font-bold text-[#000000]">
            ₹{(room.details?.startingPrice || 0).toLocaleString()}
            <span className="text-[10px] text-slate-400 font-normal uppercase tracking-widest ml-2">Starting Price</span>
          </span>
        </div>

        <div className="flex gap-4 pt-4 mt-auto">
          <Link 
            to={`/rooms/${room.category}`}
            className="flex-grow border border-[#000000] text-[#000000] py-3 text-[10px] font-bold uppercase tracking-widest text-center hover:bg-[#000000] hover:text-white transition-all"
          >
            Explore the Room
          </Link>
          <Link 
            to="/booking" state={{ roomId: room._id }}
            className="flex-grow bg-[#8B735B] text-white py-3 text-[10px] font-bold uppercase tracking-widest text-center hover:bg-[#725e4a] transition-all"
          >
            Book Now
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

const ComparisonTable = ({ rooms }) => {
  if (!rooms || rooms.length === 0) return null;

  // Get all unique amenities across all rooms to create rows
  const allAmenities = Array.from(new Set(rooms.flatMap(r => r.amenities || [])));

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="py-6 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Features</th>
            {rooms.map((room) => (
              <th key={room._id} className="py-6 text-center text-sm font-serif text-[#000000] uppercase px-4 whitespace-nowrap">
                {room.category}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allAmenities.map((amenity, idx) => (
            <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
              <td className="py-5 text-sm text-slate-600 min-w-[200px]">{amenity}</td>
              {rooms.map((room) => (
                <td key={room._id} className="py-5 text-center">
                  {(room.amenities || []).includes(amenity) ? (
                    <Check size={18} className="mx-auto text-[#8B735B]" />
                  ) : (
                    <span className="text-slate-200">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomRoom, setZoomRoom] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchRooms = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/rooms`);
        setRooms(res.data);
      } catch (err) {
        console.error('Error fetching rooms:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const getFullUrl = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop';
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="fixed top-0 z-[200] w-full">
        <TopBar />
        <Navbar />
      </header>
      
      <main className="flex-grow">
        {/* Hero Section - Matching Reference Image 1 */}
        <section className="relative min-h-screen lg:min-h-[125vh] flex items-center justify-center overflow-hidden pt-20">
          <img 
            src="HEro_room.jpeg" 
            alt="Luxury Hero" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          
          <div className="relative z-10 text-center px-4 max-w-6xl -mt-20 lg:-mt-32">
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
              className="text-3xl md:text-7xl lg:text-8xl font-serif text-white mb-6 uppercase leading-tight tracking-wide"
            >
              Rooms & Suites <br className="hidden md:block" /> That Define Luxury
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/90 text-[10px] md:text-sm lg:text-lg uppercase tracking-[0.4em] font-light"
            >
              Choose from an array of options
            </motion.p>
          </div>

          {/* Social Icons - Right Floating */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-6 z-20">
            <a href="https://wa.me/916267276957" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all shadow-lg">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </a>
            <a href="https://www.instagram.com/hoteltenontenstays/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#000000] hover:bg-[#8B735B] hover:text-white transition-all shadow-lg">
              <Instagram size={18} />
            </a>
          </div>
        </section>

        {/* Room Grid Section - Matching Reference Image 2 */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-[#8B735B]/20 border-t-[#8B735B] rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
                {rooms.map((room) => (
                  <RoomCard key={room._id} room={room} onZoom={(r) => setZoomRoom(r)} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Zoom Modal */}
        <AnimatePresence>
          {zoomRoom && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4 lg:p-12"
              onClick={() => setZoomRoom(null)}
            >
              <button 
                onClick={() => setZoomRoom(null)}
                className="absolute top-8 right-8 text-white hover:text-[#8B735B] transition-colors z-10"
              >
                <X size={40} />
              </button>
              
              <div className="relative w-full h-full flex items-center justify-center">
                <img 
                  src={getFullUrl(zoomRoom.images[0])} 
                  className="max-w-full max-h-full object-contain shadow-2xl" 
                  alt="Room zoom" 
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comparison Section */}
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-serif text-[#000000] mb-4">
                Not sure which room to choose?
              </h2>
              <div className="h-[1px] w-24 bg-[#8B735B] mx-auto"></div>
            </div>

            <div className="bg-white p-8 lg:p-12 shadow-xl border border-slate-100">
              <ComparisonTable rooms={rooms} />
            </div>

            {/* CTAs */}
            <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-6">
              <a 
                href="https://wa.me/916267276957"
                className="w-full md:w-auto flex items-center justify-center gap-3 bg-[#25D366] text-white px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#128C7E] transition-all shadow-lg rounded-sm"
              >
                <div className="w-5 h-5 fill-white">
                  <svg viewBox="0 0 448 512" fill="currentColor">
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.7-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.2-3.2-5.6-.3-8.6 2.5-11.3 2.5-2.5 5.6-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.6-9.3 1.9-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.3 5.7 23.7 9.1 31.7 11.7 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                  </svg>
                </div>
                Speak to Us on WhatsApp
              </a>
              <Link 
                to="/booking"
                className="w-full md:w-auto bg-[#000000] text-white px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#8B735B] transition-all shadow-lg text-center"
              >
                Book Your Room Now
              </Link>
            </div>
          </div>
        </section>
      </main>
      

      <Footer />
    </div>
  );
};

export default Rooms;
