// Priority badge class
export const getPriorityClass = (priority) => {
    const map = {
        Low: 'priority-low',
        Medium: 'priority-medium',
        High: 'priority-high',
        Critical: 'priority-critical',
    };
    return map[priority] || 'priority-low';
};

// Status badge class
export const getStatusClass = (status) => {
    const map = {
        Open: 'status-open',
        Assigned: 'status-assigned',
        'In Progress': 'status-inprogress',
        Pending: 'status-pending',
        Resolved: 'status-resolved',
        Closed: 'status-closed',
    };
    return map[status] || 'status-open';
};

// Format date
export const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Time ago
export const timeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(date);
};

// SLA remaining time
export const getSlaStatus = (slaDeadline, status) => {
    if (['Resolved', 'Closed'].includes(status)) return { label: 'Completed', color: 'text-emerald-400' };
    if (!slaDeadline) return { label: 'No SLA', color: 'text-slate-500' };

    const now = new Date();
    const deadline = new Date(slaDeadline);
    const diff = deadline - now;

    if (diff <= 0) return { label: 'SLA Breached', color: 'text-red-400' };

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (hours === 0) return { label: `${minutes}m left`, color: 'text-amber-400' };
    if (hours < 4) return { label: `${hours}h ${minutes}m left`, color: 'text-orange-400' };
    return { label: `${hours}h left`, color: 'text-emerald-400' };
};

// Role badge color
export const getRoleColor = (role) => {
    const map = {
        admin: 'bg-red-500/20 text-red-400 border-red-500/30',
        manager: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
        agent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        customer: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
    return map[role] || 'bg-slate-500/20 text-slate-400';
};

// File size formatter
export const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Avatar initials
export const getInitials = (name) => {
    if (!name) return '?';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};
