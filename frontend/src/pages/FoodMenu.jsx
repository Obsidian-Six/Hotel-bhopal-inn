import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import { ShoppingCart, X, Plus, Minus, Send, ChevronLeft, ArrowLeft } from 'lucide-react';

const FoodMenu = () => {
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [specials, setSpecials] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [viewMode, setViewMode] = useState('categories'); // 'categories' or 'items'
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [orderData, setOrderData] = useState({ name: '', address: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [catRes, itemRes, specialRes] = await Promise.all([
                axios.get(`${config.API_URL}/api/menu/categories`),
                axios.get(`${config.API_URL}/api/menu/items`),
                axios.get(`${config.API_URL}/api/menu/specials`).catch(() => ({ data: [] }))
            ]);
            setCategories(catRes.data);
            setItems(itemRes.data);
            setSpecials(specialRes.data || []);
        } catch (err) {
            console.error('Error fetching menu data:', err);
        }
    };

    const handleCategoryClick = (catId) => {
        setActiveCategory(catId);
        setViewMode('items');
        window.scrollTo({ top: document.getElementById('menu-section').offsetTop - 120, behavior: 'smooth' });
    };

    const addToCart = (item) => {
        const idToMatch = item._id || item.name;
        const existing = cart.find(i => (i._id || i.name) === idToMatch);
        if (existing) {
            setCart(cart.map(i => (i._id || i.name) === idToMatch ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setCart([...cart, { ...item, quantity: 1 }]);
        }
    };

    const removeFromCart = (item) => {
        const idToMatch = item._id || item.name;
        const existing = cart.find(i => (i._id || i.name) === idToMatch);
        if (existing.quantity > 1) {
            setCart(cart.map(i => (i._id || i.name) === idToMatch ? { ...i, quantity: i.quantity - 1 } : i));
        } else {
            setCart(cart.filter(i => (i._id || i.name) !== idToMatch));
        }
    };

    const handlePlaceOrder = () => {
        if (!orderData.name || !orderData.address) {
            alert('Please fill in your name and address');
            return;
        }

        const orderItems = cart.map(item => `${item.name} (x${item.quantity}) - ₹${(item.cost || item.price || 0) * item.quantity}`).join('\n');
        const cartTotal = cart.reduce((acc, item) => acc + ((item.cost || item.price || 0) * item.quantity), 0);
        
        const message = `*NEW FOOD ORDER - BHOPAL INN*\n\n*Customer Details:*\nName: ${orderData.name}\nAddress: ${orderData.address}\n\n*Order Summary:*\n${orderItems}\n\n*Total Amount: ₹${cartTotal}*`;
        
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/916267276957?text=${encodedMessage}`, '_blank');
        
        setCart([]);
        setShowOrderForm(false);
        setIsCartOpen(false);
    };

    const filteredItems = items.filter(item => item.category?._id === activeCategory);
    const cartTotal = cart.reduce((acc, item) => acc + ((item.cost || item.price || 0) * item.quantity), 0);

    return (
        <div className="min-h-screen flex flex-col bg-[#F4F7F6]">
            <header className="fixed top-0 z-[200] w-full shadow-sm bg-white">
                <TopBar />
                <Navbar light={true} />
            </header>

            <main className="flex-grow pt-[104px]">
                {/* 1. Main Hero Image */}
                <div className="w-full h-[50vh] md:h-[60vh] relative overflow-hidden">
                    <img 
                        src="/images/delicious_food_hero.png" 
                        alt="Delicious Food Hero" 
                        className="w-full h-full object-cover" 
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop' }}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-center">
                            <h1 className="text-5xl md:text-7xl font-serif text-white mb-4 uppercase tracking-widest drop-shadow-2xl">Our <span className="text-[#BFA37E]">Menu</span></h1>
                            <p className="text-white/90 font-light text-lg md:text-xl tracking-wider">Luxurious dining at its finest.</p>
                        </div>
                    </div>
                </div>

                <div id="menu-section" className="container mx-auto px-4 lg:px-8 py-16">
                    
                    {viewMode === 'categories' ? (
                        /* CATEGORY GRID (Image 1 Style) */
                        <div className="animate-fade-in">
                            <div className="text-center mb-12 relative flex items-center justify-center">
                                <div className="absolute w-full h-[1px] bg-slate-300 z-0"></div>
                                <h2 className="text-xl md:text-2xl font-bold text-slate-700 uppercase tracking-widest bg-[#F4F7F6] px-8 z-10 relative">Our Products</h2>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
                                {categories.map((cat) => (
                                    <button
                                        key={cat._id}
                                        onClick={() => handleCategoryClick(cat._id)}
                                        className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-3 flex flex-col items-center group border border-slate-100"
                                    >
                                        <div className="w-full aspect-square rounded-xl overflow-hidden mb-4">
                                            <img src={`${config.API_URL}${cat.image}`} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-[#BFA37E] transition-colors pb-2">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* SIDEBAR + ITEMS GRID (Image 3 Style) */
                        <div className="animate-fade-in">
                            <button 
                                onClick={() => setViewMode('categories')}
                                className="mb-8 flex items-center gap-2 text-slate-500 hover:text-[#BFA37E] text-xs font-bold uppercase tracking-widest transition-colors"
                            >
                                <ArrowLeft size={16} /> Back to Products
                            </button>

                            <div className="flex flex-col lg:flex-row gap-12">
                                {/* Left Sidebar */}
                                <div className="lg:w-1/4">
                                    <div className="sticky top-32 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 pb-4 border-b border-slate-100">All Categories</h3>
                                        <div className="space-y-2">
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat._id}
                                                    onClick={() => setActiveCategory(cat._id)}
                                                    className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeCategory === cat._id ? 'bg-[#000000] text-white shadow-md' : 'text-[#000000] hover:bg-slate-50'}`}
                                                >
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Items Grid */}
                                <div className="lg:w-3/4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <AnimatePresence mode="popLayout">
                                            {filteredItems.map((item) => (
                                                <motion.div
                                                    key={item._id}
                                                    layout
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col group"
                                                >
                                                    <div className="aspect-[16/11] relative overflow-hidden">
                                                        <img src={`${config.API_URL}${item.picture}`} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-2 rounded-xl shadow-md">
                                                            <div className={`w-4 h-4 border-[1.5px] p-[2px] flex items-center justify-center ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                                                                <div className={`w-full h-full rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-6 flex-grow flex flex-col">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h3 className="text-lg font-serif font-bold text-[#000000] leading-tight">{item.name}</h3>
                                                            {item.cost && <span className="text-lg font-black text-[#BFA37E]">₹{item.cost}</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-full">{item.quantity}</span>
                                                        </div>
                                                        <p className="text-slate-500 text-xs font-light leading-relaxed mb-6 line-clamp-2">{item.description}</p>
                                                        
                                                        <button 
                                                            onClick={() => addToCart(item)}
                                                            className="mt-auto w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#BFA37E] hover:text-white hover:border-[#BFA37E] hover:shadow-lg transition-all duration-300"
                                                        >
                                                            Add +
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        {filteredItems.length === 0 && (
                                            <div className="col-span-full py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                                No items available in this category.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Super Foods / 2nd Hero Image */}
                <div className="w-full h-[40vh] relative overflow-hidden mb-16">
                    <img 
                        src="/images/super_foods_hero.png" 
                        alt="Super Foods Hero" 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex items-center">
                        <div className="container mx-auto px-4 lg:px-12">
                            <h2 className="text-4xl md:text-6xl font-serif text-white mb-4">SUPER <span className="text-green-500">FOODS</span></h2>
                            <p className="text-white/90 text-lg md:text-xl font-light tracking-wide max-w-lg">Fresh, healthy, and incredibly delicious.</p>
                        </div>
                    </div>
                </div>

                {/* 3. Specials Section (Image 2 Style) */}
                {specials.length > 0 && (
                    <div className="container mx-auto px-4 lg:px-8 pb-24">
                        <div className="space-y-20">
                            {specials.map((special, idx) => (
                                <div key={special._id || idx}>
                                    {/* Special Title */}
                                    <div className="text-center mb-8 relative flex items-center justify-center">
                                        <div className="absolute w-full h-[1px] bg-slate-300 z-0"></div>
                                        <h3 className="text-xl md:text-2xl font-bold text-slate-700 uppercase tracking-widest bg-[#F4F7F6] px-8 z-10 relative">{special.heading}</h3>
                                    </div>

                                    <div className="flex flex-col lg:flex-row gap-6">
                                        {/* Left Category Image (Vertical) */}
                                        <div className="lg:w-1/4 flex-shrink-0">
                                            <div className="w-full h-full min-h-[300px] lg:h-[450px] rounded-2xl overflow-hidden shadow-md">
                                                <img src={`${config.API_URL}${special.image}`} alt={special.heading} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                                            </div>
                                        </div>
                                        
                                        {/* Right Food Items Grid */}
                                        <div className="lg:w-3/4 overflow-x-auto no-scrollbar">
                                            <div className="flex lg:grid lg:grid-cols-3 gap-6 pb-4">
                                                {special.items?.map((item, i) => (
                                                    <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col group min-w-[240px] lg:min-w-0">
                                                        <div className="aspect-[4/3] relative overflow-hidden">
                                                            <img src={item.picture ? `${config.API_URL}${item.picture}` : `${config.API_URL}${special.image}`} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                        </div>
                                                        <div className="p-5 flex-grow flex flex-col">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className={`w-3 h-3 border-[1px] p-[1.5px] flex items-center justify-center ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                                                                    <div className={`w-full h-full rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                                </div>
                                                            </div>
                                                            <h4 className="text-sm font-bold text-[#000000] mb-2 leading-tight">{item.name}</h4>
                                                            {item.description && <p className="text-[10px] text-slate-500 mb-4 line-clamp-2">{item.description}</p>}
                                                            
                                                            <div className="mt-auto flex justify-between items-center pt-2">
                                                                <span className="text-sm font-black text-slate-700">₹{item.price}</span>
                                                                <button 
                                                                    onClick={() => addToCart({ ...item, cost: item.price, _id: `special-${idx}-${i}`, picture: item.picture || special.image })}
                                                                    className="bg-white border border-slate-300 text-slate-700 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#BFA37E] hover:text-white hover:border-[#BFA37E] transition-all shadow-sm"
                                                                >
                                                                    Add +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!special.items || special.items.length === 0) && (
                                                    <div className="col-span-full py-12 text-slate-400 italic text-sm">No items listed in this special yet.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Cart Float */}
            <AnimatePresence>
                {cart.length > 0 && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsCartOpen(true)}
                        className="fixed bottom-28 right-8 z-[200] bg-[#000000] text-white p-4 rounded-full shadow-2xl flex items-center gap-3 group border border-[#BFA37E]/30"
                    >
                        <ShoppingCart size={24} />
                        <span className="bg-[#BFA37E] text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold">
                            {cart.reduce((acc, i) => acc + i.quantity, 0)}
                        </span>
                        <div className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 flex items-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest pl-2 whitespace-nowrap">
                                View Order
                            </span>
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Cart Drawer */}
            <AnimatePresence>
                {isCartOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]"
                        />
                        <motion.div 
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[400] shadow-2xl flex flex-col"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-[#000000] text-white">
                                <h2 className="text-2xl font-serif">Your Order</h2>
                                <button onClick={() => setIsCartOpen(false)} className="hover:text-[#BFA37E] transition-colors"><X size={24} /></button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-8 space-y-6">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                                            <img src={item.picture.startsWith('/') ? item.picture : `${config.API_URL}${item.picture}`} className="w-full h-full object-cover" alt={item.name} />
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="text-xs font-bold text-[#000000] uppercase leading-tight mb-1">{item.name}</h4>
                                            <p className="text-[10px] font-black text-[#BFA37E]">₹{(item.cost || item.price || 0)} x {item.quantity}</p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                            <button onClick={() => removeFromCart(item)} className="text-slate-400 hover:text-[#000000]"><Minus size={14} /></button>
                                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => addToCart(item)} className="text-slate-400 hover:text-[#000000]"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                                {cart.length === 0 && (
                                    <div className="text-center text-slate-400 py-12 text-[10px] font-bold uppercase tracking-widest">
                                        Your cart is empty
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
                                    <span className="text-3xl font-black text-[#000000]">₹{cartTotal}</span>
                                </div>
                                {showOrderForm ? (
                                    <div className="space-y-4">
                                        <input 
                                            type="text" 
                                            placeholder="Your Name"
                                            value={orderData.name}
                                            onChange={(e) => setOrderData({ ...orderData, name: e.target.value })}
                                            className="w-full bg-white border border-slate-200 p-4 text-xs font-bold rounded-xl focus:outline-none focus:border-[#000000]"
                                        />
                                        <textarea 
                                            placeholder="Delivery Address / Room Number"
                                            value={orderData.address}
                                            onChange={(e) => setOrderData({ ...orderData, address: e.target.value })}
                                            className="w-full bg-white border border-slate-200 p-4 text-xs font-bold rounded-xl focus:outline-none focus:border-[#000000] h-24"
                                        />
                                        <button 
                                            onClick={handlePlaceOrder}
                                            disabled={cart.length === 0}
                                            className="w-full bg-[#25D366] text-white py-5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#1ebd5c] transition-all shadow-lg"
                                        >
                                            <Send size={16} /> Order via WhatsApp
                                        </button>
                                        <button 
                                            onClick={() => setShowOrderForm(false)}
                                            className="w-full text-slate-400 hover:text-[#000000] text-[10px] font-bold uppercase tracking-widest pt-2 transition-colors"
                                        >
                                            Back to Cart
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setShowOrderForm(true)}
                                        disabled={cart.length === 0}
                                        className="w-full bg-[#000000] text-white py-5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#BFA37E] transition-all shadow-lg disabled:opacity-50"
                                    >
                                        Proceed to Checkout
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <Footer />
            <style dangerouslySetInnerHTML={{ __html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .animate-fade-in { animation: fadeIn 0.4s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}} />
        </div>
    );
};

export default FoodMenu;
