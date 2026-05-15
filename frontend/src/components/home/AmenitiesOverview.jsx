import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ThermometerSun, Airplay, Wifi, 
  Wind, SprayCan, BedDouble, 
  ConciergeBell, Utensils, ParkingCircle, 
  Train, Map, Users
} from 'lucide-react';

const AmenitiesOverview = () => {
  const amenities = [
    { icon: ThermometerSun, label: '24-Hr Hot Water' },
    { icon: Airplay, label: 'Full AC' },
    { icon: Wifi, label: 'High-Speed Wi-Fi' },
    { icon: Wind, label: 'Hair Dryer' },
    { icon: SprayCan, label: 'Toiletries Kit' },
    { icon: BedDouble, label: 'Premium Linen' },
    { icon: ConciergeBell, label: '24-Hr Front Desk' },
    { icon: Utensils, label: 'Catering Available' },
    { icon: ParkingCircle, label: 'Parking Available' },
    { icon: Train, label: '10 Min to Station' },
    { icon: Map, label: 'City Centre' },
    { icon: Users, label: 'Cooperative Staff' }
  ];

  return (
    <section className="py-16 md:py-24 bg-[#FDFBF7]">
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 md:mb-20"
        >
          <span className="text-[#BFA37E] text-xs font-bold tracking-[0.4em] uppercase mb-4 block">Our Amenities</span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#000000] mb-6">Everything You Need for a Great Stay</h2>
          <div className="w-24 h-[2px] bg-[#BFA37E] mx-auto" />
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-y-12 md:gap-y-16 gap-x-6 md:gap-x-8 max-w-6xl mx-auto">
          {amenities.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-col items-center gap-6 group text-center"
              >
                <div className="w-20 h-20 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[#BFA37E] group-hover:bg-[#000000] group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-xl mx-auto">
                  <Icon size={32} strokeWidth={1.2} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#000000] group-hover:text-[#BFA37E] transition-colors leading-relaxed max-w-[120px]">
                  {item.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-20">
          <Link 
            to="/amenities" 
            className="bg-[#000000] text-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] rounded-sm hover:bg-[#BFA37E] transition-all shadow-xl inline-block"
          >
            See All Amenities
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AmenitiesOverview;
