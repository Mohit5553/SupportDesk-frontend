import { useQuery } from '@tanstack/react-query';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Shield, AlertTriangle, Clock, Timer, CheckCircle } from 'lucide-react';
import API from '../lib/axios';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];
const PRIORITY_COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' };

const AdminDashboard = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['admin-analytics'],
        queryFn: async () => {
            const res = await API.get('/admin/dashboard');
            return res.data;
        },
    });

    if (isLoading) return <LoadingSpinner fullScreen />;
    if (!data) return <div className="p-8 text-center text-red-400">Failed to load analytics</div>;

    const { stats, byCategory, byPriority, ticketsOverTime, agentPerformance } = data;

    const formatPriorityData = byPriority.map(p => ({
        name: p._id,
        value: p.count,
        color: PRIORITY_COLORS[p._id] || '#6366f1'
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
                    <p className="text-slate-400 text-sm">Comprehensive performance metrics</p>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Avg CSAT Score', val: stats.avgCsat, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500' },
                    { label: 'SLA Breached', val: stats.slaBreached, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500' },
                    { label: 'Open Tickets', val: stats.openTickets, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500' },
                    { label: 'Resolved Tickets', val: stats.resolvedTickets, icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500' },
                    { label: 'Total Agents', val: stats.totalAgents, icon: Shield, color: 'text-violet-400', bg: 'bg-violet-500' },
                ].map((s, i) => (
                    <div key={i} className="glass-card p-4 relative overflow-hidden group">
                        <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full ${s.bg} opacity-10 group-hover:opacity-20 transition-opacity`} />
                        <s.icon className={`w-6 h-6 mb-2 ${s.color}`} />
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{s.label}</p>
                        <p className="text-2xl font-bold text-slate-100 mt-1">{s.val}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ticket Volume Over Time */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Ticket Volume (Last 7 Days)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={ticketsOverTime}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc' }}
                                    itemStyle={{ color: '#818cf8' }}
                                />
                                <Area type="monotone" dataKey="count" name="Tickets" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Priority & Category Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-6 flex flex-col items-center">
                        <h3 className="text-sm font-semibold text-white mb-4 w-full">Priority Breakdown</h3>
                        <div className="flex-1 w-full min-h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={formatPriorityData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {formatPriorityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-card p-6 flex flex-col items-center">
                        <h3 className="text-sm font-semibold text-white mb-4 w-full">Top Categories</h3>
                        <div className="flex-1 w-full min-h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={byCategory} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                    <XAxis type="number" stroke="#94a3b8" fontSize={10} hide />
                                    <YAxis dataKey="_id" type="category" stroke="#slate-300" fontSize={11} width={100} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                                    <Bar dataKey="count" name="Tickets" radius={[0, 4, 4, 0]}>
                                        {byCategory.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agent Performance Table */}
            <h3 className="text-lg font-semibold text-white mt-8 mb-4">Agent Performance Metrics</h3>
            <div className="glass-card overflow-hidden">
                {agentPerformance?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-sm text-slate-400 bg-black/20">
                                    <th className="p-4 font-medium">Agent</th>
                                    <th className="p-4 font-medium">Assigned</th>
                                    <th className="p-4 font-medium">Resolved</th>
                                    <th className="p-4 font-medium">Resolution Rate</th>
                                    <th className="p-4 font-medium">Avg Resolution Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {agentPerformance.map((agent) => (
                                    <tr key={agent._id} className="table-row-hover">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-900/50 flex items-center justify-center font-bold text-primary-400 text-xs shadow-inner border border-primary-500/20">
                                                    {agent.agentName.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-slate-200 font-medium text-sm">{agent.agentName}</p>
                                                    <p className="text-slate-500 text-xs">{agent.agentEmail}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-300 font-medium">{agent.totalAssigned}</td>
                                        <td className="p-4 text-emerald-400 font-medium">{agent.resolved}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-dark-900 rounded-full overflow-hidden w-24 border border-white/5">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                                        style={{ width: `${Math.round((agent.resolved / agent.totalAssigned) * 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium text-slate-300 w-10">
                                                    {Math.round((agent.resolved / agent.totalAssigned) * 100)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-300 text-sm flex items-center gap-1.5">
                                            <Timer className="w-4 h-4 text-slate-500" />
                                            {agent.avgResolutionHours ? `${agent.avgResolutionHours.toFixed(1)} hrs` : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-400">Not enough data to calculate agent performance.</div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
