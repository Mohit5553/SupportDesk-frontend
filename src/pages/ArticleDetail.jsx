import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, Eye, ThumbsUp, Tag, Share2, Printer, Edit, Trash2, EyeOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import API from '../lib/axios';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDate } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const ArticleDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data, isLoading } = useQuery({
        queryKey: ['article', slug],
        queryFn: async () => {
            const res = await API.get(`/articles/${slug}`);
            return res.data;
        },
    });

    const voteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await API.post(`/articles/${id}/helpful`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['article', slug]);
            toast.success('Thanks for your feedback!');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            if (!window.confirm('Are you sure you want to delete this article?')) return;
            return await API.delete(`/articles/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['articles']);
            toast.success('Article deleted successfully');
            navigate('/knowledge-base');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to delete article');
        }
    });

    if (isLoading) return <LoadingSpinner fullScreen />;
    if (!data?.article) return <div className="p-8 text-center text-red-400">Article not found</div>;

    const { article } = data;
    const canManage = ['agent', 'manager', 'admin'].includes(user?.role);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 pb-20">
            <button
                onClick={() => navigate('/knowledge-base')}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group px-4 py-2 hover:bg-white/5 rounded-lg w-fit"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                Back to Library
            </button>

            <article className="glass-card overflow-hidden shadow-2xl relative">
                {!article.isPublished && (
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-primary-500 animate-pulse" />
                )}

                {/* Header Section */}
                <div className="p-8 border-b border-white/10 bg-gradient-to-br from-primary-500/5 to-transparent">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="bg-primary-500/10 text-primary-400 border border-primary-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            {article.category}
                        </span>
                        {!article.isPublished && (
                            <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                                <EyeOff className="w-3.5 h-3.5" /> Draft Mode
                            </span>
                        )}
                        <div className="flex items-center gap-4 text-slate-400 text-sm ml-auto">
                            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4 text-slate-500" /> {article.views} views</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-500" /> {formatDate(article.createdAt)}</span>
                        </div>
                    </div>
                    
                    <h1 className="text-4xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                        {article.title}
                    </h1>

                    <div className="flex items-center justify-between py-6 border-t border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-slate-200 border border-white/10 shadow-lg">
                                {article.author?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white tracking-wide">{article.author?.name}</p>
                                <p className="text-[11px] text-slate-500 uppercase font-black tracking-widest">Documentation Team</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                             {canManage && (
                                <>
                                    <Link 
                                        to={`/knowledge-base/edit/${article.slug}`}
                                        className="p-2.5 rounded-xl hover:bg-white/10 text-primary-400 border border-white/5 transition-all shadow-sm" 
                                        title="Edit Article"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </Link>
                                    <button 
                                        onClick={() => deleteMutation.mutate(article._id)}
                                        disabled={deleteMutation.isLoading}
                                        className="p-2.5 rounded-xl hover:bg-red-500/20 text-red-400 border border-white/5 transition-all shadow-sm" 
                                        title="Delete Article"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </>
                             )}
                             <div className="w-px h-8 bg-white/5 mx-2 hidden sm:block" />
                             <button className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 border border-white/5 transition-all" title="Print Article" onClick={() => window.print()}>
                                <Printer className="w-5 h-5" />
                            </button>
                             <button className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 border border-white/5 transition-all" title="Share Article" onClick={() => {
                                 navigator.clipboard.writeText(window.location.href);
                                 toast.success('Link copied to clipboard');
                             }}>
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-8 prose prose-invert prose-indigo max-w-none border-b border-white/5">
                    <div className="text-slate-300 leading-relaxed font-normal antialiased">
                        <ReactMarkdown 
                            components={{
                                h1: ({node, ...props}) => <h1 className="text-3xl font-extrabold text-white mt-12 mb-8 border-b border-white/10 pb-3 tracking-tight" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-white mt-10 mb-6 tracking-tight" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-xl font-bold text-white mt-8 mb-4 tracking-tight" {...props} />,
                                p: ({node, ...props}) => <p className="text-slate-400 mb-6 leading-8 text-[1.05rem]" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc list-outside space-y-3 mb-8 text-slate-400 ml-6" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal list-outside space-y-3 mb-8 text-slate-400 ml-6" {...props} />,
                                li: ({node, ...props}) => <li className="pl-2" {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary-500 bg-primary-500/5 p-6 rounded-r-2xl italic mb-8 sm:mx-4" {...props} />,
                                code: ({node, inline, ...props}) => (
                                    inline 
                                    ? <code className="bg-white/10 px-2 py-0.5 rounded-md text-primary-400 font-mono text-[0.85rem] border border-white/5" {...props} />
                                    : <div className="bg-[#0f172a] p-8 rounded-2xl border border-white/10 my-8 overflow-x-auto shadow-inner relative group">
                                        <div className="absolute top-3 right-4 text-[10px] font-black text-slate-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Code Snippet</div>
                                        <code className="text-primary-300 font-mono text-[0.9rem] leading-7" {...props} />
                                      </div>
                                )
                            }}
                        >
                            {article.content}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* Tags Section */}
                {article.tags?.length > 0 && (
                    <div className="px-8 py-6 flex flex-wrap gap-2.5">
                        {article.tags?.map((tag, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[11px] font-bold text-slate-500 hover:text-primary-400 hover:border-primary-500/20 hover:bg-primary-500/5 transition-all cursor-pointer group uppercase tracking-widest">
                                <Tag className="w-3 h-3 text-slate-700 group-hover:text-primary-500 transition-colors" />
                                {tag}
                            </div>
                        ))}
                    </div>
                )}

                {/* Feedback Footer */}
                <div className="bg-gradient-to-b from-transparent to-white/[0.02] border-t border-white/5 p-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
                        <ThumbsUp className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-3 tracking-tight">Was this article helpful?</h4>
                    <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">Your feedback helps our documentation team create better resources for everyone.</p>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <button 
                            onClick={() => voteMutation.mutate(article._id)}
                            disabled={voteMutation.isLoading}
                            className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/25 disabled:opacity-50"
                        >
                            <ThumbsUp className="w-5 h-5" /> It was perfect
                        </button>
                        <div className="text-slate-400 text-xs font-bold uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                            <span className="text-emerald-400">{article.helpfulVotes}</span> endorsements
                        </div>
                    </div>
                </div>
            </article>
        </div>
    );
};

export default ArticleDetail;
