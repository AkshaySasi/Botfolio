import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    Ticket,
    Bell,
    LogOut,
    Shield
} from 'lucide-react';

const AdminLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: MessageSquare, label: 'Messages', path: '/admin/messages' },
        { icon: Ticket, label: 'Coupons', path: '/admin/coupons' },
        { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
    ];

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-800 bg-black fixed h-full z-10">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-8">
                        <Shield className="w-8 h-8 text-emerald-500" />
                        <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
                            Botfolio Admin
                        </span>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-900'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="absolute bottom-0 w-full p-6 border-t border-gray-800">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/10"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                        <p className="text-gray-400">Manage users, payments, coupons, and notifications</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            className="border-gray-700 text-gray-300 hover:text-white"
                            onClick={() => navigate('/dashboard')}
                        >
                            Back to App
                        </Button>
                    </div>
                </header>

                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
