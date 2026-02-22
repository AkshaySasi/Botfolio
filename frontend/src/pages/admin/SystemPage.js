import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Server, Power, Download, Activity, Shield, Database, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const SystemPage = () => {
    const [maintenance, setMaintenance] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [health, setHealth] = useState({ backend: null, supabase: null });

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        // Check backend health
        try {
            await axios.get(`${API_URL}/api/health`);
            setHealth(h => ({ ...h, backend: true }));
        } catch { setHealth(h => ({ ...h, backend: false })); }

        // Check maintenance status
        try {
            const resp = await axios.get(`${API_URL}/api/admin/maintenance`);
            setMaintenance(resp.data.maintenance_mode);
        } catch { }

        // Check Supabase (via admin stats which queries Supabase)
        try {
            await axios.get(`${API_URL}/api/admin/stats`);
            setHealth(h => ({ ...h, supabase: true }));
        } catch { setHealth(h => ({ ...h, supabase: false })); }
    };

    const handleToggleMaintenance = async () => {
        const action = maintenance ? 'disable' : 'enable';
        if (!window.confirm(`Are you sure you want to ${action} maintenance mode? ${!maintenance ? 'All users will see the maintenance screen.' : 'The app will go back online.'}`)) return;

        setToggling(true);
        try {
            const resp = await axios.post(`${API_URL}/api/admin/maintenance`);
            setMaintenance(resp.data.maintenance_mode);
            toast.success(resp.data.message);
        } catch { toast.error('Failed to toggle maintenance'); }
        finally { setToggling(false); }
    };

    const handleExport = async (type) => {
        try {
            const resp = await axios.get(`${API_URL}/api/admin/export/${type}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([resp.data]));
            const a = document.createElement('a'); a.href = url; a.download = `botfolio_${type}.csv`; a.click();
            toast.success(`${type} data exported`);
        } catch { toast.error('Export failed'); }
    };

    const HealthRow = ({ label, icon: Icon, status }) => (
        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-black/30 border border-white/5">
            <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-300">{label}</span>
            </div>
            {status === null ? (
                <span className="text-xs text-gray-600">Checking…</span>
            ) : status ? (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />Online
                </div>
            ) : (
                <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />Unreachable
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-5 max-w-2xl">
            <div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>System</h2>
                <p className="text-xs text-gray-500">Control application state and export data</p>
            </div>

            {/* Maintenance Toggle */}
            <div className={`rounded-2xl border p-6 transition-colors ${maintenance ? 'border-red-500/20 bg-red-500/5' : 'border-emerald-500/15 bg-[#0d0d0d]'
                }`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${maintenance ? 'bg-red-500/15' : 'bg-emerald-500/15'
                            }`}>
                            <Power className={`w-5 h-5 ${maintenance ? 'text-red-400' : 'text-emerald-400'}`} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-white">Maintenance Mode</div>
                            <div className="text-xs text-gray-500">
                                {maintenance ? 'App is offline — users see maintenance screen' : 'App is live and serving users'}
                            </div>
                        </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${maintenance ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                </div>

                <Button onClick={handleToggleMaintenance} disabled={toggling}
                    className={`w-full font-bold text-sm py-5 ${maintenance
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}>
                    <Power className="w-4 h-4 mr-2" />
                    {toggling ? 'Toggling…' : maintenance ? 'Bring System Online' : 'Shutdown for Maintenance'}
                </Button>
            </div>

            {/* Health */}
            <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-5 space-y-2">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />Service Health
                </h3>
                <HealthRow label="Backend API (Render)" icon={Server} status={health.backend} />
                <HealthRow label="Database (Supabase)" icon={Database} status={health.supabase} />
                <HealthRow label="Auth System" icon={Shield} status={health.backend} />
            </div>

            {/* Data Exports */}
            <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />Data Exports
                </h3>
                <p className="text-xs text-gray-500 mb-4">Download historical data in CSV format</p>
                <div className="grid sm:grid-cols-2 gap-3">
                    <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-sm justify-start" onClick={() => handleExport('users')}>
                        <Download className="w-4 h-4 mr-2 text-blue-400" />Export All Users
                    </Button>
                    <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-sm justify-start" onClick={() => handleExport('revenue')}>
                        <Download className="w-4 h-4 mr-2 text-emerald-400" />Export Revenue Data
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SystemPage;
