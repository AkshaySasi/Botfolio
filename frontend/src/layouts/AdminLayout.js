import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import {
    LayoutDashboard, Users, MessageSquare, Ticket, Bell, LogOut,
    Shield, Server, Menu, X, ChevronRight, Activity,
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const AdminLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [systemOnline, setSystemOnline] = useState(true);

    useEffect(() => {
        axios.get(`${API_URL}/api/admin/maintenance`).then(r => {
            setSystemOnline(!r.data.maintenance_mode);
        }).catch(() => { });
    }, []);

    const handleLogout = () => { logout(); navigate('/login'); };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/console-admin5353v1/dashboard' },
        { icon: Users, label: 'Users', path: '/console-admin5353v1/users' },
        { icon: Activity, label: 'Revenue', path: '/console-admin5353v1/revenue' },
        { icon: Ticket, label: 'Coupons', path: '/console-admin5353v1/coupons' },
        { icon: Bell, label: 'Notifications', path: '/console-admin5353v1/notifications' },
        { icon: MessageSquare, label: 'Messages', path: '/console-admin5353v1/messages' },
        { icon: Server, label: 'System', path: '/console-admin5353v1/system' },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:sticky top-0 h-screen w-64 z-50 transition-transform duration-300
        bg-[#0d0d0d] border-r border-emerald-500/10 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <img
                            src="/assets/botfolio-logo-transparent.png"
                            alt="Botfolio"
                            className="w-9 h-9 object-contain"
                        />
                        <div>
                            <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent block leading-tight"
                                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Console</span>
                            <span className="text-[10px] text-gray-600 uppercase tracking-widest">Admin Panel</span>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* System status */}
                <div className="mx-4 mb-4 px-3 py-2 rounded-lg bg-black/50 border border-emerald-500/10 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${systemOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-xs text-gray-400">{systemOnline ? 'System Online' : 'Maintenance Mode'}</span>
                </div>

                <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all group ${isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'text-gray-500 hover:text-white hover:bg-white/[0.03]'
                                }`
                            }
                        >
                            <item.icon className="w-[18px] h-[18px]" />
                            <span className="font-medium">{item.label}</span>
                            <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5 space-y-2">
                    <Button
                        variant="ghost" size="sm"
                        className="w-full justify-start text-gray-500 hover:text-white hover:bg-white/5 text-sm"
                        onClick={() => navigate('/dashboard')}
                    >
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Back to App
                    </Button>
                    <Button
                        variant="ghost" size="sm"
                        className="w-full justify-start text-red-500/70 hover:text-red-400 hover:bg-red-900/10 text-sm"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-4 lg:px-8 py-3 flex items-center justify-between">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white">
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="hidden lg:block" />
                    <div className="flex items-center gap-3">
                        <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${systemOnline
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${systemOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {systemOnline ? 'Live' : 'Maintenance'}
                        </div>
                    </div>
                </header>

                <div className="p-4 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
