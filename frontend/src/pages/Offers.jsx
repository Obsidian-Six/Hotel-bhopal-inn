import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import config from '../config';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import { MessageCircle, Tag, Calendar, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = config.API_URL;

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchOffers = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/offers/active`);
        setOffers(res.data);
      } catch (err) {
        console.error('Error fetching offers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <header className="fixed top-0 z-[200] w-full">
        <TopBar />
        <Navbar />
      </header>

      <main className="flex-grow">
        {/* Hero Section - 125vh height */}
        <section className="relative min-h-[125vh] flex items-center justify-center overflow-hidden pt-20">
          <img
            src="/offers_hero.png"
            alt="Special Offers & Deals"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative z-10 text-center px-4 max-w-6xl mt-20">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white text-xs lg:text-sm font-bold uppercase tracking-[0.6em] mb-4"
            >
              Exclusive Benefits
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-8xl font-serif text-white mb-6 uppercase leading-tight tracking-wide"
            >
              Special Offers <br className="hidden md:block" /> & Deals
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/90 text-sm lg:text-lg uppercase tracking-[0.4em] font-light max-w-2xl mx-auto"
            >
              Book direct for the best rates — no third-party commissions or hidden charges.
            </motion.p>
          </div>
        </section>

        {/* Offers Grid Section */}
        <section className="py-24 bg-white relative -mt-32 z-20 mx-4 lg:mx-16 shadow-2xl">
          <div className="p-8 lg:p-16">

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-[#8B735B]/20 border-t-[#8B735B] rounded-full animate-spin"></div>
              </div>
            ) : offers.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-500 font-light text-lg">There are no special offers available at this moment. Please check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {offers.map((offer) => (
                  <div key={offer._id} className="bg-[#FDFBF7] border border-slate-100 shadow-sm hover:shadow-xl transition-shadow group flex flex-col h-full">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {offer.imageUrl ? (
                        <img
                          src={`${API_BASE}${offer.imageUrl}`}
                          alt={offer.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                          <Tag size={48} />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-[#BFA37E] text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest shadow-lg">
                        Limited Time
                      </div>
                    </div>

                    <div className="p-8 flex flex-col flex-grow">
                      <h3 className="text-2xl font-serif text-[#0A192F] uppercase tracking-wide mb-4 line-clamp-2">
                        {offer.title}
                      </h3>

                      <div className="flex items-center gap-2 text-[#BFA37E] mb-6">
                        <Calendar size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{offer.validity}</span>
                      </div>

                      <p className="text-slate-600 font-light leading-relaxed mb-6 flex-grow">
                        {offer.description}
                      </p>

                      <div className="space-y-4 mt-auto pt-6 border-t border-slate-200">
                        <div className="flex items-start gap-2 text-slate-400">
                          <div className="mt-0.5"><Info size={12} /></div>
                          <p className="text-[10px] uppercase tracking-widest leading-relaxed">
                            {offer.terms}
                          </p>
                        </div>

                        <Link
                          to="/booking"
                          className="block w-full bg-[#0A192F] text-white text-center py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#8B735B] transition-all"
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </section>

      </main>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/919876543210"
        className="fixed bottom-10 right-10 z-[300] w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform"
      >
        <MessageCircle size={32} />
      </a>

      <Footer />
    </div>
  );
};

export default Offers;
