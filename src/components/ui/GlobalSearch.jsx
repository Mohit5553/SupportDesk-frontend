import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, FileText, Ticket, X, Loader2 } from 'lucide-react';
import API from '../../lib/axios';

const GlobalSearch = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const modalRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Handle custom global search open event
    useEffect(() => {
        const handleOpenSearch = () => setIsOpen(true);
        window.addEventListener('open-global-search', handleOpenSearch);
        return () => window.removeEventListener('open-global-search', handleOpenSearch);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isOpen) {
            setQuery(''); // reset query on close
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const { data: ticketsData, isLoading: isLoadingTickets } = useQuery({
        queryKey: ['search-tickets', query],
        queryFn: async () => {
            const res = await API.get('/tickets', { params: { search: query, limit: 5 } });
            return res.data.tickets;
        },
        enabled: query.trim().length > 1 && isOpen,
    });

    const { data: articlesData, isLoading: isLoadingArticles } = useQuery({
        queryKey: ['search-articles', query],
        queryFn: async () => {
            const res = await API.get('/articles', { params: { search: query, all: true } });
            return res.data.articles.slice(0, 5);
        },
        enabled: query.trim().length > 1 && isOpen,
    });

    if (!isOpen) return null;

    const isLoading = isLoadingTickets || isLoadingArticles;

    const handleNavigate = (path) => {
        navigate(path);
        setIsOpen(false);
        setQuery('');
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh]">
            <div 
                ref={modalRef}
                className="w-full max-w-2xl bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4"
            >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-dark-950">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input 
                        ref={inputRef}
                        type="text" 
                        placeholder="Search tickets and articles... (Type at least 2 characters)" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-500 text-lg"
                    />
                    {isLoading && <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-500 bg-black/20 px-2 py-1 rounded">ESC</span>
                        <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2 min-h-[100px]">
                    {query.trim().length < 2 && (
                        <div className="text-center py-8 text-sm text-slate-500 font-medium">
                            Type to start searching...
                        </div>
                    )}

                    {query.trim().length >= 2 && !isLoading && !ticketsData?.length && !articlesData?.length && (
                        <div className="text-center py-8 text-sm text-slate-500">
                            No results found for "{query}"
                        </div>
                    )}

                    {/* Tickets Section */}
                    {ticketsData?.length > 0 && (
                        <div className="mb-4">
                            <h3 className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Tickets</h3>
                            <div className="space-y-1">
                                {ticketsData.map(ticket => (
                                    <button
                                        key={ticket._id}
                                        onClick={() => handleNavigate(`/tickets/${ticket._id}`)}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center border border-primary-500/20 group-hover:bg-primary-500/20 transition-colors">
                                            <Ticket className="w-4 h-4 text-primary-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-primary-400">{ticket.ticketId}</span>
                                                <span className="font-medium text-slate-200 truncate">{ticket.title}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 truncate">{ticket.category}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Articles Section */}
                    {articlesData?.length > 0 && (
                        <div>
                            <h3 className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Knowledge Base</h3>
                            <div className="space-y-1">
                                {articlesData.map(article => (
                                    <button
                                        key={article._id}
                                        onClick={() => handleNavigate(`/knowledge-base/${article.slug}`)}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                                            <FileText className="w-4 h-4 text-violet-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium text-slate-200 truncate block">{article.title}</span>
                                            <p className="text-xs text-slate-500 truncate">{article.category}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
