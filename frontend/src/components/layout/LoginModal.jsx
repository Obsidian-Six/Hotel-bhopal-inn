import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const LoginModal = ({ isOpen, onClose }) => {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', password: '', phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        let res;
        if (isLogin) {
            res = await login(formData.email, formData.password);
        } else {
            res = await register(formData);
        }

        setLoading(false);
        if (res.success) {
            onClose();
        } else {
            setError(res.message);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden relative"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
                        <X size={20} />
                    </button>
                    
                    <div className="p-8">
                        <h2 className="text-2xl font-serif text-[#0A192F] mb-6 text-center">
                            {isLogin ? 'Sign In To Book Faster' : 'Create an Account'}
                        </h2>
                        
                        {error && <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm text-center">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">First Name</label>
                                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full border border-slate-200 p-3 text-sm focus:outline-none focus:border-[#BFA37E]" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Last Name</label>
                                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full border border-slate-200 p-3 text-sm focus:outline-none focus:border-[#BFA37E]" />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Email Address</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full border border-slate-200 p-3 text-sm focus:outline-none focus:border-[#BFA37E]" />
                            </div>

                            {!isLogin && (
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Phone Number</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full border border-slate-200 p-3 text-sm focus:outline-none focus:border-[#BFA37E]" />
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full border border-slate-200 p-3 text-sm focus:outline-none focus:border-[#BFA37E]" />
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-[#8B735B] text-white p-4 text-xs font-bold uppercase tracking-widest hover:bg-[#725e4a] transition-colors mt-6 disabled:opacity-70"
                            >
                                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-slate-600">
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                <button 
                                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                                    className="text-[#8B735B] font-bold hover:underline"
                                >
                                    {isLogin ? 'Sign Up' : 'Sign In'}
                                </button>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LoginModal;
