import { getPriorityClass, getStatusClass } from '../../lib/utils';

export const PriorityBadge = ({ priority }) => (
    <span className={`badge ${getPriorityClass(priority)}`}>
        {priority}
    </span>
);

export const StatusBadge = ({ status }) => (
    <span className={`badge ${getStatusClass(status)}`}>
        {status}
    </span>
);

export const RoleBadge = ({ role }) => {
    const colors = {
        admin: 'bg-red-500/20 text-red-400 border border-red-500/30',
        manager: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
        agent: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        customer: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    };
    return (
        <span className={`badge ${colors[role] || 'bg-slate-500/20 text-slate-400'}`}>
            {role?.charAt(0).toUpperCase() + role?.slice(1)}
        </span>
    );
};
