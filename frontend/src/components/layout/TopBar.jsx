import React from 'react';
import { Mail, Phone, Facebook, Instagram, Music2 } from 'lucide-react';

const TopBar = () => {
  return (
    <div className="bg-[#0A192F]/40 backdrop-blur-md text-white py-2 px-4 border-b border-white/10 hidden lg:block">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8 text-[11px] font-medium tracking-wider">
          <a href="mailto:bhopalinn@gmail.com" className="flex items-center gap-2 hover:text-[#BFA37E] transition-colors">
            <Mail size={14} className="text-[#BFA37E]" />
            bhopalinn@gmail.com
          </a>
          <a href="tel:+916267276957" className="flex items-center gap-2 hover:text-[#BFA37E] transition-colors">
            <Phone size={14} className="text-[#BFA37E]" />
            +91 62672 76957 / 96302 52729 / 72258 88650
          </a>
        </div>
        
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-[#BFA37E] transition-colors"><Facebook size={14} /></a>
          <a href="#" className="hover:text-[#BFA37E] transition-colors"><Instagram size={14} /></a>
          <a href="#" className="hover:text-[#BFA37E] transition-colors"><Music2 size={14} /></a>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
