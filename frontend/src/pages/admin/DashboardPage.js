import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Users, FileText, DollarSign, Shield, MessageSquare, Activity,
    TrendingUp, Download, ArrowUpRight, Zap, Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

/* ────────────────────── Inline SVG Bar Chart ────────────────────── */
const MiniBarChart = ({ data = [], labels = [], color = '#10b981', height = 160 }) => {
    if (!data.length) return <div className="text-gray-600 text-sm text-center py-8">No data yet</div>;
    const max = Math.max(...data, 1);
    const barW = Math.min(40, (280 / data.length) - 8);
    const chartW = data.length * (barW + 8);

    return (
        <svg viewBox={`0 0 ${chartW} ${height + 30}`} className="w-full" style={{ maxHeight: height + 40 }}>
            {data.map((v, i) => {
                const barH = (v / max) * height;
                const x = i * (barW + 8);
                return (
                    <g key={i}>
                        <rect x={x} y={height - barH} width={barW} height={barH} rx={4}
                            fill={color} opacity={0.85} />
                        <text x={x + barW / 2} y={height - barH - 6} textAnchor="middle"
                            fill={color} fontSize="10" fontWeight="600">
                            {v > 0 ? (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v) : ''}
                        </text>
                        <text x={x + barW / 2} y={height + 16} textAnchor="middle"
                            fill="#6b7280" fontSize="9">
                            {labels[i]?.slice(5) || ''}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};

/* ────────────────────── Stat Card ────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, color, gradient }) => (
    <div className={`relative overflow-hidden rounded-2xl p-5 border ${gradient}`}>
        <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            {sub && <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />{sub}</span>}
        </div>
        <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
    </div>
);

/* ────────────────────── Main Dashboard ────────────────────── */
const AdminDashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [revenue, setRevenue] = useState({ months: [], revenue: [] });
    const [growth, setGrowth] = useState({ months: [], signups: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            axios.get(`${API_URL}/api/admin/stats`),
            axios.get(`${API_URL}/api/admin/revenue`),
            axios.get(`${API_URL}/api/admin/user-growth`),
        ]).then(([s, r, g]) => {
            setStats(s.data);
            setRevenue(r.data);
            setGrowth(g.data);
        }).catch(() => toast.error('Failed to load dashboard data'))
            .finally(() => setLoading(false));
    }, []);

    const handleExport = async (type) => {
        try {
            const resp = await axios.get(`${API_URL}/api/admin/export/${type}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([resp.data]));
            const a = document.createElement('a'); a.href = url;
            a.download = `botfolio_${type}.csv`; a.click();
            toast.success(`${type} data exported`);
        } catch { toast.error('Export failed'); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="text-emerald-400 animate-pulse">Loading dashboard…</div></div>;

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Dashboard</h1>
                    <p className="text-sm text-gray-500">Real-time overview of your application</p>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 text-xs" onClick={() => handleExport('users')}>
                        <Download className="w-3.5 h-3.5 mr-1.5" />Users CSV
                    </Button>
                    <Button size="sm" variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 text-xs" onClick={() => handleExport('revenue')}>
                        <Download className="w-3.5 h-3.5 mr-1.5" />Revenue CSV
                    </Button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                <StatCard icon={Users} label="Total Users" value={stats?.total_users || 0}
                    sub={stats?.new_users_this_week ? `+${stats.new_users_this_week} this week` : null}
                    color="bg-blue-600" gradient="bg-blue-500/5 border-blue-500/15" />
                <StatCard icon={FileText} label="Portfolios" value={stats?.total_portfolios || 0}
                    color="bg-amber-500" gradient="bg-amber-500/5 border-amber-500/15" />
                <StatCard icon={DollarSign} label="Revenue" value={`₹${stats?.revenue || 0}`}
                    color="bg-emerald-600" gradient="bg-emerald-500/5 border-emerald-500/15" />
                <StatCard icon={Zap} label="Growth Users" value={stats?.growth_users || stats?.pro_users || 0}
                    color="bg-purple-600" gradient="bg-purple-500/5 border-purple-500/15" />
                <StatCard icon={MessageSquare} label="Messages" value={stats?.total_messages || 0}
                    color="bg-rose-600" gradient="bg-rose-500/5 border-rose-500/15" />
                <StatCard icon={Shield} label="System"
                    value={stats?.maintenance_mode ? 'Maintenance' : 'Online'}
                    color={stats?.maintenance_mode ? 'bg-red-600' : 'bg-emerald-600'}
                    gradient={stats?.maintenance_mode ? 'bg-red-500/5 border-red-500/15' : 'bg-emerald-500/5 border-emerald-500/15'} />
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-emerald-500/10 bg-[#0d0d0d] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />Revenue (Monthly)
                        </h3>
                    </div>
                    <MiniBarChart data={revenue.revenue} labels={revenue.months} color="#10b981" />
                </div>

                <div className="rounded-2xl border border-blue-500/10 bg-[#0d0d0d] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" />User Growth (Monthly)
                        </h3>
                    </div>
                    <MiniBarChart data={growth.signups} labels={growth.months} color="#3b82f6" />
                </div>
            </div>

            {/* Plan Breakdown */}
            {stats?.plan_breakdown && (
                <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Subscription Breakdown</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(stats.plan_breakdown).map(([plan, count]) => (
                            <div key={plan} className="text-center p-3 rounded-xl bg-black/50 border border-white/5">
                                <div className="text-lg font-bold text-white">{count}</div>
                                <div className="text-xs text-gray-500 capitalize">{plan}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick links */}
            <div className="grid sm:grid-cols-3 gap-3">
                <Link to="/console-admin5353v1/users" className="rounded-xl border border-white/5 bg-[#0d0d0d] p-4 hover:border-emerald-500/20 transition-colors group">
                    <Users className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 transition-colors mb-2" />
                    <div className="text-sm font-medium text-white">Manage Users</div>
                    <div className="text-xs text-gray-600">Search, filter, block</div>
                </Link>
                <Link to="/console-admin5353v1/coupons" className="rounded-xl border border-white/5 bg-[#0d0d0d] p-4 hover:border-emerald-500/20 transition-colors group">
                    <Ticket className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 transition-colors mb-2" />
                    <div className="text-sm font-medium text-white">Coupons & Discounts</div>
                    <div className="text-xs text-gray-600">Create, manage promo codes</div>
                </Link>
                <Link to="/console-admin5353v1/system" className="rounded-xl border border-white/5 bg-[#0d0d0d] p-4 hover:border-emerald-500/20 transition-colors group">
                    <Activity className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 transition-colors mb-2" />
                    <div className="text-sm font-medium text-white">System Controls</div>
                    <div className="text-xs text-gray-600">Maintenance, exports</div>
                </Link>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
