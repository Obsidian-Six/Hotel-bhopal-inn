import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import config from '../../config';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Wind, Wifi, ThermometerSun, Tv, UtensilsCrossed, Waves, Check } from 'lucide-react';

const API_BASE = config.API_URL;

const RoomCategories = () => {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/rooms`);
        // Take up to 3 rooms for the homepage
        setRooms(res.data.slice(0, 3));
      } catch (err) {
        console.error('Error fetching rooms:', err);
      }
    };
    fetchRooms();
  }, []);

  const getFullUrl = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop';
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
  };

  const getIcon = (amenity) => {
    const a = amenity.toLowerCase();
    if (a.includes('ac') || a.includes('air')) return Wind;
    if (a.includes('wi-fi') || a.includes('wifi') || a.includes('internet')) return Wifi;
    if (a.includes('water') || a.includes('hot')) return ThermometerSun;
    if (a.includes('tv') || a.includes('television')) return Tv;
    if (a.includes('room service') || a.includes('service')) return UtensilsCrossed;
    if (a.includes('balcony')) return Waves;
    return Check;
  };



  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-[#BFA37E] text-xs font-bold tracking-[0.4em] uppercase mb-4 block">Luxury Accommodation</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#0A192F] mb-6">Our Rooms</h2>
          <div className="w-24 h-[2px] bg-[#BFA37E] mx-auto mb-6" />
          <p className="text-sm font-medium tracking-wide text-slate-500 uppercase">
            Choose comfort that fits your needs and budget
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {rooms.map((room, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="group flex flex-col bg-[#FDFBF7] border border-slate-100 relative shadow-sm hover:shadow-2xl transition-all duration-500 h-full"
            >
              {room.popular && (
                <div className="absolute top-4 right-4 z-10 bg-[#BFA37E] text-white text-[10px] font-bold px-4 py-1 uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              
              <div className="relative h-72 overflow-hidden">
                <img 
                  src={getFullUrl(room.images && room.images.length > 0 ? room.images[0] : null)} 
                  alt={room.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20" />
                {room.tags && room.tags[0] && (
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-[#0A192F] text-[9px] font-bold px-3 py-1 uppercase tracking-widest border-l-2 border-[#BFA37E]">
                    {room.tags[0]}
                  </div>
                )}
              </div>
              
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-serif font-bold text-[#0A192F] tracking-tight">{room.title}</h3>
                </div>
                
                <p className="text-xs leading-loose text-slate-500 mb-8 flex-grow italic line-clamp-3">
                  {room.description}
                </p>

                <div className="flex gap-4 mb-8">
                  {(room.amenities || []).slice(0, 5).map((amenity, i) => {
                    const Icon = getIcon(amenity);
                    return <Icon key={i} size={16} className="text-[#BFA37E]" strokeWidth={1.5} />;
                  })}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Starting from</span>
                    <span className="text-xl font-serif font-bold text-[#0A192F]">₹{(room.details?.startingPrice || room.details?.basePrice || room.price || 0).toLocaleString()}<span className="text-xs">/night</span></span>
                  </div>
                  <Link 
                    to={`/rooms/${room.category}`} 
                    className="bg-[#0A192F] text-white text-[10px] font-bold px-6 py-3 uppercase tracking-widest hover:bg-[#BFA37E] transition-all"
                  >
                    View & Book
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link to="/rooms" className="text-xs font-bold text-[#BFA37E] uppercase tracking-[0.3em] hover:text-[#0A192F] transition-colors inline-flex items-center gap-2 border-b border-transparent hover:border-[#0A192F] pb-1">
            View All Rooms
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RoomCategories;
