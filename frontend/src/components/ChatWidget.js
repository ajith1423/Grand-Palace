import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/context/AppContext';
import axios from 'axios';

// Get backend URL from env, ensuring we strip any trailing /api or trailing slashes
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const WS_BASE_URL = BACKEND_URL.replace('http://', 'ws://').replace('https://', 'wss://').replace(/\/$/, '');

export const ChatWidget = () => {
    const { user } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [sessionInfo, setSessionInfo] = useState(() => {
        const saved = localStorage.getItem('gpgt_chat_session');
        return saved ? JSON.parse(saved) : null;
    });

    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState('');
    const [loading, setLoading] = useState(false);

    // Registration form
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');

    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        if (sessionInfo && isOpen) {
            connectWebSocket(sessionInfo.id);
            fetchHistory(sessionInfo.id);
        }
        return () => {
            if (ws.current) ws.current.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionInfo, isOpen]);

    const fetchHistory = async (sessionId) => {
        try {
            const { data } = await axios.get(`${BACKEND_URL}/api/chat/sessions/${sessionId}`);
            setMessages(data.messages || []);
        } catch (e) {
            console.error('Failed to load chat history');
        }
    };

    const connectWebSocket = (sessionId) => {
        if (ws.current) ws.current.close();

        // Create random client ID for this browser tab
        const clientId = Math.random().toString(36).substring(7);
        const wsUrl = `${WS_BASE_URL}/api/chat/ws/${clientId}/${sessionId}`;

        const socket = new WebSocket(wsUrl);

        socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            setMessages(prev => {
                // Prevent duplicates
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        };

        socket.onclose = () => {
            // Reconnect logic could go here
        };

        ws.current = socket;
    };

    const startChat = async (e) => {
        e.preventDefault();
        if (!name || !email) return;

        setLoading(true);
        try {
            const { data } = await axios.post(`${BACKEND_URL}/api/chat/sessions`, {
                customer_name: name,
                customer_email: email
            });

            setSessionInfo(data);
            localStorage.setItem('gpgt_chat_session', JSON.stringify(data));
            setMessages(data.messages || []);
            connectWebSocket(data.id);
        } catch (error) {
            console.error('Failed to start chat', error);
        }
        setLoading(false);
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!inputMsg.trim() || !ws.current) return;

        // The server reads raw text strings from customer websocket
        ws.current.send(inputMsg.trim());
        setInputMsg('');
    };

    // Don't render for admins if they are in the admin panel 
    // (We handle admin view separately)
    if (window.location.pathname.startsWith('/admin')) return null;

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 h-14 w-14 bg-navy hover:bg-navy-dark text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 z-50 ring-4 ring-gold/20"
                >
                    <MessageCircle className="h-6 w-6" />
                    {/* Optional unread badge could go here */}
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-100" style={{ height: '500px', maxHeight: '80vh' }}>

                    {/* Header */}
                    <div className="bg-navy p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center">
                                <MessageCircle className="h-4 w-4 text-gold" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">GPGT Live Chat</h3>
                                <p className="text-xs text-white/70">Typically replies instantly</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <Minimize2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {!sessionInfo ? (
                        /* Registration Form */
                        <div className="flex-1 p-6 flex flex-col justify-center bg-gray-50">
                            <div className="text-center mb-6">
                                <h4 className="text-lg font-bold text-navy mb-2">Welcome! 👋</h4>
                                <p className="text-sm text-gray-500">Please provide your details below to start chatting with our team.</p>
                            </div>

                            <form onSubmit={startChat} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</label>
                                    <Input
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="John Doe"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</label>
                                    <Input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="john@example.com"
                                        className="mt-1"
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-gold hover:bg-gold-light text-navy-dark font-bold mt-2" disabled={loading}>
                                    {loading ? 'Starting...' : 'Start Chat'}
                                </Button>
                            </form>
                        </div>
                    ) : (
                        /* Chat Interface */
                        <>
                            <ScrollArea className="flex-1 p-4 bg-gray-50">
                                <div className="space-y-4 pb-4">
                                    <div className="text-center">
                                        <span className="text-xs text-gray-400 bg-white border px-2 py-1 rounded-full shadow-sm">
                                            Chat started
                                        </span>
                                    </div>

                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
                                        >
                                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.is_admin
                                                ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                                : 'bg-navy text-white rounded-tr-none'
                                                }`}>
                                                {msg.is_admin && (
                                                    <div className="text-[10px] font-bold text-gold mb-1">GPGT Support</div>
                                                )}
                                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                <div className={`text-[10px] mt-1 ${msg.is_admin ? 'text-gray-400' : 'text-white/60'} text-right`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>

                            {/* Input Area */}
                            <div className="p-3 bg-white border-t border-gray-100">
                                <form onSubmit={sendMessage} className="flex gap-2 relative">
                                    <Input
                                        value={inputMsg}
                                        onChange={(e) => setInputMsg(e.target.value)}
                                        placeholder="Type your message..."
                                        className="bg-gray-50 border-transparent focus-visible:ring-1 focus-visible:ring-gold pr-12 rounded-full"
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="absolute right-1 top-1 h-8 w-8 rounded-full bg-gold hover:bg-gold-light text-navy-dark"
                                        disabled={!inputMsg.trim()}
                                    >
                                        <Send className="h-4 w-4 ml-0.5" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default ChatWidget;
