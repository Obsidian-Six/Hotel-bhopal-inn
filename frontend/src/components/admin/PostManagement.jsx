import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';

const PostManagement = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ image: null, caption: '' });

    const API_URL = `${config.API_URL}/api/posts`;

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await axios.get(API_URL);
            setPosts(res.data);
        } catch (err) {
            console.error('Error fetching posts:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        data.append('image', formData.image);
        data.append('caption', formData.caption);

        try {
            await axios.post(API_URL, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData({ image: null, caption: '' });
            setShowForm(false);
            fetchPosts();
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this post?')) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            setPosts(prev => prev.filter(post => post._id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <h2 className="text-3xl font-serif font-bold text-[#0A192F]">Instagram Journey Posts</h2>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="bg-[#0A192F] text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#BFA37E] transition-all"
                >
                    {showForm ? 'Cancel' : <><Plus size={14} /> Add Post</>}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white p-8 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Post Image</label>
                        <input 
                            type="file" 
                            required
                            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                            className="w-full text-[10px] text-slate-400"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Caption (Optional)</label>
                        <input 
                            type="text" 
                            value={formData.caption}
                            onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                            className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E]"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-[#BFA37E] text-white py-3 text-[10px] font-bold uppercase tracking-widest md:col-span-2"
                    >
                        {loading ? 'Uploading...' : 'Save Post'}
                    </button>
                </form>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {posts.map(post => (
                    <div key={post._id} className="relative aspect-square group rounded-xl overflow-hidden shadow-sm">
                        <img src={`${config.API_URL}${post.image}`} className="w-full h-full object-cover" alt={post.caption} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                            <button 
                                onClick={() => handleDelete(post._id)}
                                className="bg-white/20 backdrop-blur-sm p-3 rounded-full text-white hover:bg-red-600 transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PostManagement;
