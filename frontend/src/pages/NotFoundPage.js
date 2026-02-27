import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFoundPage = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 text-center">
            {/* Glow blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-md mx-auto">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-10">
                    <img src="/assets/botfolio-logo-bg.png" alt="Botfolio" className="w-12 h-12" />
                    <span
                        className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent"
                        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                    >
                        Botfolio
                    </span>
                </div>

                {/* 404 */}
                <div
                    className="text-[120px] font-bold leading-none bg-gradient-to-b from-emerald-400/40 to-transparent bg-clip-text text-transparent mb-4 select-none"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                    404
                </div>

                <Bot className="w-12 h-12 text-emerald-500/40 mx-auto mb-6" />

                <h1
                    className="text-2xl sm:text-3xl font-bold text-white mb-3"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                    Page not found
                </h1>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    This page doesn't exist or may have been moved. Let's get you back on track.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                    <Button
                        asChild
                        className="bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold"
                    >
                        <Link to="/">
                            <Home className="w-4 h-4 mr-2" />
                            Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
