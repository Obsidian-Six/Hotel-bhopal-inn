import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Tag, CalendarDays, Clock } from 'lucide-react';

const SpecialOffers = () => {
  const offers = [
    {
      title: 'Direct Booking Discount',
      icon: Tag,
      body: 'Book directly on our website and save up to 10% compared to OTA platforms. Plus, free early check-in subject to availability.',
      cta: 'Book Direct & Save',
      path: '/booking',
      color: 'bg-black'
    },
    {
      title: 'Weekend Getaway Deal',
      icon: CalendarDays,
      body: 'Check in Friday, check out Sunday — flat 15% off for 2-night stays. Valid for Balcony & Super Deluxe rooms.',
      cta: 'Book Weekend Deal',
      path: '/booking?promo=WEEKEND',
      color: 'bg-[#BFA37E]'
    },
    {
      title: 'Extended Stay Rate',
      icon: Clock,
      body: '7 nights or more? Enjoy special long-stay pricing and complimentary laundry service. Ideal for business travellers.',
      cta: 'Enquire for Long Stay',
      path: '/contact',
      color: 'bg-black'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-[#FDFBF7]">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#000000] mb-6 uppercase tracking-tight">Special Offers & Deals</h2>
          <div className="w-24 h-[2px] bg-[#BFA37E] mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {offers.map((offer, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`${offer.color} p-10 text-white flex flex-col items-start gap-6 relative overflow-hidden group`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                <offer.icon size={120} />
              </div>
              
              <offer.icon size={32} className="text-[#BFA37E]" />
              <h3 className="text-2xl font-serif font-bold tracking-tight">{offer.title}</h3>
              <p className="text-sm leading-relaxed text-white/70 flex-grow">
                {offer.body}
              </p>
              
              <Link 
                to={offer.path} 
                className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 border-black/30 pb-1 hover:text-black hover:border-black transition-all"
              >
                {offer.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpecialOffers;
