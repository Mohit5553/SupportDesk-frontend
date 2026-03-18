import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import API from '../lib/axios';
import { Link } from 'react-router-dom';
import {
    Search, Ticket, Plus, BookOpen, Clock, ArrowRight,
    CheckCircle, AlertCircle, MessageSquare
} from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { timeAgo } from '../lib/utils';
import Avatar from '../components/ui/Avatar';

const CustomerDashboard = () => {
    const { user } = useAuth();

    const openGlobalSearch = () => {
        window.dispatchEvent(new Event('open-global-search'));
    };

    const { data: recentTickets, isLoading: loadingTickets } = useQuery({
        queryKey: ['recent-tickets-customer'],
        queryFn: async () => {
            const res = await API.get('/tickets', { params: { limit: 5 } });
            return res.data.tickets;
        }
    });

    const { data: articles, isLoading: loadingArticles } = useQuery({
        queryKey: ['featured-articles-customer'],
        queryFn: async () => {
            const res = await API.get('/articles', { params: { limit: 4 } });
            return res.data.articles;
        }
    });

    if (loadingTickets || loadingArticles) return <LoadingSpinner fullScreen />;

    const openTicketsCount = recentTickets?.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length || 0;

    return (
        <div className="space-y-8 animate-fade-in pb-10 max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900/40 via-violet-900/20 to-dark-900 border border-white/5 p-8 md:p-12">
                <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 max-w-3xl">
                    <div className="flex items-center gap-4 mb-6">
                        <Avatar name={user.name} size="lg" />
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                                Hello, {user.name.split(' ')[0]}!
                            </h1>
                            <p className="text-primary-400 font-medium mt-1">How can we help you today?</p>
                        </div>
                    </div>

                    <div className="mt-8 relative max-w-2xl group">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-violet-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                        <button 
                            onClick={openGlobalSearch}
                            className="relative w-full bg-dark-900/80 backdrop-blur-xl border border-white/10 hover:border-primary-500/50 rounded-2xl p-4 flex items-center gap-4 transition-all"
                        >
                            <Search className="w-6 h-6 text-slate-400 group-hover:text-primary-400 transition-colors" />
                            <span className="text-slate-400 text-lg flex-1 text-left">Search for answers...</span>
                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-black/30 px-2 py-1 rounded-lg">
                                <kbd className="font-sans">Ctrl</kbd> + <kbd className="font-sans">K</kbd>
                            </span>
                        </button>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-4">
                        <Link to="/tickets/new" className="btn-primary py-3 px-6 shadow-lg shadow-primary-500/20 flex items-center gap-2 text-base">
                            <Plus className="w-5 h-5" /> Open New Ticket
                        </Link>
                        {openTicketsCount > 0 && (
                            <Link to="/tickets" className="btn-secondary py-3 px-6 flex items-center gap-2 text-base border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                                <Clock className="w-5 h-5" /> You have {openTicketsCount} open tickets
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Tickets Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-primary-400" />
                            Your Recent Tickets
                        </h2>
                        <Link to="/tickets" className="text-sm font-bold text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {recentTickets?.length > 0 ? (
                        <div className="grid gap-4">
                            {recentTickets.map(ticket => (
                                <Link 
                                    key={ticket._id} 
                                    to={`/tickets/${ticket._id}`}
                                    className="glass-card p-5 hover:bg-white/[0.03] hover:border-primary-500/30 transition-all group"
                                >
                                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-primary-400 font-mono text-sm font-bold bg-primary-500/10 px-2 py-1 rounded">
                                                {ticket.ticketId}
                                            </span>
                                            <StatusBadge status={ticket.status} />
                                            <PriorityBadge priority={ticket.priority} />
                                        </div>
                                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" /> Updated {timeAgo(ticket.updatedAt)}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-200 group-hover:text-white transition-colors mb-2 line-clamp-1">
                                        {ticket.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                                        {ticket.description}
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-dark-800 px-2 py-1 rounded border border-white/5">
                                                {ticket.category}
                                            </span>
                                        </div>
                                        {ticket.assignedTo ? (
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <span>Assigned to:</span>
                                                <Avatar name={ticket.assignedTo.name} size="xs" />
                                                <span className="font-medium text-slate-300">{ticket.assignedTo.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-amber-500 font-medium flex items-center gap-1">
                                                <AlertCircle className="w-3.5 h-3.5" /> Awaiting Assignment
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card p-8 text-center border-dashed">
                            <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-500/20">
                                <CheckCircle className="w-8 h-8 text-primary-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">No active tickets</h3>
                            <p className="text-slate-400 mb-6">You're all caught up! Need help with something?</p>
                            <Link to="/tickets/new" className="btn-primary inline-flex">
                                Create a Ticket
                            </Link>
                        </div>
                    )}
                </div>

                {/* Sidebar: Knowledge Base & Tips */}
                <div className="space-y-6">
                    <div className="glass-card p-6 border-t-4 border-violet-500 bg-gradient-to-b from-violet-500/5 to-transparent">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-violet-400" />
                            Helpful Articles
                        </h2>
                        <div className="space-y-4">
                            {articles?.map(article => (
                                <Link 
                                    key={article._id}
                                    to={`/knowledge-base/${article.slug}`}
                                    className="block group"
                                >
                                    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all">
                                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                                            <BookOpen className="w-4 h-4 text-violet-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-200 group-hover:text-primary-400 transition-colors line-clamp-2 mb-1">
                                                {article.title}
                                            </h4>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                {article.category}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {articles?.length === 0 && (
                                <p className="text-sm text-slate-500 text-center py-4">No articles available.</p>
                            )}
                        </div>
                        <Link 
                            to="/knowledge-base"
                            className="btn-secondary w-full mt-6 flex items-center justify-center gap-2"
                        >
                            Browse Help Center
                        </Link>
                    </div>

                    <div className="glass-card p-6 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
                        <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                            <MessageSquare className="w-5 h-5 text-emerald-400" />
                            Need immediate help?
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed mb-4">
                            If you're facing a critical system outage, please use the live chat feature or mark your ticket priority as <strong className="text-red-400">Critical</strong>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDashboard;
