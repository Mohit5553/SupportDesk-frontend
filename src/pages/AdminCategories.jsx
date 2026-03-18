import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
    Plus, Trash2, Save, Settings, Layers, 
    ArrowRight, Clock, ChevronLeft, ShieldCheck, Tag
} from 'lucide-react';
import API from '../lib/axios';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const AdminCategories = () => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ name: '', subcategories: [] });

    const { data: categories, isLoading } = useQuery({
        queryKey: ['admin-categories'],
        queryFn: async () => {
            try {
                const res = await API.get('/admin/categories');
                return Array.isArray(res.data.categories) ? res.data.categories : [];
            } catch (error) {
                console.error('Failed to fetch admin categories:', error);
                return [];
            }
        },
        initialData: [],
    });

    const upsertCategoryMutation = useMutation({
        mutationFn: async (data) => {
            const res = await API.post('/admin/categories', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-categories']);
            toast.success('Category updated successfully');
            setIsEditing(false);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update category');
        },
    });

    const handleEdit = (cat) => {
        setEditData({ ...cat });
        setIsEditing(true);
    };

    const handleNew = () => {
        setEditData({ name: '', subcategories: [] });
        setIsEditing(true);
    };

    const addSubcategory = () => {
        setEditData(prev => ({
            ...prev,
            subcategories: [...prev.subcategories, { name: '', escalationTiming: 30 }]
        }));
    };

    const removeSubcategory = (index) => {
        setEditData(prev => ({
            ...prev,
            subcategories: prev.subcategories.filter((_, i) => i !== index)
        }));
    };

    const updateSubcategory = (index, field, value) => {
        const newSubcats = [...editData.subcategories];
        newSubcats[index] = { ...newSubcats[index], [field]: value };
        setEditData(prev => ({ ...prev, subcategories: newSubcats }));
    };

    const handleSave = () => {
        if (!editData.name.trim()) return toast.error('Category name is required');
        if (editData.subcategories.some(s => !s.name.trim())) return toast.error('All subcategories must have a name');
        
        upsertCategoryMutation.mutate(editData);
    };

    if (isLoading) return <LoadingSpinner fullScreen />;

    if (isEditing) {
        return (
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
                <div className="flex items-center gap-4 border-b border-white/10 pb-5">
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="p-2 rounded-xl hover:bg-white/5 transition-colors text-slate-400"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-white">
                            {editData._id ? 'Edit Category' : 'Create New Category'}
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Configure the category name and its associated subcategories with SLAs.</p>
                    </div>
                </div>

                <div className="glass-card p-6 md:p-8 space-y-8">
                    {/* Category Details */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-primary-400" />
                            General Information
                        </h3>
                        <div className="max-w-md">
                            <label className="form-label">Category Name</label>
                            <input 
                                type="text"
                                value={editData.name}
                                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                                className="form-input text-lg font-medium"
                                placeholder="e.g., Software Support"
                            />
                        </div>
                    </div>

                    <hr className="border-white/10" />

                    {/* Subcategories */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Tag className="w-5 h-5 text-violet-400" />
                                Subcategories & SLAs
                            </h3>
                            <button 
                                onClick={addSubcategory}
                                className="btn-secondary py-2 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Subcategory
                            </button>
                        </div>

                        {editData.subcategories.length === 0 ? (
                            <div className="text-center py-12 bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                                <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
                                    <Clock className="w-8 h-8 text-violet-400" />
                                </div>
                                <h4 className="text-lg font-medium text-slate-300 mb-2">No Subcategories Yet</h4>
                                <p className="text-slate-500 max-w-sm mx-auto mb-6">Add subcategories to define specific issue types and their expected resolution times (SLAs) in minutes.</p>
                                <button onClick={addSubcategory} className="btn-primary inline-flex">
                                    Add Your First Subcategory
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {editData.subcategories.map((sub, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end bg-dark-900/50 p-5 rounded-xl border border-white/5 relative group hover:border-white/10 transition-colors">
                                        
                                        {/* Subcategory Name */}
                                        <div className="flex-1 w-full">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                                                Subcategory Name
                                            </label>
                                            <input 
                                                type="text"
                                                value={sub.name}
                                                onChange={(e) => updateSubcategory(idx, 'name', e.target.value)}
                                                className="form-input"
                                                placeholder="e.g., Bug Fix, Login Issue"
                                            />
                                        </div>

                                        {/* SLA Time */}
                                        <div className="w-full sm:w-48">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" /> SLA Context
                                            </label>
                                            <div className="relative">
                                                <input 
                                                    type="number"
                                                    value={sub.escalationTiming}
                                                    onChange={(e) => updateSubcategory(idx, 'escalationTiming', parseInt(e.target.value))}
                                                    className="form-input pr-16"
                                                    min="1"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                                                    minutes
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delete Button */}
                                        <button 
                                            onClick={() => removeSubcategory(idx)}
                                            className="w-full sm:w-auto mt-2 sm:mt-0 px-4 h-12 rounded-xl flex items-center justify-center border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all bg-red-500/5 group-hover:bg-red-500/10"
                                            title="Remove Subcategory"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                            <span className="sm:hidden ml-2 font-medium">Remove</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-6 border-t border-white/10 mt-8">
                        <div className="flex gap-4">
                            <button onClick={() => setIsEditing(false)} className="btn-secondary px-6">Cancel</button>
                            <button 
                                onClick={handleSave} 
                                disabled={upsertCategoryMutation.isLoading}
                                className="btn-primary px-8 flex items-center gap-2"
                            >
                                <Save className="w-5 h-5" /> 
                                {upsertCategoryMutation.isLoading ? 'Saving...' : 'Save Category'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Default Grid View
    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-10">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900/40 via-violet-900/20 to-dark-900 border border-white/5 p-8">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[400px] h-[400px] bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                                <Settings className="w-6 h-6 text-white" />
                            </div>
                            Category Management
                        </h1>
                        <p className="text-slate-400 font-medium mt-3 max-w-xl leading-relaxed">
                            Organize your support tickets by defining categories and mapping specific subcategories to target SLAs for your agents.
                        </p>
                    </div>
                    
                    <button onClick={handleNew} className="btn-primary py-3 px-6 shadow-lg shadow-primary-500/20 flex items-center gap-2 text-base shrink-0">
                        <Plus className="w-5 h-5" /> Create Category
                    </button>
                </div>
            </div>

            {categories.length === 0 ? (
                <div className="glass-card p-12 text-center border-dashed border-2">
                    <div className="w-20 h-20 rounded-full bg-slate-500/10 flex items-center justify-center mx-auto mb-6">
                        <Layers className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white">No categories configured yet.</h3>
                    <p className="text-slate-500 max-w-md mx-auto mt-2">
                        Get started by setting up the top-level categories that map the kinds of tickets your agents will receive.
                    </p>
                    <button onClick={handleNew} className="mt-8 btn-primary px-8">Create First Category</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((cat) => (
                        <div 
                            key={cat._id}
                            className="glass-card group hover:border-primary-500/40 transition-all flex flex-col overflow-hidden bg-gradient-to-b from-white/[0.03] to-transparent cursor-pointer relative"
                            onClick={() => handleEdit(cat)}
                        >
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 border border-primary-500/20 group-hover:scale-110 transition-transform duration-300">
                                        <Layers className="w-6 h-6" />
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center text-slate-500 group-hover:bg-primary-500 group-hover:text-white transition-colors group-hover:border-primary-400">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-200 group-hover:text-white mb-2">{cat.name}</h3>
                                <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mb-6">
                                    <Tag className="w-4 h-4" /> {cat.subcategories.length} Subcategories
                                </p>

                                {/* Mini Pills for subcategories preview */}
                                <div className="flex flex-wrap gap-2">
                                    {cat.subcategories.slice(0, 5).map((sub, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-white/5 border border-white/5 px-2 py-1 rounded-md">
                                            {sub.name} <span className="text-primary-400/80">({sub.escalationTiming}m)</span>
                                        </span>
                                    ))}
                                    {cat.subcategories.length > 5 && (
                                        <span className="inline-flex items-center text-[11px] font-bold text-slate-500 bg-white/5 border border-white/5 px-2 py-1 rounded-md">
                                            +{cat.subcategories.length - 5} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminCategories;
