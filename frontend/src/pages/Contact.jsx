import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import axios from 'axios';
import config from '../config';

const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
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
                                Opp. Railway Station, Rani Kamlapati,<br />
                                MP Nagar, Bhopal, MP 462011
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
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3666.216667597148!2d77.43333331497184!3d23.23333338484967!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x397c4260d7000001%3A0x2155716d572d4f8!2sRani%20Kamalapati%20(Habibganj)%20Railway%20Station!5e0!3m2!1sen!2sin!4v1714000000000!5m2!1sen!2sin" 
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
