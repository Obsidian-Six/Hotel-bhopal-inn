import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import config from '../../config';
import { Star, DoorOpen, MapPin, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const [images, setImages] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  const defaultImages = [
    "/banquet_main.jpg",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop"
  ];

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await axios.get(`${config.API_URL}/api/hero-images`);
        if (res.data && res.data.length > 0) {
          setImages(res.data); // Now contains objects with url and type
        } else {
          setImages(defaultImages.map(url => ({ url, type: 'image' })));
        }
      } catch (err) {
        setImages(defaultImages.map(url => ({ url, type: 'image' })));
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  const handleNext = () => {
    if (images.length > 0) {
      setCurrent((prev) => (prev + 1) % images.length);
    }
  };

  useEffect(() => {
    if (images.length === 0) return;
    
    // Only set a timer if the current item is an image
    // If it's a video, we rely on the onEnded event
    if (images[current]?.type !== 'video') {
      const timer = setInterval(handleNext, 6000);
      return () => clearInterval(timer);
    }
  }, [images.length, current]);

  return (
    <div className="relative min-h-screen lg:min-h-[125vh] w-full overflow-hidden flex items-center justify-center bg-[#000000]">
      {/* Background Slider */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          {!loading && images.length > 0 && (
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="w-full h-full"
            >
              {images[current].type === 'video' ? (
                <video
                  src={images[current].url.startsWith('http') ? images[current].url : `${config.API_URL}${images[current].url}`}
                  autoPlay
                  muted
                  playsInline
                  loop={images.length === 1}
                  onEnded={handleNext}
                  preload="auto"
                  className="w-full h-full object-cover"
                />

              ) : (
                <img
                  src={images[current].url.startsWith('http') ? images[current].url : `${config.API_URL}${images[current].url}`}
                  loading="eager"
                  className="w-full h-full object-cover"
                  alt={`Hero ${current + 1}`}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-[#000000]/40" />
      </div>



      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center mt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#BFA37E] text-xs lg:text-sm font-bold uppercase tracking-[0.6em] mb-4"
          >
            Welcome to Bhopal Inn
          </motion.p>
          
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-serif text-white mb-8 uppercase leading-[1.1] tracking-wide">
            Experience Luxury <br className="hidden md:block"/> At Every Turn
          </h1>
          
          <p className="text-white/90 text-sm md:text-lg uppercase tracking-[0.4em] font-light mb-12 max-w-2xl mx-auto border-l-2 border-[#BFA37E] pl-6 py-2">
            Premium Boutique Hotel | City Centre | 10 Min from Station
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 mb-10">
            <Link 
              to="/booking" 
              className="bg-[#BFA37E] text-white px-10 py-4 text-xs font-bold tracking-[0.2em] uppercase rounded-sm hover:bg-[#a68d6d] transition-all shadow-2xl min-w-[200px]"
            >
              Book Now
            </Link>
            <Link 
              to="/rooms" 
              className="border border-white text-white px-10 py-4 text-xs font-bold tracking-[0.2em] uppercase rounded-sm hover:bg-white hover:text-[#000000] transition-all min-w-[200px]"
            >
              Explore Rooms
            </Link>
          </div>

          {/* Trust Strip */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 py-5 border-t border-white/20"
          >
            <div className="flex items-center gap-2 text-white/80">
              <Star size={16} className="text-[#BFA37E]" fill="#BFA37E" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Google Rating</span>
            </div>
            <div className="w-[1px] h-4 bg-white/20 hidden md:block" />
            <div className="flex items-center gap-2 text-white/80">
              <DoorOpen size={16} className="text-[#BFA37E]" />
              <span className="text-[10px] font-bold tracking-widest uppercase">16 Premium Rooms</span>
            </div>
            <div className="w-[1px] h-4 bg-white/20 hidden md:block" />
            <div className="flex items-center gap-2 text-white/80">
              <MapPin size={16} className="text-[#BFA37E]" />
              <span className="text-[10px] font-bold tracking-widest uppercase">City Centre Location</span>
            </div>
            <div className="w-[1px] h-4 bg-white/20 hidden md:block" />
            <div className="flex items-center gap-2 text-white/80">
              <Trophy size={16} className="text-[#BFA37E]" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Best Budget Hotel Bhopal</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Slider Indicators */}
      <div className="absolute bottom-10 left-10 z-20 flex flex-col gap-3">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-8 w-[2px] transition-all duration-500 ${current === idx ? 'bg-[#BFA37E] h-12' : 'bg-white/20'}`}
          />
        ))}
      </div>

      {/* Scroll Down */}
      <div className="absolute bottom-10 right-10 z-20 hidden md:flex items-center gap-4 rotate-90 origin-right">
        <span className="text-white/40 text-[10px] font-bold tracking-[0.5em] uppercase whitespace-nowrap">Scroll Down</span>
        <div className="w-12 h-[1px] bg-[#BFA37E]" />
      </div>
    </div>
  );
};

export default HeroSection;
