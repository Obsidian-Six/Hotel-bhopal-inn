import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import config from '../../config';

const Testimonials = () => {
  const [reviews, setReviews] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${config.API_URL}/api/testimonials?visible=true`);
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
    <section className="py-24 bg-[#E8F2F2] relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#0A192F] mb-4">Our Customer Reviews</h2>
        </motion.div>

        <div className="max-w-6xl mx-auto relative px-4 md:px-12">
            <div className={`grid grid-cols-1 ${reviews.length >= 3 ? 'md:grid-cols-3' : reviews.length === 2 ? 'md:grid-cols-2 max-w-4xl' : 'md:grid-cols-1 max-w-xl'} gap-8 mx-auto`}>
                {(reviews.length > 3 
                  ? [reviews[current % reviews.length], reviews[(current + 1) % reviews.length], reviews[(current + 2) % reviews.length]]
                  : reviews
                ).map((review, idx) => (
                    <motion.div
                        key={`${review._id}-${idx}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white p-8 rounded-sm shadow-sm border border-slate-100 flex flex-col gap-6 h-full hover:shadow-xl transition-all duration-500"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                                    <img src={`https://ui-avatars.com/api/?name=${review.name}&background=random`} alt={review.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#0A192F] uppercase tracking-wider">{review.name}</h4>
                                    <p className="text-[10px] font-bold text-[#BFA37E] uppercase tracking-widest">{review.city}</p>
                                </div>
                            </div>
                            {review.source?.toLowerCase().includes('google') ? (
                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5 opacity-50" />
                            ) : (
                                <img src="https://www.vectorlogo.zone/logos/tripadvisor/tripadvisor-icon.svg" alt="TripAdvisor" className="w-5 h-5 opacity-50" />
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} size={12} fill="#BFA37E" className="text-[#BFA37E]" />
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
            </div>

          {reviews.length > 3 && (
            <>
              <button 
                onClick={() => setCurrent((prev) => (prev === 0 ? reviews.length - 1 : prev - 1))}
                className="absolute -left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white shadow-xl flex items-center justify-center text-[#0A192F] hover:bg-[#BFA37E] hover:text-white transition-all rounded-full z-20"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={() => setCurrent((prev) => (prev + 1) % reviews.length)}
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white shadow-xl flex items-center justify-center text-[#0A192F] hover:bg-[#BFA37E] hover:text-white transition-all rounded-full z-20"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        {reviews.length > 3 && (
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
