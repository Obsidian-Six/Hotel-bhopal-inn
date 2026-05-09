import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram, Facebook, MessageCircle } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0A192F] text-[#EFEDEA] pt-20 pb-10">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1 - Brand */}
          <div className="flex flex-col gap-6">
            <Link to="/" className="flex flex-col">
              <span className="text-3xl font-serif font-bold text-white leading-none">Bhopal Inn</span>
              <div className="flex items-center gap-1 w-full mt-1">
                 <div className="h-[1px] bg-[#BFA37E] w-8"></div>
                 <span className="text-[10px] tracking-[0.4em] font-bold text-[#BFA37E]">HOTEL</span>
               </div>
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
              <li><Link to="/faq" className="hover:text-[#BFA37E] transition-colors">FAQ</Link></li>
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
                  <span>+91 62672 76957</span>
                  <span>+91 96302 52729</span>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-[#BFA37E] shrink-0" />
                <span>bhopalinn@gmail.com</span>
              </li>
              <li className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <MessageCircle size={18} className="text-[#BFA37E] shrink-0" />
                    <span className="font-bold uppercase tracking-widest text-[10px]">WhatsApp Support</span>
                </div>
                <div className="flex flex-col gap-2 pl-7 text-[11px]">
                    <a href="https://wa.me/916267276957" target="_blank" rel="noopener noreferrer" className="hover:text-[#BFA37E] transition-colors">+91 62672 76957 (Primary)</a>
                    <a href="https://wa.me/919630252729" target="_blank" rel="noopener noreferrer" className="hover:text-[#BFA37E] transition-colors">+91 96302 52729</a>
                    <a href="https://wa.me/917225888650" target="_blank" rel="noopener noreferrer" className="hover:text-[#BFA37E] transition-colors">+91 72258 88650</a>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 4 - Social & Times */}
          <div className="flex flex-col gap-6 lg:items-end lg:text-right">
            <h4 className="font-serif text-lg font-bold text-[#BFA37E] uppercase tracking-wider">Social Connect</h4>
            <div className="flex gap-4 lg:justify-end">
              {[Instagram, Facebook, MessageCircle].map((Icon, idx) => (
                <a key={idx} href="#" className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-[#BFA37E] hover:text-white transition-all rounded-sm bg-white/5">
                  <Icon size={18} />
                </a>
              ))}
            </div>
            <div className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex flex-col gap-1 lg:items-end">
              <span>Check-in: 12:00 PM</span>
              <span>Check-out: 11:00 AM</span>
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
    </footer>
  );
};

export default Footer;
