import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import API from '../lib/axios';
import { Search, Filter, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge';
import { timeAgo } from '../lib/utils';
import Avatar from '../components/ui/Avatar';

const TicketList = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [priority, setPriority] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['tickets', page, search, status, priority],
        queryFn: async () => {
            const res = await API.get('/tickets', {
                params: { page, limit: 10, search, status, priority },
            });
            return res.data;
        },
        keepPreviousData: true,
    });

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
                                    <th className="p-4 font-medium">Ticket ID</th>
                                    <th className="p-4 font-medium">Subject</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Priority</th>
                                    <th className="p-4 font-medium">Requester</th>
                                    <th className="p-4 font-medium">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.tickets.map((ticket) => (
                                    <tr key={ticket._id} className="table-row-hover group">
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
                                                <span className="text-xs text-slate-500 mt-1 truncate max-w-sm">
                                                    {ticket.category}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={ticket.status} />
                                        </td>
                                        <td className="p-4">
                                            <PriorityBadge priority={ticket.priority} />
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
                                ))}
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

// Add icon back that was missing in above code
import { Ticket as TicketIcon } from 'lucide-react';

export default TicketList;
