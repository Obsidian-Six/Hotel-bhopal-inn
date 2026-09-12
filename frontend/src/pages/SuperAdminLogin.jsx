import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff, KeyRound } from 'lucide-react';

const SuperAdminLogin = () => {
    const [email, setEmail] = useState('superadmin@hotelbhopalinn.com');
    const [password, setPassword] = useState('SuperAdmin@BhopalInn2026#');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { superAdminLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await superAdminLogin(email, password);
        if (result.success) {
            navigate('/super-admin');
        } else {
            setError(result.message || 'Super Admin authentication failed');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#08080a] text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background subtle glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#BFA37E]/10 rounded-full blur-3xl pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-md w-full bg-[#111115] border border-[#BFA37E]/30 p-8 md:p-10 shadow-2xl relative z-10 rounded-sm"
            >
                {/* Header with Luxury Badge */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#BFA37E]/10 border border-[#BFA37E]/40 mb-4 text-[#BFA37E]">
                        <ShieldCheck size={32} />
                    </div>

                    <h1 className="text-2xl font-serif font-bold text-white tracking-wide mb-1">
                        Super Admin Portal
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#BFA37E]">
                        Complete Administrative Access
                    </p>
                </div>

                {/* Info Callout */}
                <div className="mb-6 p-3 bg-[#BFA37E]/10 border border-[#BFA37E]/20 rounded text-[11px] text-stone-300 flex items-start gap-2">
                    <KeyRound size={16} className="text-[#BFA37E] shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold text-[#BFA37E]">Exclusive Access:</span> Grants full control over past-date bookings, payment editing, deletion & financial overrides.
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                            Super Admin Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFA37E]" size={16} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#18181e] border border-white/10 p-3.5 pl-12 text-sm text-white focus:outline-none focus:border-[#BFA37E] rounded transition-all"
                                placeholder="superadmin@hotelbhopalinn.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                            Super Admin Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFA37E]" size={16} />
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#18181e] border border-white/10 p-3.5 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-[#BFA37E] rounded transition-all"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-400 text-xs font-semibold bg-red-950/40 border border-red-800/50 p-3 rounded text-center">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-[#BFA37E] hover:bg-[#d4b993] text-black font-black py-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] transition-all rounded shadow-xl disabled:opacity-50 mt-2"
                    >
                        {loading ? 'Authenticating Super Admin...' : 'Authenticate & Enter Console'}
                        <ArrowRight size={16} />
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10 text-center flex justify-between items-center text-[11px] text-stone-500">
                    <a href="/admin-login" className="hover:text-[#BFA37E] transition-colors">
                        Regular Admin Login
                    </a>
                    <a href="/" className="hover:text-white transition-colors">
                        Back to Home
                    </a>
                </div>
            </motion.div>
        </div>
    );
};

export default SuperAdminLogin;
