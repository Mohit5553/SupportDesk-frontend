import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, X, ArrowLeft, Ticket as TicketIcon } from 'lucide-react';
import API from '../lib/axios';
import SearchableSelect from '../components/ui/SearchableSelect';

const schema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
    description: z.string().min(20, 'Please provide more details in description'),
    category: z.string().min(1, 'Category is required'),
    subcategory: z.string().min(1, 'Subcategory is required'),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
});

const PRIORITY_OPTIONS = [
    { name: 'Low' },
    { name: 'Medium' },
    { name: 'High' },
    { name: 'Critical' }
];

const NewTicket = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [attachments, setAttachments] = useState([]);
    const [subcategories, setSubcategories] = useState([]);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            category: '',
            subcategory: '',
            priority: 'Low',
        },
    });

    const selectedCategory = watch('category');
    const selectedSubcategory = watch('subcategory');
    const selectedPriority = watch('priority');

    const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
        queryKey: ['ticket-categories'],
        queryFn: async () => {
            const res = await API.get('/tickets/categories');
            return Array.isArray(res.data.categories) ? res.data.categories : [];
        },
    });

    useEffect(() => {
        if (selectedCategory && categoriesData) {
            const category = categoriesData.find(c => c.name === selectedCategory);
            if (category) {
                setSubcategories(category.subcategories);
                // Only reset if it's not already set (prevents loop)
                const currentSubcat = category.subcategories.find(s => s.name === selectedSubcategory);
                if (!currentSubcat && selectedSubcategory !== '') {
                    setValue('subcategory', '');
                }
            }
        } else {
            setSubcategories([]);
            if (selectedSubcategory !== '') setValue('subcategory', '');
        }
    }, [selectedCategory, categoriesData, setValue]);

    const createTicketMutation = useMutation({
        mutationFn: async (formData) => {
            const res = await API.post('/tickets', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['tickets']);
            toast.success('Ticket created successfully!');
            navigate(`/tickets/${data.ticket._id}`);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create ticket');
        },
    });

    const onSubmit = (data) => {
        if (createTicketMutation.isPending) return;

        const formData = new FormData();
        Object.keys(data).forEach((key) => formData.append(key, data[key]));
        attachments.forEach((file) => formData.append('attachments', file));

        createTicketMutation.mutate(formData);
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            if (filesArray.length + attachments.length > 5) {
                toast.error('Maximum 5 attachments allowed');
                return;
            }
            setAttachments((prev) => [...prev, ...filesArray]);
        }
    };

    const removeAttachment = (index) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            <button
                onClick={() => navigate('/tickets')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to tickets
            </button>

            <div className="glass-card p-6 md:p-8">
                <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                        <TicketIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Create New Ticket</h1>
                        <p className="text-slate-400 text-sm mt-1">Please provide detailed information about your issue.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="form-label">Subject</label>
                        <input
                            {...register('title')}
                            className="form-input text-lg"
                            placeholder="Brief summary of the issue"
                        />
                        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SearchableSelect
                            label="Category"
                            options={categoriesData || []}
                            value={selectedCategory}
                            onChange={(val) => setValue('category', val, { shouldValidate: true })}
                            placeholder={categoriesLoading ? 'Loading...' : 'Select Category'}
                            disabled={categoriesLoading}
                            error={errors.category?.message}
                        />

                        <SearchableSelect
                            label="Subcategory"
                            options={subcategories}
                            value={selectedSubcategory}
                            onChange={(val) => setValue('subcategory', val, { shouldValidate: true })}
                            placeholder={!selectedCategory ? 'Select category first' : 'Select Subcategory'}
                            disabled={!selectedCategory || subcategories.length === 0}
                            error={errors.subcategory?.message}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SearchableSelect
                            label="Priority"
                            options={PRIORITY_OPTIONS}
                            value={selectedPriority}
                            onChange={(val) => setValue('priority', val, { shouldValidate: true })}
                            placeholder="Select Priority"
                            error={errors.priority?.message}
                        />
                    </div>

                    <div>
                        <label className="form-label">Description</label>
                        <textarea
                            {...register('description')}
                            className="form-input min-h-[200px] resize-y"
                            placeholder="Please describe your issue in detail. Include error messages, steps to reproduce, etc."
                        />
                        {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
                    </div>

                    {/* Attachments */}
                    <div>
                        <label className="form-label">Attachments (Max 5)</label>
                        <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center bg-white/5 hover:border-primary-500/50 transition-colors">
                            <Upload className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                            <p className="text-sm text-slate-400 mb-4">Drag and drop files here, or click to browse</p>
                            <label className="btn-secondary cursor-pointer inline-block">
                                Choose Files
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                                />
                            </label>
                        </div>

                        {attachments.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-dark-800 border border-white/10 px-3 py-2 rounded-lg text-sm text-slate-300">
                                        <span className="truncate max-w-[200px]">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(idx)}
                                            className="text-slate-500 hover:text-red-400 ml-2"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-white/10 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/tickets')}
                            className="px-6 py-2.5 rounded-xl text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createTicketMutation.isPending}
                            className="btn-primary min-w-[150px]"
                        >
                            {createTicketMutation.isPending ? 'Creating...' : 'Submit Ticket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewTicket;
