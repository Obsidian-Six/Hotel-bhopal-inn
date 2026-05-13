import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import TopBar from '@/components/layout/TopBar';
import Footer from '@/components/layout/Footer';

const GALLERY_API_URL = `${config.API_URL}/api/event-gallery`;

const defaultImages = [
  {
    _id: '1',
    title: 'Modern Dining Space',
    category: 'Interior & Exterior',
    imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop'
  },
  {
    _id: '2',
    title: 'Signature Restaurant Table',
    category: 'Interior & Exterior',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop'
  },
  {
    _id: '3',
    title: 'Grand Banquet Setup',
    category: 'Interior & Exterior',
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    _id: '4',
    title: 'Elegant Banquet Event',
    category: 'Interior & Exterior',
    imageUrl: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?q=80&w=2070&auto=format&fit=crop'
  },
  {
    _id: '5',
    title: 'Executive Suite',
    category: 'Interior & Exterior',
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2074&auto=format&fit=crop'
  },
  {
    _id: '6',
    title: 'Luxury King Bed',
    category: 'Interior & Exterior',
    imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2070&auto=format&fit=crop'
  },
  {
    _id: '7',
    title: 'Lobby Design',
    category: 'Interior & Exterior',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop'
  },
  {
    _id: '8',
    title: 'Boutique Facade',
    category: 'Interior & Exterior',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop'
  }
];

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    try {
      const res = await axios.get(GALLERY_API_URL);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setImages(res.data);
        extractCategories(res.data);
      } else {
        setImages(defaultImages);
        extractCategories(defaultImages);
      }
    } catch (err) {
      console.error('Error fetching gallery images:', err);
      setImages(defaultImages);
      extractCategories(defaultImages);
    }
  };

  const extractCategories = (items) => {
    const cats = ['All', ...new Set(items.map(item => item.category).filter(Boolean))];
    setCategories(cats);
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${config.API_URL}${url}`;
  };

  const filteredImages = activeCategory === 'All' 
    ? images 
    : images.filter(img => img.category === activeCategory);

  const groupedImages = filteredImages.reduce((acc, img) => {
    const cat = img.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(img);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] font-sans overflow-x-hidden antialiased select-none scroll-smooth">
      {/* Sticky Top Navigation */}
      <header className="fixed top-0 z-[100] w-full transition-all duration-500">
        <TopBar />
        <Navbar />
      </header>

      {/* LUXURY FULL-SCREEN HERO SECTION WITH DARK OVERLAY */}
      <section className="relative min-h-[125vh] w-full bg-[#0A192F] overflow-hidden flex items-center justify-center pt-20">
        {/* Background Image with warm lighting, premium decor */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/Room.jpeg" 
            className="w-full h-full object-cover" 
            alt="Gallery Header" 
          />
          {/* Direct Dark Overlay exactly matching Rooms & Events pages */}
          <div className="absolute inset-0 bg-black/40 z-10" />
        </div>

        {/* Center Text with off-white/ivory font color exactly per request */}
        <div className="relative z-20 text-center container mx-auto px-4 mt-20 flex flex-col justify-center items-center">
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[#BFA37E] text-[12px] md:text-sm font-bold uppercase tracking-[0.6em] mb-4 select-none"
          >
            HOTEL BHOPAL INN
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-3xl md:text-6xl lg:text-7xl font-serif text-[#FAFAFA] tracking-wider mb-6 uppercase leading-tight select-none font-medium max-w-5xl"
          >
            EXPLORE BHOPAL INN
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-[#E6DFD3] text-xs md:text-sm font-light uppercase tracking-[0.4em] max-w-2xl mx-auto border-l-2 border-[#BFA37E] pl-6 py-2 select-none"
          >
            See, what we have in store for you
          </motion.p>
        </div>
      </section>

      {/* Category Filter Navigation Pills */}
      <div className="container mx-auto px-4 lg:px-12 py-12 -mt-16 relative z-30 flex justify-center">
        <div className="flex flex-wrap justify-center gap-2 bg-white px-6 py-3 border border-[#F1E9DA] shadow-xl max-w-4xl rounded-sm">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-sm ${activeCategory === cat ? 'bg-[#0A192F] text-white' : 'bg-transparent text-[#0A192F] hover:text-[#BFA37E]'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* INTERIOR & EXTERIOR GALLERY SECTION */}
      <div className="container mx-auto px-4 lg:px-12 pb-24 space-y-20">
        {Object.entries(groupedImages).map(([categoryName, catImages]) => (
          <div key={categoryName} className="space-y-12">
            {/* Category Section Header */}
            <div className="flex flex-col items-center text-center">
              <h2 className="text-2xl md:text-3xl font-serif text-[#0A192F] tracking-[0.15em] uppercase border-b border-[#BFA37E]/40 pb-4 mb-2 min-w-[240px] font-medium">
                {categoryName}
              </h2>
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-slate-400">Perfectly Curated Spaces</span>
            </div>

            {/* Premium Pixel-Perfect Square 3-Column Flex-Grid with perfect alignment & centered last row */}
            <div className="flex flex-wrap justify-center gap-8">
              {catImages.map((img) => (
                <div 
                  key={img._id} 
                  className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.3333%-1.3333rem)] max-w-full sm:max-w-none group relative bg-white border border-slate-200 hover:border-[#BFA37E] transition-all duration-500 overflow-hidden cursor-pointer aspect-square flex flex-col justify-between p-4 shadow-sm hover:shadow-2xl rounded-sm flex-shrink-0 flex-grow-0"
                  onClick={() => setSelectedImage(img)}
                >
                  <div className="relative w-full h-full overflow-hidden border border-slate-200 bg-slate-50 rounded-sm">
                    <motion.img 
                      src={getImageUrl(img.imageUrl)} 
                      alt={img.title} 
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Dark Overlay & Centered Magnifying glass fades in on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.7 }}
                        whileHover={{ scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-3 rounded-full shadow-2xl border border-slate-200 flex items-center justify-center cursor-pointer"
                      >
                        <Search size={18} className="text-[#0A192F]" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* LUXURIOUS CENTRIC LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0A192F]/85 backdrop-blur-md cursor-pointer"
              onClick={() => setSelectedImage(null)}
            />
            
            <motion.div 
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="relative max-w-5xl w-full bg-white p-3 border border-white shadow-2xl z-20 flex flex-col rounded-sm"
            >
              {/* Close Icon Button */}
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-6 right-6 z-30 bg-[#0A192F] text-white p-3 rounded-full hover:bg-[#BFA37E] transition-all duration-300 shadow-xl"
              >
                <X size={20} />
              </button>

              <div className="relative aspect-[16/10] sm:aspect-video bg-slate-50 overflow-hidden rounded-sm">
                <img 
                  src={getImageUrl(selectedImage.imageUrl)} 
                  alt={selectedImage.title} 
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* Lightbox Caption */}
              <div className="p-6 text-center bg-white">
                <span className="text-[10px] font-bold text-[#BFA37E] uppercase tracking-[0.3em] mb-2 block">{selectedImage.category}</span>
                <h3 className="text-xl md:text-2xl font-serif text-[#0A192F] tracking-wide mb-1 uppercase">{selectedImage.title}</h3>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      <Footer />
    </div>
  );
};

export default Gallery;
