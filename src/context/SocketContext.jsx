import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import API from '../lib/axios';
import { SOCKET_URL } from '../lib/config';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [tasksCount, setTasksCount] = useState(0);

    // Initial count fetch
    useEffect(() => {
        if (!user) return;
        const fetchInitialCounts = async () => {
            try {
                // Determine query params based on role
                const params = { limit: 1 };
                if (user.role === 'admin' || user.role === 'manager') {
                    params.status = 'Open'; // Admins see unassigned/new tickets
                } else if (user.role === 'agent') {
                    params.status = 'Assigned'; // Agents see tickets assigned to them
                } else {
                    params.status = 'Open'; // Customers see their open tickets
                }
                
                const res = await API.get('/tickets', { params });
                setTasksCount(res.data.total || 0);
            } catch (err) {
                console.error('Failed to fetch initial task count', err);
            }
        };
        fetchInitialCounts();
    }, [user]);

    useEffect(() => {
        if (!user) return;

        const newSocket = io(SOCKET_URL, {
            auth: { token: localStorage.getItem('token') },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        setSocket(newSocket);

        newSocket.emit('join', user._id);
        
        if (['admin', 'manager'].includes(user.role)) {
            newSocket.emit('join-admins');
        }

        newSocket.on('notification', (data) => {
            console.log('Received notification:', data);
            setNotifications(prev => [data, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Adjust task count based on notification type
            if (data.type === 'TICKET_ASSIGNED' && user.role === 'agent') {
                setTasksCount(prev => prev + 1);
            }
            if (data.type === 'STATUS_UPDATE' && user.role === 'customer' && data.status === 'Open') {
                // Not standard for status update to increase task count for customer usually, 
                // but if it becomes actionable we can add it.
            }
            
            toast.success(data.message, {
                duration: 5000,
                icon: '🔔',
            });
        });

        newSocket.on('admin-notification', (data) => {
            console.log('Received admin notification:', data);
            setNotifications(prev => [data, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // If new ticket, increase task count for admins
            if (data.type === 'NEW_TICKET' && (user.role === 'admin' || user.role === 'manager')) {
                setTasksCount(prev => prev + 1);
            }
            
            toast.info(data.message, {
                duration: 5000,
            });
        });

        return () => newSocket.close();
    }, [user]);

    const clearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    const markAsRead = () => {
        setUnreadCount(0);
    };

    return (
        <SocketContext.Provider value={{ socket, notifications, unreadCount, tasksCount, clearNotifications, markAsRead }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
