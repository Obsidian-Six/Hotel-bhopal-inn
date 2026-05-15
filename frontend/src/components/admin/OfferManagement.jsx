import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { Tag, Trash2, CheckCircle, XCircle } from 'lucide-react';

const OfferManagement = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validity, setValidity] = useState('');
  const [terms, setTerms] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);

  const API_URL = `${config.API_URL}/api/offers`;

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await axios.get(API_URL);
      setOffers(res.data);
    } catch (err) {
      console.error('Error fetching offers:', err);
    }
  };

  const onFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !validity || !terms) {
      setMessage('Please fill all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('validity', validity);
    formData.append('terms', terms);
    formData.append('isActive', isActive);
    if (selectedFile) {
        formData.append('image', selectedFile);
    }

    setLoading(true);
    try {
      await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Offer created successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setValidity('');
      setTerms('');
      setIsActive(true);
      setSelectedFile(null);
      // Reset file input UI manually if needed, but simple reset is ok
      document.getElementById('offerImage').value = '';
      
      fetchOffers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to create offer');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (offer) => {
    try {
      const formData = new FormData();
      formData.append('title', offer.title);
      formData.append('description', offer.description);
      formData.append('validity', offer.validity);
      formData.append('terms', offer.terms);
      formData.append('isActive', !offer.isActive);

      await axios.put(`${API_URL}/${offer._id}`, formData);
      fetchOffers();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchOffers();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold text-[#000000]">Special Offers Management</h2>
      </div>

      {/* Upload Section */}
      <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-6">Create New Offer</h3>
        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Offer Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Early Bird Discount" className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#000000] focus:outline-none focus:border-[#BFA37E]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Validity Period</label>
              <input type="text" value={validity} onChange={(e) => setValidity(e.target.value)} required placeholder="e.g. Valid till Dec 31, 2026" className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#000000] focus:outline-none focus:border-[#BFA37E]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Short Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="e.g. Book 14 days in advance..." rows="3" className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#000000] focus:outline-none focus:border-[#BFA37E] resize-none" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Terms & Conditions</label>
              <textarea value={terms} onChange={(e) => setTerms(e.target.value)} required placeholder="e.g. Non-refundable, subject to availability..." rows="3" className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs text-slate-600 focus:outline-none focus:border-[#BFA37E] resize-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Offer Image / Icon</label>
              <input type="file" id="offerImage" onChange={onFileChange} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-[#BFA37E] file:text-white hover:file:bg-[#000000] transition-all" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-[#BFA37E]" />
              <label htmlFor="isActive" className="text-xs font-bold text-slate-600 uppercase tracking-widest">Mark as Active</label>
            </div>
            <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full bg-[#000000] text-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-50">
                {loading ? 'Saving...' : 'Publish Offer'}
                </button>
                {message && <p className={`text-[10px] font-bold uppercase tracking-widest mt-4 ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
            </div>
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-8">Current Offers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offers.length === 0 ? (
            <p className="text-slate-400 italic text-sm">No offers available.</p>
          ) : (
            offers.map((offer) => (
              <div key={offer._id} className={`flex gap-4 border ${offer.isActive ? 'border-[#BFA37E]/30 bg-[#FDFBF7]' : 'border-slate-200 bg-slate-50 opacity-70'} p-4 transition-all`}>
                 {offer.imageUrl ? (
                    <img src={`${config.API_URL}${offer.imageUrl}`} alt={offer.title} className="w-24 h-24 object-cover" />
                 ) : (
                    <div className="w-24 h-24 bg-slate-200 flex items-center justify-center text-slate-400"><Tag size={24} /></div>
                 )}
                 <div className="flex-grow flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start">
                            <h4 className="text-sm font-serif font-bold text-[#000000] uppercase">{offer.title}</h4>
                            <div className="flex gap-2">
                                <button onClick={() => toggleStatus(offer)} title={offer.isActive ? 'Deactivate' : 'Activate'} className={`text-[10px] ${offer.isActive ? 'text-green-600 hover:text-green-800' : 'text-slate-400 hover:text-slate-600'}`}>
                                    {offer.isActive ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                </button>
                                <button onClick={() => onDelete(offer._id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-[#BFA37E] uppercase tracking-widest mt-1 mb-2">{offer.validity}</p>
                        <p className="text-xs text-slate-500 line-clamp-2">{offer.description}</p>
                    </div>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferManagement;
