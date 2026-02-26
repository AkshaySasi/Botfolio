import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdBanner from '@/components/AdBanner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Bot, BarChart, Settings, LogOut, ExternalLink, Trash2, Eye, AlertTriangle, X, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000'}/api`;

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPortfolios();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchPortfolios = async () => {
    try {
      const response = await axios.get(`${API_URL}/portfolios`);
      setPortfolios(response.data);
    } catch (error) {
      toast.error('Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (portfolioId) => {
    try {
      await axios.delete(`${API_URL}/portfolios/${portfolioId}`);
      toast.success('Portfolio deleted');
      setDeleteTarget(null);
      fetchPortfolios();
    } catch (error) {
      toast.error('Failed to delete portfolio');
    }
  };

  const canCreateMore = () => {
    if (!user) return false;
    if (user?.subscription_tier === 'free') return portfolios.length < 1;
    if (user?.subscription_tier === 'creator') return portfolios.length < 1;
    if (user?.subscription_tier === 'growth') return portfolios.length < 3;
    return true; // enterprise
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="dashboard-page">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Guest View */}
        {!user && (
          <div className="text-center py-20">
            <div className="block mx-auto w-32 h-32 mb-8 opacity-90">
              <img src="/assets/botfolio-logo-transparent.png" alt="Botfolio" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Start Your <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">AI Journey</span>
            </h1>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
              You don't have any chatbots created yet. Sign up now to build your first intelligent portfolio bot in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/register')}
                className="px-8 py-6 text-lg bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold"
              >
                Create Your First Chatbot
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="px-8 py-6 text-lg border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                Login to Account
              </Button>
            </div>
          </div>
        )}

        {/* User View */}
        {user && (
          <>
            {/* Header with Usage Meters */}
            <div className="mb-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Manage your botfolios
                  </h1>
                  <p className="text-gray-400 max-w-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Control your AI fleet and track their engagement from one central command center.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  {/* Portfolio Meter */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-w-[160px]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Botfolios</span>
                      <span className="text-xs font-mono text-emerald-400">
                        {portfolios.length} / {user?.subscription_tier === 'free' ? '1' : user?.subscription_tier === 'creator' ? '1' : user?.subscription_tier === 'growth' ? '3' : '∞'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${(portfolios.length / (user?.subscription_tier === 'free' ? 1 : user?.subscription_tier === 'creator' ? 1 : user?.subscription_tier === 'growth' ? 3 : 100)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Monthly Conversations Meter */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-w-[170px]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Monthly Conversations</span>
                      <span className="text-xs font-mono text-emerald-400">
                        {user?.daily_queries_count || 0} / {user?.subscription_tier === 'free' ? '7' : user?.subscription_tier === 'creator' ? '40' : user?.subscription_tier === 'growth' ? '180' : '∞'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-lime-500 transition-all duration-500"
                        style={{ width: `${((user?.daily_queries_count || 0) / (user?.subscription_tier === 'free' ? 7 : user?.subscription_tier === 'creator' ? 40 : user?.subscription_tier === 'growth' ? 180 : 1000)) * 100}%` }}
                      />
                    </div>
                    {user?.bonus_credits > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-emerald-500/60 font-medium">BONUS CONVERSATIONS</span>
                        <span className="text-[10px] text-emerald-400 font-bold">{user.bonus_credits} left</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Upgrade Banner for Free Tier */}
            {user?.subscription_tier === 'free' && (
              <div className="mb-8 p-6 bg-gradient-to-r from-emerald-500/20 via-lime-500/20 to-emerald-500/20 border border-emerald-500/30 rounded-xl animate-pulse-slow">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">🚀 Upgrade to do more</h3>
                    <p className="text-gray-300">Get up to 40 AI conversations per month with the Creator plan</p>
                  </div>
                  <Button
                    onClick={() => navigate('/pricing')}
                    className="bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-semibold whitespace-nowrap"
                  >
                    View Plans →
                  </Button>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
              {canCreateMore() ? (
                <Button
                  onClick={() => navigate('/builder')}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold"
                  data-testid="create-portfolio-btn"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Create New Chatbot
                </Button>
              ) : (
                <div className="flex-1 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-between gap-4">
                  <p className="text-yellow-400 text-sm">Chatbot limit reached</p>
                  <Button size="sm" onClick={() => navigate('/pricing')} className="bg-yellow-500 text-black font-bold h-8">
                    Upgrade
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => navigate('/checkout?plan=credits_30')}
                className="w-full sm:w-auto border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-medium"
              >
                <Zap className="mr-2 h-4 w-4" />
                Get Extra Conversations
              </Button>
            </div>

            {/* Portfolios Grid */}
            {loading ? (
              <div className="text-center text-gray-400 py-12">Loading chatbots...</div>
            ) : portfolios.length === 0 ? (
              <div className="text-center py-16">
                <div className="block mx-auto w-24 h-24 mb-6 opacity-80">
                  <img src="/assets/botfolio-logo-transparent.png" alt="Botfolio" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No chatbots yet</h3>
                <p className="text-gray-500 mb-6">Create your first AI-powered chatbot</p>
                <Button
                  onClick={() => navigate('/builder')}
                  className="bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Create Chatbot
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {portfolios.map((portfolio, index) => (
                  <div
                    key={portfolio.id}
                    className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                    data-testid={`portfolio-card-${portfolio.id}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center p-2">
                          <img src="/assets/botfolio-logo-transparent.png" alt="Bot" className="w-full h-full object-contain brightness-0 invert" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{portfolio.name}</h3>
                          <p className="text-sm text-gray-400">/p/{portfolio.custom_url}</p>
                        </div>
                      </div>
                      {portfolio.is_active ? (
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Active</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">Inactive</span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-6">
                      <Button
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/p/${portfolio.custom_url}`);
                          toast.success('Public link copied to clipboard!');
                        }}
                        className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                        data-testid={`view-portfolio-${portfolio.id}`}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => window.open(`/p/${portfolio.custom_url}`, '_blank')}
                        className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/analytics/${portfolio.id}`)}
                        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                      >
                        <BarChart className="w-4 h-4 mr-1" />
                        Analytics
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget({ id: portfolio.id, name: portfolio.name })}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        data-testid={`delete-portfolio-${portfolio.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Ad Banner */}
            <AdBanner slotId="1234567890" />
          </>
        )}
      </div>

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-red-500/30 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Portfolio?</h3>
                <p className="text-gray-500 text-sm">This cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 text-sm">
              You're about to permanently delete <strong className="text-white">{deleteTarget.name}</strong>.
              All associated files and chatbot data will be removed.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setDeleteTarget(null)}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteTarget.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Request Limit Modal (Free Tier) ─── */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-emerald-500/30 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
            <button onClick={() => setShowLimitModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Monthly Limit Reached</h3>
              <p className="text-gray-400 text-sm">You've used all 7 free AI conversations for this month. Upgrade to get more monthly conversations.</p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => { setShowLimitModal(false); navigate('/pricing'); }}
                className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold"
              >
                <Zap className="w-4 h-4 mr-2" /> Upgrade Now
              </Button>
              <Button
                onClick={() => setShowLimitModal(false)}
                variant="outline"
                className="w-full border-gray-700 text-gray-400 hover:bg-gray-800"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;