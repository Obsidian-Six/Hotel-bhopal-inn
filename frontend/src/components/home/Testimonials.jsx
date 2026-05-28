import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import config from '../../config';

const Testimonials = () => {
  const [reviews, setReviews] = useState([]);
  const [current, setCurrent] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(3);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetchReviews();
    
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsToShow(1);
      } else if (window.innerWidth < 1024) {
        setItemsToShow(2);
      } else {
        setItemsToShow(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${config.API_URL}/api/reviews`);
      if (res.data && res.data.length > 0) {
        setReviews(res.data);
      }
    } catch (err) {
      console.error('Error fetching reviews from server:', err);
    }
  };

  useEffect(() => {
    if (reviews.length === 0 || isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % reviews.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [reviews.length, isPaused]);

  if (reviews.length === 0) return null;

  // Calculate visible reviews
  const getVisibleReviews = () => {
    const visible = [];
    for (let i = 0; i < itemsToShow; i++) {
      visible.push(reviews[(current + i) % reviews.length]);
    }
    return visible;
  };

  return (
    <section 
      className="py-24 bg-[#E8F2F2] relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#BFA37E] text-xs font-bold tracking-[0.4em] uppercase mb-4 block">Guest Experiences</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#000000] mb-4">What Our Guests Say</h2>
          <div className="w-24 h-[2px] bg-[#BFA37E] mx-auto" />
        </motion.div>

        <div className="max-w-6xl mx-auto relative px-4 md:px-12">
            <div className={`grid grid-cols-1 md:grid-cols-${itemsToShow === 1 ? '1' : itemsToShow === 2 ? '2' : '3'} gap-8 mx-auto`}>
                <AnimatePresence mode="wait">
                  {getVisibleReviews().map((review, idx) => (
                      <motion.div
                          key={`${review.id}-${idx}-${current}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.5 }}
                          className="bg-white p-8 rounded-sm shadow-sm border border-slate-100 flex flex-col gap-6 h-full hover:shadow-xl transition-all duration-500 min-h-[350px]"
                      >
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                                      <img src={review.profile_photo_url || `https://ui-avatars.com/api/?name=${review.name}&background=random`} alt={review.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                      <h4 className="text-sm font-bold text-[#000000] uppercase tracking-wider">{review.name}</h4>
                                      <p className="text-[10px] font-bold text-[#BFA37E] uppercase tracking-widest">{review.time}</p>
                                  </div>
                              </div>
                              {review.source?.toLowerCase().includes('google') ? (
                                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5 opacity-50" />
                              ) : (
                                  <img src="https://www.vectorlogo.zone/logos/tripadvisor/tripadvisor-icon.svg" alt="TripAdvisor" className="w-5 h-5 opacity-50" />
                              )}
                          </div>

                          <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={12} fill={i < (review.rating || 5) ? "#BFA37E" : "transparent"} className={i < (review.rating || 5) ? "text-[#BFA37E]" : "text-slate-300"} />
                              ))}
                          </div>

                          <p className="text-sm text-slate-500 leading-relaxed italic flex-grow">
                              "{review.text}"
                          </p>
                          
                          <div className="pt-4 border-t border-slate-50">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{review.source}</span>
                          </div>
                      </motion.div>
                  ))}
                </AnimatePresence>
            </div>

          {reviews.length > itemsToShow && (
            <>
              <button 
                onClick={() => setCurrent((prev) => (prev === 0 ? reviews.length - 1 : prev - 1))}
                className="absolute -left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white shadow-xl flex items-center justify-center text-[#000000] hover:bg-[#BFA37E] hover:text-white transition-all rounded-full z-20 hidden md:flex"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={() => setCurrent((prev) => (prev + 1) % reviews.length)}
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white shadow-xl flex items-center justify-center text-[#000000] hover:bg-[#BFA37E] hover:text-white transition-all rounded-full z-20 hidden md:flex"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        {reviews.length > itemsToShow && (
          <div className="flex justify-center gap-3 mt-16">
              {reviews.map((_, i) => (
                  <button 
                      key={i} 
                      onClick={() => setCurrent(i)}
                      className={`h-1.5 transition-all duration-500 rounded-full ${current === i ? 'bg-[#BFA37E] w-8' : 'bg-slate-300 w-2'}`}
                  />
              ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
