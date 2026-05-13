import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { Trash2, Plus, Save, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = `${config.API_URL}/api/rooms`;

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form states
  const [category, setCategory] = useState('Standard Deluxe');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState('');
  const [tags, setTags] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [maxOccupancy, setMaxOccupancy] = useState('');
  const [bedType, setBedType] = useState('');
  const [view, setView] = useState('');
  const [extraPersonCharge, setExtraPersonCharge] = useState('');
  const [files, setFiles] = useState([]);
  const [replaceImages, setReplaceImages] = useState(false);

  const PRESET_AMENITIES = [
    'AC', 'Wi-Fi', 'Hot Water', 'TV', 'Toiletries', 'Premium Linen', 
    '24/7 Room Service', 'King Size Bed', 'Balcony View', 'Tea/Coffee Maker',
    'Safe', 'Mini Fridge', 'Work Desk', 'Breakfast'
  ];

  const PRESET_TAGS = [
    'Best Value', 'Premium View', 'Luxury Stay', 'Business Friendly', 'Family Choice'
  ];

  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get(API_URL);
      setRooms(res.data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  };

  const resetForm = () => {
    setEditingRoom(null);
    setCategory('Standard Deluxe');
    setShowNewCategory(false);
    setNewCategory('');
    setTitle('');
    setDescription('');
    setAmenities('');
    setTags('');
    setStartingPrice('');
    setMaxOccupancy('');
    setBedType('');
    setView('');
    setExtraPersonCharge('');
    setSelectedAmenities([]);
    setSelectedTags([]);
    setFiles([]);
    setReplaceImages(false);
  };

  const onEdit = (room) => {
    setEditingRoom(room);
    setCategory(room.category);
    setShowNewCategory(false);
    setTitle(room.title);
    setDescription(room.description);
    setAmenities(room.amenities.join(', '));
    setTags(room.tags.join(', '));
    setStartingPrice(room.details?.startingPrice || '');
    setMaxOccupancy(room.details?.maxOccupancy || '');
    setBedType(room.details?.bedType || '');
    setView(room.details?.view || '');
    setExtraPersonCharge(room.details?.extraPersonCharge || '');
    setSelectedAmenities(room.amenities || []);
    setSelectedTags(room.tags || []);
    setReplaceImages(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const finalCategory = category === 'NEW' ? newCategory : category;

    const formData = new FormData();
    if (editingRoom) {
      formData.append('id', editingRoom._id);
    }
    formData.append('category', finalCategory);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('amenities', JSON.stringify(selectedAmenities));
    formData.append('tags', JSON.stringify(selectedTags));
    formData.append('replaceImages', replaceImages);
    formData.append('details', JSON.stringify({
      startingPrice: Number(startingPrice),
      maxOccupancy,
      bedType,
      view,
      extraPersonCharge: Number(extraPersonCharge)
    }));

    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Room saved successfully!');
      resetForm();
      fetchRooms();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || err.response?.data?.message || 'Error saving room');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const onDelete = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete the "${cat}" category?`)) return;
    
    try {
      await axios.delete(`${API_URL}/${cat}`);
      setMessage('Room deleted successfully!');
      if (editingRoom && editingRoom.category === cat) {
        resetForm();
      }
      fetchRooms();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error deleting room');
      console.error(err);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-[#F1E9DA] pb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#0A192F]">Room Management</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Create and edit your property's room inventory</p>
        </div>
        <button 
          onClick={resetForm}
          className="flex items-center gap-2 bg-[#0A192F] text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#BFA37E] transition-all"
        >
          <Plus size={16}/>
          Add New Room
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Form Section */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-10 border border-[#F1E9DA] shadow-sm">
            <h2 className="text-sm font-bold text-[#0A192F] uppercase tracking-[0.2em] mb-10 pb-4 border-b border-[#F1E9DA] flex items-center gap-3">
              <Edit3 size={18} className="text-[#BFA37E]" />
              {editingRoom ? `Editing: ${editingRoom.title}` : 'Room Details'}
            </h2>
            
            <form onSubmit={onSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Category Selection</label>
                    <div className="flex flex-col gap-3">
                      <select 
                        value={category} 
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setShowNewCategory(e.target.value === 'NEW');
                        }}
                        className="w-full bg-[#FDFBF7] border border-[#F1E9DA] p-4 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E] transition-colors"
                      >
                        <option>Standard Deluxe</option>
                        <option>Balcony Deluxe</option>
                        <option>Super Deluxe</option>
                        <option value="NEW">+ Create New Category</option>
                      </select>
                      {showNewCategory && (
                        <motion.input 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          type="text" 
                          value={newCategory} 
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Enter new category name..."
                          className="w-full bg-white border border-[#BFA37E] p-4 text-xs font-bold text-[#0A192F] focus:outline-none shadow-inner"
                          required
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Room Title</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Executive King Suite"
                      className="w-full bg-[#FDFBF7] border border-[#F1E9DA] p-4 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E] transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nightly Rate (₹)</label>
                      <input 
                        type="number" 
                        value={startingPrice} 
                        onChange={(e) => setStartingPrice(e.target.value)}
                        className="w-full bg-[#FDFBF7] border border-[#F1E9DA] p-4 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E] transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Extra Person (₹)</label>
                      <input 
                        type="number" 
                        value={extraPersonCharge} 
                        onChange={(e) => setExtraPersonCharge(e.target.value)}
                        className="w-full bg-[#FDFBF7] border border-[#F1E9DA] p-4 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E] transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Occupancy</label>
                      <input 
                        type="text" 
                        value={maxOccupancy} 
                        onChange={(e) => setMaxOccupancy(e.target.value)}
                        placeholder="2 Adults"
                        className="w-full bg-[#FDFBF7] border border-[#F1E9DA] p-4 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E] transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bed Type</label>
                      <input 
                        type="text" 
                        value={bedType} 
                        onChange={(e) => setBedType(e.target.value)}
                        placeholder="King / Twin"
                        className="w-full bg-[#FDFBF7] border border-[#F1E9DA] p-4 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E] transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Room Description</label>
                <textarea 
                  rows="4"
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the luxury and comfort of this room..."
                  className="w-full bg-[#FDFBF7] border border-[#F1E9DA] p-4 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E] transition-colors leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Select Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_AMENITIES.map((amenity) => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                          selectedAmenities.includes(amenity)
                            ? 'bg-[#0A192F] text-white border-[#0A192F]'
                            : 'bg-white text-slate-400 border-slate-100 hover:border-[#BFA37E]'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Marketing Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                          selectedTags.includes(tag)
                            ? 'bg-[#BFA37E] text-white border-[#BFA37E]'
                            : 'bg-white text-slate-400 border-slate-100 hover:border-[#BFA37E]'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-[#F1E9DA]">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Gallery Upload</label>
                <div className="flex items-center gap-2 mb-4">
                  <input 
                    type="checkbox" 
                    id="replaceImages" 
                    checked={replaceImages} 
                    onChange={(e) => setReplaceImages(e.target.checked)}
                    className="w-4 h-4 accent-[#BFA37E]"
                  />
                  <label htmlFor="replaceImages" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 cursor-pointer">
                    Replace existing images with new uploads
                  </label>
                </div>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#F1E9DA] border-dashed rounded-lg cursor-pointer bg-[#FDFBF7] hover:bg-[#F1E9DA] transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Plus className="w-8 h-8 mb-3 text-[#BFA37E]" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {files.length > 0 ? `${files.length} Files Selected` : 'Click to upload room photos'}
                      </p>
                    </div>
                    <input type="file" multiple className="hidden" onChange={(e) => setFiles(e.target.files)} />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-6">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[#0A192F] text-white px-12 py-5 text-xs font-bold uppercase tracking-[0.3em] hover:bg-[#BFA37E] transition-all disabled:opacity-50 flex items-center gap-3 shadow-xl"
                >
                  <Save size={18}/>
                  {loading ? 'Processing...' : 'Commit Changes'}
                </button>
                {editingRoom && (
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Discard Changes
                  </button>
                )}
              </div>
              {message && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-[10px] font-bold uppercase tracking-widest p-4 bg-[#FDFBF7] border-l-4 ${message.includes('success') ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}`}
                >
                  {message}
                </motion.p>
              )}
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-4">Inventory Overview</h3>
          <div className="flex flex-col gap-6">
            {rooms.length === 0 ? (
              <div className="bg-white p-8 border border-dashed border-[#F1E9DA] text-center">
                <p className="text-slate-400 italic text-sm">Empty inventory.</p>
              </div>
            ) : (
              rooms.map((room) => (
                <div key={room._id} className="bg-white border border-[#F1E9DA] group hover:border-[#BFA37E] transition-all duration-500 shadow-sm hover:shadow-md">
                  <div className="h-48 relative overflow-hidden">
                    <img 
                      src={room.images[0]?.startsWith('/') ? `${config.API_URL}${room.images[0]}` : room.images[0] || 'https://via.placeholder.com/400x300?text=No+Image'} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={room.title} 
                    />
                    <div className="absolute inset-0 bg-[#0A192F]/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4">
                      <button onClick={() => onEdit(room)} className="p-3 bg-white text-[#0A192F] rounded-full hover:bg-[#BFA37E] hover:text-white transition-all shadow-xl transform translate-y-4 group-hover:translate-y-0 duration-500">
                        <Edit3 size={18}/>
                      </button>
                      <button onClick={() => onDelete(room.category)} className="p-3 bg-white text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl transform translate-y-4 group-hover:translate-y-0 duration-500 delay-75">
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-[#0A192F] uppercase tracking-wider">{room.title}</h4>
                      <span className="text-[9px] font-bold text-[#BFA37E] bg-[#FDFBF7] px-2 py-1 uppercase">{room.category}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">₹{room.details?.startingPrice} / Night</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomManagement;
