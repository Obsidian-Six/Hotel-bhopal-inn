import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { Trash2, Plus, Save, Edit3, Star } from 'lucide-react';

const API_URL = `${config.API_URL}/api/testimonials`;

const TestimonialManagement = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [text, setText] = useState('');
  const [source, setSource] = useState('Via Google');
  const [rating, setRating] = useState(5);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await axios.get(API_URL);
      setTestimonials(res.data);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
    }
  };

  const resetForm = () => {
    setEditingTestimonial(null);
    setName('');
    setCity('');
    setText('');
    setSource('Via Google');
    setRating(5);
  };

  const onEdit = (t) => {
    setEditingTestimonial(t);
    setName(t.name || '');
    setCity(t.city || '');
    setText(t.text || '');
    setSource(t.source || 'Via Google');
    setRating(t.rating || 5);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      city,
      text,
      source,
      rating: Number(rating)
    };

    try {
      if (editingTestimonial) {
        await axios.put(`${API_URL}/${editingTestimonial._id}`, payload);
        setMessage('Testimonial updated successfully!');
      } else {
        await axios.post(API_URL, payload);
        setMessage('Testimonial created successfully!');
      }
      resetForm();
      await fetchTestimonials();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error saving testimonial');
      console.error(err);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    if (!id) return alert('Invalid testimonial ID');
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      setMessage('Testimonial deleted successfully!');
      if (editingTestimonial && editingTestimonial._id === id) {
        resetForm();
      }
      fetchTestimonials();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error deleting testimonial');
      console.error(err);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-[#F1E9DA] pb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#0A192F]">Testimonial Management</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Add, modify and manage guest experiences</p>
        </div>
        <button 
          onClick={resetForm}
          className="flex items-center gap-2 bg-[#0A192F] text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#BFA37E] transition-all"
        >
          <Plus size={16}/>
          Add New Testimonial
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Form Section */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-10 border border-[#F1E9DA] shadow-sm">
            <h2 className="text-sm font-bold text-[#0A192F] uppercase tracking-[0.2em] mb-10 pb-4 border-b border-[#F1E9DA] flex items-center gap-3">
              <Edit3 size={18} className="text-[#BFA37E]" />
              {editingTestimonial ? `Editing: ${editingTestimonial.name}` : 'Testimonial Details'}
            </h2>
            
            <form onSubmit={onSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Guest Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Anand T."
                      className="w-full bg-[#FDFBF7] border border-[#F1E9DA] p-4 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E] transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Guest City</label>
                    <input 
                      type="text" 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Delhi"
                      className="w-full bg-[#FDFBF7] border border-[#F1E9DA] p-4 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E] transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Source</label>
                    <input 
                      type="text" 
                      value={source} 
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="e.g. Via Google / Via TripAdvisor"
                      className="w-full bg-[#FDFBF7] border border-[#F1E9DA] p-4 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E] transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rating</label>
                    <select 
                      value={rating} 
                      onChange={(e) => setRating(e.target.value)}
                      className="w-full bg-[#FDFBF7] border border-[#F1E9DA] p-4 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E] transition-colors"
                    >
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="2">2 Stars</option>
                      <option value="1">1 Star</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Review / Comment</label>
                <textarea 
                  rows="4"
                  value={text} 
                  onChange={(e) => setText(e.target.value)}
                  placeholder="The guest experience comment..."
                  className="w-full bg-[#FDFBF7] border border-[#F1E9DA] p-4 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E] transition-colors leading-relaxed"
                  required
                />
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
                {editingTestimonial && (
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
                <p 
                  className={`text-[10px] font-bold uppercase tracking-widest p-4 bg-[#FDFBF7] border-l-4 mt-4 ${message.includes('success') ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}`}
                >
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-4">Current Reviews</h3>
          <div className="flex flex-col gap-6">
            {testimonials.length === 0 ? (
              <div className="bg-white p-8 border border-dashed border-[#F1E9DA] text-center">
                <p className="text-slate-400 italic text-sm">No reviews added yet.</p>
              </div>
            ) : (
              testimonials.map((t) => (
                <div key={t._id} className="bg-white p-6 border border-[#F1E9DA] group hover:border-[#BFA37E] transition-all duration-500 shadow-sm hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-[#0A192F] uppercase tracking-wider">{t.name}</h4>
                      <div className="flex gap-1 items-center bg-[#FDFBF7] px-2 py-1">
                        <span className="text-[9px] font-bold text-[#BFA37E] uppercase">{t.rating}</span>
                        <Star size={10} fill="#BFA37E" className="text-[#BFA37E]" />
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-[#BFA37E] bg-[#FDFBF7] px-2 py-1 uppercase tracking-wider block w-fit mb-2">{t.city} • {t.source}</span>
                    <p className="text-xs text-slate-500 italic mb-4 leading-relaxed font-serif">"{t.text}"</p>
                  </div>
                  <div className="flex gap-4 border-t border-[#F1E9DA] pt-4 mt-2">
                    <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(t); }} 
                      className="flex items-center gap-1 text-[10px] font-bold text-[#0A192F] hover:text-[#BFA37E] uppercase tracking-widest transition-colors"
                    >
                      <Edit3 size={12}/> Edit
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(t._id); }} 
                      className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors ml-auto"
                    >
                      <Trash2 size={12}/> Delete
                    </button>
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

export default TestimonialManagement;
