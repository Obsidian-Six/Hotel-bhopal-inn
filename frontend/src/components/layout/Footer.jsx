import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram, MessageCircle, Send, X } from 'lucide-react';

const Footer = () => {
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [queryData, setQueryData] = useState({ name: '', mobile: '', message: '' });

  const handleWhatsAppQuery = (e) => {
    e.preventDefault();
    const text = `Hello Bhopal Inn, I have a query:\n\n*Name:* ${queryData.name}\n*Mobile:* ${queryData.mobile}\n*Message:* ${queryData.message}`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/916267276957?text=${encodedText}`, '_blank');
    setShowQueryModal(false);
    setQueryData({ name: '', mobile: '', message: '' });
  };

  const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
    <svg viewBox="0 0 448 512" className={className} fill="currentColor">
        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.7-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.2-3.2-5.6-.3-8.6 2.5-11.3 2.5-2.5 5.6-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.6-9.3 1.9-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.3 5.7 23.7 9.1 31.7 11.7 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
    </svg>
  );

  return (
    <footer className="bg-[#FDFBF7] text-[#000000] pt-20 pb-10 border-t border-slate-100">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1 - Brand */}
          <div className="flex flex-col gap-6">
            <Link to="/" className="flex flex-col">
              <div className="h-20 md:h-28 w-48 md:w-56 overflow-hidden flex items-start justify-start">
                <img src="/logo.png" alt="Bhopal Inn Logo" className="h-full w-auto object-contain scale-[1.8] md:scale-[2.2] origin-left" />
              </div>
            </Link>

            <p className="text-xs leading-loose text-slate-600 font-medium italic">
              Budget Comfort. Top-Notch Hospitality. City Centre Bhopal.
            </p>
          </div>

          {/* Column 2 - Quick Links */}
          <div className="flex flex-col gap-6 lg:pl-12">
            <h4 className="font-serif text-lg font-bold text-[#BFA37E] uppercase tracking-wider">Quick Links</h4>
            <ul className="flex flex-col gap-3 text-[11px] font-bold tracking-widest uppercase">
              <li><Link to="/" className="hover:text-[#BFA37E] transition-colors">Home</Link></li>
              <li><Link to="/rooms" className="hover:text-[#BFA37E] transition-colors">Rooms</Link></li>
              <li><Link to="/banquet" className="hover:text-[#BFA37E] transition-colors">Banquet</Link></li>
              <li><Link to="/gallery" className="hover:text-[#BFA37E] transition-colors">Gallery</Link></li>
              <li><Link to="/offers" className="hover:text-[#BFA37E] transition-colors">Offers</Link></li>
              <li><Link to="/about" className="hover:text-[#BFA37E] transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-[#BFA37E] transition-colors">Contact</Link></li>
              <li><button onClick={() => setShowQueryModal(true)} className="text-left hover:text-[#BFA37E] transition-colors uppercase tracking-widest">Post a Query</button></li>
            </ul>
          </div>

          {/* Column 3 - Contact */}
          <div className="flex flex-col gap-6">
            <h4 className="font-serif text-lg font-bold text-[#BFA37E] uppercase tracking-wider">Contact Details</h4>
            <ul className="flex flex-col gap-5 text-xs font-medium leading-relaxed text-slate-600">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-[#BFA37E] mt-0.5 shrink-0" />
                <a 
                  href="https://maps.google.com/?q=2/213,+Danish+Nagar,+Bagmugaliya,+Bhopal,+Madhya+Pradesh+462026" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-[#BFA37E] transition-colors"
                >
                  2/213, Danish Nagar, Bagmugaliya, <br/>Bhopal, Madhya Pradesh 462026
                </a>
              </li>

              <li className="flex items-center gap-3">
                <Mail size={18} className="text-[#BFA37E] shrink-0" />
                <a href="mailto:bhopalinn@gmail.com" className="hover:text-[#BFA37E] transition-colors">bhopalinn@gmail.com</a>
              </li>
              <li className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 text-[#25D366] shrink-0"><WhatsAppIcon /></div>
                    <span className="font-bold uppercase tracking-widest text-[10px]">WhatsApp Support</span>
                </div>
                <div className="flex flex-col gap-2 pl-7 text-[11px]">
                    <a href="https://wa.me/916267276957" target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition-colors flex items-center gap-2">
                        +91 62672 76957 (Primary)
                    </a>
                    <a href="https://wa.me/919630252729" target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition-colors">
                        +91 96302 52729
                    </a>
                    <a href="https://wa.me/917225888650" target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition-colors">
                        +91 72258 88650
                    </a>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 4 - Social & Times */}
          <div className="flex flex-col gap-6 lg:items-end lg:text-right">
            <h4 className="font-serif text-lg font-bold text-[#BFA37E] uppercase tracking-wider">Social Connect</h4>
            <div className="flex gap-4 lg:justify-end">
              <a href="https://www.instagram.com/hoteltenontenstays/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-slate-200 flex items-center justify-center hover:bg-[#E4405F] hover:text-white transition-all rounded-sm bg-slate-100">
                <Instagram size={18} />
              </a>
              <a href="https://wa.me/916267276957" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-slate-200 flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all rounded-sm bg-slate-100">
                <WhatsAppIcon className="w-5 h-5" />
              </a>
            </div>
            <div className="mt-4 text-[12px] text-white font-black uppercase tracking-widest flex flex-col gap-2 lg:items-end">
              <span className="bg-[#BFA37E] px-3 py-1 rounded-sm text-white">CHECK-IN: 12:00 PM</span>
              <span className="bg-[#BFA37E] px-3 py-1 rounded-sm text-white">CHECK-OUT: 11:00 AM</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          <p>© 2026 Hotel Bhopal Inn by <a href="https://www.tenontenstays.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">Ten on Ten Stays</a></p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </div>

      {/* Query Modal */}
      {showQueryModal && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-sm shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
                <div className="bg-[#000000] p-6 text-white flex justify-between items-center">
                    <h3 className="font-serif text-xl font-bold uppercase tracking-widest text-[#BFA37E]">Post a Query</h3>
                    <button onClick={() => setShowQueryModal(false)} className="hover:text-[#BFA37E] transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleWhatsAppQuery} className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Your Name</label>
                        <input 
                            type="text" 
                            required 
                            value={queryData.name}
                            onChange={(e) => setQueryData({...queryData, name: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 p-4 text-xs font-bold text-[#000000] focus:outline-none focus:border-[#BFA37E]" 
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mobile Number</label>
                        <input 
                            type="tel" 
                            required 
                            value={queryData.mobile}
                            onChange={(e) => setQueryData({...queryData, mobile: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 p-4 text-xs font-bold text-[#000000] focus:outline-none focus:border-[#BFA37E]" 
                            placeholder="+91 00000 00000"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Your Message</label>
                        <textarea 
                            required 
                            rows="4"
                            value={queryData.message}
                            onChange={(e) => setQueryData({...queryData, message: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 p-4 text-xs font-bold text-[#000000] focus:outline-none focus:border-[#BFA37E] resize-none" 
                            placeholder="Tell us what you need..."
                        ></textarea>
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-[#25D366] text-white py-4 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest hover:bg-[#1ebc57] transition-all shadow-lg"
                    >
                        <WhatsAppIcon className="w-5 h-5" />
                        Send on WhatsApp
                    </button>
                </form>
            </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
