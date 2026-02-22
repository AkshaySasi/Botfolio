import React from 'react';
import { Wrench } from 'lucide-react';

const MaintenancePage = () => (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 text-center">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md mx-auto">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-10">
                <img src="/assets/botfolio-logo-transparent.png" alt="Botfolio" className="w-12 h-12" />
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Botfolio</span>
            </div>

            {/* Animated icon */}
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-8">
                <Wrench className="w-10 h-10 text-amber-400 animate-pulse" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Under Maintenance
            </h1>
            <p className="text-gray-500 leading-relaxed mb-6">
                We're making some improvements to give you a better experience.
                We'll be back online shortly!
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Maintenance in progress
            </div>
        </div>
    </div>
);

export default MaintenancePage;
