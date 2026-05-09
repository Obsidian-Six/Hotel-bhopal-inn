import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import { MapPin, Phone, Mail, Clock, MessageCircle, Send } from 'lucide-react';
import axios from 'axios';
import config from '../config';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '', subject: 'Booking Enquiry', message: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');
    try {
      await axios.post(`${config.API_URL}/api/enquiries`, formData);
      setStatus('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', mobile: '', email: '', subject: 'Booking Enquiry', message: '' });
    } catch (err) {
      setStatus('Failed to send message. Please try again.');
    }
  };

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
            src="/contact_hero.png" 
            alt="Contact Hotel Bhopal Inn" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          
          <div className="relative z-10 text-center px-4 max-w-6xl mt-20">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white text-xs lg:text-sm font-bold uppercase tracking-[0.6em] mb-4"
            >
              Get In Touch
            </motion.p>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-8xl font-serif text-white mb-6 uppercase leading-tight tracking-wide"
            >
              Contact Us
            </motion.h1>
          </div>
        </section>

        {/* Contact Info & Map Section */}
        <section className="py-24 bg-white relative -mt-32 z-20 mx-4 lg:mx-16 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-0">
            {/* Contact Info */}
            <div className="p-8 lg:p-16 flex flex-col justify-center">
                <h2 className="text-3xl font-serif text-[#0A192F] mb-10 uppercase tracking-wide">
                    Contact Information
                </h2>
                
                <div className="space-y-8">
                    <div className="flex items-start gap-4">
                        <div className="mt-1 text-[#BFA37E]"><MapPin size={24} /></div>
                        <div>
                            <h4 className="text-sm font-bold text-[#0A192F] uppercase tracking-widest mb-1">Address</h4>
                            <p className="text-slate-600 font-light leading-relaxed">
                                Hotel Bhopal Inn<br />
                                Plot No. 123, City Centre<br />
                                Bhopal, Madhya Pradesh - 462011
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 text-[#BFA37E]"><Phone size={24} /></div>
                        <div>
                            <h4 className="text-sm font-bold text-[#0A192F] uppercase tracking-widest mb-1">Phone</h4>
                            <p className="text-slate-600 font-light">Reception: +91 98765 43210</p>
                            <p className="text-slate-600 font-light">Reservations: +91 98765 43211</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 text-[#BFA37E]"><Mail size={24} /></div>
                        <div>
                            <h4 className="text-sm font-bold text-[#0A192F] uppercase tracking-widest mb-1">Email</h4>
                            <p className="text-slate-600 font-light">reservations@hotelbhopalinn.com</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 text-[#25D366]"><MessageCircle size={24} /></div>
                        <div>
                            <h4 className="text-sm font-bold text-[#0A192F] uppercase tracking-widest mb-1">WhatsApp</h4>
                            <a href="https://wa.me/919876543210" className="text-slate-600 font-light hover:text-[#25D366] transition-colors">
                                +91 98765 43210 (Click to Chat)
                            </a>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 text-[#BFA37E]"><Clock size={24} /></div>
                        <div>
                            <h4 className="text-sm font-bold text-[#0A192F] uppercase tracking-widest mb-1">Hours</h4>
                            <p className="text-slate-600 font-light">Check-in: 12:00 Noon | Check-out: 11:00 AM</p>
                            <p className="text-slate-600 font-light">Front Desk: 24 hours</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Google Map Embed */}
            <div className="h-[500px] lg:h-auto bg-slate-200">
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117300.99971033235!2d77.33232147775952!3d23.25700778531122!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x397c428f8fd68fbd%3A0x2155716d572d4f8!2sBhopal%2C%20Madhya%20Pradesh!5e0!3m2!1sen!2sin!4v1713000000000!5m2!1sen!2sin" 
                    className="w-full h-full border-0" 
                    allowFullScreen="" 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Hotel Location Map"
                ></iframe>
            </div>
          </div>
        </section>

        {/* How to Reach & Contact Form */}
        <section className="py-24 bg-[#FDFBF7]">
            <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    
                    {/* How to Reach Us */}
                    <div>
                        <h2 className="text-3xl font-serif text-[#0A192F] mb-10 uppercase tracking-wide">
                            How to Reach Us
                        </h2>
                        <div className="space-y-8">
                            <div className="bg-white p-6 shadow-sm border border-slate-100 border-l-4 border-l-[#BFA37E]">
                                <h4 className="text-lg font-serif font-bold text-[#0A192F] mb-2">From Rani Kamlapati Station</h4>
                                <p className="text-slate-600 font-light leading-relaxed">
                                    Hotel Bhopal Inn is extremely well connected. It takes approximately 10 minutes by auto-rickshaw or cab from Rani Kamlapati Railway Station.
                                </p>
                            </div>
                            <div className="bg-white p-6 shadow-sm border border-slate-100 border-l-4 border-l-[#BFA37E]">
                                <h4 className="text-lg font-serif font-bold text-[#0A192F] mb-2">From Raja Bhoj Airport</h4>
                                <p className="text-slate-600 font-light leading-relaxed">
                                    The airport is around 18 kms away. You can easily get a prepaid taxi or an app-based cab which takes approx. 25–30 minutes to reach the hotel.
                                </p>
                            </div>
                            <div className="bg-white p-6 shadow-sm border border-slate-100 border-l-4 border-l-[#BFA37E]">
                                <h4 className="text-lg font-serif font-bold text-[#0A192F] mb-2">From ISBT Bus Stand</h4>
                                <p className="text-slate-600 font-light leading-relaxed">
                                    Just a 15-minute drive from the Inter State Bus Terminal (ISBT). Local transport is readily available 24/7.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white p-8 lg:p-10 shadow-xl border border-slate-100">
                        <h2 className="text-2xl font-serif text-[#0A192F] mb-8 uppercase tracking-wide">
                            Send us a message
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-[#FDFBF7] border border-slate-200 p-4 text-xs focus:outline-none focus:border-[#BFA37E]" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mobile Number</label>
                                    <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required className="w-full bg-[#FDFBF7] border border-slate-200 p-4 text-xs focus:outline-none focus:border-[#BFA37E]" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-[#FDFBF7] border border-slate-200 p-4 text-xs focus:outline-none focus:border-[#BFA37E]" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Subject</label>
                                <select name="subject" value={formData.subject} onChange={handleChange} className="w-full bg-[#FDFBF7] border border-slate-200 p-4 text-xs focus:outline-none focus:border-[#BFA37E]">
                                    <option value="Booking Enquiry">Booking Enquiry</option>
                                    <option value="Banquet Enquiry">Banquet Enquiry</option>
                                    <option value="Feedback">Feedback</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Your Message</label>
                                <textarea name="message" value={formData.message} onChange={handleChange} required rows="4" className="w-full bg-[#FDFBF7] border border-slate-200 p-4 text-xs focus:outline-none focus:border-[#BFA37E] resize-none"></textarea>
                            </div>
                            
                            <button type="submit" className="w-full bg-[#0A192F] text-white px-10 py-4 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#8B735B] transition-all">
                                <Send size={16} />
                                Send Message
                            </button>
                            
                            {status && (
                                <p className={`text-center text-sm font-bold mt-4 ${status.includes('success') ? 'text-green-600' : 'text-[#BFA37E]'}`}>
                                    {status}
                                </p>
                            )}
                        </form>
                    </div>

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

export default Contact;
