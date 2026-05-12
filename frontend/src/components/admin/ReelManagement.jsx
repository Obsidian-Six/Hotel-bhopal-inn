import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { Film, Trash2, Plus, Edit2, Play, Pause } from 'lucide-react';

const ReelManagement = () => {
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editReel, setEditReel] = useState(null);
    const [formData, setFormData] = useState({ title: '', video: null });

    const API_URL = `${config.API_URL}/api/reels`;

    useEffect(() => {
        fetchReels();
    }, []);

    const fetchReels = async () => {
        try {
            const res = await axios.get(API_URL);
            setReels(res.data);
        } catch (err) {
            console.error('Error fetching reels:', err);
        }
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, video: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        data.append('title', formData.title);
        if (formData.video) data.append('video', formData.video);

        try {
            if (editReel) {
                await axios.put(`${API_URL}/${editReel._id}`, { title: formData.title });
                setMessage('Reel updated successfully!');
            } else {
                await axios.post(API_URL, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setMessage('Reel uploaded successfully!');
            }
            setFormData({ title: '', video: null });
            setShowAddForm(false);
            setEditReel(null);
            fetchReels();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this reel?')) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            // Manually update state for instant removal in frontend
            setReels(prev => prev.filter(reel => reel._id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const handleEdit = (reel) => {
        setEditReel(reel);
        setFormData({ title: reel.title, video: null });
        setShowAddForm(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif font-bold text-[#0A192F]">Reels Management</h2>
                <button 
                    onClick={() => { setShowAddForm(!showAddForm); setEditReel(null); setFormData({ title: '', video: null }); }}
                    className="bg-[#0A192F] text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#BFA37E] transition-all"
                >
                    {showAddForm ? 'Cancel' : <><Plus size={14} /> Add New Reel</>}
                </button>
            </div>

            {showAddForm && (
                <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-6">
                        {editReel ? 'Edit Reel Title' : 'Upload New Video Reel'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Reel Title</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.title} 
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E]"
                                />
                            </div>
                            {!editReel && (
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Video File (Vertical preferred)</label>
                                    <input 
                                        type="file" 
                                        accept="video/*"
                                        required
                                        onChange={handleFileChange}
                                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-[#BFA37E] file:text-white hover:file:bg-[#0A192F] transition-all"
                                    />
                                </div>
                            )}
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-[#0A192F] text-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : editReel ? 'Update Reel' : 'Upload Reel'}
                        </button>
                        {message && <p className="text-[10px] font-bold uppercase tracking-widest mt-2 text-green-600">{message}</p>}
                    </form>
                </div>
            )}

            <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-8">Published Reels</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {reels.map((reel) => (
                        <div key={reel._id} className="relative group bg-slate-50 rounded-sm overflow-hidden aspect-[9/16] shadow-md">
                            <video 
                                src={`${config.API_URL}${reel.videoUrl}`} 
                                className="w-full h-full object-cover"
                                muted
                                loop
                                onMouseEnter={(e) => e.target.play()}
                                onMouseLeave={(e) => e.target.pause()}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-6">
                                <p className="text-white text-xs font-bold uppercase tracking-widest mb-4">{reel.title}</p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleEdit(reel)}
                                        className="flex-grow bg-white text-[#0A192F] py-2 text-[8px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-[#BFA37E] hover:text-white transition-all"
                                    >
                                        <Edit2 size={12} /> Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(reel._id)}
                                        className="flex-grow bg-red-600 text-white py-2 text-[8px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-red-700 transition-all"
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {reels.length === 0 && <p className="text-slate-400 italic text-sm">No reels found.</p>}
            </div>
        </div>
    );
};

export default ReelManagement;
