import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const AnnouncementBar = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [showOffer, setShowOffer] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setShowOffer(prev => !prev);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-[#0A192F] text-white py-2 px-4 text-center relative z-[100] border-b border-[#BFA37E]/20"
        >
          <div className="container mx-auto flex items-center justify-center gap-4">
            <div className="flex-grow overflow-hidden h-5 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {!showOffer ? (
                  <motion.p
                    key="text1"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="text-[11px] md:text-[13px] font-medium tracking-wider"
                  >
                    Best Rates Guaranteed on Direct Booking | No Hidden Fees | Instant Confirmation
                  </motion.p>
                ) : (
                  <motion.p
                    key="text2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="text-[11px] md:text-[13px] font-bold text-[#BFA37E] tracking-wider uppercase"
                  >
                    Weekend Deal: Flat 10% Off — Use Code WEEKEND10
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnnouncementBar;
