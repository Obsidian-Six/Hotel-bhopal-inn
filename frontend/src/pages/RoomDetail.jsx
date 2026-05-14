import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import TopBar from '@/components/layout/TopBar';
import Footer from '@/components/layout/Footer';
import { 
  Users, Info, ChevronLeft, ChevronRight, 
  Check, MessageCircle, Star, Utensils, 
  ShieldCheck, Clock, Coffee, Wind, Wifi, Tv, ThermometerSun
} from 'lucide-react';

const API_BASE = config.API_URL;

const RoomDetail = () => {
  const { category } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);

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
    fetchRoom();
  }, [category]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-[#8B735B]/20 border-t-[#8B735B] rounded-full animate-spin"></div>
    </div>
  );

  if (!room) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h2 className="text-2xl font-serif text-[#0A192F] mb-4">Room not found</h2>
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
    if (a.includes('ac') || a.includes('air')) return { icon: Wind, label: amenity };
    if (a.includes('wi-fi') || a.includes('wifi') || a.includes('internet')) return { icon: Wifi, label: amenity };
    if (a.includes('water') || a.includes('hot')) return { icon: ThermometerSun, label: amenity };
    if (a.includes('tv') || a.includes('television')) return { icon: Tv, label: amenity };
    if (a.includes('coffee') || a.includes('tea') || a.includes('kettle')) return { icon: Coffee, label: amenity };
    if (a.includes('room service') || a.includes('service')) return { icon: Utensils, label: amenity };
    if (a.includes('toiletries') || a.includes('bathroom')) return { icon: ShieldCheck, label: amenity };
    if (a.includes('bed') || a.includes('linen') || a.includes('interior')) return { icon: Star, label: amenity };
    if (a.includes('family')) return { icon: Users, label: amenity };
    if (a.includes('parking')) return { icon: ShieldCheck, label: amenity };
    if (a.includes('support') || a.includes('24x7') || a.includes('clock') || a.includes('service')) return { icon: Clock, label: amenity };
    return { icon: Info, label: amenity };
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <header className="fixed top-0 z-[200] w-full">
        <TopBar />
        <Navbar />
      </header>

      <main className="flex-grow">
        {/* Hero Section - Image 1 Reference */}
        <section className="relative min-h-[125vh] flex items-center justify-center overflow-hidden pt-20">
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
              className="text-5xl md:text-8xl font-serif text-white mb-12 uppercase leading-tight tracking-wide"
            >
              {room.title}
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link 
                to="/booking" state={{ roomId: room._id }}
                className="bg-white text-[#0A192F] px-12 py-5 text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-[#8B735B] hover:text-white transition-all shadow-2xl inline-block rounded-full"
              >
                Reserve This Room
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Info Bar - Image 2 Reference */}
        <section className="bg-[#4A4A4A] py-6 text-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-7xl flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-white/60" />
                <span className="text-sm font-medium tracking-wide">Sleeps {room.details.maxOccupancy}</span>
              </div>
            </div>
            <button className="border border-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-[#4A4A4A] transition-all rounded-full">
              More Info
            </button>
          </div>
        </section>

        {/* Room Description & Slider - Image 2 Reference */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl lg:text-4xl font-serif text-[#0A192F] uppercase tracking-wide">Room Description</h2>
                  <div className="h-[1px] w-12 bg-[#8B735B]"></div>
                </div>
                <div className="flex flex-col mb-4">
                  {room.details?.cutPrice > 0 && (
                    <span className="text-lg font-serif text-slate-400 line-through decoration-slate-400/60">₹{room.details.cutPrice.toLocaleString()}</span>
                  )}
                  <span className="text-4xl font-serif font-bold text-[#0A192F]">
                    ₹{(room.details?.startingPrice || 0).toLocaleString()}
                    <span className="text-xs text-slate-400 font-normal uppercase tracking-[0.2em] ml-4 italic">Per Night Starting</span>
                  </span>
                </div>
                <p className="text-slate-600 text-lg leading-relaxed font-light">
                  {room.description}
                </p>
                <div className="pt-4">
                  <Link 
                    to="/booking" state={{ roomId: room._id }}
                    className="bg-[#8B735B] text-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#725e4a] transition-all shadow-lg inline-block rounded-sm"
                  >
                    Reserve This Room
                  </Link>
                </div>
              </div>

              {/* Image Slider */}
              <div className="relative group">
                <div className="aspect-[4/3] overflow-hidden bg-slate-100 relative">
                  <img 
                    src={getFullUrl(room.images[currentImg])} 
                    className="w-full h-full object-cover transition-all duration-700" 
                    alt="Room detail" 
                  />
                  
                  {/* Slider Controls */}
                  <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setCurrentImg(prev => (prev - 1 + room.images.length) % room.images.length)}
                      className="w-10 h-10 bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-[#8B735B] transition-all"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      onClick={() => setCurrentImg(prev => (prev + 1) % room.images.length)}
                      className="w-10 h-10 bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-[#8B735B] transition-all"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>
                
                {/* Thumbnails */}
                <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                  {room.images.map((img, idx) => (
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
            </div>
          </div>
        </section>

        {/* Amenities - Image 3 Reference */}
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-4 lg:px-8 max-w-7xl text-center">
            <div className="space-y-4 mb-20">
              <h2 className="text-4xl lg:text-6xl font-serif text-[#0A192F] uppercase tracking-wide">Amenities</h2>
              <div className="h-[1px] w-24 bg-[#8B735B] mx-auto"></div>
              <p className="text-slate-500 max-w-2xl mx-auto mt-6">Our rooms are well appointed with amenities that ensure a comfortable and productive stay</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 max-w-6xl mx-auto">
              {room.amenities && room.amenities.length > 0 ? (
                room.amenities.map((amenity, idx) => {
                  const { icon: Icon, label } = getAmenityData(amenity);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-4 group">
                      <div className="w-16 h-16 flex items-center justify-center bg-white shadow-sm rounded-full text-[#0A192F] group-hover:bg-[#8B735B] group-hover:text-white transition-all border border-slate-100">
                        <Icon size={28} strokeWidth={1.5} className="relative z-10" />
                      </div>
                      <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-600 group-hover:text-[#0A192F] transition-colors leading-tight">
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

        {/* Testimonial - Image 4 Reference */}
        <section className="bg-[#8B735B] py-24 text-white text-center">
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
            <Star size={32} className="mx-auto mb-8 fill-white" />
            <p className="text-xl md:text-2xl font-light italic leading-relaxed mb-12">
              "Hotel Bhopal Inn truly lives up to its name! The ambiance is serene, the rooms are immaculate, and the staff made me feel right at home. I'll definitely be coming back."
            </p>
            <div className="space-y-2">
              <h4 className="text-lg font-bold tracking-widest uppercase">Priya Mehta</h4>
              <div className="flex justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white"></div>
                <div className="w-2 h-2 rounded-full bg-white/40"></div>
                <div className="w-2 h-2 rounded-full bg-white/40"></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Elements */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 z-[210]">
        <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#0A192F] shadow-xl hover:bg-[#8B735B] hover:text-white transition-all"><Star size={20} /></button>
        <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#0A192F] shadow-xl hover:bg-[#8B735B] hover:text-white transition-all"><Info size={20} /></button>
      </div>


      <Footer />
    </div>
  );
};

export default RoomDetail;
