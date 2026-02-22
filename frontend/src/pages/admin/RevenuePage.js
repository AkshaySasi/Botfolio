import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { TrendingUp, Download, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

/* ────────────────────── Inline SVG Bar Chart ────────────────────── */
const BarChart = ({ data = [], labels = [], color = '#10b981', height = 200 }) => {
    if (!data.length) return <div className="text-gray-600 text-sm text-center py-12">No revenue data yet</div>;
    const max = Math.max(...data, 1);
    const barW = Math.min(50, (400 / data.length) - 12);
    const chartW = data.length * (barW + 12);

    return (
        <svg viewBox={`0 0 ${chartW} ${height + 35}`} className="w-full" style={{ maxHeight: height + 50 }}>
            {data.map((v, i) => {
                const barH = (v / max) * height;
                const x = i * (barW + 12);
                return (
                    <g key={i}>
                        <rect x={x} y={height - barH} width={barW} height={barH} rx={5}
                            fill={color} opacity={0.8} />
                        <text x={x + barW / 2} y={height - barH - 8} textAnchor="middle"
                            fill={color} fontSize="11" fontWeight="700">
                            ₹{v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                        </text>
                        <text x={x + barW / 2} y={height + 18} textAnchor="middle"
                            fill="#6b7280" fontSize="10">
                            {labels[i]?.slice(5) || ''}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};

const RevenuePage = () => {
    const [revenue, setRevenue] = useState({ months: [], revenue: [] });
    const [growth, setGrowth] = useState({ months: [], signups: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            axios.get(`${API_URL}/api/admin/revenue`),
            axios.get(`${API_URL}/api/admin/user-growth`),
        ]).then(([r, g]) => {
            setRevenue(r.data);
            setGrowth(g.data);
        }).catch(() => toast.error('Failed to load data'))
            .finally(() => setLoading(false));
    }, []);

    const handleExport = async () => {
        try {
            const resp = await axios.get(`${API_URL}/api/admin/export/revenue`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([resp.data]));
            const a = document.createElement('a'); a.href = url; a.download = 'botfolio_revenue.csv'; a.click();
            toast.success('Revenue exported');
        } catch { toast.error('Export failed'); }
    };

    const totalRevenue = revenue.revenue.reduce((a, b) => a + b, 0);

    if (loading) return <div className="flex items-center justify-center h-64"><div className="text-emerald-400 animate-pulse">Loading…</div></div>;

    return (
        <div className="space-y-5 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Revenue Analytics</h2>
                    <p className="text-xs text-gray-500">Monthly revenue breakdown and trends</p>
                </div>
                <Button size="sm" variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 text-xs" onClick={handleExport}>
                    <Download className="w-3.5 h-3.5 mr-1.5" />Export CSV
                </Button>
            </div>

            {/* Total */}
            <div className="rounded-2xl border border-emerald-500/15 bg-[#0d0d0d] p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <div className="text-2xl font-bold text-white">₹{totalRevenue.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Total Revenue (All Time)</div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="rounded-2xl border border-emerald-500/10 bg-[#0d0d0d] p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />Monthly Revenue
                </h3>
                <BarChart data={revenue.revenue} labels={revenue.months} color="#10b981" height={200} />
            </div>

            {/* User Growth Chart */}
            <div className="rounded-2xl border border-blue-500/10 bg-[#0d0d0d] p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />User Signups
                </h3>
                <BarChart data={growth.signups} labels={growth.months} color="#3b82f6" height={200} />
            </div>
        </div>
    );
};

export default RevenuePage;
