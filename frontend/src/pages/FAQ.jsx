import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import { MessageCircle, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const faqs = [
  {
    q: "What are the check-in and check-out times?",
    a: "Check-in from 12:00 Noon. Check-out by 11:00 AM. Early check-in or late checkout available on request, subject to availability."
  },
  {
    q: "Is Wi-Fi available? Is it free?",
    a: "Yes, complimentary high-speed Wi-Fi is available in all rooms and common areas. Ideal for business travellers and remote workers."
  },
  {
    q: "How far is the hotel from Rani Kamlapati Railway Station?",
    a: "Hotel Bhopal Inn is approximately 10 minutes by auto-rickshaw or cab from Rani Kamlapati Railway Station."
  },
  {
    q: "Is breakfast included in the room rate?",
    a: "Breakfast is available on request at an additional charge. In-house catering can be arranged for any meal. Please mention your requirement at the time of booking."
  },
  {
    q: "Do you accept credit/debit cards and UPI payments?",
    a: "Yes. We accept all major payment methods including UPI, credit/debit cards, net banking, and cash at the property."
  },
  {
    q: "Is parking available?",
    a: "Yes, free and secure parking is available on-site for our guests. Valet parking is also available on request."
  },
  {
    q: "Can I bring extra guests to my room?",
    a: "Extra guests are accommodated at an additional charge per person per night. Please inform us in advance."
  },
  {
    q: "What is the cancellation policy?",
    a: "Cancellations made 48 hours or more before check-in receive a full refund. Cancellations within 24 hours may incur a one-night charge."
  },
  {
    q: "Do you have a banquet hall for events?",
    a: "Yes. Our banquet hall accommodates corporate events, family functions, weddings, and social gatherings with in-house catering. Contact us for availability and pricing."
  },
  {
    q: "Is the hotel pet-friendly?",
    a: "While we love animals, Hotel Bhopal Inn is not pet-friendly to ensure the comfort and safety of all our guests."
  }
];

const FAQItem = ({ faq, isOpen, onClick }) => {
  return (
    <div className="border border-slate-100 bg-white mb-4 shadow-sm hover:shadow-md transition-shadow">
      <button 
        className="w-full text-left px-8 py-6 flex items-center justify-between gap-4 focus:outline-none"
        onClick={onClick}
      >
        <h4 className="font-serif text-[#0A192F] text-lg uppercase tracking-wide">{faq.q}</h4>
        <div className={`text-[#BFA37E] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={24} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-8 pb-6 text-slate-600 font-light leading-relaxed border-t border-slate-50 pt-4">
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
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
            src="/faq_hero.png" 
            alt="Frequently Asked Questions" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          
          <div className="relative z-10 text-center px-4 max-w-6xl mt-20">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white text-xs lg:text-sm font-bold uppercase tracking-[0.6em] mb-4"
            >
              Need Information?
            </motion.p>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-8xl font-serif text-white mb-6 uppercase leading-tight tracking-wide"
            >
              Frequently Asked <br className="hidden md:block" /> Questions
            </motion.h1>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-white relative -mt-32 z-20 mx-4 lg:mx-16 shadow-2xl">
          <div className="p-8 lg:p-16 max-w-5xl mx-auto">
             <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-serif text-[#0A192F] mb-6 uppercase tracking-wide">
                Common Questions
              </h2>
              <div className="h-[1px] w-24 bg-[#BFA37E] mx-auto"></div>
            </div>

            <div className="space-y-2">
                {faqs.map((faq, index) => (
                    <FAQItem 
                        key={index} 
                        faq={faq} 
                        isOpen={openIndex === index} 
                        onClick={() => setOpenIndex(openIndex === index ? -1 : index)} 
                    />
                ))}
            </div>

            <div className="mt-16 text-center bg-[#FDFBF7] p-8 border border-slate-100">
                <h4 className="text-xl font-serif text-[#0A192F] mb-4 uppercase tracking-wide">Still have questions?</h4>
                <p className="text-slate-600 font-light mb-8">If you cannot find the answer to your question in our FAQ, you can always contact us. We will answer to you shortly!</p>
                <Link 
                    to="/contact"
                    className="inline-block bg-[#0A192F] text-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#8B735B] transition-all"
                >
                    Contact Us
                </Link>
            </div>
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

export default FAQ;
