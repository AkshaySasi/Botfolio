import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Bell, Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => { fetchNotifications(); }, []);

    const fetchNotifications = async () => {
        try {
            const resp = await axios.get(`${API_URL}/api/admin/notifications`);
            setNotifications(resp.data);
        } catch { toast.error('Failed to load notifications'); }
        finally { setLoading(false); }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) { toast.error('Title and message required'); return; }
        setSending(true);
        try {
            await axios.post(`${API_URL}/api/admin/notifications`, { title: title.trim(), message: message.trim() });
            toast.success('Notification sent to all users!');
            setTitle(''); setMessage('');
            fetchNotifications();
        } catch { toast.error('Failed to send'); }
        finally { setSending(false); }
    };

    return (
        <div className="space-y-5 max-w-3xl">
            <div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Push Notifications</h2>
                <p className="text-xs text-gray-500">Broadcast messages to all users</p>
            </div>

            {/* Compose */}
            <form onSubmit={handleSend} className="rounded-2xl border border-emerald-500/15 bg-[#0d0d0d] p-5 space-y-4">
                <div>
                    <Label className="text-gray-400 text-xs mb-1.5 block">Title</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. New Feature: AI Resume Analysis"
                        className="bg-black/50 border-white/10 text-white" />
                </div>
                <div>
                    <Label className="text-gray-400 text-xs mb-1.5 block">Message</Label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                        placeholder="Write your notification message…"
                        className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm resize-none focus:border-emerald-500/50 focus:outline-none" />
                </div>
                <Button type="submit" disabled={sending} className="bg-gradient-to-r from-emerald-500 to-lime-500 text-black font-bold text-sm w-full">
                    <Send className="w-3.5 h-3.5 mr-1.5" />{sending ? 'Sending…' : 'Send to All Users'}
                </Button>
            </form>

            {/* History */}
            <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Sent History</h3>
                <div className="space-y-2">
                    {notifications.map(n => (
                        <div key={n.id} className="rounded-xl border border-white/5 bg-[#0d0d0d] p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Bell className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">{n.title}</div>
                                        <div className="text-xs text-gray-500 mt-1">{n.message}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-gray-600 flex-shrink-0">
                                    <Clock className="w-3 h-3" />
                                    {new Date(n.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}

                    {notifications.length === 0 && !loading && (
                        <div className="text-center py-16 text-gray-600 rounded-xl border border-white/5 bg-[#0d0d0d]">
                            <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            No notifications sent yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
