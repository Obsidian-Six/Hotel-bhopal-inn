import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

const BanquetTeaser = () => {
  const highlights = [
    'Fully Air-Conditioned Hall',
    'In-House Catering',
    'AV Facilities',
    'Flexible Seating'
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2"
          >
            <div className="relative group">
              <div className="absolute -inset-4 border border-[#BFA37E]/20 -z-10 group-hover:inset-0 transition-all duration-700" />
              <img 
                src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2074&auto=format&fit=crop" 
                alt="Banquet Hall" 
                className="w-full h-[500px] object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 shadow-2xl"
              />
              <div className="absolute bottom-10 left-10 bg-white p-8 shadow-2xl hidden md:block">
                <span className="text-4xl font-serif font-bold text-[#0A192F]">200+</span>
                <p className="text-[10px] font-bold text-[#BFA37E] uppercase tracking-widest mt-2">Guest Capacity</p>
              </div>
            </div>
          </motion.div>

          <div className="w-full lg:w-1/2">
            <span className="text-[#BFA37E] text-xs font-bold tracking-[0.4em] uppercase mb-4 block text-left">Events & Celebrations</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#0A192F] mb-8 leading-tight">
              Host Your Next Event at <br/> Hotel Bhopal Inn
            </h2>
            <p className="text-sm md:text-base leading-loose text-slate-500 font-medium mb-10 italic">
              Our spacious banquet hall is equipped to host corporate meetings, family functions, social gatherings, and celebrations. In-house catering with customised menus ensures a memorable event experience for your guests.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              {highlights.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-[#BFA37E]" />
                  <span className="text-xs font-bold text-[#0A192F] uppercase tracking-widest">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <Link 
                to="/contact?type=banquet" 
                className="bg-[#0A192F] text-white px-10 py-4 text-xs font-bold tracking-[0.2em] uppercase rounded-sm hover:bg-[#BFA37E] transition-all shadow-xl text-center"
              >
                Enquire for Banquet
              </Link>
              <Link 
                to="/banquet" 
                className="border-b-2 border-[#BFA37E] text-[#0A192F] px-4 py-4 text-xs font-bold tracking-[0.2em] uppercase hover:text-[#BFA37E] transition-all text-center"
              >
                View Banquet Details
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default BanquetTeaser;
