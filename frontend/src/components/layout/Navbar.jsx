import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, User as UserIcon, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import config from '../../config';

const Navbar = ({ light = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [navLinks, setNavLinks] = useState([
    { 
      name: 'ROOMS', 
      path: '/rooms',
      dropdown: []
    },
    { name: 'BANQUET & EVENTS', path: '/banquet' },
    { name: 'ORDER FOOD', path: '/menu' },
    { name: 'GALLERY', path: '/gallery' },
    { name: 'ABOUT US', path: '/about' },
    { name: 'CONTACT', path: '/contact' },
  ]);

  useEffect(() => {
    // Fetch dynamic room categories for dropdown
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${config.API_URL}/api/rooms`);
        const data = await res.json();
        const dropdown = data.map(r => ({ name: r.title, path: `/rooms/${r.category}` }));
        setNavLinks(prev => prev.map(link => link.name === 'ROOMS' ? { ...link, dropdown } : link));
      } catch (err) {
        console.error('Error fetching room dropdown:', err);
      }
    };
    fetchRooms();
  }, []);

  const showDarkText = isScrolled || light;

  return (
    <nav className={`w-full z-[90] transition-all duration-500 ${showDarkText ? 'bg-white shadow-lg py-2' : 'bg-transparent py-4 lg:py-6'}`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between min-h-[50px]">
          
          {/* Logo */}
          <Link to="/" className="relative z-[100] group">
            <div className={`transition-all duration-500 ${isScrolled ? 'h-10 lg:h-12' : 'h-12 lg:h-20'}`}>
                <div className="h-full w-auto overflow-hidden flex items-center justify-center">
                    <img 
                        src="/logo.png" 
                        alt="Bhopal Inn Logo" 
                        className={`h-full w-auto object-contain transition-transform duration-500 ${isScrolled ? 'scale-[1.8] lg:scale-[2.4]' : 'scale-[2.0] lg:scale-[2.4]'}`}
                    />
                </div>
            </div>
          </Link>


          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <div 
                key={link.name} 
                className="relative group"
                onMouseEnter={() => link.dropdown && setActiveDropdown(link.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link 
                  to={link.path} 
                  className={`flex items-center gap-1 text-[12px] font-bold tracking-widest transition-colors ${showDarkText ? 'text-[#000000] hover:text-[#BFA37E]' : 'text-white/90 hover:text-white'}`}
                >
                  {link.name}
                  {link.dropdown && <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === link.name ? 'rotate-180' : ''}`} />}
                </Link>

                {/* Dropdown Menu */}
                {link.dropdown && (
                  <AnimatePresence>
                    {activeDropdown === link.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-56 bg-white shadow-2xl border-t-2 border-[#BFA37E] py-4 z-50"
                      >
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.name}
                            to={item.path}
                            className="block px-6 py-2 text-[11px] font-bold text-[#000000] hover:bg-[#FDFBF7] hover:text-[#BFA37E] transition-all"
                          >
                            {item.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </nav>

          {/* Book Now Button / User Profile */}
          <div className="hidden lg:block relative">
            {user ? (
                <div>
                    <button 
                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                        className={`flex items-center gap-2 px-6 py-2 rounded-sm text-[12px] font-bold tracking-widest transition-all ${showDarkText ? 'text-[#000000] border border-[#000000]' : 'text-white border border-white hover:bg-white/10'}`}
                    >
                        <UserIcon size={16} />
                        {user.firstName?.toUpperCase()}
                    </button>
                    
                    <AnimatePresence>
                        {profileDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute right-0 top-full mt-2 w-48 bg-white shadow-2xl border-t-2 border-[#BFA37E] py-2 z-50"
                            >
                                <Link 
                                    to="/my-bookings"
                                    onClick={() => setProfileDropdownOpen(false)}
                                    className="block px-6 py-3 text-[11px] font-bold text-[#000000] hover:bg-[#FDFBF7] hover:text-[#BFA37E] transition-all"
                                >
                                    MY BOOKINGS
                                </Link>
                                <button 
                                    onClick={() => { logout(); setProfileDropdownOpen(false); navigate('/'); }}
                                    className="w-full text-left px-6 py-3 text-[11px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-all"
                                >
                                    <LogOut size={14} /> LOGOUT
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <Link 
                  to="/booking" 
                  className={`px-8 py-3 rounded-sm text-[12px] font-bold tracking-widest transition-all shadow-md hover:shadow-lg ${showDarkText ? 'bg-[#BFA37E] text-white hover:bg-[#a68d6d]' : 'bg-white text-[#000000] hover:bg-[#BFA37E] hover:text-white'}`}
                >
                  BOOK NOW
                </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className={`lg:hidden transition-colors ${showDarkText ? 'text-[#000000]' : 'text-white'}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 bg-white z-[100] flex flex-col p-8"
          >
            <div className="flex justify-between items-center mb-12">
              <Link to="/" className="h-12 w-32 md:h-16 md:w-48 overflow-hidden flex items-center justify-center">
                <img src="/logo.png" alt="Bhopal Inn" className="h-full w-full object-contain scale-[2.1] transition-transform" />
              </Link>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X size={32} className="text-[#000000]" />
              </button>
            </div>
            <div className="flex flex-col gap-6 overflow-y-auto">
              {navLinks.map((link) => (
                <div key={link.name} className="flex flex-col gap-4">
                  <Link 
                    to={link.path} 
                    className="text-2xl font-serif font-medium text-[#000000]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                  {link.dropdown && (
                    <div className="flex flex-col gap-3 pl-4 border-l-2 border-[#BFA37E]">
                      {link.dropdown.map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          className="text-lg text-[#000000]/70"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Link 
                to="/booking" 
                className="bg-[#BFA37E] text-white text-center py-4 rounded-sm text-lg font-bold mt-8 shadow-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                BOOK NOW
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
