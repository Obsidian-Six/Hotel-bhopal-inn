import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import { ShoppingCart, X, Plus, Minus, Send, CheckCircle2 } from 'lucide-react';

const FoodMenu = () => {
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [vegFilter, setVegFilter] = useState('veg'); // Always default to veg
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [orderData, setOrderData] = useState({ name: '', address: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [catRes, itemRes] = await Promise.all([
                axios.get(`${config.API_URL}/api/menu/categories`),
                axios.get(`${config.API_URL}/api/menu/items`)
            ]);
            setCategories(catRes.data);
            setItems(itemRes.data);
            if (catRes.data.length > 0) setActiveCategory(catRes.data[0]._id);
        } catch (err) {
            console.error('Error fetching menu data:', err);
        }
    };

    const addToCart = (item) => {
        const existing = cart.find(i => i._id === item._id);
        if (existing) {
            setCart(cart.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setCart([...cart, { ...item, quantity: 1 }]);
        }
    };

    const removeFromCart = (id) => {
        const existing = cart.find(i => i._id === id);
        if (existing.quantity > 1) {
            setCart(cart.map(i => i._id === id ? { ...i, quantity: i.quantity - 1 } : i));
        } else {
            setCart(cart.filter(i => i._id !== id));
        }
    };

    const handlePlaceOrder = () => {
        if (!orderData.name || !orderData.address) {
            alert('Please fill in your name and address');
            return;
        }

        const orderItems = cart.map(item => `${item.name} (x${item.quantity})`).join('\n');
        const message = `*NEW FOOD ORDER - BHOPAL INN*\n\n*Customer Details:*\nName: ${orderData.name}\nAddress: ${orderData.address}\n\n*Order Summary:*\n${orderItems}`;
        
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/916267276957?text=${encodedMessage}`, '_blank');
        
        // Reset cart
        setCart([]);
        setShowOrderForm(false);
        setIsCartOpen(false);
    };

    const filteredItems = items.filter(item => {
        const categoryMatch = item.category?._id === activeCategory;
        const vegMatch = vegFilter === 'all' || (vegFilter === 'veg' && item.isVeg);
        return categoryMatch && vegMatch;
    });

    return (
        <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
            <header className="fixed top-0 z-[200] w-full shadow-sm bg-white">
                <TopBar />
                <Navbar light={true} />
            </header>

            <main className="flex-grow pt-48 pb-24">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-6xl font-serif text-[#000000] mb-4 uppercase">Our <span className="text-[#BFA37E]">Menu</span></h1>
                        <p className="text-slate-500 font-light text-sm">Delicious food delivered to your room or table.</p>
                    </div>

                    {/* Filters & Categories */}
                    <div className="space-y-12 mb-16">
                        {/* Veg Toggle */}
                        <div className="flex justify-center">
                            <div className="flex bg-white/5 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-xl">
                                <button 
                                    className="px-12 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-600 text-white shadow-md flex items-center gap-2 cursor-default"
                                >
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div> 100% Pure Vegetarian Menu
                                </button>
                            </div>
                        </div>

                        {/* Categories */}
                        <div className="flex gap-8 md:gap-12 overflow-x-auto pb-4 no-scrollbar justify-start md:justify-center px-4">
                            {categories.map((cat) => (
                                <button
                                    key={cat._id}
                                    onClick={() => setActiveCategory(cat._id)}
                                    className="flex flex-col items-center gap-3 flex-shrink-0 group"
                                >
                                    <div className={`w-20 h-20 md:w-32 md:h-32 rounded-full p-1 border-[6px] transition-all duration-500 ${activeCategory === cat._id ? 'border-green-500 scale-110 shadow-2xl rotate-6' : 'border-slate-100 grayscale hover:grayscale-0 hover:border-[#BFA37E]'}`}>
                                        <div className="w-full h-full rounded-full overflow-hidden border-[6px] border-white shadow-inner bg-white">
                                            <img src={`${config.API_URL}${cat.image}`} alt={cat.name} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                    <span className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${activeCategory === cat._id ? 'text-green-600' : 'text-slate-400'}`}>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                        <AnimatePresence mode="popLayout">
                            {filteredItems.map((item) => (
                                <motion.div
                                    key={item._id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 flex flex-col group"
                                >
                                    <div className="aspect-[16/11] relative overflow-hidden">
                                        <img src={`${config.API_URL}${item.picture}`} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm p-2 rounded-xl shadow-lg">
                                            <div className={`w-5 h-5 border-2 p-[2px] flex items-center justify-center border-green-500`}>
                                                <div className={`w-full h-full rounded-full bg-green-500`}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 flex-grow flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-serif font-bold text-[#000000]">{item.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="text-[10px] font-bold text-[#BFA37E] uppercase tracking-widest">{item.quantity}</span>
                                            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                            <span className="text-[9px] font-bold text-green-600 uppercase tracking-widest">Vegetarian</span>
                                        </div>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed mb-10 line-clamp-2">{item.description}</p>
                                        
                                        <button 
                                            onClick={() => addToCart(item)}
                                            className="mt-auto w-full bg-[#000000] text-white py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#BFA37E] hover:shadow-xl transition-all duration-300"
                                        >
                                            <Plus size={16} /> Add to Order
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* Cart Float */}
            <AnimatePresence>
                {cart.length > 0 && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsCartOpen(true)}
                        className="fixed bottom-24 right-8 z-[200] bg-[#BFA37E] text-white p-4 rounded-full shadow-2xl flex items-center gap-3 group"
                    >
                        <ShoppingCart size={24} />
                        <span className="bg-white text-[#BFA37E] w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold">
                            {cart.reduce((acc, i) => acc + i.quantity, 0)}
                        </span>
                        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 text-[10px] font-bold uppercase tracking-widest">
                            View Order
                        </span>
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
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300]"
                        />
                        <motion.div 
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[400] shadow-2xl flex flex-col"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-2xl font-serif text-[#000000]">Your Order</h2>
                                <button onClick={() => setIsCartOpen(false)}><X size={24} /></button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-8 space-y-6">
                                {cart.map(item => (
                                    <div key={item._id} className="flex gap-4 items-center">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                            <img src={`${config.API_URL}${item.picture}`} className="w-full h-full object-cover" alt={item.name} />
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="text-sm font-bold text-[#000000] uppercase">{item.name}</h4>
                                        </div>
                                        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1 rounded-full">
                                            <button onClick={() => removeFromCart(item._id)} className="text-[#BFA37E]"><Minus size={14} /></button>
                                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => addToCart(item)} className="text-[#BFA37E]"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Items</span>
                                    <span className="text-2xl font-bold text-[#000000]">{cart.reduce((acc, i) => acc + i.quantity, 0)}</span>
                                </div>
                                {showOrderForm ? (
                                    <div className="space-y-4">
                                        <input 
                                            type="text" 
                                            placeholder="Your Name"
                                            value={orderData.name}
                                            onChange={(e) => setOrderData({ ...orderData, name: e.target.value })}
                                            className="w-full bg-white border border-slate-200 p-4 text-xs font-bold rounded-xl focus:outline-none focus:border-[#BFA37E]"
                                        />
                                        <textarea 
                                            placeholder="Delivery Address / Room Number"
                                            value={orderData.address}
                                            onChange={(e) => setOrderData({ ...orderData, address: e.target.value })}
                                            className="w-full bg-white border border-slate-200 p-4 text-xs font-bold rounded-xl focus:outline-none focus:border-[#BFA37E] h-24"
                                        />
                                        <button 
                                            onClick={handlePlaceOrder}
                                            className="w-full bg-green-600 text-white py-5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                                        >
                                            <Send size={16} /> Confirm Order via WhatsApp
                                        </button>
                                        <button 
                                            onClick={() => setShowOrderForm(false)}
                                            className="w-full text-slate-400 text-[10px] font-bold uppercase tracking-widest pt-2"
                                        >
                                            Back to Items
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setShowOrderForm(true)}
                                        className="w-full bg-[#000000] text-white py-5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#BFA37E] transition-all"
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
            `}} />
        </div>
    );
};

export default FoodMenu;
