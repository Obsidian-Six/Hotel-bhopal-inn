import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { Image as ImageIcon, Bed, LogOut, Home, Star, MessageSquare } from 'lucide-react';
import RoomManagement from '@/components/admin/RoomManagement';
import BanquetManagement from '@/components/admin/BanquetManagement';

import OfferManagement from '@/components/admin/OfferManagement';
import InventoryManagement from '@/components/admin/InventoryManagement';
import FrontDeskManagement from '@/components/admin/FrontDeskManagement';
import FinanceManagement from '@/components/admin/FinanceManagement';
import ReelManagement from '@/components/admin/ReelManagement';
import FoodMenuManagement from '@/components/admin/FoodMenuManagement';
import PostManagement from '@/components/admin/PostManagement';
import FrontDeskAnalytics from '@/components/admin/FrontDeskAnalytics';
import { Tag, Calendar, Users, IndianRupee, Film, Utensils, Camera, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('hero'); // 'hero', 'rooms', or 'banquet'
  const [images, setImages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_URL = `${config.API_URL}/api/hero-images`;

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await axios.get(API_URL);
      setImages(res.data);
    } catch (err) {
      console.error('Error fetching images:', err);
    }
  };

  const onFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const onUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title);

    setLoading(true);
    try {
      await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Image uploaded successfully!');
      setTitle('');
      setSelectedFile(null);
      fetchImages();
    } catch (err) {
      setMessage('Upload failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchImages();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#000000] text-white flex flex-col">
        <div className="p-8 border-b border-white/10">
          <div className="h-16 w-full overflow-hidden flex items-center justify-center bg-white rounded-sm p-1">
            <img src="/logo.png" alt="Logo" className="h-full w-auto object-contain scale-[2.2]" />
          </div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mt-2">CMS Admin Panel</p>
        </div>

        
        <nav className="flex-grow p-4 space-y-2 mt-6">
          <button 
            onClick={() => setActiveTab('hero')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'hero' ? 'bg-[#BFA37E] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <ImageIcon size={16} />
            Hero Slider
          </button>
          <button 
            onClick={() => setActiveTab('rooms')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'rooms' ? 'bg-[#BFA37E] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Bed size={16} />
            Room Management
          </button>
          <button 
            onClick={() => setActiveTab('banquet')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'banquet' ? 'bg-[#BFA37E] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Star size={16} />
            Banquet & Events
          </button>

          <button 
            onClick={() => setActiveTab('offers')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'offers' ? 'bg-[#BFA37E] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Tag size={16} />
            Special Offers
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'bookings' ? 'bg-[#BFA37E] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Users size={16} />
            Front Desk
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'analytics' ? 'bg-[#BFA37E] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <TrendingUp size={16} />
            Front Desk Analytics
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'inventory' ? 'bg-[#BFA37E] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Calendar size={16} />
            Inventory Calendar
          </button>

          <button 
            onClick={() => setActiveTab('finance')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'finance' ? 'bg-[#BFA37E] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <IndianRupee size={16} />
            Finance — Income, Expense & Cash
          </button>
          <button 
            onClick={() => setActiveTab('reels')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'reels' ? 'bg-[#BFA37E] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Film size={16} />
            Video Reels
          </button>
          <button 
            onClick={() => setActiveTab('menu')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'menu' ? 'bg-[#BFA37E] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Utensils size={16} />
            Food Menu
          </button>
          <button 
            onClick={() => setActiveTab('posts')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'posts' ? 'bg-[#BFA37E] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Camera size={16} />
            Instagram Posts
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <a href="/" className="flex items-center gap-4 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-[#BFA37E] transition-all">
            <Home size={16} />
            Back to Site
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-10 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'hero' ? (
            <div className="space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif font-bold text-[#000000]">Hero Content Management</h2>
              </div>

              {/* Upload Section */}
              <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-6">Upload New Hero Image or Video</h3>
                <form onSubmit={onUpload} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Content Title</label>
                      <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Deluxe Room View"
                        className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#000000] focus:outline-none focus:border-[#BFA37E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Select File (Image/Video)</label>
                      <input 
                        type="file" 
                        accept="image/*,video/*"
                        onChange={onFileChange}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-[#BFA37E] file:text-white hover:file:bg-[#000000] transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full md:w-auto bg-[#000000] text-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                    >
                      {loading ? 'Uploading...' : 'Upload to Slider'}
                    </button>
                    {message && <p className={`text-[10px] font-bold uppercase tracking-widest mt-4 ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
                  </div>
                </form>
              </div>

              {/* List Section */}
              <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-8">Current Slides</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {images.length === 0 ? (
                    <p className="text-slate-400 italic text-sm">No content uploaded yet.</p>
                  ) : (
                    images.map((item) => (
                      <div key={item._id} className="relative group border border-slate-50 overflow-hidden">
                        {item.type === 'video' ? (
                          <video 
                            src={`${config.API_URL}${item.url}`} 
                            className="w-full h-48 object-cover"
                            muted
                            loop
                          />
                        ) : (
                          <img 
                            src={`${config.API_URL}${item.url}`} 
                            alt={item.title} 
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center">
                          <span className="text-white text-[10px] font-bold uppercase tracking-widest mb-2">{item.title}</span>
                          <span className="text-white/60 text-[8px] font-bold uppercase tracking-widest mb-4">{item.type}</span>
                          <button 
                            onClick={() => onDelete(item._id)}
                            className="text-white bg-red-600 px-6 py-2 rounded-sm text-[9px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all"
                          >
                            Delete Item
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          ) : activeTab === 'rooms' ? (
            <RoomManagement />
          ) : activeTab === 'banquet' ? (
            <BanquetManagement />

          ) : activeTab === 'offers' ? (
            <OfferManagement />
          ) : activeTab === 'bookings' ? (
            <FrontDeskManagement />
          ) : activeTab === 'analytics' ? (
            <FrontDeskAnalytics />
          ) : activeTab === 'inventory' ? (
            <InventoryManagement />
          ) : activeTab === 'finance' ? (
            <FinanceManagement role="Admin" />
          ) : activeTab === 'reels' ? (
            <ReelManagement />
          ) : activeTab === 'menu' ? (
            <FoodMenuManagement />
          ) : activeTab === 'posts' ? (
            <PostManagement />
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
