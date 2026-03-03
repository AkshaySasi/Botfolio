import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import {
    Settings, LogOut, User, Menu, X, Home, Cpu, Star,
    DollarSign, LayoutDashboard, Info, Mail, ChevronRight, Zap,
    Bell, CheckCheck, Clock,
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const NAV_LINKS = [
    { label: 'Home', section: 'home', icon: Home },
    { label: 'How it Works', href: '/how-it-works', icon: Info },
    { label: 'Features', section: 'features', icon: Zap },
    { label: 'Pricing', href: '/pricing', icon: DollarSign },
];

// ─── Notification Panel ───────────────────────────────────────────────────────
function NotificationPanel({ open, onClose }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const panelRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/notifications`);
            setNotifications(res.data || []);
        } catch {
            // silent fail
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) fetchNotifications();
    }, [open, fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open, onClose]);

    const markRead = async (id = null) => {
        try {
            await axios.post(`${API_URL}/api/notifications/mark-read`, {
                notification_id: id
            });
            setNotifications(prev =>
                prev.map(n => id ? (n.id === id ? { ...n, read: true } : n) : { ...n, read: true })
            );
        } catch { /* silent */ }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const formatTime = (iso) => {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    return (
        <>
            {/* Backdrop */}
            {open && (
                <div className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            )}

            {/* Slide-in Panel */}
            <div
                ref={panelRef}
                className={`fixed top-0 right-0 h-full z-[60] w-[340px] max-w-[92vw] bg-[#0d0d0d] border-l border-emerald-500/20 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-500/15 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Notifications</h3>
                            {unreadCount > 0 && (
                                <p className="text-[10px] text-emerald-400">{unreadCount} unread</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markRead(null)}
                                title="Mark all as read"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all font-medium"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                All read
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Notification List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                                <Bell className="w-6 h-6 text-gray-700" />
                            </div>
                            <p className="text-sm font-semibold text-gray-500">No notifications yet</p>
                            <p className="text-xs text-gray-700 mt-1">We'll notify you of updates and news here</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => !n.read && markRead(n.id)}
                                    className={`relative px-5 py-4 transition-all duration-200 group ${!n.read
                                        ? 'bg-emerald-500/5 hover:bg-emerald-500/8 cursor-pointer'
                                        : 'bg-transparent hover:bg-white/3 cursor-default'
                                        }`}
                                >
                                    {/* Unread accent bar */}
                                    {!n.read && (
                                        <span className="absolute left-0 top-3 bottom-3 w-[3px] bg-gradient-to-b from-emerald-500 to-lime-500 rounded-r-full" />
                                    )}

                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.read
                                            ? 'bg-emerald-500/20 border border-emerald-500/30'
                                            : 'bg-white/5 border border-white/10'
                                            }`}>
                                            <Bell className={`w-3.5 h-3.5 ${!n.read ? 'text-emerald-400' : 'text-gray-600'}`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Title */}
                                            <p className={`text-sm font-semibold leading-snug ${!n.read ? 'text-white' : 'text-gray-500'}`}>
                                                {n.title}
                                            </p>
                                            {/* Message */}
                                            <p className={`text-xs mt-1 leading-relaxed ${!n.read ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {n.message}
                                            </p>
                                            {/* Time */}
                                            <div className="flex items-center gap-1 mt-2">
                                                <Clock className="w-3 h-3 text-gray-700" />
                                                <span className="text-[10px] text-gray-700">{formatTime(n.created_at)}</span>
                                                {!n.read && (
                                                    <span className="ml-auto text-[10px] text-emerald-500/70 group-hover:text-emerald-400 transition-colors">
                                                        Tap to mark read
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Unread dot */}
                                        {!n.read && (
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5 animate-pulse" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-white/5 flex-shrink-0">
                    <p className="text-[10px] text-gray-700 text-center">From Botfolio team · {notifications.length} total</p>
                </div>
            </div>
        </>
    );
}

// ─── Bell Button (reused in desktop and mobile) ───────────────────────────────
function BellButton({ onClick, unreadCount }) {
    return (
        <button
            onClick={onClick}
            className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
            title="Notifications"
            aria-label="Notifications"
        >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 text-black text-[9px] font-extrabold flex items-center justify-center leading-none shadow-lg shadow-emerald-500/40">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const drawerRef = useRef(null);

    const isHome = location.pathname === '/';

    // Shadow on scroll
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close drawer on route change
    useEffect(() => { setMenuOpen(false); }, [location.pathname]);

    // Close on Escape
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') { setMenuOpen(false); setNotifOpen(false); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Lock body scroll when drawer open
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    // Fetch unread count (only when logged in)
    useEffect(() => {
        if (!user) return;
        const fetchCount = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/notifications`);
                const data = res.data || [];
                setUnreadCount(data.filter(n => !n.read).length);
            } catch { /* silent */ }
        };
        fetchCount();
        // Re-check every 2 minutes
        const interval = setInterval(fetchCount, 120000);
        return () => clearInterval(interval);
    }, [user]);

    const scrollToSection = (id) => {
        setMenuOpen(false);
        if (!isHome) {
            navigate(`/`);
            setTimeout(() => {
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
            }, 120);
        } else {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleBellClick = () => {
        setMenuOpen(false);
        setNotifOpen(prev => !prev);
    };

    const displayName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Account';

    return (
        <>
            {/* ─── Main Nav Bar ─── */}
            <nav
                className={`border-b border-emerald-500/20 backdrop-blur-md bg-black/60 sticky top-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-lg shadow-black/40' : ''}`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
                        <img
                            src="/assets/botfolio-logo-bg.png"
                            alt="Botfolio"
                            className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-110 transition-transform"
                        />
                        <span
                            className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent"
                            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                        >
                            Botfolio
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map(({ label, section, href, icon: Icon }) =>
                            href ? (
                                <Link
                                    key={label}
                                    to={href}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${location.pathname === href
                                        ? 'text-emerald-400 bg-emerald-500/10'
                                        : 'text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/8'
                                        }`}
                                >
                                    {label}
                                </Link>
                            ) : (
                                <button
                                    key={label}
                                    onClick={() => scrollToSection(section)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/8 transition-all"
                                >
                                    {label}
                                </button>
                            )
                        )}
                        <Link
                            to="/dashboard"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${location.pathname === '/dashboard'
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/8'
                                }`}
                        >
                            Dashboard
                        </Link>

                        {user?.is_admin && (
                            <Link
                                to="/console-admin5353v1"
                                className="text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full bg-emerald-500/10 text-xs font-semibold"
                            >
                                Admin
                            </Link>
                        )}
                    </div>

                    {/* Right Side: Auth + Bell */}
                    <div className="flex items-center gap-2">
                        {user ? (
                            <>
                                {/* Bell icon (desktop) */}
                                <BellButton onClick={handleBellClick} unreadCount={unreadCount} />

                                {/* User chip */}
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <User className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>
                                    <span className="text-sm text-emerald-300 font-medium max-w-[120px] truncate">
                                        {displayName}
                                    </span>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate('/settings')}
                                    className="text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/8 p-2 rounded-xl"
                                    title="Settings"
                                >
                                    <Settings className="w-4.5 h-4.5" />
                                </Button>

                                <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-gray-400 hover:text-red-400 hover:bg-red-500/8 p-2 rounded-xl"
                                            title="Logout"
                                        >
                                            <LogOut className="w-4.5 h-4.5" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-[#0d0d0d] border-emerald-500/20 text-white">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-xl font-bold">Confirm Log Out</AlertDialogTitle>
                                            <AlertDialogDescription className="text-gray-400">
                                                Are you sure you want to log out of your Botfolio account?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="bg-transparent border-white/10 text-gray-400 hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={logout}
                                                className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                                            >
                                                Log Out
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={() => navigate('/login')}
                                    className="text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/8 text-sm px-3 py-2 rounded-xl hidden sm:inline-flex"
                                >
                                    Login
                                </Button>
                                <Button
                                    onClick={() => navigate('/register')}
                                    className="bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-semibold text-sm px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20"
                                >
                                    Get Started
                                </Button>
                            </>
                        )}

                        {/* Hamburger — mobile only */}
                        <button
                            onClick={() => setMenuOpen(true)}
                            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all ml-1"
                            aria-label="Open menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* ─── Notification Panel ─── */}
            <NotificationPanel
                open={notifOpen}
                onClose={() => setNotifOpen(false)}
            />

            {/* ─── Mobile Drawer Overlay ─── */}
            <div
                className={`fixed inset-0 z-[60] md:hidden transition-all duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                aria-hidden={!menuOpen}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => setMenuOpen(false)}
                />

                {/* Drawer Panel */}
                <div
                    ref={drawerRef}
                    className={`absolute right-0 top-0 h-full w-[75vw] max-w-xs bg-[#0d0d0d] border-l border-emerald-500/20 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-500/15">
                        <div className="flex items-center gap-2">
                            <img src="/assets/botfolio-logo-bg.png" alt="Botfolio" className="w-8 h-8" />
                            <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                Botfolio
                            </span>
                        </div>
                        <button
                            onClick={() => setMenuOpen(false)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* User info (if logged in) */}
                    {user && (
                        <div className="mx-4 mt-4 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/15 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                                <User className="w-4.5 h-4.5 text-emerald-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-white truncate">{user.name || 'User'}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                            {/* Bell in mobile drawer */}
                            <BellButton onClick={handleBellClick} unreadCount={unreadCount} />
                        </div>
                    )}

                    {/* Nav Links */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3">
                        <p className="text-xs text-gray-600 uppercase tracking-widest px-2 mb-2 font-medium">Navigation</p>

                        {NAV_LINKS.map(({ label, section, href, icon: Icon }, i) =>
                            href ? (
                                <Link
                                    key={label}
                                    to={href}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all group ${location.pathname === href
                                        ? 'bg-emerald-500/15 text-emerald-400'
                                        : 'text-gray-300 hover:bg-emerald-500/8 hover:text-emerald-400'
                                        }`}
                                    style={{ animationDelay: `${i * 40}ms` }}
                                >
                                    <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                                    <span className="font-medium text-sm">{label}</span>
                                    <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                </Link>
                            ) : (
                                <button
                                    key={label}
                                    onClick={() => scrollToSection(section)}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 text-gray-300 hover:bg-emerald-500/8 hover:text-emerald-400 transition-all group"
                                >
                                    <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                                    <span className="font-medium text-sm">{label}</span>
                                    <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                </button>
                            )
                        )}

                        <Link
                            to="/dashboard"
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all group ${location.pathname === '/dashboard'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'text-gray-300 hover:bg-emerald-500/8 hover:text-emerald-400'
                                }`}
                        >
                            <LayoutDashboard className="w-4.5 h-4.5" />
                            <span className="font-medium text-sm">Dashboard</span>
                            <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </Link>

                        {user?.is_admin && (
                            <Link
                                to="/console-admin5353v1"
                                className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 transition-all"
                            >
                                <Star className="w-4.5 h-4.5" />
                                <span className="font-medium text-sm">Admin Panel</span>
                            </Link>
                        )}

                        <div className="mt-4 pt-4 border-t border-emerald-500/10">
                            <p className="text-xs text-gray-600 uppercase tracking-widest px-2 mb-2 font-medium">Legal</p>
                            <Link to="/privacy" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/8 transition-all text-sm">Privacy Policy</Link>
                            <Link to="/terms" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/8 transition-all text-sm">Terms & Conditions</Link>
                            <Link to="/contact" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/8 transition-all text-sm">Contact Us</Link>
                        </div>
                    </nav>

                    {/* Auth Buttons */}
                    <div className="px-4 pb-6 pt-3 border-t border-emerald-500/10 flex flex-col gap-2">
                        {user ? (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={() => { navigate('/settings'); setMenuOpen(false); }}
                                    className="w-full justify-start gap-3 text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/8 rounded-xl"
                                >
                                    <Settings className="w-4.5 h-4.5" />
                                    Settings
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start gap-3 text-gray-400 hover:text-red-400 hover:bg-red-500/8 rounded-xl"
                                        >
                                            <LogOut className="w-4.5 h-4.5" />
                                            Log Out
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-[#0d0d0d] border-emerald-500/20 text-white mx-4 sm:mx-0">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-xl font-bold">Confirm Log Out</AlertDialogTitle>
                                            <AlertDialogDescription className="text-gray-400">
                                                Are you sure you want to log out?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                            <AlertDialogCancel className="bg-transparent border-white/10 text-gray-400 hover:bg-white/5 hover:text-white m-0">Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => { logout(); setMenuOpen(false); }}
                                                className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white m-0"
                                            >
                                                Log Out
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={() => { navigate('/login'); setMenuOpen(false); }}
                                    className="w-full border border-emerald-500/20 text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/8 rounded-xl"
                                >
                                    Login
                                </Button>
                                <Button
                                    onClick={() => { navigate('/register'); setMenuOpen(false); }}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                                >
                                    Get Started Free
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;
