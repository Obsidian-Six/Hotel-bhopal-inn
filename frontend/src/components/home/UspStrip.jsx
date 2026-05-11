import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Train, Wifi, IndianRupee, ThermometerSun, Building2 } from 'lucide-react';

const USPStrip = () => {
  const usps = [
    { icon: MapPin, text: 'City Centre Location' },
    { icon: Train, text: '10 Min — Rani Kamlapati Station' },
    { icon: Wifi, text: 'High-Speed Wi-Fi' },
    { icon: IndianRupee, text: 'Budget-Friendly Rates' },
    { icon: ThermometerSun, text: '24-Hour Hot & Cold Water' },
    { icon: Building2, text: 'Banquet & Catering' },
  ];

  return (
    <section className="py-12 bg-[#FDFBF7] border-b border-slate-100">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-4">
          {usps.map((usp, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center text-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#BFA37E] group-hover:bg-[#BFA37E] group-hover:text-white transition-all duration-300">
                <usp.icon size={20} strokeWidth={1.5} />
              </div>
              <span className="text-[10px] md:text-[11px] font-bold text-[#0A192F] uppercase tracking-widest leading-relaxed">
                {usp.text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default USPStrip;
