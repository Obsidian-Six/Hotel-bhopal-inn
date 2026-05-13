import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { Plus, Trash2, Edit2, Utensils, Circle } from 'lucide-react';

const FoodMenuManagement = () => {
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Forms states
    const [showCatForm, setShowCatForm] = useState(false);
    const [catData, setCatData] = useState({ name: '', image: null });

    const [showItemForm, setShowItemForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [itemData, setItemData] = useState({ 
        name: '', picture: null, description: '', category: '', isVeg: true, quantity: '' 
    });

    const API_URL = `${config.API_URL}/api/menu`;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [catRes, itemRes] = await Promise.all([
                axios.get(`${API_URL}/categories`),
                axios.get(`${API_URL}/items`)
            ]);
            setCategories(catRes.data);
            setItems(itemRes.data);
        } catch (err) {
            console.error('Error fetching menu data:', err);
        }
    };

    // --- Category Handlers ---
    const handleCatSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        data.append('name', catData.name);
        data.append('image', catData.image);

        try {
            await axios.post(`${API_URL}/categories`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('Category added!');
            setCatData({ name: '', image: null });
            setShowCatForm(false);
            fetchData();
        } catch (err) {
            setMessage('Failed to add category');
        } finally {
            setLoading(false);
        }
    };

    const handleCatDelete = async (id) => {
        if (!window.confirm('Deleting a category will also delete all items in it. Proceed?')) return;
        try {
            await axios.delete(`${API_URL}/categories/${id}`);
            fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    // --- Item Handlers ---
    const handleItemSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        Object.keys(itemData).forEach(key => {
            if (key === 'picture' && !itemData[key] && editItem) return;
            data.append(key, itemData[key]);
        });

        try {
            if (editItem) {
                await axios.put(`${API_URL}/items/${editItem._id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setMessage('Item updated!');
            } else {
                await axios.post(`${API_URL}/items`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setMessage('Item added!');
            }
            setItemData({ name: '', picture: null, description: '', category: '', isVeg: true, quantity: '' });
            setShowItemForm(false);
            setEditItem(null);
            fetchData();
        } catch (err) {
            setMessage('Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleItemDelete = async (id) => {
        if (!window.confirm('Delete this item?')) return;
        try {
            await axios.delete(`${API_URL}/items/${id}`);
            fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const handleEditItem = (item) => {
        setEditItem(item);
        setItemData({
            name: item.name,
            picture: null,
            description: item.description,
            category: item.category._id || item.category,
            isVeg: item.isVeg,
            quantity: item.quantity
        });
        setShowItemForm(true);
    };

    return (
        <div className="space-y-12 pb-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <h2 className="text-3xl font-serif font-bold text-[#0A192F]">Food Menu CMS</h2>
                {message && <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{message}</p>}
            </div>

            {/* Categories Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Menu Categories</h3>
                    <button 
                        onClick={() => setShowCatForm(!showCatForm)}
                        className="bg-[#0A192F] text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#BFA37E] transition-all"
                    >
                        {showCatForm ? 'Cancel' : <><Plus size={14} /> Add Category</>}
                    </button>
                </div>

                {showCatForm && (
                    <form onSubmit={handleCatSubmit} className="bg-white p-8 border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Category Name</label>
                            <input 
                                type="text" 
                                required
                                value={catData.name} 
                                onChange={(e) => setCatData({ ...catData, name: e.target.value })}
                                className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E]"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Circle Image</label>
                            <input 
                                type="file" 
                                required
                                onChange={(e) => setCatData({ ...catData, image: e.target.files[0] })}
                                className="w-full text-[10px] text-slate-400"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-[#BFA37E] text-white py-3 text-[10px] font-bold uppercase tracking-widest"
                        >
                            Save Category
                        </button>
                    </form>
                )}

                <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
                    {categories.map(cat => (
                        <div key={cat._id} className="flex-shrink-0 group relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#BFA37E] p-1">
                                <img src={`${config.API_URL}${cat.image}`} className="w-full h-full object-cover rounded-full" alt={cat.name} />
                            </div>
                            <p className="text-center mt-2 text-[9px] font-bold uppercase tracking-widest text-[#0A192F]">{cat.name}</p>
                            <button 
                                onClick={() => handleCatDelete(cat._id)}
                                className="absolute -top-2 -right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Menu Items Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Menu Items</h3>
                    <button 
                        onClick={() => { setShowItemForm(!showItemForm); setEditItem(null); }}
                        className="bg-[#0A192F] text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#BFA37E] transition-all"
                    >
                        {showItemForm ? 'Cancel' : <><Plus size={14} /> Add Menu Item</>}
                    </button>
                </div>

                {showItemForm && (
                    <form onSubmit={handleItemSubmit} className="bg-white p-8 border border-slate-100 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Item Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={itemData.name} 
                                    onChange={(e) => setItemData({ ...itemData, name: e.target.value })}
                                    className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E]"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Category</label>
                                <select 
                                    required
                                    value={itemData.category} 
                                    onChange={(e) => setItemData({ ...itemData, category: e.target.value })}
                                    className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E]"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Quantity/Serving</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. 1 Plate, 12 Pcs"
                                    value={itemData.quantity} 
                                    onChange={(e) => setItemData({ ...itemData, quantity: e.target.value })}
                                    className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Description</label>
                                <textarea 
                                    value={itemData.description} 
                                    onChange={(e) => setItemData({ ...itemData, description: e.target.value })}
                                    className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#BFA37E] h-24"
                                />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Item Picture</label>
                                    <input 
                                        type="file" 
                                        onChange={(e) => setItemData({ ...itemData, picture: e.target.files[0] })}
                                        className="w-full text-[10px] text-slate-400"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type:</label>
                                    <button 
                                        type="button"
                                        onClick={() => setItemData({ ...itemData, isVeg: !itemData.isVeg })}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${itemData.isVeg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                    >
                                        <Circle size={10} fill={itemData.isVeg ? '#15803d' : '#b91c1c'} />
                                        {itemData.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-[#0A192F] text-white px-10 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[#BFA37E]"
                        >
                            {editItem ? 'Update Item' : 'Add to Menu'}
                        </button>
                    </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => (
                        <div key={item._id} className="bg-white border border-slate-100 p-6 flex gap-4 group">
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={`${config.API_URL}${item.picture}`} className="w-full h-full object-cover" alt={item.name} />
                            </div>
                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-sm font-bold text-[#0A192F] uppercase tracking-tight">{item.name}</h4>
                                        <p className="text-[8px] font-bold text-[#BFA37E] uppercase tracking-widest">{item.category?.name}</p>
                                    </div>
                                    <div className={`w-3 h-3 border-2 p-[2px] flex items-center justify-center ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                                        <div className={`w-full h-full rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-2">{item.description}</p>
                                <div className="flex justify-end items-center mt-4">
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => handleEditItem(item)} className="p-2 text-slate-400 hover:text-[#BFA37E]"><Edit2 size={12} /></button>
                                        <button onClick={() => handleItemDelete(item._id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default FoodMenuManagement;
