import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
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

        <div className="max-w-6xl mx-auto relative px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.slice(current, current + 3).length > 0 ? (
                    reviews.slice(current, (current + 3) > reviews.length ? reviews.length : current + 3).map((review, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col gap-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                        <img src={`https://ui-avatars.com/api/?name=${review.name}&background=random`} alt={review.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-[#0A192F]">{review.name}</h4>
                                        <p className="text-[10px] text-slate-400">{review.city} • {review.source}</p>
                                    </div>
                                </div>
                                {review.source?.toLowerCase().includes('google') ? (
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5" />
                                ) : (
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tripadvisor_logo.svg" alt="TripAdvisor" className="w-5 h-5" />
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                                {[...Array(review.rating)].map((_, i) => (
                                    <Star key={i} size={14} fill="#FBBC05" className="text-[#FBBC05]" />
                                ))}
                                <CheckCircle2 size={14} className="text-blue-500 ml-1" fill="currentColor" />
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                                {review.text}
                            </p>
                            
                            {review.text.length > 150 && (
                                <button className="text-xs font-bold text-slate-400 hover:text-[#BFA37E] transition-colors text-left">Read more</button>
                            )}
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-3 text-center py-10 text-slate-400 italic">No reviews found</div>
                )}
            </div>

          {/* Navigation Controls */}
          <button 
            onClick={() => setCurrent((prev) => (prev === 0 ? reviews.length - 1 : prev - 1))}
            className="absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-md flex items-center justify-center text-slate-400 hover:text-[#BFA37E] transition-all rounded-full z-20"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setCurrent((prev) => (prev + 1) % reviews.length)}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-md flex items-center justify-center text-slate-400 hover:text-[#BFA37E] transition-all rounded-full z-20"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mt-12">
            {reviews.map((_, i) => (
                <button 
                    key={i} 
                    onClick={() => setCurrent(i)}
                    className={`w-2 h-2 rounded-full transition-all ${current === i ? 'bg-[#BFA37E] w-6' : 'bg-slate-300'}`}
                />
            ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
