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

import { 
    PieChart, Pie, Cell, Tooltip as RechartsTooltip
} from 'recharts';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { BookOpen, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#94a3b8'];

const StatCard = ({ title, value, icon: Icon, colorClass, gradient, subValue }) => (
    <div className="glass-card p-6 relative overflow-hidden group hover:bg-white/5 transition-all">
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
        <div className="flex items-start justify-between">
            <div className={`w-12 h-12 rounded-xl ${colorClass} bg-opacity-10 border border-current flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
            </div>
            {subValue && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{subValue}</span>}
        </div>
        <div className="mt-4">
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
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
                return res.data;
            } else {
                const res = await API.get('/tickets');
                const tickets = res.data.tickets;
                return {
                    stats: {
                        totalTickets: res.data.pagination.total,
                        openTickets: tickets.filter(t => t.status === 'Open').length,
                        resolvedTickets: tickets.filter(t => t.status === 'Resolved').length,
                        criticalTickets: tickets.filter(t => t.priority === 'Critical').length,
                    },
                    byStatus: [
                        { _id: 'Open', count: tickets.filter(t => t.status === 'Open').length },
                        { _id: 'In Progress', count: tickets.filter(t => t.status === 'In Progress').length },
                        { _id: 'Resolved', count: tickets.filter(t => t.status === 'Resolved').length },
                        { _id: 'Closed', count: tickets.filter(t => t.status === 'Closed').length },
                    ]
                };
            }
        }
    });

    const { data: recentTickets, isLoading: loadingTickets } = useQuery({
        queryKey: ['recent-tickets'],
        queryFn: async () => {
            const res = await API.get('/tickets', { params: { limit: 5 } });
            return res.data.tickets;
        }
    });

    const { data: articles } = useQuery({
        queryKey: ['featured-articles'],
        queryFn: async () => {
            const res = await API.get('/articles', { params: { limit: 3 } });
            return res.data.articles;
        }
    });

    if (isLoading || loadingTickets) return <LoadingSpinner fullScreen />;
    if (error) return <EmptyState title="Failed to load dashboard" description="There was an error fetching your data." />;

    const dashboardStats = stats?.stats || stats;
    const pieData = (stats?.byStatus || []).map(s => ({ name: s._id, value: s.count }));

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-violet-500/20 flex items-center justify-center border border-white/5 relative">
                        <div className="absolute inset-0 bg-primary-500/10 blur-xl rounded-full" />
                        <ShieldCheck className="w-8 h-8 text-primary-400 relative z-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">Support Console</h1>
                        <p className="text-slate-400 font-medium">Welcome back, <span className="text-primary-400">{user?.name}</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/knowledge-base" className="btn-secondary h-11 px-6 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Help Center
                    </Link>
                    <Link to="/tickets/new" className="btn-primary h-11 px-6 shadow-lg shadow-primary-500/20 flex items-center gap-2 group">
                        <Zap className="w-4 h-4 group-hover:animate-pulse" /> New Request
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Active Requests" value={dashboardStats?.openTickets || 0} icon={Activity} colorClass="text-amber-400" gradient="bg-amber-500" subValue="Urgent" />
                <StatCard title="Resolved" value={dashboardStats?.resolvedTickets || 0} icon={CheckCircle} colorClass="text-emerald-400" gradient="bg-emerald-500" subValue="Success" />
                <StatCard title="Critical Priority" value={dashboardStats?.criticalTickets || 0} icon={AlertCircle} colorClass="text-red-400" gradient="bg-red-500" subValue="Action Required" />
                <StatCard title="Total Volume" value={dashboardStats?.totalTickets || 0} icon={TicketIcon} colorClass="text-blue-400" gradient="bg-blue-500" subValue="lifetime" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Recent Activity & Breakdown */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Status Breakdown Chart */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary-400" /> Ticket Distribution
                        </h3>
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            <div className="flex-shrink-0">
                                <PieChart width={200} height={200}>
                                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" cx="50%" cy="50%">
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#f8fafc' }} />
                                </PieChart>
                            </div>
                            <div className="flex-1 space-y-4 w-full">
                                {pieData.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            <span className="text-sm font-medium text-slate-400">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Ticket List */}
                    <div className="glass-card overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                            <Link to="/tickets" className="text-sm text-primary-400 font-bold hover:underline">View All</Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#0f172a]/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4">Ticket</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Priority</th>
                                        <th className="p-4">Last Update</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {recentTickets?.map((ticket) => (
                                        <tr key={ticket._id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-4">
                                                <Link to={`/tickets/${ticket._id}`} className="block">
                                                    <span className="text-primary-400 font-mono text-sm font-bold mb-0.5 block">{ticket.ticketId}</span>
                                                    <span className="text-slate-200 font-semibold text-sm group-hover:text-primary-400 transition-colors line-clamp-1">{ticket.title}</span>
                                                </Link>
                                            </td>
                                            <td className="p-4"><StatusBadge status={ticket.status} /></td>
                                            <td className="p-4"><PriorityBadge priority={ticket.priority} /></td>
                                            <td className="p-4 text-xs text-slate-500 font-medium whitespace-nowrap">{new Date(ticket.updatedAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: Resources & Tips */}
                <div className="space-y-8">
                    <div className="glass-card p-6 bg-gradient-to-br from-primary-500/10 to-transparent border-primary-500/20">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary-400" /> Featured Guides
                        </h3>
                        <div className="space-y-4">
                            {articles?.map((article) => (
                                <Link 
                                    to={`/knowledge-base/${article.slug}`} 
                                    key={article._id}
                                    className="block p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary-500/50 hover:bg-white/10 transition-all transition-transform group"
                                >
                                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-primary-400 mb-1">{article.title}</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase font-extrabold text-slate-500">{article.category}</span>
                                        <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-primary-400" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <Link 
                            to="/knowledge-base" 
                            className="mt-6 block text-center py-2 text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors border border-dashed border-primary-500/30 rounded-lg hover:bg-primary-500/5"
                        >
                            Explore Help Center
                        </Link>
                    </div>

                    <div className="glass-card p-6 border-l-4 border-l-amber-500">
                        <h3 className="font-bold text-white mb-2">Pro-Tip</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Adding screenshots and detailed error messages to your tickets can speed up resolution time by up to <span className="text-amber-400 font-bold">40%</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
