import { useState } from 'react';
import API from '../lib/axios';
import { Download, Calendar, BarChart2, Star, Users, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminReports = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleExport = async (type, filename) => {
        setIsLoading(true);
        try {
            const res = await API.get('/admin/reports', {
                params: { type, startDate, endDate }
            });

            const data = res.data.data;
            if (data.length === 0) {
                toast.error('No data found for the selected date range.');
                setIsLoading(false);
                return;
            }

            // Convert JSON array to CSV
            const headers = Object.keys(data[0]);
            const csvRows = [
                headers.join(','), // header row
                ...data.map(row => 
                    headers.map(fieldName => JSON.stringify(row[fieldName] || '')).join(',')
                )
            ];

            const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${filename}_${new Date().toLocaleDateString()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success(`${filename} exported successfully.`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to export report');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <BarChart2 className="w-6 h-6 text-primary-400" />
                        Advanced Reporting & Exports
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Generate and download detailed CSV reports based on custom date ranges.</p>
                </div>
            </div>

            <div className="glass-card p-6 border-l-4 border-l-primary-500">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-400" />
                    Select Date Range
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="form-input bg-dark-950 w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                            className="form-input bg-dark-950 w-full"
                        />
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">Leave dates empty to export all historical data.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CSAT Report */}
                <div className="glass-card p-6 flex flex-col hover:border-primary-500/30 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-4">
                        <Star className="w-6 h-6 text-primary-400" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">CSAT Feedback Report</h3>
                    <p className="text-sm text-slate-400 flex-1">Export customer ratings, feedback comments, and associated ticket/agent details.</p>
                    <button
                        onClick={() => handleExport('csat', 'CSAT_Report')}
                        disabled={isLoading}
                        className="btn-primary w-full mt-6 py-2.5 flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Download CSV
                    </button>
                </div>

                {/* Agent Performance */}
                <div className="glass-card p-6 flex flex-col hover:border-emerald-500/30 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">Agent Performance</h3>
                    <p className="text-sm text-slate-400 flex-1">Export resolution rates, total handled tickets, and average CSAT scores per agent.</p>
                    <button
                        onClick={() => handleExport('agents', 'Agent_Performance_Report')}
                        disabled={isLoading}
                        className="btn-primary w-full mt-6 py-2.5 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                    >
                        <Download className="w-4 h-4" /> Download CSV
                    </button>
                </div>

                {/* All Tickets Raw */}
                <div className="glass-card p-6 flex flex-col hover:border-violet-500/30 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                        <Briefcase className="w-6 h-6 text-violet-400" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">Raw Ticket Data</h3>
                    <p className="text-sm text-slate-400 flex-1">Export all ticket metadata including SLA status, priorities, and creation timestamps.</p>
                    <button
                        onClick={() => handleExport('tickets', 'Raw_Tickets_Report')}
                        disabled={isLoading}
                        className="btn-primary w-full mt-6 py-2.5 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 shadow-violet-500/20"
                    >
                        <Download className="w-4 h-4" /> Download CSV
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
