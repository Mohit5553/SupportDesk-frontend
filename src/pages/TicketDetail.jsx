import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
    MessageSquare, Paperclip, Send, ArrowLeft, Clock,
    User, CheckCircle, Upload, MoreHorizontal
} from 'lucide-react';
import API from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge';
import { formatDate, timeAgo, formatFileSize, getSlaStatus } from '../lib/utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Avatar from '../components/ui/Avatar';

const TicketDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [commentText, setCommentText] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [attachments, setAttachments] = useState([]);

    const { data, isLoading } = useQuery({
        queryKey: ['ticket', id],
        queryFn: async () => {
            const res = await API.get(`/tickets/${id}`);
            return res.data;
        },
        retry: 1,
    });

    const { register, handleSubmit, reset } = useForm();

    const addCommentMutation = useMutation({
        mutationFn: async (formData) => {
            const res = await API.post(`/tickets/${id}/comments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['ticket', id]);
            setCommentText('');
            setAttachments([]);
            setIsInternal(false);
            reset();
            toast.success('Comment added successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to add comment');
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (status) => {
            const res = await API.put(`/tickets/${id}/status`, { status });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['ticket', id]);
            toast.success('Status updated');
        },
    });

    if (isLoading) return <LoadingSpinner fullScreen />;
    if (!data?.ticket) return <div className="p-8 text-center text-red-400">Ticket not found</div>;

    const { ticket, comments } = data;
    const slaStatus = getSlaStatus(ticket.slaDeadline, ticket.status);

    const onSubmitComment = (e) => {
        e.preventDefault();
        if (!commentText.trim() && attachments.length === 0) return;

        const formData = new FormData();
        formData.append('message', commentText);
        formData.append('isInternal', isInternal);
        attachments.forEach((file) => formData.append('attachments', file));

        addCommentMutation.mutate(formData);
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            if (filesArray.length + attachments.length > 3) {
                toast.error('Maximum 3 attachments allowed per comment');
                return;
            }
            setAttachments((prev) => [...prev, ...filesArray]);
        }
    };

    const removeAttachment = (index) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const canEditStatus = ['agent', 'manager', 'admin'].includes(user.role);

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            <button
                onClick={() => navigate('/tickets')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to tickets
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header Card */}
                    <div className="glass-card p-6 border-l-4 border-l-primary-500">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-primary-400 font-mono text-lg font-semibold">{ticket.ticketId}</span>
                                <StatusBadge status={ticket.status} />
                                <PriorityBadge priority={ticket.priority} />
                            </div>
                            <span className="text-slate-400 text-sm flex items-center gap-1.5">
                                <Clock className="w-4 h-4" /> {formatDate(ticket.createdAt)}
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">{ticket.title}</h1>

                        <div className="bg-white/5 rounded-xl p-4 text-slate-200 mt-4 whitespace-pre-wrap border border-white/10">
                            {ticket.description}
                        </div>

                        {ticket.attachments?.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                                    <Paperclip className="w-4 h-4" /> Attachments
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {ticket.attachments.map((file, idx) => (
                                        <a
                                            key={idx}
                                            href={`http://localhost:5000/${file.path.replace(/\\/g, '/')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800 border border-white/10 hover:border-primary-500/50 transition-colors text-sm text-slate-300"
                                        >
                                            <Paperclip className="w-4 h-4 text-primary-400" />
                                            <span className="truncate max-w-[150px]">{file.originalName || file.filename}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Comments Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary-400" />
                            Conversation
                        </h3>

                        {comments.map((comment) => (
                            <div
                                key={comment._id}
                                className={`glass-card p-5 relative ${comment.isInternal
                                        ? 'border-orange-500/30 bg-orange-500/5'
                                        : comment.author._id === user._id
                                            ? 'border-primary-500/20 bg-primary-900/10'
                                            : ''
                                    }`}
                            >
                                {comment.isInternal && (
                                    <span className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-lg shadow-md uppercase tracking-wide">
                                        Internal Note
                                    </span>
                                )}

                                <div className="flex items-start gap-4">
                                    <Avatar name={comment.author.name} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div>
                                                <span className="font-semibold text-slate-200 mr-2">{comment.author.name}</span>
                                                <span className="text-xs text-slate-500 capitalize px-2 py-0.5 rounded-full bg-white/10 border border-white/5">
                                                    {comment.author.role}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-400" title={formatDate(comment.createdAt)}>
                                                {timeAgo(comment.createdAt)}
                                            </span>
                                        </div>
                                        <div className="text-slate-300 mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">
                                            {comment.message}
                                        </div>

                                        {comment.attachments?.length > 0 && (
                                            <div className="mt-3 pt-3 flex flex-wrap gap-2">
                                                {comment.attachments.map((file, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={`http://localhost:5000/${file.path.replace(/\\/g, '/')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-dark-900 border border-white/10 text-xs text-slate-400 hover:text-white transition-colors"
                                                    >
                                                        <Paperclip className="w-3 h-3 text-primary-400" />
                                                        <span className="truncate max-w-[120px]">{file.originalName || file.filename}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Reply Box */}
                        {ticket.status !== 'Closed' && (
                            <div className="glass-card p-5 mt-6 border-primary-500/30 bg-white/5">
                                <form onSubmit={onSubmitComment}>
                                    <textarea
                                        className="form-input bg-dark-900 min-h-[120px] resize-y mb-3 text-[15px]"
                                        placeholder="Type your reply here..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                    />

                                    {attachments.length > 0 && (
                                        <div className="mb-4 flex flex-wrap gap-2">
                                            {attachments.map((file, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-dark-800 border border-white/10 px-3 py-1.5 rounded-lg text-sm text-slate-300">
                                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAttachment(idx)}
                                                        className="text-slate-500 hover:text-red-400"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <label className="cursor-pointer text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                                                <Upload className="w-5 h-5 text-primary-400" />
                                                Attach Files
                                                <input
                                                    type="file"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                                                />
                                            </label>

                                            {canEditStatus && (
                                                <label className="flex items-center gap-2 text-sm text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 cursor-pointer hover:bg-orange-500/20 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-orange-500/50 bg-dark-900 text-orange-500 focus:ring-orange-500/30"
                                                        checked={isInternal}
                                                        onChange={(e) => setIsInternal(e.target.checked)}
                                                    />
                                                    Internal Note
                                                </label>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={addCommentMutation.isLoading}
                                            className="btn-primary flex items-center gap-2 ml-auto"
                                        >
                                            {addCommentMutation.isLoading ? 'Sending...' : (
                                                <>
                                                    <Send className="w-4 h-4" /> Send Reply
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="glass-card p-5">
                        <h3 className="font-semibold text-white mb-4 border-b border-white/10 pb-3">Ticket Details</h3>

                        <div className="space-y-4">
                            {canEditStatus && (
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1 block">Status</label>
                                    <select
                                        className="form-input bg-dark-900 border-white/5 py-1.5 text-sm w-full"
                                        value={ticket.status}
                                        onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                                        disabled={updateStatusMutation.isLoading}
                                    >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1 block">Category</label>
                                <div className="text-slate-200 text-sm bg-white/5 border border-white/5 px-3 py-2 rounded-lg">
                                    {ticket.category}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1 block">Requester</label>
                                <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-lg">
                                    <Avatar name={ticket.createdBy.name} size="md" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-200 truncate">{ticket.createdBy.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{ticket.createdBy.email}</p>
                                    </div>
                                </div>
                            </div>

                            {ticket.assignedTo && (
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1 block">Assignee</label>
                                    <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-lg">
                                        <Avatar name={ticket.assignedTo.name} size="md" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-200 truncate">{ticket.assignedTo.name}</p>
                                            <p className="text-xs text-slate-500 capitalize">{ticket.assignedTo.role}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1 block">SLA Target</label>
                                <div className={`text-sm font-medium bg-white/5 border border-white/5 px-3 py-2 rounded-lg ${slaStatus.color}`}>
                                    {slaStatus.label}
                                    {ticket.slaDeadline && <span className="block text-xs font-normal text-slate-500 mt-0.5">{formatDate(ticket.slaDeadline)}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TicketDetail;
