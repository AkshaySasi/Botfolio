import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Search, Ban, CheckCircle, Download, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const PAGE_SIZE = 20;

const planColors = {
    free: 'border-gray-700 text-gray-400',
    starter: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
    pro: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    agency: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
};

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [planFilter, setPlanFilter] = useState('all');
    const [page, setPage] = useState(0);

    useEffect(() => { fetchUsers(); }, [page, planFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = { limit: PAGE_SIZE, offset: page * PAGE_SIZE };
            if (searchTerm) params.search = searchTerm;
            if (planFilter !== 'all') params.plan = planFilter;
            const resp = await axios.get(`${API_URL}/api/admin/users`, { params });
            setUsers(resp.data.users || []);
            setTotal(resp.data.total || 0);
        } catch { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0);
        fetchUsers();
    };

    const handleBlock = async (userId) => {
        try {
            const resp = await axios.post(`${API_URL}/api/admin/users/${userId}/block`);
            toast.success(resp.data.message);
            fetchUsers();
        } catch { toast.error('Failed to update user'); }
    };

    const handleExport = async () => {
        try {
            const resp = await axios.get(`${API_URL}/api/admin/export/users`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([resp.data]));
            const a = document.createElement('a'); a.href = url; a.download = 'botfolio_users.csv'; a.click();
            toast.success('Users exported');
        } catch { toast.error('Export failed'); }
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-5 max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Users</h2>
                    <p className="text-xs text-gray-500">{total} total users</p>
                </div>
                <Button size="sm" variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 text-xs" onClick={handleExport}>
                    <Download className="w-3.5 h-3.5 mr-1.5" />Export CSV
                </Button>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
                    <Input placeholder="Search by name or email…" className="pl-10 bg-[#0d0d0d] border-white/10 text-white text-sm"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </form>
                <div className="flex gap-1.5">
                    {['all', 'free', 'starter', 'pro', 'agency'].map(p => (
                        <button key={p} onClick={() => { setPlanFilter(p); setPage(0); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${planFilter === p
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'text-gray-500 hover:text-white bg-white/[0.03] border border-transparent'
                                }`}>{p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}</button>
                    ))}
                </div>
            </div>

            {/* Users List */}
            <div className="space-y-2">
                {users.map(user => (
                    <div key={user.id} className="rounded-xl border border-white/5 bg-[#0d0d0d] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-medium text-white truncate">{user.name}</div>
                                <div className="text-xs text-gray-500 truncate">{user.email}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={planColors[user.subscription_tier] || planColors.free}>
                                {user.subscription_tier || 'free'}
                            </Badge>
                            <Badge variant="outline" className="border-gray-800 text-gray-500 text-[10px]">
                                {user.portfolios_count || 0} portfolios
                            </Badge>
                            {user.is_blocked && (
                                <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10">Blocked</Badge>
                            )}
                            <Button size="sm" variant="outline"
                                className={user.is_blocked
                                    ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs'
                                    : 'border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs'}
                                onClick={() => handleBlock(user.id)}
                            >
                                {user.is_blocked ? <><CheckCircle className="w-3 h-3 mr-1" />Unblock</> : <><Ban className="w-3 h-3 mr-1" />Block</>}
                            </Button>
                        </div>
                    </div>
                ))}

                {users.length === 0 && !loading && (
                    <div className="text-center py-16 text-gray-600 rounded-xl border border-white/5 bg-[#0d0d0d]">
                        No users found
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}
                        className="text-gray-400 hover:text-white">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-gray-500">Page {page + 1} of {totalPages}</span>
                    <Button size="sm" variant="ghost" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                        className="text-gray-400 hover:text-white">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
