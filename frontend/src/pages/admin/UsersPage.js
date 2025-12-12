import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Search, Shield, ShieldOff, Ban, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/admin/users`);
            setUsers(response.data);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleBlockUser = async (userId, currentStatus) => {
        // This functionality requires a backend update to support blocking officially
        // For now we'll just toggle a mock status or update a field if backend supports it
        toast.info("Block functionality to be connected to backend logic");
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <Input
                        placeholder="Search users..."
                        className="pl-12 bg-black border-gray-800 text-white w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-4">
                {filteredUsers.map((user) => (
                    <div key={user.id} className="bg-[#111] border border-gray-800 rounded-xl p-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-white">{user.name}</h3>
                            <p className="text-gray-400">{user.email}</p>
                            <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/10">Active</Badge>
                                <Badge variant="outline" className="border-gray-700 text-gray-400">Portfolios: {user.portfolios_count}</Badge>
                                <Badge variant="outline" className="border-gray-700 text-gray-400">Slots: 1/1</Badge>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="border-red-900/30 bg-red-900/10 text-red-500 hover:bg-red-900/20 hover:text-red-400"
                            onClick={() => handleBlockUser(user.id)}
                        >
                            <Ban className="w-4 h-4 mr-2" />
                            Block
                        </Button>
                    </div>
                ))}

                {filteredUsers.length === 0 && !loading && (
                    <div className="text-center py-12 text-gray-500">
                        No users found
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsersPage;
