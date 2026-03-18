import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../lib/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
    MessageSquare, Clock, User, CheckCircle, Send, Users, AlertCircle, XOctagon
} from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';
import { timeAgo } from '../lib/utils';

const AgentChat = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const queryClient = useQueryClient();
    
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [text, setText] = useState('');
    const endOfMessagesRef = useRef(null);

    const { data: chats, isLoading } = useQuery({
        queryKey: ['active-chats'],
        queryFn: async () => {
            const res = await API.get('/chat');
            return res.data.chats;
        }
    });

    const selectedChat = chats?.find(c => c._id === selectedChatId);

    // Socket Updates
    useEffect(() => {
        if (!socket) return;

        const handleChatUpdate = () => {
            queryClient.invalidateQueries(['active-chats']);
        };
        const handleNewMessage = (msg) => {
            queryClient.invalidateQueries(['active-chats']);
        };

        socket.on('chat-updated', handleChatUpdate);
        socket.on('new-chat-message', handleNewMessage);

        return () => {
            socket.off('chat-updated', handleChatUpdate);
            socket.off('new-chat-message', handleNewMessage);
        };
    }, [socket, queryClient]);

    // Join room when selecting a chat
    useEffect(() => {
        if (!socket || !selectedChatId) return;
        socket.emit('join-chat', selectedChatId);
    }, [socket, selectedChatId]);

    // Scroll to bottom
    useEffect(() => {
        if (selectedChat) {
            endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedChat?.messages?.length]);

    const acceptChatMutation = useMutation({
        mutationFn: async (id) => {
            const res = await API.put(`/chat/${id}/accept`);
            return res.data.chat;
        },
        onSuccess: (updatedChat) => {
            queryClient.invalidateQueries(['active-chats']);
            setSelectedChatId(updatedChat._id);
            toast.success('Chat accepted');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to accept chat');
        }
    });

    const endChatMutation = useMutation({
        mutationFn: async (id) => {
            await API.put(`/chat/${id}/end`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['active-chats']);
            setSelectedChatId(null);
            toast.success('Chat closed');
        }
    });

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() || !selectedChatId) return;

        try {
            const currentText = text;
            setText('');
            await API.post(`/chat/${selectedChatId}/messages`, { text: currentText });
            queryClient.invalidateQueries(['active-chats']);
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading) return <LoadingSpinner fullScreen />;

    const waitingChats = chats?.filter(c => c.status === 'waiting') || [];
    const activeChats = chats?.filter(c => c.status === 'active') || [];

    return (
        <div className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden glass-card">
            {/* Sidebar */}
            <div className="w-80 bg-dark-900/50 border-r border-white/10 flex flex-col">
                <div className="p-4 border-b border-white/10 bg-dark-800">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary-400" />
                        Live Chats
                    </h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-6">
                    {/* Waiting Queue */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                            Waiting Queue 
                            <span className="bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">{waitingChats.length}</span>
                        </h3>
                        {waitingChats.length === 0 && <p className="text-sm text-slate-500 text-center py-2">No customers waiting</p>}
                        <div className="space-y-2">
                            {waitingChats.map(chat => (
                                <div 
                                    key={chat._id}
                                    onClick={() => setSelectedChatId(chat._id)}
                                    className={`p-3 rounded-xl cursor-pointer border transition-all ${selectedChatId === chat._id ? 'border-primary-500 bg-primary-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'} `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Avatar name={chat.customer.name} size="sm" />
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-dark-900" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-200 truncate">{chat.customer.name}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Waiting {timeAgo(chat.startedAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Chats */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                            Active Chats
                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{activeChats.length}</span>
                        </h3>
                        <div className="space-y-2">
                            {activeChats.map(chat => (
                                <div 
                                    key={chat._id}
                                    onClick={() => setSelectedChatId(chat._id)}
                                    className={`p-3 rounded-xl cursor-pointer border transition-all ${selectedChatId === chat._id ? 'border-primary-500 bg-primary-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'} `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Avatar name={chat.customer.name} size="sm" />
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-dark-900" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-200 truncate">{chat.customer.name}</p>
                                            <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                                                {chat.agent?._id === user._id ? 'Assigned to you' : `Assigned to ${chat.agent?.name?.split(' ')[0]}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-dark-950/50 relative">
                {selectedChat ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 bg-dark-900/80 flex justify-between items-center z-10">
                            <div className="flex items-center gap-3">
                                <Avatar name={selectedChat.customer.name} />
                                <div>
                                    <h3 className="font-bold text-white">{selectedChat.customer.name}</h3>
                                    <p className="text-xs text-slate-400">{selectedChat.customer.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {selectedChat.status === 'waiting' ? (
                                    <button 
                                        onClick={() => acceptChatMutation.mutate(selectedChat._id)}
                                        disabled={acceptChatMutation.isLoading}
                                        className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Accept Chat
                                    </button>
                                ) : selectedChat.agent?._id === user._id ? (
                                    <button 
                                        onClick={() => {
                                            if(window.confirm('Are you sure you want to end this chat?')) {
                                                endChatMutation.mutate(selectedChat._id);
                                            }
                                        }}
                                        disabled={endChatMutation.isLoading}
                                        className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10"
                                    >
                                        <XOctagon className="w-4 h-4" /> End Chat
                                    </button>
                                ) : (
                                    <div className="px-3 py-1.5 bg-white/5 rounded-lg text-xs text-slate-400 flex items-center gap-2">
                                        <User className="w-4 h-4" /> Handled by {selectedChat.agent?.name}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="text-center text-xs font-medium text-slate-500 uppercase tracking-widest mb-6 py-2 border-b border-white/5">
                                Chat started {new Date(selectedChat.startedAt).toLocaleString()}
                            </div>
                            
                            {selectedChat.messages.map((msg, idx) => {
                                const isMe = msg.sender?._id === user._id || msg.sender === user._id;
                                const isSystem = msg.system;

                                if (isSystem) {
                                    return (
                                        <div key={idx} className="text-center text-xs text-amber-500/80 my-2 bg-amber-500/5 py-1 rounded inline-block mx-auto">
                                            {msg.text}
                                        </div>
                                    );
                                }

                                return (
                                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-end gap-2 mb-1">
                                            {!isMe && <span className="text-[10px] text-slate-500 ml-1">{msg.sender?.name}</span>}
                                        </div>
                                        <div className={`max-w-[70%] rounded-2xl px-5 py-2.5 text-sm ${isMe ? 'bg-primary-600 text-white rounded-br-none shadow-lg shadow-primary-500/20' : 'bg-white/10 text-slate-200 rounded-bl-none shadow border border-white/5'}`}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[10px] text-slate-500 mt-1">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                );
                            })}
                            <div ref={endOfMessagesRef} />
                        </div>

                        {/* Input Area */}
                        {selectedChat.status === 'active' && selectedChat.agent?._id === user._id ? (
                            <div className="p-4 bg-dark-900 border-t border-white/10 z-10">
                                <form onSubmit={sendMessage} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="form-input rounded-full h-12 flex-1 shadow-inner focus:border-primary-500/50"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!text.trim()}
                                        className="w-12 h-12 rounded-full bg-primary-600 hover:bg-primary-500 text-white flex items-center justify-center disabled:opacity-50 transition-transform hover:scale-105 active:scale-95"
                                    >
                                        <Send className="w-5 h-5 ml-1" />
                                    </button>
                                </form>
                            </div>
                        ) : selectedChat.status === 'waiting' && (
                            <div className="p-4 bg-amber-500/10 border-t border-amber-500/20 text-center text-amber-500 text-sm">
                                You must accept the chat before responding.
                            </div>
                        )}
                    </>
                ) : (
                    <div className="m-auto text-center p-8 max-w-sm">
                        <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                            <MessageSquare className="w-10 h-10 text-primary-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Select a Conversation</h3>
                        <p className="text-slate-400 text-sm">Choose a chat from the queue on the left to start providing live support.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentChat;
