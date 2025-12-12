import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, User, Crown, Mail } from 'lucide-react';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getTierBadgeColor = (tier) => {
    if (tier === 'pro') return 'from-emerald-500 to-lime-500';
    if (tier === 'enterprise') return 'from-purple-500 to-pink-500';
    return 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="settings-page">
      <nav className="border-b border-emerald-500/20 backdrop-blur-sm bg-black/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/assets/botfolio-logo-transparent.png" alt="Botfolio" className="w-10 h-10" />
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Botfolio</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Settings</h1>
          <p className="text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>Manage your account and subscription</p>
        </div>

        {/* Profile Section */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <User className="w-6 h-6 text-emerald-400" />
            Profile Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Name</label>
              <div className="text-white text-lg">{user?.name}</div>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Email</label>
              <div className="text-white text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-gray-400" />
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-400" />
            Subscription
          </h2>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${getTierBadgeColor(user?.subscription_tier).split(' ')[1]} 0%, ${getTierBadgeColor(user?.subscription_tier).split(' ')[3]} 100%)` }}>
                <Crown className="w-5 h-5 text-black" />
                <span className="font-bold text-black uppercase">{user?.subscription_tier || 'FREE'} PLAN</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                {user?.subscription_tier === 'free' && 'Limited to 1 portfolio'}
                {user?.subscription_tier === 'pro' && 'Up to 5 portfolios'}
                {user?.subscription_tier === 'enterprise' && 'Unlimited portfolios'}
              </p>
            </div>
            {user?.subscription_tier === 'free' && (
              <Button onClick={() => navigate('/#pricing')} className="bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold">
                Upgrade Plan
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-700">
            <div>
              <div className="text-2xl font-bold text-white">{user?.portfolios_count || 0}</div>
              <div className="text-sm text-gray-400">Active Portfolios</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {user?.subscription_tier === 'free' ? '1' : user?.subscription_tier === 'pro' ? '5' : '∞'}
              </div>
              <div className="text-sm text-gray-400">Portfolio Limit</div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Danger Zone</h2>
          <p className="text-gray-400 mb-4">Permanently delete your account and all associated data</p>
          <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
