import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { LogIn, Lock, Mail, ArrowRight } from 'lucide-react';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(email, password);
        if (result.success) {
            // Check if user is admin after login
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (storedUser && storedUser.role === 'admin') {
                navigate('/admin');
            } else {
                setError('Access denied. You do not have administrator privileges.');
            }
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-[#0A192F] text-white p-10 shadow-2xl border border-white/5"
            >
                <div className="text-center mb-10">
                    <div className="inline-block p-4 bg-white mb-6">
                        <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain" />
                    </div>

                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Administrator Secure Login</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFA37E]" size={16} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-sm focus:outline-none focus:border-[#BFA37E] transition-all"
                                placeholder="admin@hotelbhopalinn.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFA37E]" size={16} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-sm focus:outline-none focus:border-[#BFA37E] transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest bg-red-400/10 p-3 text-center">
                            {error}
                        </p>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-[#BFA37E] hover:bg-[#a68d6d] text-white py-4 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                        <ArrowRight size={16} />
                    </button>
                </form>

                <div className="mt-8 text-center pt-8 border-t border-white/5">
                    <a href="/" className="text-[10px] font-bold text-white/20 hover:text-[#BFA37E] transition-all uppercase tracking-widest">
                        Back to Public Website
                    </a>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
