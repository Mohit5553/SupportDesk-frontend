import { useQuery } from '@tanstack/react-query';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Shield, AlertTriangle, Clock, Timer, CheckCircle, Download, FileText, BookOpen, ThumbsUp, Eye, Layers, BarChart2 } from 'lucide-react';
import API from '../lib/axios';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

    const handleExportCSV = () => {
        if (!data) return;
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Category,Ticket Count\n"
            + data.byCategory.map(c => `${c._id},${c.count}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `platform_report_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        toast.success('CSV Report downloaded successfully');
    };

    const handleExportPDF = () => {
        if (!data) return;
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(99, 102, 241);
        doc.text("Platform Performance Report", 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        
        // Executive Summary
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Executive Summary", 14, 45);
        
        const summaryData = [
            ["Avg CSAT Score", data.stats.avgCsat],
            ["SLA Breached", data.stats.slaBreached],
            ["Open Tickets", data.stats.openTickets],
            ["Resolved Tickets", data.stats.resolvedTickets],
            ["Total Agents", data.stats.totalAgents]
        ];

        doc.autoTable({
            startY: 50,
            head: [['Statistic', 'Value']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241] }
        });

        // Agent Performance Table
        doc.text("Agent Performance Leaderboard", 14, doc.lastAutoTable.finalY + 15);
        const agentData = data.agentPerformance.map(a => [
            a.agentName,
            a.totalAssigned,
            a.resolved,
            `${Math.round((a.resolved / a.totalAssigned) * 100)}%`,
            a.avgResolutionHours ? `${a.avgResolutionHours.toFixed(1)}h` : 'N/A'
        ]);

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Agent', 'Assigned', 'Resolved', 'Health', 'Avg Time']],
            body: agentData,
            headStyles: { fillColor: [139, 92, 246] }
        });

        doc.save(`SupportPortal_Report_${new Date().getTime()}.pdf`);
        toast.success('PDF Report generated');
    };

    if (isLoading) return <LoadingSpinner fullScreen />;
    if (!data) return <div className="p-8 text-center text-red-400">Failed to load analytics</div>;

    const { 
        stats, 
        byCategory, 
        bySubcategory,
        byPriority, 
        ticketsOverTime, 
        agentPerformance, 
        slaByCategory, 
        slaByLevel,
        slaBreachedOverTime = [],
        avgResolutionTimeByCategory = [],
        avgResolutionTimeByPriority = [],
        kbTrendingArticles = []
    } = data;

    const mergedTrendData = ticketsOverTime.map(ticket => {
        const sla = slaBreachedOverTime.find(s => s._id === ticket._id);
        return {
            date: ticket._id,
            total: ticket.count,
            breached: sla ? sla.count : 0
        };
    });

    const formatPriorityData = byPriority.map(p => ({
        name: p._id,
        value: p.count,
        color: PRIORITY_COLORS[p._id] || '#6366f1'
    }));

    const formatPriorityResolution = avgResolutionTimeByPriority.map(p => ({
        ...p,
        color: PRIORITY_COLORS[p._id] || '#6366f1'
    }));

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Analytics</h1>
                        <p className="text-slate-400 text-sm">Comprehensive performance metrics</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-sm transition-all shadow-sm"
                    >
                        <Download className="w-4 h-4 text-emerald-400" />
                        Export CSV
                    </button>
                    <button 
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 border border-primary-400/50 rounded-xl text-white text-sm transition-all shadow-lg shadow-primary-500/20"
                    >
                        <FileText className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { label: 'Avg CSAT Score', val: stats.avgCsat, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500' },
                    { label: 'SLA Compliance', val: `${stats.slaHealthScore}%`, icon: Shield, color: 'text-primary-400', bg: 'bg-primary-500' },
                    { label: 'SLA Breached', val: stats.slaBreached, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500' },
                    { label: 'Open Tickets', val: stats.openTickets, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500' },
                    { label: 'Resolved', val: stats.resolvedTickets, icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500' },
                    { label: 'Total Agents', val: stats.totalAgents, icon: Shield, color: 'text-violet-400', bg: 'bg-violet-500' },
                ].map((s, i) => (
                    <div key={i} className="glass-card p-4 relative overflow-hidden group hover:bg-white/5 transition-all">
                        <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full ${s.bg} opacity-10 group-hover:opacity-20 transition-opacity`} />
                        <s.icon className={`w-6 h-6 mb-2 ${s.color}`} />
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider line-clamp-1">{s.label}</p>
                        <p className="text-2xl font-black text-white mt-1 group-hover:scale-110 transition-transform origin-left">{s.val}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ticket Volume vs SLA Breaches */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">Performance Trends</h3>
                        <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest">
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-primary-500" /> Total</div>
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Breached</div>
                        </div>
                    </div>
                    <div className="h-[300px] relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={mergedTrendData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="total" name="Total Tickets" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                <Area type="monotone" dataKey="breached" name="SLA Breached" stroke="#ef4444" strokeWidth={2} fillOpacity={0} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Priority & Level Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-6 flex flex-col items-center">
                        <h3 className="text-sm font-semibold text-white mb-4 w-full">Priority Breakdown</h3>
                        <div className="flex-1 w-full min-h-[220px] relative">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
                        <h3 className="text-sm font-semibold text-white mb-4 w-full">Escalation Levels</h3>
                        <div className="flex-1 w-full min-h-[220px] relative">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <BarChart data={data.byLevel}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis 
                                        dataKey="_id" 
                                        stroke="#94a3b8" 
                                        fontSize={12} 
                                        tickFormatter={(val) => `Level ${val}`}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                                    <Bar dataKey="count" name="Tickets" radius={[4, 4, 0, 0]}>
                                        {data.byLevel.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={['#6366f1', '#f59e0b', '#ef4444'][index % 3]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category & Subcategory Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 border-t-4 border-primary-500">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-primary-400" />
                        Tickets by Category
                    </h3>
                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={byCategory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                                <Bar dataKey="count" name="Tickets" radius={[4, 4, 0, 0]}>
                                    {byCategory.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card p-6 border-t-4 border-violet-500">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                         <BarChart2 className="w-5 h-5 text-violet-400" />
                         Top 10 Subcategories
                    </h3>
                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={bySubcategory} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis dataKey="_id" type="category" stroke="#94a3b8" fontSize={10} width={100} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                                <Bar dataKey="count" name="Tickets" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* SLA Health Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 border-l-4 border-red-500/50">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">SLA Breaches by Category</h3>
                        <div className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/20 uppercase tracking-widest">High Risk</div>
                    </div>
                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={slaByCategory} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis dataKey="_id" type="category" stroke="#94a3b8" fontSize={10} width={100} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                                <Bar dataKey="count" name="Breached" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card p-6 border-l-4 border-amber-500/50">
                    <h3 className="text-lg font-semibold text-white mb-6">SLA Health by Support Level</h3>
                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={slaByLevel}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `L${val}`} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                                <Bar dataKey="count" name="Breached" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Knowledge Base Insights & Resolution Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* KB Trends Card */}
                <div className="glass-card p-6 border-l-4 border-primary-500 overflow-hidden relative">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl" />
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary-400" /> KB Insights
                    </h3>
                    <div className="space-y-4">
                        {kbTrendingArticles.map((article, i) => (
                            <div key={i} className="group/item relative pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                <p className="text-sm font-semibold text-slate-200 group-hover/item:text-primary-400 transition-colors truncate mb-1">
                                    {article.title}
                                </p>
                                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-slate-500 flex items-center gap-1">
                                        <Eye className="w-3 h-3" /> {article.views}
                                    </span>
                                    <span className="text-emerald-500/80 flex items-center gap-1">
                                        <ThumbsUp className="w-3 h-3" /> {article.helpfulVotes}
                                    </span>
                                    <span className="ml-auto text-primary-500/50 bg-primary-500/5 px-2 py-0.5 rounded">
                                        {article.category}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-6 border-t-4 border-emerald-500 lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-emerald-400" /> Resolution Time by Category
                        </h3>
                    </div>
                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={avgResolutionTimeByCategory} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                                <YAxis dataKey="_id" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#f8fafc' }}
                                    formatter={(value) => [`${value.toFixed(1)}h`, 'Avg Resolution']}
                                />
                                <Bar dataKey="avgHours" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Priority Resolution Row */}
            <div className="grid grid-cols-1 gap-6">
                <div className="glass-card p-6 border-t-4 border-indigo-500">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Timer className="w-5 h-5 text-indigo-400" /> Resolution Efficiency by Priority
                        </h3>
                    </div>
                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={formatPriorityResolution} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                                <YAxis dataKey="_id" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#f8fafc' }}
                                    formatter={(value) => [`${value.toFixed(1)}h`, 'Avg Resolution']}
                                />
                                <Bar dataKey="avgHours" radius={[0, 4, 4, 0]} barSize={20}>
                                    {formatPriorityResolution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
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
                                {agentPerformance.sort((a, b) => b.resolved - a.resolved).map((agent, index) => (
                                    <tr key={agent._id} className="table-row-hover group/row">
                                         <td className="p-4 relative">
                                             {index < 3 && (
                                                 <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 z-10">
                                                     {index === 0 && <span className="text-xl">🥇</span>}
                                                     {index === 1 && <span className="text-xl">🥈</span>}
                                                     {index === 2 && <span className="text-xl">🥉</span>}
                                                 </div>
                                             )}
                                             <div className="flex items-center gap-3 pl-4">
                                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-lg border transition-transform group-hover/row:scale-110 ${
                                                     index === 0 ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' :
                                                     index === 1 ? 'bg-slate-300/20 border-slate-300/50 text-slate-300' :
                                                     index === 2 ? 'bg-orange-500/20 border-orange-500/50 text-orange-500' :
                                                     'bg-white/5 border-white/10 text-slate-400'
                                                 }`}>
                                                     {agent.agentName.substring(0, 2).toUpperCase()}
                                                 </div>
                                                 <div>
                                                     <p className="text-slate-200 font-bold text-sm">{agent.agentName}</p>
                                                     <p className="text-slate-500 text-xs">{agent.agentEmail}</p>
                                                 </div>
                                             </div>
                                         </td>
                                         <td className="p-4">
                                            <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300">
                                                {agent.totalAssigned}
                                            </span>
                                         </td>
                                         <td className="p-4">
                                            <span className="text-emerald-400 font-bold text-base">{agent.resolved}</span>
                                         </td>
                                         <td className="p-4">
                                             <div className="flex items-center gap-2">
                                                 <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden w-24">
                                                     <div
                                                         className={`h-full bg-gradient-to-r rounded-full transition-all duration-500 ${
                                                            index === 0 ? 'from-amber-400 to-amber-600' : 'from-primary-500 to-violet-600'
                                                         }`}
                                                         style={{ width: `${Math.round((agent.resolved / agent.totalAssigned) * 100)}%` }}
                                                     />
                                                 </div>
                                                 <span className="text-xs font-bold text-slate-400 w-10">
                                                     {Math.round((agent.resolved / agent.totalAssigned) * 100)}%
                                                 </span>
                                             </div>
                                         </td>
                                         <td className="p-4 text-slate-300 text-sm">
                                            <div className="flex items-center gap-2 text-slate-400 bg-white/5 w-fit px-3 py-1.5 rounded-xl border border-white/5">
                                                <Timer className="w-3.5 h-3.5" />
                                                <span className="font-semibold">{agent.avgResolutionHours ? `${agent.avgResolutionHours.toFixed(1)}h` : 'N/A'}</span>
                                            </div>
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
