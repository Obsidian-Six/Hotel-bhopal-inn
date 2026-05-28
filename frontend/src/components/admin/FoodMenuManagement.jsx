import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { Plus, Trash2, Edit2, Utensils, Circle } from 'lucide-react';

const FoodMenuManagement = () => {
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [specials, setSpecials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Forms states
    const [showCatForm, setShowCatForm] = useState(false);
    const [catData, setCatData] = useState({ name: '', image: null });

    const [showItemForm, setShowItemForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [itemData, setItemData] = useState({ 
        name: '', picture: null, description: '', category: '', isVeg: true, quantity: '', cost: '' 
    });

    const [showSpecialForm, setShowSpecialForm] = useState(false);
    const [specialData, setSpecialData] = useState({ heading: '', image: null });

    const [activeSpecialId, setActiveSpecialId] = useState(null);
    const [specialItemData, setSpecialItemData] = useState({ name: '', description: '', picture: null, isVeg: true, quantity: '', price: '' });

    const API_URL = `${config.API_URL}/api/menu`;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [catRes, itemRes, specialRes] = await Promise.all([
                axios.get(`${API_URL}/categories`),
                axios.get(`${API_URL}/items`),
                axios.get(`${API_URL}/specials`)
            ]);
            setCategories(catRes.data);
            setItems(itemRes.data);
            setSpecials(specialRes.data);
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
            setItemData({ name: '', picture: null, description: '', category: '', isVeg: true, quantity: '', cost: '' });
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
            quantity: item.quantity,
            cost: item.cost || ''
        });
        setShowItemForm(true);
    };

    const handleSpecialSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        data.append('heading', specialData.heading);
        if (specialData.image) data.append('image', specialData.image);

        try {
            await axios.post(`${API_URL}/specials`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('Special added!');
            setSpecialData({ heading: '', image: null });
            setShowSpecialForm(false);
            fetchData();
        } catch (err) {
            setMessage('Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSpecialDelete = async (id) => {
        if (!window.confirm('Delete this Special?')) return;
        try {
            await axios.delete(`${API_URL}/specials/${id}`);
            fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const handleSpecialItemSubmit = async (e, specialId) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        data.append('name', specialItemData.name);
        data.append('description', specialItemData.description);
        if (specialItemData.picture) data.append('picture', specialItemData.picture);
        data.append('isVeg', specialItemData.isVeg);
        data.append('quantity', specialItemData.quantity);
        data.append('price', specialItemData.price);

        try {
            await axios.post(`${API_URL}/specials/${specialId}/items`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('Special item added!');
            setSpecialItemData({ name: '', description: '', picture: null, isVeg: true, quantity: '', price: '' });
            setActiveSpecialId(null);
            fetchData();
        } catch (err) {
            setMessage('Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSpecialItemDelete = async (specialId, itemId) => {
        if (!window.confirm('Delete this special item?')) return;
        try {
            await axios.delete(`${API_URL}/specials/${specialId}/items/${itemId}`);
            fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    return (
        <div className="space-y-12 pb-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <h2 className="text-3xl font-serif font-bold text-[#000000]">Food Menu CMS</h2>
                {message && <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{message}</p>}
            </div>

            {/* Categories Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Menu Categories</h3>
                    <button 
                        onClick={() => setShowCatForm(!showCatForm)}
                        className="bg-[#000000] text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#BFA37E] transition-all"
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
                                className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#000000] focus:outline-none focus:border-[#BFA37E]"
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
                            <p className="text-center mt-2 text-[9px] font-bold uppercase tracking-widest text-[#000000]">{cat.name}</p>
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
                        className="bg-[#000000] text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#BFA37E] transition-all"
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
                                    className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#000000] focus:outline-none focus:border-[#BFA37E]"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Category</label>
                                <select 
                                    required
                                    value={itemData.category} 
                                    onChange={(e) => setItemData({ ...itemData, category: e.target.value })}
                                    className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#000000] focus:outline-none focus:border-[#BFA37E]"
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
                                    className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#000000] focus:outline-none focus:border-[#BFA37E]"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Price/Cost (₹)</label>
                                <input 
                                    type="number" 
                                    required
                                    placeholder="e.g. 250"
                                    value={itemData.cost} 
                                    onChange={(e) => setItemData({ ...itemData, cost: e.target.value })}
                                    className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#000000] focus:outline-none focus:border-[#BFA37E]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Description</label>
                                <textarea 
                                    value={itemData.description} 
                                    onChange={(e) => setItemData({ ...itemData, description: e.target.value })}
                                    className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#000000] focus:outline-none focus:border-[#BFA37E] h-24"
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
                                        <span className="text-green-600">Vegetarian</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-[#000000] text-white px-10 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[#BFA37E]"
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
                                        <h4 className="text-sm font-bold text-[#000000] uppercase tracking-tight">{item.name}</h4>
                                        <p className="text-[8px] font-bold text-[#BFA37E] uppercase tracking-widest">{item.category?.name} {item.cost ? `| ₹${item.cost}` : ''}</p>
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

            {/* Specials Section */}
            <section className="space-y-6 pt-8 border-t border-slate-100">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Specials Management</h3>
                    <button 
                        onClick={() => setShowSpecialForm(!showSpecialForm)}
                        className="bg-[#000000] text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#BFA37E] transition-all"
                    >
                        {showSpecialForm ? 'Cancel' : <><Plus size={14} /> Add Special</>}
                    </button>
                </div>

                {showSpecialForm && (
                    <form onSubmit={handleSpecialSubmit} className="bg-white p-8 border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Heading Name</label>
                            <input 
                                type="text" 
                                required
                                value={specialData.heading} 
                                onChange={(e) => setSpecialData({ ...specialData, heading: e.target.value })}
                                className="w-full bg-[#FDFBF7] border border-slate-100 p-3 text-xs font-bold text-[#000000] focus:outline-none focus:border-[#BFA37E]"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Hero Image</label>
                            <input 
                                type="file" 
                                required
                                onChange={(e) => setSpecialData({ ...specialData, image: e.target.files[0] })}
                                className="w-full text-[10px] text-slate-400"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-[#BFA37E] text-white py-3 text-[10px] font-bold uppercase tracking-widest"
                        >
                            Save Special
                        </button>
                    </form>
                )}

                <div className="grid grid-cols-1 gap-6">
                    {specials.map(special => (
                        <div key={special._id} className="bg-white border border-slate-100 p-6 relative group flex flex-col md:flex-row gap-8">
                            {/* Special Category Info */}
                            <div className="md:w-1/3">
                                <h4 className="text-sm font-bold text-[#000000] uppercase tracking-tight mb-4">{special.heading}</h4>
                                <div className="w-full h-40 rounded-lg overflow-hidden mb-4">
                                    <img src={`${config.API_URL}${special.image}`} className="w-full h-full object-cover" alt={special.heading} />
                                </div>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setActiveSpecialId(activeSpecialId === special._id ? null : special._id)}
                                        className="bg-[#000000] text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex-grow hover:bg-[#BFA37E] transition-all"
                                    >
                                        {activeSpecialId === special._id ? 'Close' : 'Manage Items'}
                                    </button>
                                    <button 
                                        onClick={() => handleSpecialDelete(special._id)}
                                        className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-all shadow-sm"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Special Items List */}
                            <div className="md:w-2/3 border-l border-slate-100 pl-8">
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Special Items ({special.items?.length || 0})</h5>
                                
                                {activeSpecialId === special._id && (
                                    <form onSubmit={(e) => handleSpecialItemSubmit(e, special._id)} className="bg-slate-50 p-6 border border-slate-100 mb-6 space-y-4">
                                        <h6 className="text-[10px] font-bold text-[#000000] uppercase tracking-widest">Add New Item to {special.heading}</h6>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input type="text" placeholder="Item Name" required value={specialItemData.name} onChange={e => setSpecialItemData({...specialItemData, name: e.target.value})} className="w-full bg-white border border-slate-200 p-2 text-xs focus:border-[#BFA37E] outline-none" />
                                            <input type="number" placeholder="Price (₹)" required value={specialItemData.price} onChange={e => setSpecialItemData({...specialItemData, price: e.target.value})} className="w-full bg-white border border-slate-200 p-2 text-xs focus:border-[#BFA37E] outline-none" />
                                            <input type="text" placeholder="Quantity/Serving" value={specialItemData.quantity} onChange={e => setSpecialItemData({...specialItemData, quantity: e.target.value})} className="w-full bg-white border border-slate-200 p-2 text-xs focus:border-[#BFA37E] outline-none" />
                                            <div className="flex items-center gap-4 bg-white border border-slate-200 px-3">
                                                <input type="file" onChange={e => setSpecialItemData({...specialItemData, picture: e.target.files[0]})} className="text-[10px] w-full text-slate-400" />
                                            </div>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <textarea placeholder="Description" value={specialItemData.description} onChange={e => setSpecialItemData({...specialItemData, description: e.target.value})} className="w-full bg-white border border-slate-200 p-2 text-xs focus:border-[#BFA37E] outline-none h-10" />
                                            <button type="button" onClick={() => setSpecialItemData({...specialItemData, isVeg: !specialItemData.isVeg})} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${specialItemData.isVeg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                <Circle size={10} fill={specialItemData.isVeg ? '#15803d' : '#b91c1c'} /> {specialItemData.isVeg ? 'Veg' : 'Non-Veg'}
                                            </button>
                                        </div>
                                        <button type="submit" disabled={loading} className="bg-[#BFA37E] text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest">Add Item</button>
                                    </form>
                                )}

                                <div className="space-y-4">
                                    {special.items?.map(item => (
                                        <div key={item._id} className="flex gap-4 items-center bg-white p-4 border border-slate-100 shadow-sm group">
                                            {item.picture && (
                                                <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                                                    <img src={`${config.API_URL}${item.picture}`} className="w-full h-full object-cover" alt={item.name} />
                                                </div>
                                            )}
                                            <div className="flex-grow">
                                                <h6 className="text-xs font-bold text-[#000000]">{item.name}</h6>
                                                <p className="text-[10px] text-slate-500">₹{item.price} • {item.quantity}</p>
                                            </div>
                                            <button onClick={() => handleSpecialItemDelete(special._id, item._id)} className="text-slate-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!special.items || special.items.length === 0) && (
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest italic">No items added yet.</p>
                                    )}
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
