import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { 
  Upload, X, Plus, Trash2, Layout, 
  Image as ImageIcon, Info, Coffee, 
  Edit, Save, CheckCircle2, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BanquetManagement = () => {
  const [banquetData, setBanquetData] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('details'); // 'details', 'photos', 'gallery'
  
  // Gallery Modal State
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [galleryFormData, setGalleryFormData] = useState({
    title: '',
    category: 'Social Events',
    images: []
  });
  const [imagePreviews, setImagePreviews] = useState([]);

  const API_URL = `${config.API_URL}/api/banquet`;
  const GALLERY_API_URL = `${config.API_URL}/api/event-gallery`;

  useEffect(() => {
    fetchBanquetData();
    fetchGalleryImages();
  }, []);

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${config.API_URL}${url}`;
  };

  const fetchBanquetData = async () => {
    try {
      const res = await axios.get(API_URL);
      if (res.data) {
        setBanquetData({
          ...res.data,
          heroImages: Array.isArray(res.data.heroImages) ? res.data.heroImages : [],
          overviewPhotos: Array.isArray(res.data.overviewPhotos) ? res.data.overviewPhotos : []
        });
      }
    } catch (err) {
      console.error('Error fetching banquet data:', err);
    }
  };

  const fetchGalleryImages = async () => {
    try {
      const res = await axios.get(GALLERY_API_URL);
      if (Array.isArray(res.data)) {
        setGalleryImages(res.data);
      } else {
        setGalleryImages([]);
      }
    } catch (err) {
      console.error('Error fetching gallery:', err);
      setGalleryImages([]);
    }
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(API_URL, banquetData);
      alert('Banquet details updated successfully!');
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const endpoint = type === 'hero' ? `${API_URL}/hero` : `${API_URL}/overview`;
    
    try {
      await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchBanquetData();
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleDeleteOverview = async (filename) => {
    if (!window.confirm('Delete this photo?')) return;
    const name = filename.split('/').pop();
    try {
      await axios.delete(`${API_URL}/overview/${name}`);
      fetchBanquetData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleDeleteHero = async (filename) => {
    if (!window.confirm('Delete this hero slider photo?')) return;
    const name = filename.split('/').pop();
    try {
      await axios.delete(`${API_URL}/hero/${name}`);
      fetchBanquetData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Gallery Management
  const openGalleryModal = (image = null) => {
    if (image) {
      setEditingImage(image);
      setGalleryFormData({
        title: image.title,
        category: image.category,
        images: []
      });
      setImagePreviews([]);
    } else {
      setEditingImage(null);
      setGalleryFormData({
        title: '',
        category: 'Social Events',
        images: []
      });
      setImagePreviews([]);
    }
    setShowGalleryModal(true);
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    
    // Append new files to existing ones
    setGalleryFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newFiles]
    }));
    
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeSelectedImage = (index) => {
    setGalleryFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleGallerySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingImage) {
        await axios.put(`${GALLERY_API_URL}/${editingImage._id}`, {
          title: galleryFormData.title,
          category: galleryFormData.category
        });
      } else {
        if (galleryFormData.images.length === 0) return alert('Please select at least one image');
        const formData = new FormData();
        galleryFormData.images.forEach(img => {
          formData.append('images', img);
        });
        formData.append('title', galleryFormData.title);
        formData.append('category', galleryFormData.category);

        await axios.post(GALLERY_API_URL, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      fetchGalleryImages();
      setShowGalleryModal(false);
      alert(`${editingImage ? 'Image details updated' : galleryFormData.images.length + ' images uploaded'} successfully!`);
    } catch (err) {
      console.error('Gallery operation failed:', err);
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGallery = async (id) => {
    if (!window.confirm('Delete this gallery image?')) return;
    try {
      await axios.delete(`${GALLERY_API_URL}/${id}`);
      fetchGalleryImages();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (!banquetData) return <div className="p-10 text-slate-400 font-serif">Loading Banquet CMS...</div>;

  const galleryCategories = ['Interior & Exterior', 'Banquet Hall', 'Board Meeting Room', 'Catering', 'Social Events', 'Wedding', 'Other'];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#0A192F]">Banquet & Events CMS</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Manage hall details, catering, and event galleries</p>
        </div>
        
        <div className="flex bg-white rounded-sm shadow-sm border border-slate-100 p-1">
          {['details', 'photos', 'gallery'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-6 py-2 text-[9px] font-bold uppercase tracking-widest transition-all ${activeSubTab === tab ? 'bg-[#0A192F] text-white shadow-lg' : 'text-slate-400 hover:text-[#0A192F]'}`}
            >
              {tab === 'details' ? 'Hall Details' : tab === 'photos' ? 'Hall Photos' : 'Event Gallery'}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <Info size={14} className="text-[#BFA37E]" /> Basic Information
              </h3>
              <form onSubmit={handleUpdateDetails} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Page Title (H1)</label>
                  <input type="text" value={banquetData.title} onChange={(e) => setBanquetData({...banquetData, title: e.target.value})} className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Sub Headline</label>
                  <textarea value={banquetData.subHeadline} onChange={(e) => setBanquetData({...banquetData, subHeadline: e.target.value})} rows="2" className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E]" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Theatre Capacity</label>
                  <input type="text" value={banquetData.capacityTheatre} onChange={(e) => setBanquetData({...banquetData, capacityTheatre: e.target.value})} className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E]" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Banquet Capacity</label>
                  <input type="text" value={banquetData.capacityBanquet} onChange={(e) => setBanquetData({...banquetData, capacityBanquet: e.target.value})} className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E]" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Hall Dimensions</label>
                  <input type="text" value={banquetData.dimensions} onChange={(e) => setBanquetData({...banquetData, dimensions: e.target.value})} className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E]" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Parking Slots</label>
                  <input type="text" value={banquetData.parking} onChange={(e) => setBanquetData({...banquetData, parking: e.target.value})} className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E]" />
                </div>
                <div className="md:col-span-2 mt-4">
                  <button type="submit" disabled={loading} className="bg-[#0A192F] text-white px-10 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#BFA37E] transition-all disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-6">Hall Amenities</h3>
              <div className="space-y-4">
                {[
                  { key: 'airConditioning', label: 'Full AC' },
                  { key: 'avEquipment', label: 'AV Equipment' },
                  { key: 'naturalLight', label: 'Natural Light' }
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-10 h-5 rounded-full transition-all relative ${banquetData[item.key] ? 'bg-green-500' : 'bg-slate-200'}`}>
                      <input type="checkbox" className="hidden" checked={banquetData[item.key]} onChange={(e) => setBanquetData({...banquetData, [item.key]: e.target.checked})} />
                      <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all ${banquetData[item.key] ? 'translate-x-5' : ''}`}></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'photos' && (
        <div className="space-y-10">
          <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Hero Slider Images</h3>
              <label className="bg-[#0A192F] text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-[#BFA37E] transition-all shadow-md">
                <Plus size={14} className="inline mr-2" /> Add Hero Photo
                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'hero')} />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {(banquetData.heroImages || []).map((photo, idx) => (
                <div key={idx} className="relative group aspect-[16/9] bg-slate-50 border border-slate-100 overflow-hidden rounded-sm shadow-sm">
                  <img src={getImageUrl(photo)} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => handleDeleteHero(photo)} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Hall Overview Photos</h3>
              <label className="bg-[#BFA37E] text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-[#0A192F] transition-all shadow-md">
                <Plus size={14} className="inline mr-2" /> Add Overview Photo
                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'overview')} />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {(banquetData.overviewPhotos || []).map((photo, idx) => (
                <div key={idx} className="relative group aspect-square bg-white border-4 border-white shadow-xl overflow-hidden rounded-sm">
                  <img src={getImageUrl(photo)} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => handleDeleteOverview(photo)} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'gallery' && (
        <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Event Photo Gallery</h3>
              <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Images grouped by category with beautiful border structure</p>
            </div>
            <button 
              onClick={() => openGalleryModal()}
              className="bg-[#0A192F] text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#BFA37E] transition-all shadow-lg flex items-center gap-2"
            >
              <Plus size={14} /> Upload Multiple Photos
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(galleryImages || []).map((img) => (
              <div key={img._id} className="relative group p-4 bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500">
                <div className="aspect-[4/3] bg-slate-50 overflow-hidden mb-4 border-2 border-slate-50">
                  <img src={getImageUrl(img.imageUrl)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-grow min-w-0">
                    <span className="text-[8px] font-bold text-[#BFA37E] uppercase tracking-widest">{img.category}</span>
                    <p className="text-[10px] font-bold uppercase text-[#0A192F] truncate" title={img.title}>{img.title}</p>
                  </div>
                  <div className="flex gap-3 flex-shrink-0 pt-1">
                    <button onClick={() => openGalleryModal(img)} className="text-slate-400 hover:text-[#BFA37E] transition-colors p-1"><Edit size={14} /></button>
                    <button onClick={() => handleDeleteGallery(img._id)} className="text-slate-400 hover:text-red-600 transition-colors p-1"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gallery Upload/Edit Modal */}
      <AnimatePresence>
        {showGalleryModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGalleryModal(false)} className="absolute inset-0 bg-[#0A192F]/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-2xl p-10 shadow-2xl rounded-sm border border-slate-100 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowGalleryModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-[#0A192F]"><X size={20} /></button>
              
              <h3 className="text-2xl font-serif font-bold text-[#0A192F] mb-2">{editingImage ? 'Edit Photo Details' : 'Upload Multiple Photos'}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Select multiple images and assign a category</p>
              
              <form onSubmit={handleGallerySubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">General Title (Optional)</label>
                    <input type="text" value={galleryFormData.title} onChange={(e) => setGalleryFormData({...galleryFormData, title: e.target.value})} className="w-full bg-[#FDFBF7] border border-slate-100 p-4 text-xs font-bold focus:outline-none focus:border-[#BFA37E]" placeholder="e.g. Grand Event Highlights" />
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Assign Category</label>
                    <select value={galleryFormData.category} onChange={(e) => setGalleryFormData({...galleryFormData, category: e.target.value})} className="w-full bg-[#FDFBF7] border border-slate-100 p-4 text-xs font-bold focus:outline-none focus:border-[#BFA37E]">
                      {galleryCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>
                
                {!editingImage && (
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Select Multiple Images</label>
                    <div className="relative border-2 border-dashed border-slate-100 rounded-sm p-10 text-center hover:border-[#BFA37E] transition-colors group">
                      <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <Upload className="w-10 h-10 text-slate-200 group-hover:text-[#BFA37E] mx-auto mb-4 transition-colors" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click or drag images to upload</p>
                    </div>
                  </div>
                )}

                {/* Previews */}
                {imagePreviews.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Selected Images Preview ({imagePreviews.length})</h4>
                    <div className="grid grid-cols-4 gap-4">
                      {imagePreviews.map((url, i) => (
                        <div key={i} className="aspect-square bg-slate-50 border border-slate-100 overflow-hidden rounded-sm relative group">
                          <img src={url} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => removeSelectedImage(i)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <button type="submit" disabled={loading} className="w-full bg-[#0A192F] text-white py-5 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[#BFA37E] transition-all shadow-xl disabled:opacity-50">
                  {loading ? 'Processing Uploads...' : editingImage ? 'Save Changes' : `Upload ${galleryFormData.images.length} Photos`}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BanquetManagement;
