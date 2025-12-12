import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, FileText, DollarSign, Bell } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-[#111] border border-gray-800 rounded-2xl p-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <div className="text-gray-400 text-sm">{label}</div>
    </div>
);

const AdminDashboardPage = () => {
    const [stats, setStats] = useState({
        total_users: 0,
        total_portfolios: 0,
        revenue: 0,
        pending_approvals: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/admin/stats`);
            setStats(response.data);
        } catch (error) {
            toast.error('Failed to load stats');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Users}
                    label="Total Users"
                    value={stats.total_users}
                    color="bg-emerald-500"
                />
                <StatCard
                    icon={FileText}
                    label="Portfolios"
                    value={stats.total_portfolios}
                    color="bg-amber-500"
                />
                <StatCard
                    icon={DollarSign}
                    label="Revenue"
                    value={`₹${stats.revenue}`}
                    color="bg-green-600"
                />
                <StatCard
                    icon={Bell}
                    label="Pending"
                    value={stats.pending_approvals}
                    color="bg-red-500"
                />
            </div>

            <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Activity Overview</h3>
                    <p className="text-gray-400">Chart data visualization coming soon</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
