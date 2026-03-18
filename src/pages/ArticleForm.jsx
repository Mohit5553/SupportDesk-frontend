import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReactMarkdown from 'react-markdown';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save, ArrowLeft, BookOpen, Eye, EyeOff } from 'lucide-react';
import API from '../lib/axios';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const schema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    category: z.string().min(1, 'Category is required'),
    content: z.string().min(50, 'Content must be at least 50 characters'),
    tags: z.string().optional(),
    isPublished: z.boolean().default(true),
});

const ArticleForm = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEdit = !!slug;
    const [preview, setPreview] = useState(false);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            title: '',
            category: 'General',
            content: '',
            tags: '',
            isPublished: true,
        },
    });

    const isPublished = watch('isPublished');

    // Fetch article if editing
    const { data: articleData, isLoading } = useQuery({
        queryKey: ['article-edit', slug],
        queryFn: async () => {
            const res = await API.get(`/articles/${slug}`);
            return res.data.article;
        },
        enabled: isEdit,
        onSuccess: (data) => {
            reset({
                title: data.title,
                category: data.category,
                content: data.content,
                tags: data.tags?.join(', '),
                isPublished: data.isPublished,
            });
        }
    });

    const mutation = useMutation({
        mutationFn: async (data) => {
            if (isEdit) {
                return await API.put(`/articles/${articleData._id}`, data);
            }
            return await API.post('/articles', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['articles']);
            toast.success(`Article ${isEdit ? 'updated' : 'created'} successfully!`);
            navigate('/knowledge-base');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Something went wrong');
        }
    });

    const onSubmit = (data) => {
        mutation.mutate(data);
    };

    if (isLoading) return <LoadingSpinner fullScreen />;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 pb-20">
            <button
                onClick={() => navigate('/knowledge-base')}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group px-4 py-2 hover:bg-white/5 rounded-lg w-fit"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                Back to Library
            </button>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Form Side */}
                <div className="flex-1">
                    <div className="glass-card p-6 md:p-8">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{isEdit ? 'Edit Article' : 'Compose Article'}</h1>
                                <p className="text-slate-400 text-sm mt-1">Share knowledge with the community</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <label className="form-label">Article Title</label>
                                <input
                                    {...register('title')}
                                    className="form-input text-lg font-semibold"
                                    placeholder="e.g. How to troubleshoot VPN connection"
                                />
                                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="form-label">Category</label>
                                    <select {...register('category')} className="form-input">
                                        <option value="General">General</option>
                                        <option value="Security">Security</option>
                                        <option value="Network">Network</option>
                                        <option value="Acounts">Accounts</option>
                                        <option value="Software">Software</option>
                                        <option value="Hardware">Hardware</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Tags (comma separated)</label>
                                    <input
                                        {...register('tags')}
                                        className="form-input"
                                        placeholder="vpn, internet, guide"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="form-label flex justify-between items-center mb-4">
                                    <span className="flex items-center gap-2">
                                        Content (Markdown Supported)
                                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-500 font-normal">Min 50 chars</span>
                                    </span>
                                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
                                        <button 
                                            type="button"
                                            onClick={() => setPreview(false)}
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${!preview ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Editor
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setPreview(true)}
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${preview ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Preview
                                        </button>
                                    </div>
                                </label>
                                
                                {!preview ? (
                                    <textarea
                                        {...register('content')}
                                        className="form-input min-h-[400px] font-mono text-sm leading-relaxed"
                                        placeholder="# Introduction\nWrite your article content here..."
                                    />
                                ) : (
                                    <div className="form-input min-h-[400px] bg-white/[0.02] prose prose-invert prose-sm max-w-none overflow-y-auto p-6 border-dashed border-white/10">
                                        {watch('content') ? (
                                            <ReactMarkdown>{watch('content')}</ReactMarkdown>
                                        ) : (
                                            <p className="text-slate-600 italic">No content to preview...</p>
                                        )}
                                    </div>
                                )}
                                {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content.message}</p>}
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-white/10">
                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            {...register('isPublished')} 
                                            className="hidden"
                                        />
                                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isPublished ? 'bg-primary-500' : 'bg-slate-700'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isPublished ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                                            {isPublished ? (
                                                <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Published</span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-slate-500"><EyeOff className="w-3.5 h-3.5" /> Draft</span>
                                            )}
                                        </span>
                                    </label>
                                </div>

                                <div className="flex gap-4">
                                     <button
                                        type="button"
                                        onClick={() => navigate('/knowledge-base')}
                                        className="px-6 py-2.5 rounded-xl text-slate-400 hover:text-white transition-colors"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={mutation.isLoading}
                                        className="btn-primary min-w-[160px] flex items-center justify-center gap-2"
                                    >
                                        {mutation.isLoading ? (
                                            'Saving...'
                                        ) : (
                                            <><Save className="w-4 h-4" /> {isEdit ? 'Update Article' : 'Publish Article'}</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Info Side */}
                <div className="lg:w-80 space-y-6">
                    <div className="glass-card p-6 border-l-4 border-primary-500">
                        <h3 className="font-bold text-white mb-2">Writing Tips</h3>
                        <ul className="text-xs text-slate-400 space-y-3 list-disc list-inside">
                            <li>Use <b># Heading</b> for main titles</li>
                            <li>Use <b>## Heading</b> for sections</li>
                            <li><b>**Bold text**</b> for emphasis</li>
                            <li>Use code blocks for commands</li>
                            <li>Be concise and clear</li>
                        </ul>
                    </div>

                    <div className="glass-card p-6 bg-amber-500/5 border border-amber-500/20">
                         <h3 className="font-bold text-amber-500 mb-2 text-sm uppercase tracking-widest flex items-center gap-2">
                             <Save className="w-4 h-4" /> Auto-Save
                         </h3>
                         <p className="text-xs text-slate-500">
                             Drafts are automatically saved in the database when "Publish" is off.
                         </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArticleForm;
