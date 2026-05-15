import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '../../config';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, VolumeX } from 'lucide-react';

const ReelsSection = () => {
    const [reels, setReels] = useState([]);
    const [selectedReel, setSelectedReel] = useState(null);
    const [muted, setMuted] = useState(true);

    useEffect(() => {
        const fetchReels = async () => {
            try {
                const res = await axios.get(`${config.API_URL}/api/reels`);
                setReels(res.data);
            } catch (err) {
                console.error('Error fetching reels:', err);
            }
        };
        fetchReels();
    }, []);

    if (reels.length === 0) return null;

    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                    <div>
                        <span className="text-[10px] font-bold text-[#BFA37E] uppercase tracking-[0.6em] mb-4 block">Visual Stories</span>
                        <h2 className="text-4xl md:text-6xl font-serif text-[#000000] uppercase tracking-tight">
                            Experience <span className="italic text-[#BFA37E]">Bhopal Inn</span>
                        </h2>
                    </div>
                    <p className="text-slate-500 max-w-md text-sm font-light leading-relaxed">
                        Glimpses of luxury, comfort, and celebration. Watch our latest reels to explore the vibrant life at our hotel.
                    </p>
                </div>

                <div className="flex gap-4 md:gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
                    {reels.map((reel) => (
                        <motion.div 
                            key={reel._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            onClick={() => setSelectedReel(reel)}
                            className="relative flex-shrink-0 w-[280px] md:w-[320px] aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer group snap-center shadow-2xl"
                        >
                            <video 
                                src={`${config.API_URL}${reel.videoUrl}`}
                                className="w-full h-full object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="absolute bottom-6 left-6 right-6 text-white">
                                <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">{reel.title}</p>
                                <div className="h-[2px] w-0 group-hover:w-full bg-[#BFA37E] transition-all duration-500" />
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                    <Play fill="white" className="text-white ml-1" size={24} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Full Screen Modal */}
            <AnimatePresence>
                {selectedReel && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-black flex items-center justify-center p-4 md:p-8"
                    >
                        <button 
                            onClick={() => setSelectedReel(null)}
                            className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors z-[1001]"
                        >
                            <X size={40} />
                        </button>

                        <div className="relative h-full aspect-[9/16] max-w-full rounded-2xl overflow-hidden bg-zinc-900 shadow-[0_0_100px_rgba(191,163,126,0.3)]">
                            <video 
                                src={`${config.API_URL}${selectedReel.videoUrl}`}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted={muted}
                            />
                            <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                                <div>
                                    <h3 className="text-2xl font-serif text-white mb-2">{selectedReel.title}</h3>
                                    <div className="h-1 w-20 bg-[#BFA37E]" />
                                </div>
                                <button 
                                    onClick={() => setMuted(!muted)}
                                    className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 hover:bg-white/40 transition-all"
                                >
                                    {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </section>
    );
};

export default ReelsSection;
