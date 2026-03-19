import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import API from '../../lib/axios';
import { MessageSquare, X, Send, Maximize2 } from 'lucide-react';

const CustomerChatWidget = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const endOfMessagesRef = useRef(null);

    // Initial check for active chat
    useEffect(() => {
        if (!user || user.role !== 'customer') return;

        const checkActiveChat = async () => {
            try {
                const res = await API.post('/chat/init');
                if (res.data.chat) {
                    setChat(res.data.chat);
                    setMessages(res.data.chat.messages || []);
                }
            } catch (err) {
                console.error("Failed to init chat", err);
            }
        };

        checkActiveChat();
    }, [user]);

    // Socket listeners
    useEffect(() => {
        if (!socket || !chat) return;

        socket.emit('join-chat', chat._id);

        const handleNewMessage = (msg) => {
            setMessages(prev => [...prev, msg]);
            if (!isOpen) {
                setIsOpen(true);
                setIsMinimized(false);
            }
        };

        socket.on('new-chat-message', handleNewMessage);

        return () => {
            socket.off('new-chat-message', handleNewMessage);
        };
    }, [socket, chat, isOpen]);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isMinimized]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() || !chat || loading) return;

        setLoading(true);
        try {
            const currentText = text;
            setText('');
            await API.post(`/chat/${chat._id}/messages`, { text: currentText });
        } catch (err) {
            console.error(err);
            toast.error('Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== 'customer') return null;

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-500 text-white rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 z-50 cursor-pointer border border-primary-500/50"
            >
                <MessageSquare className="w-6 h-6" />
                {/* Optional: Add unread badge here */}
            </button>
        );
    }

    return (
        <div className={`fixed right-6 z-50 shadow-2xl flex flex-col bg-dark-900 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 ${isMinimized ? 'bottom-6 w-64 h-14' : 'bottom-6 w-[350px] h-[500px]'}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-violet-600 px-4 py-3 flex items-center justify-between cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-white" />
                    <span className="font-semibold text-white">Live Support</span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="text-white/80 hover:text-white" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
                        {isMinimized ? <Maximize2 className="w-4 h-4" /> : <X className="w-4 h-4" />} 
                    </button>
                </div>
            </div>

            {/* Body */}
            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-900/50">
                        <div className="text-center text-xs text-slate-500 mb-4">
                            {!chat?.agent ? "Waiting for an agent to join..." : `You are chatting with ${chat.agent.name}`}
                        </div>
                        {messages.map((msg, idx) => {
                            const isMe = msg.sender?._id === user._id || msg.sender === user._id;
                            const isSystem = msg.system;

                            if (isSystem) {
                                return (
                                    <div key={idx} className="text-center text-xs text-amber-500/80 my-2">
                                        {msg.text}
                                    </div>
                                );
                            }

                            return (
                                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white/10 text-slate-200 rounded-tl-none'}`}>
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

                    {/* Footer */}
                    <div className="p-3 bg-dark-800 border-t border-white/10">
                        {chat?.status === 'closed' ? (
                            <div className="text-center text-sm text-slate-500">This chat has ended.</div>
                        ) : (
                            <form onSubmit={sendMessage} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-dark-900 border border-white/10 rounded-full px-4 py-2 flex items-center text-sm focus:outline-none focus:border-primary-500/50"
                                />
                                <button type="submit" disabled={!text.trim()} className="w-9 h-9 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:hover:bg-primary-600 rounded-full flex items-center justify-center text-white transition-colors">
                                    <Send className="w-4 h-4 ml-0.5" />
                                </button>
                            </form>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default CustomerChatWidget;
