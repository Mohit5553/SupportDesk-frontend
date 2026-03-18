import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Book, ArrowRight, HelpCircle, FileText, ChevronRight, Plus, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../lib/axios';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const KnowledgeBase = () => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    const canManageArticles = ['agent', 'manager', 'admin'].includes(user?.role);

    const { data, isLoading } = useQuery({
        queryKey: ['articles', searchQuery, user?.role],
        queryFn: async () => {
            const params = { search: searchQuery };
            if (canManageArticles) params.all = true;
            const res = await API.get('/articles', { params });
            return res.data;
        },
        enabled: true,
    });

    const categories = [
        { name: 'General', description: 'Basics and portal guides', icon: HelpCircle, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { name: 'Security', description: 'Password reset and protocols', icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10' },
        { name: 'Network', description: 'VPN and connectivity help', icon: Book, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    ];

    if (isLoading) return <LoadingSpinner fullScreen />;

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* Hero Section */}
            <div className="text-center mb-12 animate-fade-in-up">
                <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
                    How can we <span className="text-primary-400">help you</span> today?
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
                    Search our knowledge base for quick answers and troubleshooting guides.
                </p>
                
                <div className="max-w-2xl mx-auto relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search for articles, guides, and more..."
                        className="w-full bg-[#1e293b]/50 backdrop-blur-xl border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-lg shadow-2xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Categories */}
            {!searchQuery && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 animate-fade-in">
                    {categories.map((cat, i) => (
                        <div key={i} className="glass-card p-6 flex flex-col items-center text-center group cursor-pointer hover:border-primary-500/30 transition-all">
                            <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                                <cat.icon className={`w-6 h-6 ${cat.color}`} />
                            </div>
                            <h3 className="font-bold text-slate-200 mb-2">{cat.name}</h3>
                            <p className="text-sm text-slate-500">{cat.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Featured Articles Section */}
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                    {searchQuery ? `Search results for "${searchQuery}"` : 'Library Catalog'}
                </h2>
                <div className="flex items-center gap-4">
                    {canManageArticles && (
                        <Link to="/knowledge-base/new" className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
                            <Plus className="w-4 h-4" /> Create Article
                        </Link>
                    )}
                    <div className="hidden sm:flex items-center gap-2 text-slate-500 hover:text-primary-300 transition-colors cursor-pointer text-sm font-semibold uppercase tracking-widest">
                        View All <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.articles?.length > 0 ? (
                    data.articles.map((article) => (
                        <Link 
                            to={`/knowledge-base/${article.slug}`} 
                            key={article._id}
                            className={`glass-card p-5 group flex items-start gap-4 hover:bg-white/5 transition-all ${!article.isPublished ? 'border-primary-500/30' : ''}`}
                        >
                            <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-primary-400 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-slate-200 font-semibold group-hover:text-primary-400 transition-colors truncate">
                                        {article.title}
                                    </h3>
                                    {!article.isPublished && (
                                        <span className="flex items-center gap-1 text-[9px] font-black uppercase text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded border border-primary-500/20">
                                            <EyeOff className="w-2.5 h-2.5" /> Draft
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="bg-white/5 px-2 py-0.5 rounded uppercase font-extrabold tracking-tighter text-[9px] border border-white/5">
                                        {article.category}
                                    </span>
                                    <span>{article.views} views</span>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-primary-400 transition-colors" />
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-white/5 rounded-2xl">
                        No articles found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeBase;
