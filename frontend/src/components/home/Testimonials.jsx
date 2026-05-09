import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import config from '../../config';

const Testimonials = () => {
  const defaultReviews = [
    {
      name: 'Rahul M.',
      city: 'Indore',
      text: 'Excellent stay! The rooms are spacious, very clean, and the staff is extremely cooperative. The 24-hour hot water and fast Wi-Fi made my business trip hassle-free.',
      source: 'Via Google',
      rating: 5
    },
    {
      name: 'Priya S.',
      city: 'Mumbai',
      text: 'Perfect location right in the city centre. Easy access to DB mall and the station. The food from their in-house catering was delicious.',
      source: 'Via TripAdvisor',
      rating: 5
    },
    {
      name: 'Anand T.',
      city: 'Delhi',
      text: 'Booked the Balcony Deluxe room and it was worth every penny. Beautiful views and very comfortable bed. Will definitely stay here again.',
      source: 'Via Google',
      rating: 5
    }
  ];

  const [reviews, setReviews] = useState(defaultReviews);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${config.API_URL}/api/testimonials`);
      if (res.data && res.data.length > 0) {
        setReviews(res.data);
      }
    } catch (err) {
      console.error('Error fetching reviews from server:', err);
    }
  };

  useEffect(() => {
    if (reviews.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % reviews.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [reviews.length]);

  if (reviews.length === 0) return null;

  return (
    <section className="py-24 bg-[#0A192F] relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <Quote size={400} className="absolute -top-20 -left-20 text-white" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#BFA37E] text-xs font-bold tracking-[0.4em] uppercase mb-4 block">Guest Experiences</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">What Our Guests Say</h2>
          <div className="w-24 h-[2px] bg-[#BFA37E] mx-auto" />
        </motion.div>

        <div className="max-w-4xl mx-auto relative group">
          <div className="min-h-[350px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center px-6"
              >
                <div className="flex justify-center gap-1 mb-8">
                  {[...Array(reviews[current]?.rating || 5)].map((_, i) => (
                    <Star key={i} size={20} fill="#BFA37E" className="text-[#BFA37E]" />
                  ))}
                </div>
                
                <p className="text-xl md:text-3xl font-serif italic text-white/90 leading-relaxed mb-10 max-w-3xl mx-auto">
                  "{reviews[current]?.text}"
                </p>
                
                <div className="flex flex-col items-center gap-2">
                  <h4 className="text-sm font-bold tracking-[0.3em] text-[#BFA37E] uppercase">
                    {reviews[current]?.name} {reviews[current]?.city ? `• ${reviews[current].city}` : ''}
                  </h4>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {reviews[current]?.source}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <button 
            onClick={() => setCurrent((prev) => (prev === 0 ? reviews.length - 1 : prev - 1))}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#BFA37E] hover:border-[#BFA37E] transition-all rounded-full hidden md:flex"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={() => setCurrent((prev) => (prev + 1) % reviews.length)}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#BFA37E] hover:border-[#BFA37E] transition-all rounded-full hidden md:flex"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Social Proof Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 pt-10 border-t border-white/10 flex flex-wrap justify-center items-center gap-8 md:gap-16"
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl font-serif font-bold text-white">4.5<span className="text-sm text-white/40">/5</span></span>
            <div className="flex flex-col">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} size={10} fill="#BFA37E" className="text-[#BFA37E]" />)}
              </div>
              <span className="text-[9px] font-bold text-white/60 uppercase tracking-tighter mt-1">Average Rating</span>
            </div>
          </div>
          <div className="w-[1px] h-8 bg-white/10 hidden md:block" />
          <div className="text-center">
            <span className="block text-lg font-serif font-bold text-white">1,200+</span>
            <span className="text-[9px] font-bold text-white/60 uppercase tracking-tighter">Reviews on Google</span>
          </div>
          <div className="w-[1px] h-8 bg-white/10 hidden md:block" />
          <div className="text-center">
            <span className="block text-lg font-serif font-bold text-white">Top 3</span>
            <span className="text-[9px] font-bold text-white/60 uppercase tracking-tighter">Budget Hotels in Bhopal</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
