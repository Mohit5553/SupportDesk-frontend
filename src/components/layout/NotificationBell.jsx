import { useState, useRef, useEffect } from 'react';
import { Bell, X, Info, Ticket, MessageSquare, CheckCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, clearNotifications } = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBellClick = () => {
        setIsOpen(!isOpen);
        if (!isOpen) markAsRead();
    };

    const handleNotificationClick = (notif) => {
        setIsOpen(false);
        if (notif.ticketId) {
            navigate(`/tickets/${notif.ticketId}`);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'NEW_TICKET': return <Ticket className="w-4 h-4 text-blue-400" />;
            case 'TICKET_ASSIGNED': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
            case 'NEW_COMMENT': return <MessageSquare className="w-4 h-4 text-violet-400" />;
            case 'STATUS_UPDATE': return <Info className="w-4 h-4 text-amber-400" />;
            default: return <Bell className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleBellClick}
                className={`p-2 rounded-xl transition-all duration-200 relative ${
                    isOpen ? 'bg-primary-500/10 text-primary-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-dark-950">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">Notifications</h3>
                        <button 
                            onClick={clearNotifications}
                            className="text-[10px] text-slate-500 hover:text-white uppercase tracking-wider font-semibold"
                        >
                            Clear all
                        </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                            notifications.map((notif, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleNotificationClick(notif)}
                                    className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex gap-3"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-200 line-clamp-2">{notif.message}</p>
                                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-medium">Just now</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center">
                                <Bell className="w-12 h-12 text-slate-700 mx-auto mb-3 opacity-20" />
                                <p className="text-slate-500 text-sm">No new notifications</p>
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 bg-white/5 text-center">
                            <button className="text-xs text-primary-400 hover:text-primary-300 font-medium">
                                View all activity
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
