import React, { useState } from 'react';
import FrontDeskManagement from '@/components/admin/FrontDeskManagement';
import FinanceManagement from '@/components/admin/FinanceManagement';
import { Home, LogOut, Bell, Search, User } from 'lucide-react';

const ReceptionDashboard = () => {
    const [activeTab, setActiveTab] = useState('frontDesk');

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
            {/* Top Navigation */}
            <header className="bg-[#1A2B48] text-white p-4 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-8">
                    <h1 className="text-xl font-serif font-bold text-[#BFA37E] uppercase tracking-tighter">Bhopal Inn</h1>
                    <div className="h-6 w-px bg-white/10"></div>
                    <nav className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-white/60">
                        <button onClick={() => setActiveTab('frontDesk')} className={`${activeTab === 'frontDesk' ? 'text-[#BFA37E]' : 'hover:text-white transition-colors'}`}>Front Desk</button>
                        <button onClick={() => setActiveTab('finance')} className={`${activeTab === 'finance' ? 'text-[#BFA37E]' : 'hover:text-white transition-colors'}`}>Finance</button>
                        <a href="#" className="hover:text-white transition-colors">Housekeeping</a>
                        <a href="#" className="hover:text-white transition-colors">Room Service</a>
                    </nav>
                </div>
                <div className="flex items-center gap-6">
                    <div className="relative hidden md:block">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                        <input 
                            type="text" 
                            placeholder="Search Guest / Room..." 
                            className="bg-white/10 border border-white/5 rounded-full py-2 pl-10 pr-4 text-xs focus:outline-none focus:bg-white/20 transition-all w-64"
                        />
                    </div>
                    <button className="relative text-white/60 hover:text-white transition-colors">
                        <Bell size={20} />
                        <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
                    </button>
                    <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                        <div className="text-right">
                            <div className="text-[10px] font-bold">Reception Staff</div>
                            <div className="text-[9px] text-white/40 uppercase tracking-widest font-bold">On Duty</div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#BFA37E] flex items-center justify-center font-bold text-xs">
                            RS
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow p-8">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'frontDesk' && (
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-[#1A2B48]">Reception Dashboard</h2>
                                <p className="text-slate-500 text-sm">Welcome back! Here's what's happening today.</p>
                            </div>
                            <div className="flex gap-3">
                                <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">
                                    Export Reports
                                </button>
                                <button className="bg-[#BFA37E] text-white px-6 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-[#a68d6d] transition-all">
                                    Night Audit
                                </button>
                            </div>
                        </div>
                    )}

                    {/* The Core Module */}
                    {activeTab === 'frontDesk' ? <FrontDeskManagement /> : <FinanceManagement role="FrontDesk" />}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 p-4 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    © 2026 Hotel Bhopal Inn — Premium PMS System v2.0
                </p>
            </footer>
        </div>
    );
};

export default ReceptionDashboard;
