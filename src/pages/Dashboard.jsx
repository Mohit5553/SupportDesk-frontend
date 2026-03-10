import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import API from '../lib/axios';
import {
    Ticket as TicketIcon,
    CheckCircle,
    Clock,
    AlertCircle,
    Activity,
    Users
} from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, colorClass, gradient }) => (
    <div className="stat-card relative overflow-hidden group">
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${gradient} opacity-20 group-hover:opacity-30 transition-opacity`} />
        <div className={`w-12 h-12 rounded-xl ${colorClass} bg-opacity-10 border border-current flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();

    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            if (user.role === 'admin' || user.role === 'manager') {
                const res = await API.get('/admin/dashboard');
                return res.data.stats;
            } else {
                // Customers/Agents view their own ticket stats
                const res = await API.get('/tickets');
                const tickets = res.data.tickets;
                return {
                    totalTickets: res.data.pagination.total,
                    openTickets: tickets.filter(t => t.status === 'Open').length,
                    resolvedTickets: tickets.filter(t => t.status === 'Resolved').length,
                    criticalTickets: tickets.filter(t => t.priority === 'Critical').length,
                };
            }
        }
    });

    const { data: recentTickets, isLoading: loadingTickets } = useQuery({
        queryKey: ['recent-tickets'],
        queryFn: async () => {
            const res = await API.get('/tickets?limit=5');
            return res.data.tickets;
        }
    });

    if (isLoading || loadingTickets) return <LoadingSpinner fullScreen />;
    if (error) return <EmptyState title="Failed to load dashboard" description="There was an error fetching your data." />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-slate-400 text-sm mt-1">Welcome back, {user?.name}</p>
                </div>
                <Link to="/tickets/new" className="btn-primary">
                    Create New Ticket
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <StatCard
                    title="Total Tickets"
                    value={stats?.totalTickets || 0}
                    icon={TicketIcon}
                    colorClass="text-blue-400"
                    gradient="bg-blue-500"
                />
                <StatCard
                    title="Open"
                    value={stats?.openTickets || 0}
                    icon={Activity}
                    colorClass="text-violet-400"
                    gradient="bg-violet-500"
                />
                <StatCard
                    title="Resolved"
                    value={stats?.resolvedTickets || 0}
                    icon={CheckCircle}
                    colorClass="text-emerald-400"
                    gradient="bg-emerald-500"
                />
                <StatCard
                    title="Critical"
                    value={stats?.criticalTickets || 0}
                    icon={AlertCircle}
                    colorClass="text-red-400"
                    gradient="bg-red-500"
                />
                {(user.role === 'admin' || user.role === 'manager') && (
                    <StatCard
                        title="Total Users"
                        value={stats?.totalUsers || 0}
                        icon={Users}
                        colorClass="text-amber-400"
                        gradient="bg-amber-500"
                    />
                )}
            </div>

            {/* Recent Tickets Activity */}
            <h2 className="text-lg font-semibold text-white mt-8 mb-4">Recent Tickets</h2>
            <div className="glass-card overflow-hidden">
                {recentTickets?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-sm text-slate-400">
                                    <th className="p-4 font-medium">Ticket ID</th>
                                    <th className="p-4 font-medium">Title</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Priority</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTickets.map((ticket) => (
                                    <tr key={ticket._id} className="border-b border-white/5 table-row-hover">
                                        <td className="p-4">
                                            <Link to={`/tickets/${ticket._id}`} className="text-primary-400 hover:text-primary-300 font-medium font-mono text-sm">
                                                {ticket.ticketId}
                                            </Link>
                                        </td>
                                        <td className="p-4 text-slate-200">
                                            <div className="truncate max-w-xs">{ticket.title}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`badge ${ticket.status === 'Open' ? 'status-open' :
                                                    ticket.status === 'Resolved' ? 'status-resolved' : 'status-inprogress'
                                                }`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`badge ${ticket.priority === 'Critical' ? 'priority-critical' :
                                                    ticket.priority === 'High' ? 'priority-high' : 'priority-low'
                                                }`}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-400">No recent tickets found.</div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
