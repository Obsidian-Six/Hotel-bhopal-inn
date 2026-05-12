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
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );

  return (
    <footer className="bg-[#0A192F] text-[#EFEDEA] pt-20 pb-10">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1 - Brand */}
          <div className="flex flex-col gap-6">
            <Link to="/" className="flex flex-col">
              <img src="/logo.png" alt="Bhopal Inn Logo" className="h-24 w-auto object-contain self-start bg-white rounded-sm" />
            </Link>

            <p className="text-xs leading-loose text-slate-400 font-medium italic">
              Budget Comfort. Top-Notch Hospitality. City Centre Bhopal.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="bg-white/5 p-2 rounded-sm border border-white/10">
                <span className="text-[10px] block font-bold text-[#BFA37E]">⭐ 4.5/5</span>
                <span className="text-[8px] uppercase tracking-tighter text-white/60">Google Rating</span>
              </div>
              <div className="bg-white/5 p-2 rounded-sm border border-white/10">
                <span className="text-[10px] block font-bold text-[#BFA37E]">TripAdvisor</span>
                <span className="text-[8px] uppercase tracking-tighter text-white/60">Certificate of Excellence</span>
              </div>
            </div>
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
            <ul className="flex flex-col gap-5 text-xs font-medium leading-relaxed text-slate-300">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-[#BFA37E] mt-0.5 shrink-0" />
                <span>Opp. Railway Station, Rani Kamlapati, <br/>MP Nagar, Bhopal, MP 462011</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-[#BFA37E] shrink-0" />
                <div className="flex flex-col">
                  <a href="tel:+916267276957" className="hover:text-[#BFA37E] transition-colors">+91 62672 76957</a>
                  <a href="tel:+919630252729" className="hover:text-[#BFA37E] transition-colors">+91 96302 52729</a>
                </div>
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
              <a href="https://www.instagram.com/hoteltenontenstays/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-[#E4405F] hover:text-white transition-all rounded-sm bg-white/5">
                <Instagram size={18} />
              </a>
              <a href="https://wa.me/916267276957" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all rounded-sm bg-white/5">
                <WhatsAppIcon className="w-5 h-5" />
              </a>
            </div>
            <div className="mt-4 text-[12px] text-white font-black uppercase tracking-widest flex flex-col gap-2 lg:items-end">
              <span className="bg-[#BFA37E] px-3 py-1 rounded-sm">CHECK-IN: 12:00 PM</span>
              <span className="bg-[#BFA37E] px-3 py-1 rounded-sm">CHECK-OUT: 11:00 AM</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
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
                <div className="bg-[#0A192F] p-6 text-white flex justify-between items-center">
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
                            className="w-full bg-slate-50 border border-slate-200 p-4 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E]" 
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
                            className="w-full bg-slate-50 border border-slate-200 p-4 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E]" 
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
                            className="w-full bg-slate-50 border border-slate-200 p-4 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E] resize-none" 
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
