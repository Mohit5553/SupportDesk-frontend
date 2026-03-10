import { AlertTriangle, RefreshCw } from 'lucide-react';

const EmptyState = ({ title, description, icon: Icon, action, actionLabel }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            {Icon ? (
                <Icon className="w-8 h-8 text-slate-500" />
            ) : (
                <AlertTriangle className="w-8 h-8 text-slate-500" />
            )}
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-1">{title}</h3>
        {description && <p className="text-slate-500 text-sm max-w-xs">{description}</p>}
        {action && (
            <button onClick={action} className="btn-primary mt-6 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                {actionLabel || 'Retry'}
            </button>
        )}
    </div>
);

export default EmptyState;
