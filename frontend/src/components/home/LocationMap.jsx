import React from 'react';
import { motion } from 'framer-motion';
import { Train, Plane, ShoppingBag, Waves, TreePine, Building2, ExternalLink } from 'lucide-react';

const LocationMap = () => {
  const locations = [
    { icon: Train, label: 'Rani Kamlapati Railway Station', dist: '10 minutes' },
    { icon: Plane, label: 'Raja Bhoj Airport', dist: 'approx. 25–30 minutes' },
    { icon: ShoppingBag, label: 'DB CITY MALL', dist: '5–10 minutes' },
    { icon: Waves, label: 'Upper Lake (Bada Talab)', dist: '15 minutes' },
    { icon: TreePine, label: 'Van Vihar National Park', dist: '15–20 minutes' },
    { icon: Building2, label: 'Bharat Bhavan', dist: '10 minutes' },
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="text-[#BFA37E] text-xs font-bold tracking-[0.4em] uppercase mb-4 block">Our Location</span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#000000] mb-6">Perfectly Located in Bhopal City Centre</h2>
          <div className="w-24 h-[2px] bg-[#BFA37E] mx-auto" />
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-0 shadow-2xl rounded-sm overflow-hidden border border-slate-100">
          {/* Map Embed */}
          <div className="w-full lg:w-3/5 h-[350px] md:h-[500px]">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3667.620067597148!2d77.46666671497184!3d23.18333338484967!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x397c43c0d7000001%3A0x2155716d572d4f8!2sDanish%20Nagar%2C%20Bhopal!5e0!3m2!1sen!2sin!4v1714000000000!5m2!1sen!2sin" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy"
              title="Hotel Bhopal Inn Location"
              className="grayscale-[20%] contrast-[1.1] brightness-[0.9]"
            ></iframe>
          </div>

          {/* Distance List */}
          <div className="w-full lg:w-2/5 p-6 md:p-10 bg-[#000000] text-white flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-serif font-bold text-[#BFA37E] mb-10 border-b border-white/10 pb-6 uppercase tracking-wider">Nearby Landmarks</h3>
              <ul className="space-y-6">
                {locations.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#BFA37E] group-hover:bg-[#BFA37E] group-hover:text-white transition-all duration-300">
                        <item.icon size={16} strokeWidth={1.5} />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-medium text-[#BFA37E] italic">{item.dist}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <a 
              href="https://maps.google.com/?q=2/213,+Danish+Nagar,+Bagmugaliya,+Bhopal,+Madhya+Pradesh+462026" 
              target="_blank" 
              rel="noreferrer"
              className="mt-12 flex items-center justify-center gap-3 bg-[#BFA37E] text-white py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-[#000000] transition-all shadow-xl"
            >
              <ExternalLink size={14} />
              Get Directions on Google Maps
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationMap;
