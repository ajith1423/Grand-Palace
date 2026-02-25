import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import axios from 'axios';
import { MessageCircle, Send, CheckCircle2, Clock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const WS_BASE_URL = BACKEND_URL.replace('http://', 'ws://').replace('https://', 'wss://').replace(/\/api$/, '').replace(/\/$/, '');

export const AdminChat = () => {
    const { user } = useApp();
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 1. Initial Load & Admin WebSocket Connection
    useEffect(() => {
        fetchSessions();
        connectAdminWebSocket();

        return () => {
            if (ws.current) ws.current.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2. Scroll to bottom when reading messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 3. Load active session messages when clicked
    useEffect(() => {
        if (activeSession) {
            fetchSessionHistory(activeSession.id);

            // Mark as read in local state
            setSessions(prev =>
                prev.map(s => s.id === activeSession.id ? { ...s, unread_admin: 0 } : s)
            );
        }
    }, [activeSession]);

    const fetchSessions = async () => {
        try {
            const { data } = await axios.get(`${BACKEND_URL}/api/chat/sessions`);
            setSessions(data || []);
        } catch (e) {
            console.error('Failed to fetch chat sessions', e);
        }
    };

    const fetchSessionHistory = async (sessionId) => {
        try {
            const { data } = await axios.get(`${BACKEND_URL}/api/chat/sessions/${sessionId}`);
            setMessages(data.messages || []);
        } catch (e) {
            console.error('Failed to fetch session history', e);
        }
    };

    const connectAdminWebSocket = () => {
        if (ws.current) ws.current.close();

        const clientId = user?.id || Math.random().toString(36).substring(7);
        const wsUrl = `${WS_BASE_URL}/api/chat/ws/admin/${clientId}`;

        const socket = new WebSocket(wsUrl);

        socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);

            // Handle New Incoming Customer Session Notification
            if (msg.type === 'new_session') {
                setSessions(prev => [msg.data, ...prev]);
                return;
            }

            // Handle Incoming Broadcast Message
            if (msg.type === 'session_message') {
                const { session_id, data } = msg;

                // Update unread badges and snippets in the sidebar
                setSessions(prev => prev.map(s => {
                    if (s.id === session_id) {
                        return {
                            ...s,
                            last_message: data.content,
                            updated_at: data.timestamp,
                            unread_admin: activeSession?.id === session_id ? 0 : (s.unread_admin || 0) + 1
                        };
                    }
                    return s;
                }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));

                // If we are currently viewing this thread, append it live
                if (activeSession?.id === session_id) {
                    setMessages(prev => {
                        if (prev.find(m => m.id === data.id)) return prev;
                        return [...prev, data];
                    });

                    if (data.is_admin === false) {
                        // Let the backend know we read it immediately
                        axios.get(`${BACKEND_URL}/api/chat/sessions/${session_id}`).catch(() => { });
                    }
                }
            }
        };

        ws.current = socket;
    };

    const sendAdminReply = (e) => {
        e.preventDefault();
        if (!inputMsg.trim() || !activeSession || !ws.current) return;

        // Broadcast back to the correct session
        ws.current.send(JSON.stringify({
            type: "admin_reply",
            session_id: activeSession.id,
            content: inputMsg.trim()
        }));

        setInputMsg('');
    };

    const filteredSessions = sessions.filter(s =>
        s.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customer_email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

            {/* LEFT PANEL: Sessions Sidebar */}
            <div className="w-1/3 min-w-[300px] border-r border-gray-100 flex flex-col bg-gray-50/50">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-navy mb-4 flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-gold" />
                        Live Chat
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    {filteredSessions.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <MessageCircle className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                            <p>No active conversations found.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredSessions.map((session) => (
                                <button
                                    key={session.id}
                                    onClick={() => setActiveSession(session)}
                                    className={`w-full text-left p-4 hover:bg-white transition-colors flex items-start gap-3 ${activeSession?.id === session.id ? 'bg-white border-l-4 border-l-gold' : ''
                                        }`}
                                >
                                    <div className="relative">
                                        <div className="h-10 w-10 rounded-full bg-navy/5 text-navy flex items-center justify-center font-bold">
                                            {session.customer_name.charAt(0).toUpperCase()}
                                        </div>
                                        {session.status === 'active' && (
                                            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="font-semibold text-gray-900 truncate pr-2">{session.customer_name}</h4>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {new Date(session.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className={`text-sm truncate ${session.unread_admin > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                            {session.last_message}
                                        </p>
                                    </div>

                                    {session.unread_admin > 0 && activeSession?.id !== session.id && (
                                        <div className="bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] rounded-full flex items-center justify-center px-1.5">
                                            {session.unread_admin}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* RIGHT PANEL: Active Chat Window */}
            <div className="flex-1 flex flex-col bg-white">
                {activeSession ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-navy text-white flex items-center justify-center font-bold">
                                    {activeSession.customer_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{activeSession.customer_name}</h3>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-green-500" /> Connecting via Storefront
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-600">{activeSession.customer_email}</p>
                                <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                                    <Clock className="h-3 w-3" />
                                    Started {new Date(activeSession.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* Chat History Container */}
                        <ScrollArea className="flex-1 p-6 bg-gray-50/30">
                            <div className="space-y-6 pb-4">
                                <div className="flex justify-center">
                                    <span className="text-xs text-gray-400 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full shadow-sm">
                                        {new Date(activeSession.created_at).toLocaleString()} - Chat Instance Created
                                    </span>
                                </div>

                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm text-[15px] ${msg.is_admin
                                                ? 'bg-navy text-white rounded-tr-none'
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                                            }`}>
                                            <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                                            <div className={`text-[11px] mt-2 flex items-center gap-1 ${msg.is_admin ? 'text-white/60 justify-end' : 'text-gray-400 justify-start'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {msg.is_admin && <CheckCircle2 className="h-3 w-3" />}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Message Input Box */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <form onSubmit={sendAdminReply} className="flex gap-3 max-w-4xl mx-auto items-end relative">
                                <Input
                                    value={inputMsg}
                                    onChange={(e) => setInputMsg(e.target.value)}
                                    placeholder={`Reply to ${activeSession.customer_name}...`}
                                    className="bg-gray-50 border-gray-200 focus-visible:ring-gold min-h-[50px] rounded-xl pr-16 text-[15px]"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="absolute right-2 top-1.5 h-9 w-9 bg-gold hover:bg-gold-light text-navy-dark rounded-lg shadow-sm"
                                    disabled={!inputMsg.trim()}
                                >
                                    <Send className="h-4 w-4 ml-0.5" />
                                </Button>
                            </form>
                            <div className="text-right mt-2 text-xs text-gray-400 max-w-4xl mx-auto">
                                <kbd className="px-1 border rounded bg-gray-50 mr-1 font-sans">Enter</kbd> to send
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/30">
                        <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <MessageCircle className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No Conversation Selected</h3>
                        <p className="max-w-xs text-gray-500">
                            Choose a conversation from the sidebar to view message history and reply.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminChat;
