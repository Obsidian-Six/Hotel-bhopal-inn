import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import config from '../config';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import Testimonials from '@/components/home/Testimonials';
import { Check, MessageCircle } from 'lucide-react';

const API_BASE = config.API_URL;

const About = () => {


  useEffect(() => {
    window.scrollTo(0, 0);

  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="fixed top-0 z-[200] w-full">
        <TopBar />
        <Navbar />
      </header>

      <main className="flex-grow">
        {/* Hero Section - 125vh height */}
        <section className="relative min-h-[125vh] flex items-center justify-center overflow-hidden pt-20">
          <img 
            src="/about_hero.png" 
            alt="About Hotel Bhopal Inn" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          
          <div className="relative z-10 text-center px-4 max-w-6xl mt-20">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white text-xs lg:text-sm font-bold uppercase tracking-[0.6em] mb-4"
            >
              Discover Our Story
            </motion.p>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-8xl font-serif text-white mb-6 uppercase leading-tight tracking-wide"
            >
              About <br className="hidden md:block" /> Hotel Bhopal Inn
            </motion.h1>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-24 bg-[#FDFBF7]">
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl text-center">
            <h2 className="text-3xl md:text-5xl font-serif text-[#000000] mb-6 uppercase tracking-wide">
              Our Story
            </h2>
            <div className="h-[1px] w-24 bg-[#BFA37E] mx-auto mb-10"></div>
            <p className="text-slate-600 text-lg leading-relaxed font-light">
              Hotel Bhopal Inn by Ten on Ten Stays was created with a simple belief — every guest deserves comfort, warmth, and value. Centrally located in Bhopal city, we serve business travellers, families, and transit guests with the same level of care and hospitality. Our 16 rooms are designed to offer the best budget experience in the city.
            </p>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-serif text-[#000000] mb-6 uppercase tracking-wide">
                Why Choose Hotel Bhopal Inn
              </h2>
              <div className="h-[1px] w-24 bg-[#BFA37E] mx-auto"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {[
                "Budget-friendly rates with no compromise on quality",
                "City Centre location — 10 min from Rani Kamlapati Railway Station",
                "24-hour hot and cold water | Full AC | High-speed Wi-Fi",
                "Cooperative, well-trained staff available round the clock",
                "Banquet hall and in-house catering for events",
                "Direct booking — best rates guaranteed, no OTA commission"
              ].map((reason, idx) => (
                <div key={idx} className="flex items-start gap-4 p-6 border border-slate-100 hover:shadow-lg transition-shadow bg-slate-50/50">
                  <div className="mt-1 bg-[#BFA37E] rounded-full p-1 text-white">
                    <Check size={16} />
                  </div>
                  <p className="text-slate-700 font-medium text-lg">{reason}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ten on Ten Stays Brand */}
        <section className="py-24 bg-[#000000] text-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl text-center">
            <div className="flex justify-center mb-6">
                <img src="/logo.png" alt="Hotel Bhopal Inn Logo" className="h-32 md:h-48 w-auto object-contain bg-white rounded-sm" />
            </div>
            <div className="h-[1px] w-24 bg-[#BFA37E] mx-auto mb-10"></div>
            <p className="text-slate-300 text-lg leading-relaxed font-light">
              Ten on Ten Stays represents a commitment to excellence in hospitality. We believe in providing top-tier service, impeccable cleanliness, and memorable experiences for every guest. Our brand stands for reliability, luxury within reach, and a warm, welcoming environment that makes you feel instantly at home.
            </p>
          </div>
        </section>

        {/* Testimonials Section */}
        <Testimonials />
      </main>


      <Footer />
    </div>
  );
};

export default About;
