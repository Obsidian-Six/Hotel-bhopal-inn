import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import axios from 'axios';
import config from '../config';

const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 448 512" className={className} fill="currentColor">
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.7-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.2-3.2-5.6-.3-8.6 2.5-11.3 2.5-2.5 5.6-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.6-9.3 1.9-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.3 5.7 23.7 9.1 31.7 11.7 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
  </svg>
);

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
      // Also save to database
      await axios.post(`${config.API_URL}/api/enquiries`, formData);
      
      // Redirect to WhatsApp
      const text = `Hello Bhopal Inn, I have a message for you:\n\n*Name:* ${formData.name}\n*Mobile:* ${formData.mobile}\n*Email:* ${formData.email}\n*Subject:* ${formData.subject}\n*Message:* ${formData.message}`;
      const encodedText = encodeURIComponent(text);
      window.open(`https://wa.me/916267276957?text=${encodedText}`, '_blank');

      setStatus('Message sent successfully!');
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
        {/* Hero Section */}
        <section className="relative min-h-[125vh] flex items-center justify-center overflow-hidden pt-20">
          <img 
            src="/contact_hero_clean.png" 
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
                                <a 
                                    href="https://maps.google.com/?q=2/213,+Danish+Nagar,+Bagmugaliya,+Bhopal,+Madhya+Pradesh+462026" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hover:text-[#BFA37E] transition-colors"
                                >
                                    2/213, Danish Nagar, Bagmugaliya, <br />
                                    Bhopal, Madhya Pradesh 462026
                                </a>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 text-[#BFA37E]"><Phone size={24} /></div>
                        <div>
                            <h4 className="text-sm font-bold text-[#0A192F] uppercase tracking-widest mb-1">Phone</h4>
                            <p className="text-slate-600 font-light">Reception: +91 62672 76957</p>
                            <p className="text-slate-600 font-light">Reservations: +91 96302 52729</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 text-[#BFA37E]"><Mail size={24} /></div>
                        <div>
                            <h4 className="text-sm font-bold text-[#0A192F] uppercase tracking-widest mb-1">Email</h4>
                            <p className="text-slate-600 font-light">bhopalinn@gmail.com</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 text-[#25D366]"><WhatsAppIcon size={24} /></div>
                        <div>
                            <h4 className="text-sm font-bold text-[#0A192F] uppercase tracking-widest mb-1">WhatsApp</h4>
                            <a href="https://wa.me/916267276957" className="text-slate-600 font-light hover:text-[#25D366] transition-colors">
                                +91 62672 76957 (Click to Chat)
                            </a>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 text-[#BFA37E]"><Clock size={24} /></div>
                        <div>
                            <h4 className="text-sm font-bold text-[#0A192F] uppercase tracking-widest mb-1">Hours</h4>
                            <p className="text-slate-600 font-light">Check-in: 12:00 PM | Check-out: 11:00 AM</p>
                            <p className="text-slate-600 font-light">Front Desk: 24 hours</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Google Map Embed */}
            <div className="h-[500px] lg:h-auto bg-slate-200">
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3667.620067597148!2d77.46666671497184!3d23.18333338484967!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x397c43c0d7000001%3A0x2155716d572d4f8!2sDanish%20Nagar%2C%20Bhopal!5e0!3m2!1sen!2sin!4v1714000000000!5m2!1sen!2sin" 
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
                            
                            <button type="submit" className="w-full bg-[#25D366] text-white px-10 py-4 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#1ebc57] transition-all shadow-lg">
                                <WhatsAppIcon size={16} />
                                Send on WhatsApp
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


      <Footer />
    </div>
  );
};

export default Contact;
