import React, { useState } from 'react';
import axios from 'axios';
import config from '../../config';
import { motion } from 'framer-motion';
import { Send, CheckCircle } from 'lucide-react';

const NewsletterSignup = () => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await axios.post(`${config.API_URL}/api/newsletter`, { firstName, email });
      setSubscribed(true);
    } catch (err) {
      console.error('Error subscribing to newsletter:', err);
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-24 relative overflow-hidden bg-[#0A192F]">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
        <img 
          src="https://images.unsplash.com/photo-1551882547-ff40c66fe561?q=80&w=2070&auto=format&fit=crop" 
          alt="Newsletter Decor" 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-white p-10 md:p-20 shadow-2xl rounded-sm"
        >
          {!subscribed ? (
            <div className="flex flex-col items-center text-center">
              <span className="text-[#BFA37E] text-[10px] font-bold tracking-[0.5em] uppercase mb-6">Stay Connected</span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#0A192F] mb-6">Stay Updated with Exclusive Deals</h2>
              <p className="text-sm md:text-base text-slate-500 mb-12 max-w-xl mx-auto italic font-medium leading-relaxed">
                Join our mailing list for special offers, seasonal discounts, and Bhopal travel tips.
              </p>
              
              <form onSubmit={handleSubmit} className="w-full max-w-2xl flex flex-col gap-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <input 
                    type="text" 
                    placeholder="FIRST NAME" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="flex-1 bg-[#FDFBF7] border border-slate-100 p-4 text-[10px] font-bold tracking-widest text-[#0A192F] focus:outline-none focus:border-[#BFA37E] transition-colors"
                  />
                  <input 
                    type="email" 
                    placeholder="EMAIL ADDRESS" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-[#FDFBF7] border border-slate-100 p-4 text-[10px] font-bold tracking-widest text-[#0A192F] focus:outline-none focus:border-[#BFA37E] transition-colors"
                  />
                </div>
                
                <div className="flex items-start gap-3 text-left">
                  <input 
                    type="checkbox" 
                    id="privacy" 
                    required 
                    className="mt-1 accent-[#BFA37E]"
                  />
                  <label htmlFor="privacy" className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed cursor-pointer">
                    I agree to receive emails from Hotel Bhopal Inn. We never spam. Unsubscribe anytime.
                  </label>
                </div>

                {error && <p className="text-red-500 text-[10px] uppercase font-bold tracking-wider">{error}</p>}

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-[#BFA37E] text-white py-5 text-xs font-bold uppercase tracking-[0.3em] hover:bg-[#0A192F] transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 cursor-pointer"
                >
                  <Send size={16} />
                  {isSubmitting ? 'Subscribing...' : 'Subscribe Now'}
                </button>
              </form>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-10"
            >
              <CheckCircle size={80} className="text-[#BFA37E] mb-8" />
              <h2 className="text-3xl font-serif font-bold text-[#0A192F] mb-4">Thank you!</h2>
              <p className="text-slate-500 font-medium italic">Check your inbox for a welcome discount.</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSignup;
