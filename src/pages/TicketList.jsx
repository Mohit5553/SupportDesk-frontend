import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import API from '../lib/axios';
import { Search, Filter, Plus, ChevronLeft, ChevronRight, Ticket as TicketIcon, CheckSquare } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge';
import { timeAgo, getSlaStatus } from '../lib/utils';
import Avatar from '../components/ui/Avatar';
import { Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useQueryClient, useMutation } from '@tanstack/react-query';

const TicketList = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialSearch = queryParams.get('search') || '';

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState(initialSearch);
    const [status, setStatus] = useState('');
    const [priority, setPriority] = useState('');
    const [tags, setTags] = useState('');

    const [selectedTickets, setSelectedTickets] = useState([]);
    const canBulkAction = ['agent', 'manager', 'admin'].includes(user?.role);

    const bulkActionMutation = useMutation({
        mutationFn: async ({ action, value }) => {
            const res = await API.post('/tickets/bulk', { ticketIds: selectedTickets, action, value });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['tickets']);
            setSelectedTickets([]);
            toast.success('Bulk action applied successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Bulk action failed');
        }
    });

    // Update search state if URL param changes (for global search in header)
    useEffect(() => {
        const urlSearch = new URLSearchParams(location.search).get('search');
        if (urlSearch !== null) {
            setSearch(urlSearch);
            setPage(1);
        }
    }, [location.search]);

    const { data, isLoading } = useQuery({
        queryKey: ['tickets', page, search, status, priority, tags],
        queryFn: async () => {
            const params = { page, limit: 10, search, status, priority };
            if (tags.trim()) params.tags = tags.trim();
            
            const res = await API.get('/tickets', { params });
            return res.data;
        },
        keepPreviousData: true,
    });

    const handleSelectAll = (e) => {
        if (e.target.checked && data?.tickets) {
            setSelectedTickets(data.tickets.map(t => t._id));
        } else {
            setSelectedTickets([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedTickets(prev => 
            prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-white">Tickets</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage and track your support requests</p>
                </div>
                <Link to="/tickets/new" className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Ticket
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search tickets by ID, title, etc..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="form-input pl-10 h-10 py-2 text-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Filter by tags (comma separated)"
                            value={tags}
                            onChange={(e) => {
                                setTags(e.target.value);
                                setPage(1);
                            }}
                            className="form-input h-10 py-2 text-sm w-48"
                        />
                    </div>
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="form-input h-10 py-2 text-sm w-36"
                    >
                        <option value="">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Pending">Pending</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                    </select>

                    <select
                        value={priority}
                        onChange={(e) => { setPriority(e.target.value); setPage(1); }}
                        className="form-input h-10 py-2 text-sm w-36"
                    >
                        <option value="">All Priorities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions */}
            {canBulkAction && selectedTickets.length > 0 && (
                <div className="bg-primary-500/10 border border-primary-500/30 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 animate-fade-in">
                    <div className="flex items-center gap-2 text-primary-400 font-medium">
                        <CheckSquare className="w-5 h-5" />
                        <span>{selectedTickets.length} tickets selected</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <select 
                            className="form-input h-9 py-1 text-sm w-40 bg-dark-900"
                            onChange={(e) => {
                                if (bulkActionMutation.isPending) return;
                                if(e.target.value) bulkActionMutation.mutate({ action: 'status', value: e.target.value });
                                e.target.value = '';
                            }}
                            disabled={bulkActionMutation.isPending}
                        >
                            <option value="">Change Status...</option>
                            <option value="Open">Open</option>
                            <option value="Assigned">Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Pending">Pending</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                        </select>
                        <select 
                            className="form-input h-9 py-1 text-sm w-40 bg-dark-900"
                            onChange={(e) => {
                                if (bulkActionMutation.isPending) return;
                                if(e.target.value) bulkActionMutation.mutate({ action: 'priority', value: e.target.value });
                                e.target.value = '';
                            }}
                            disabled={bulkActionMutation.isPending}
                        >
                            <option value="">Change Priority...</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Ticket Table */}
            <div className="glass-card overflow-hidden">
                {isLoading ? (
                    <LoadingSpinner text="Loading tickets..." />
                ) : data?.tickets?.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TicketIcon className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-200">No tickets found</h3>
                        <p className="text-slate-500 mt-1">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-white/10 text-sm text-slate-400 bg-black/20">
                                    {canBulkAction && (
                                        <th className="p-4 w-12">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-white/20 bg-dark-900 text-primary-500 focus:ring-primary-500/30 cursor-pointer"
                                                checked={data?.tickets?.length > 0 && selectedTickets.length === data.tickets.length}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                    )}
                                    <th className="p-4 font-medium">Ticket ID</th>
                                    <th className="p-4 font-medium">Subject</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Priority</th>
                                    <th className="p-4 font-medium">SLA</th>
                                    <th className="p-4 font-medium">Requester</th>
                                    <th className="p-4 font-medium">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.tickets.map((ticket) => {
                                    const sla = getSlaStatus(ticket.slaDeadline, ticket.status);
                                    return (
                                        <tr key={ticket._id} className={`table-row-hover group ${selectedTickets.includes(ticket._id) ? 'bg-primary-500/5' : ''}`}>
                                        {canBulkAction && (
                                            <td className="p-4">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-white/20 bg-dark-900 text-primary-500 focus:ring-primary-500/30 cursor-pointer"
                                                    checked={selectedTickets.includes(ticket._id)}
                                                    onChange={() => handleSelectOne(ticket._id)}
                                                />
                                            </td>
                                        )}
                                        <td className="p-4">
                                            <Link to={`/tickets/${ticket._id}`} className="text-primary-400 hover:text-primary-300 font-mono font-medium text-sm transition-colors">
                                                {ticket.ticketId}
                                            </Link>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <Link to={`/tickets/${ticket._id}`} className="text-slate-200 font-medium group-hover:text-white transition-colors block truncate max-w-sm">
                                                    {ticket.title}
                                                </Link>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap max-w-sm">
                                                    <span className="text-[10px] text-slate-500 truncate bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                                        {ticket.category}
                                                    </span>
                                                    {ticket.tags && ticket.tags.map(tag => (
                                                        <span key={tag} className="text-[10px] text-primary-400 truncate bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={ticket.status} />
                                        </td>
                                        <td className="p-4">
                                            <PriorityBadge priority={ticket.priority} />
                                        </td>
                                        <td className="p-4">
                                            <div className={`text-xs inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-dark-900 border border-white/5 ${sla.color}`}>
                                                <Clock className="w-3 h-3" />
                                                <span>{sla.label}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Avatar name={ticket.createdBy.name} size="sm" />
                                                <span className="text-sm text-slate-300 truncate max-w-[120px]">
                                                    {ticket.createdBy.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-400 whitespace-nowrap">
                                            {timeAgo(ticket.createdAt)}
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {data?.pagination.pages > 1 && (
                    <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/20">
                        <p className="text-sm text-slate-400">
                            Showing page <span className="font-medium text-slate-200">{data.pagination.page}</span> of{' '}
                            <span className="font-medium text-slate-200">{data.pagination.pages}</span>
                        </p>
                        <div className="flex gap-2">
                            <button
                                className="btn-secondary px-3 py-1.5 flex items-center gap-1"
                                disabled={data.pagination.page === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Prev
                            </button>
                            <button
                                className="btn-secondary px-3 py-1.5 flex items-center gap-1"
                                disabled={data.pagination.page === data.pagination.pages}
                                onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketList;
