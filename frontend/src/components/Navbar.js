import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Settings, LogOut } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isHome = location.pathname === '/';

    const scrollToSection = (id) => {
        if (!isHome) {
            navigate(`/#${id}`);
            // Small timeout to allow navigation to complete before scrolling
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            const element = document.getElementById(id);
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav className="border-b border-emerald-500/20 backdrop-blur-sm bg-black/50 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/assets/botfolio-logo-transparent.png" alt="Botiee" className="w-10 h-10 object-contain" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Botfolio</span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center gap-6">
                        <button onClick={() => scrollToSection('home')} className="text-gray-300 hover:text-emerald-400 transition-colors bg-transparent border-none cursor-pointer text-sm font-medium">Home</button>
                        <button onClick={() => scrollToSection('vision')} className="text-gray-300 hover:text-emerald-400 transition-colors bg-transparent border-none cursor-pointer text-sm font-medium">Vision</button>
                        <button onClick={() => scrollToSection('features')} className="text-gray-300 hover:text-emerald-400 transition-colors bg-transparent border-none cursor-pointer text-sm font-medium">Features</button>
                        <button onClick={() => scrollToSection('pricing')} className="text-gray-300 hover:text-emerald-400 transition-colors bg-transparent border-none cursor-pointer text-sm font-medium">Pricing</button>
                        <Link to="/dashboard" className={`text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'text-emerald-400' : 'text-gray-300 hover:text-emerald-400'}`}>
                            Dashboard
                        </Link>
                    </div>

                    {/* Admin Link */}
                    {user?.is_admin && (
                        <Link to="/admin" className="hidden md:block text-emerald-400 hover:text-emerald-300 font-semibold border border-emerald-500/30 px-3 py-1 rounded-full bg-emerald-500/10 text-xs">
                            Admin
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <span className="text-gray-400 text-sm hidden lg:block">{user.email}</span>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} className="text-gray-300 hover:text-emerald-400">
                                <Settings className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-300 hover:text-red-400">
                                <LogOut className="w-5 h-5" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => navigate('/login')} className="text-gray-300 hover:text-emerald-400">
                                Login
                            </Button>
                            <Button onClick={() => navigate('/register')} className="bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-semibold">
                                Get Started
                            </Button>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button className="md:hidden text-gray-300 ml-4" onClick={() => document.getElementById('mobile-menu').classList.toggle('hidden')}>
                    <Settings className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <div id="mobile-menu" className="hidden md:hidden absolute top-full left-0 w-full bg-[#0a0a0a] border-b border-emerald-500/20 p-4 flex flex-col gap-4">
                <button onClick={() => scrollToSection('home')} className="text-gray-300 hover:text-emerald-400 text-left">Home</button>
                <button onClick={() => scrollToSection('features')} className="text-gray-300 hover:text-emerald-400 text-left">Features</button>
                <button onClick={() => scrollToSection('pricing')} className="text-gray-300 hover:text-emerald-400 text-left">Pricing</button>
                <Link to="/dashboard" className="text-gray-300 hover:text-emerald-400">Dashboard</Link>
                {user?.is_admin && <Link to="/admin" className="text-emerald-400">Admin Panel</Link>}
            </div>
        </nav>
    );
};

export default Navbar;
