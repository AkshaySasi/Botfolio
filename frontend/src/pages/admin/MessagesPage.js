import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Mail, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const MessagesPage = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/admin/messages`);
            setMessages(response.data);
        } catch (error) {
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {messages.map((msg, index) => (
                <div key={index} className="bg-[#111] border border-gray-800 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-white">{msg.subject || 'Agency Pack Inquiry'}</h3>
                            <Badge variant="destructive" className="bg-red-900/20 text-red-400 hover:bg-red-900/30">Agency</Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                            {msg.created_at ? format(new Date(msg.created_at), 'MM/dd/yyyy') : 'N/A'}
                        </div>
                    </div>

                    <div className="text-gray-400 text-sm mb-4">
                        From: <span className="text-white">{msg.email}</span>
                    </div>

                    <div className="bg-gray-900/50 rounded-lg p-4 text-gray-300 text-sm">
                        {msg.message}
                    </div>
                </div>
            ))}

            {messages.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500 bg-[#111] rounded-xl border border-gray-800">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No messages received yet</p>
                </div>
            )}
        </div>
    );
};

export default MessagesPage;
