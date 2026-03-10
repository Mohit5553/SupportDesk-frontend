import { getInitials } from '../../lib/utils';

const Avatar = ({ name, size = 'md', className = '' }) => {
    const sizes = {
        sm: 'w-7 h-7 text-xs',
        md: 'w-9 h-9 text-sm',
        lg: 'w-11 h-11 text-base',
        xl: 'w-14 h-14 text-lg',
    };

    const colors = [
        'from-violet-500 to-purple-600',
        'from-blue-500 to-cyan-600',
        'from-emerald-500 to-teal-600',
        'from-orange-500 to-red-600',
        'from-pink-500 to-rose-600',
        'from-indigo-500 to-primary-600',
    ];

    const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;

    return (
        <div
            className={`${sizes[size]} rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center font-bold text-white flex-shrink-0 ${className}`}
        >
            {getInitials(name)}
        </div>
    );
};

export default Avatar;
