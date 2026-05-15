
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Maximize, Sun, Wind, Tv, Car, 
  CheckCircle2, Calendar, Utensils, 
  ChevronRight, X, GraduationCap, Heart, 
  Cake, PartyPopper, Briefcase, Plus,
  Facebook, Instagram, Youtube, MessageCircle,
  Award, Coffee, Pizza
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';

const BanquetPage = () => {
  const [banquetData, setBanquetData] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    emailAddress: '',
    eventType: 'Corporate',
    preferredDate: '',
    noOfGuests: '',
    mealRequirement: 'Veg Only',
    specialRequirements: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        const [banquetRes, galleryRes] = await Promise.all([
          axios.get(`${config.API_URL}/api/banquet`),
          axios.get(`${config.API_URL}/api/event-gallery`)
        ]);
        setBanquetData(banquetRes.data);
        setGalleryImages(galleryRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (banquetData?.heroImages?.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % banquetData.heroImages.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banquetData?.heroImages]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage({ type: '', text: '' });

    try {
      await axios.post(`${config.API_URL}/api/enquiries`, formData);
      setSubmitMessage({ 
        type: 'success', 
        text: 'Thank you! Your enquiry has been sent. We will contact you shortly.' 
      });
      setFormData({
        fullName: '',
        mobileNumber: '',
        emailAddress: '',
        eventType: 'Corporate',
        preferredDate: '',
        noOfGuests: '',
        mealRequirement: 'Veg Only',
        specialRequirements: ''
      });
    } catch (err) {
      setSubmitMessage({ 
        type: 'error', 
        text: 'Something went wrong. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!banquetData) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-[#BFA37E] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const eventTypes = [
    { icon: <GraduationCap className="w-6 h-6" />, title: 'Corporate Meetings & Conferences', note: 'Seminars, workshops & team off-sites' },
    { icon: <Heart className="w-6 h-6" />, title: 'Engagement & Wedding Ceremonies', note: 'Grand celebrations & intimate rituals' },
    { icon: <Cake className="w-6 h-6" />, title: 'Birthday & Anniversary Celebrations', note: 'Milestone moments with family' },
    { icon: <Users className="w-6 h-6" />, title: 'Family Functions & Gatherings', note: 'Traditional poojas & family get-togethers' },
    { icon: <PartyPopper className="w-6 h-6" />, title: 'Social Parties & Celebrations', note: 'Cocktail nights & theme parties' },
    { icon: <Briefcase className="w-6 h-6" />, title: 'Product Launches & Brand Events', note: 'Press meets & corporate gala nights' },
  ];

  const highlights = [
    { icon: <Wind className="w-5 h-5 text-[#BFA37E]" />, label: 'Full AC', active: banquetData.airConditioning },
    { icon: <Tv className="w-5 h-5 text-[#BFA37E]" />, label: 'AV Equipment', active: banquetData.avEquipment },
    { icon: <Utensils className="w-5 h-5 text-[#BFA37E]" />, label: 'In-House Catering', active: true },
    { icon: <Car className="w-5 h-5 text-[#BFA37E]" />, label: 'Ample Parking', active: true },
  ];

  const groupedGallery = galleryImages.reduce((acc, img) => {
    if (!acc[img.category]) acc[img.category] = [];
    acc[img.category].push(img);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
      <header className="fixed top-0 z-[200] w-full">
        <TopBar />
        <Navbar />
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative min-h-[125vh] flex items-center justify-center overflow-hidden pt-20">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <img 
                src="/banquet_main.jpg" 
                className="w-full h-full object-cover" 
                alt="Hero"
              />
              <div className="absolute inset-0 bg-black/40"></div>
            </motion.div>
          </AnimatePresence>
          
          <div className="relative z-10 text-center px-6 max-w-5xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <span className="text-[10px] font-bold text-[#BFA37E] uppercase tracking-[0.6em] mb-6 block">Grand Celebrations</span>
              <h1 className="text-5xl md:text-8xl font-serif font-bold text-white mb-8 leading-tight uppercase tracking-tight">
                {banquetData.title}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 font-serif italic max-w-3xl mx-auto">{banquetData.subHeadline}</p>
            </motion.div>
          </div>

          <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-6 z-20">
            <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#000000] hover:bg-[#BFA37E] hover:text-white transition-all shadow-lg"><Instagram size={18} /></button>
            <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#000000] hover:bg-[#BFA37E] hover:text-white transition-all shadow-lg"><Youtube size={18} /></button>
          </div>
        </section>

        {/* Section 1: Hall Overview */}
        <section className="py-24 px-6 lg:px-24 bg-[#FDFBF7]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-12">
                <div>
                  <span className="text-[10px] font-bold text-[#BFA37E] uppercase tracking-[0.4em] mb-4 block">Elegance Redefined</span>
                  <h2 className="text-4xl md:text-6xl font-serif font-bold mb-8 text-[#000000]">Our Banquet Hall</h2>
                  <p className="text-slate-600 text-lg leading-relaxed font-light">
                    Step into a world of sophisticated grandeur. Our banquet hall is a masterpiece of design, offering an unparalleled venue for your most precious moments.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {[
                    { icon: <Users />, label: 'Capacity', value: `${banquetData.capacityTheatre} - ${banquetData.capacityBanquet}` },
                    { icon: <Maximize />, label: 'Size', value: `${banquetData.dimensions} sq.ft` },
                    { icon: <Sun />, label: 'Lighting', value: banquetData.naturalLight ? 'Natural' : 'Ambient' },
                    { icon: <Car />, label: 'Parking', value: `${banquetData.parking} Slots` }
                  ].map((item, i) => (
                    <div key={i} className="p-6 bg-white border border-slate-100 shadow-sm">
                      <div className="text-[#BFA37E] mb-4">{item.icon}</div>
                      <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</h4>
                      <p className="text-lg font-serif font-bold text-[#000000]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  {banquetData.overviewPhotos?.slice(0, 4).map((photo, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`relative aspect-square border-[12px] border-white shadow-2xl overflow-hidden rounded-sm ${i === 1 || i === 2 ? 'translate-y-8' : ''}`}
                    >
                      <img src={`${config.API_URL}${photo}`} className="w-full h-full object-cover" alt="Overview" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Event Types */}
        <section className="py-24 bg-[#000000] text-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <span className="text-[10px] font-bold text-[#BFA37E] uppercase tracking-[0.4em] mb-4 block">Events We Host</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold">Perfect for Every Occasion</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {eventTypes.map((event, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -10 }}
                  className="group p-10 bg-white/5 border border-white/10 rounded-sm hover:bg-[#BFA37E] transition-all duration-500"
                >
                  <div className="w-14 h-14 bg-[#BFA37E] group-hover:bg-white flex items-center justify-center rounded-sm mb-8 transition-colors">
                    <div className="text-white group-hover:text-[#BFA37E]">{event.icon}</div>
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-4">{event.title}</h3>
                  <p className="text-white/60 group-hover:text-white/90 leading-relaxed">{event.note}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Catering */}
        <section className="py-24 px-6 md:px-24 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-20 items-center">
              <div className="lg:w-1/2">
                <div className="relative rounded-sm overflow-hidden shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=1200" alt="Catering" className="w-full aspect-[4/5] object-cover" />
                  <div className="absolute inset-0 bg-black/30"></div>
                </div>
              </div>
              
              <div className="lg:w-1/2 space-y-10">
                <div>
                  <span className="text-[10px] font-bold text-[#BFA37E] uppercase tracking-[0.4em] mb-4 block">Taste of Perfection</span>
                  <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8 text-[#000000]">In-House Catering</h2>
                  <p className="text-slate-600 text-lg leading-relaxed italic border-l-4 border-[#BFA37E] pl-6 py-2">
                    "Our experienced kitchen team serves authentic Indian cuisine with a focus on quality and hygiene."
                  </p>
                </div>

                <div className="space-y-8">
                  <div>
                    <h4 className="text-[10px] font-bold text-[#000000] uppercase tracking-widest mb-4 flex items-center gap-2"><Coffee size={14} className="text-[#BFA37E]" /> Meal Options Available</h4>
                    <div className="flex flex-wrap gap-3">
                      {['Breakfast', 'Lunch', 'High Tea', 'Dinner', 'Cocktail Snacks'].map((opt) => (
                        <span key={opt} className="px-5 py-2 border border-slate-100 bg-[#FDFBF7] text-[10px] font-bold uppercase tracking-widest text-slate-500">{opt}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-[#000000] uppercase tracking-widest mb-4 flex items-center gap-2"><Pizza size={14} className="text-[#BFA37E]" /> Cuisine Types</h4>
                    <div className="flex flex-wrap gap-3">
                      {['North Indian', 'South Indian', 'Chinese', 'Continental'].map((type) => (
                        <span key={type} className="flex items-center gap-2 px-5 py-2 bg-[#BFA37E]/10 text-[#BFA37E] text-[10px] font-bold uppercase tracking-widest font-bold">
                          <CheckCircle2 size={12} /> {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="pt-8 border-t border-slate-100">
                  <div className="flex items-center gap-4 p-4 bg-[#FDFBF7] border border-[#BFA37E]/20">
                    <Award size={24} className="text-[#BFA37E]" />
                    <p className="text-[11px] font-bold text-[#000000] uppercase tracking-widest">Custom menus available on request. Contact for per-head pricing.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Photo Gallery Sections */}
        <section className="py-24 bg-[#FDFBF7]">
          <div className="max-w-7xl mx-auto px-6 lg:px-24">
            {Object.entries(groupedGallery).map(([category, images]) => (
              <div key={category} className="mb-32 last:mb-0">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-serif font-bold text-[#000000] uppercase tracking-widest mb-4">{category}</h2>
                  <div className="h-[2px] w-24 bg-[#BFA37E] mx-auto opacity-30" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {images.map((img, i) => (
                    <motion.div 
                      key={img._id}
                      whileHover={{ y: -10 }}
                      className="group relative bg-white border-[1px] border-slate-100 p-3 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer"
                      onClick={() => setSelectedImage(img)}
                    >
                      <div className="aspect-[4/3] overflow-hidden relative border-4 border-white">
                        <img src={`${config.API_URL}${img.imageUrl}`} className="w-full h-full object-cover" alt={img.title} />
                      </div>
                      <div className="mt-6 text-center">
                        <h4 className="text-lg font-serif text-[#000000]">{img.title}</h4>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Enquiry Form */}
        <section id="book" className="py-24 px-6 lg:px-24 bg-white">
          <div className="max-w-4xl mx-auto bg-white p-10 md:p-20 shadow-2xl border border-slate-100 relative">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif font-bold text-[#000000] mb-4 uppercase tracking-tighter">Plan Your Event</h2>
              <div className="h-[1px] w-20 bg-[#BFA37E] mx-auto" />
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                <input required name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full bg-[#FDFBF7] border border-slate-100 p-4 text-xs font-bold focus:outline-none focus:border-[#BFA37E]" placeholder="Your Name" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mobile Number</label>
                <input required name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} className="w-full bg-[#FDFBF7] border border-slate-100 p-4 text-xs font-bold focus:outline-none focus:border-[#BFA37E]" placeholder="+91 00000 00000" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                <input required type="email" name="emailAddress" value={formData.emailAddress} onChange={handleInputChange} className="w-full bg-[#FDFBF7] border border-slate-100 p-4 text-xs font-bold focus:outline-none focus:border-[#BFA37E]" placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Event Type</label>
                <select name="eventType" value={formData.eventType} onChange={handleInputChange} className="w-full bg-[#FDFBF7] border border-slate-100 p-4 text-xs font-bold focus:outline-none focus:border-[#BFA37E]">
                  <option>Corporate</option>
                  <option>Wedding</option>
                  <option>Birthday</option>
                  <option>Social</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Preferred Date</label>
                <input required type="date" name="preferredDate" value={formData.preferredDate} onChange={handleInputChange} className="w-full bg-[#FDFBF7] border border-slate-100 p-4 text-xs font-bold focus:outline-none focus:border-[#BFA37E]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No. of Guests</label>
                <input required type="number" name="noOfGuests" value={formData.noOfGuests} onChange={handleInputChange} className="w-full bg-[#FDFBF7] border border-slate-100 p-4 text-xs font-bold focus:outline-none focus:border-[#BFA37E]" placeholder="e.g. 150" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Meal Requirement</label>
                <select name="mealRequirement" value={formData.mealRequirement} onChange={handleInputChange} className="w-full bg-[#FDFBF7] border border-slate-100 p-4 text-xs font-bold focus:outline-none focus:border-[#BFA37E]">
                  <option>Veg Only</option>
                  <option>No Catering Needed</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Special Requirements</label>
                <textarea name="specialRequirements" value={formData.specialRequirements} onChange={handleInputChange} className="w-full bg-[#FDFBF7] border border-slate-100 p-4 text-xs font-bold focus:outline-none focus:border-[#BFA37E]" rows="4" placeholder="Any specific needs..." />
              </div>
              <div className="md:col-span-2 pt-6">
                <button disabled={isSubmitting} className="w-full bg-[#000000] text-white py-6 text-xs font-bold uppercase tracking-[0.3em] hover:bg-[#BFA37E] transition-all duration-500 disabled:opacity-50">
                  {isSubmitting ? 'Processing...' : 'Submit Enquiry'}
                </button>
                {submitMessage.text && <p className={`mt-6 text-center text-[10px] font-bold uppercase tracking-widest ${submitMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{submitMessage.text}</p>}
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer />
      
      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-10"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="max-w-5xl max-h-full">
              <img src={`${config.API_URL}${selectedImage.imageUrl}`} className="max-w-full max-h-[80vh] object-contain shadow-2xl border-4 border-white" alt="Full" />
              <div className="mt-8 text-center text-white">
                <p className="text-[10px] font-bold text-[#BFA37E] uppercase tracking-[0.4em] mb-2">{selectedImage.category}</p>
                <h3 className="text-2xl font-serif">{selectedImage.title}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BanquetPage;
