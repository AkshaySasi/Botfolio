import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Bot, BarChart, Settings, LogOut, ExternalLink, Trash2 } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000'}/api`;

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolios();
  }, []);

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
    if (!window.confirm('Are you sure you want to delete this portfolio?')) return;

    try {
      await axios.delete(`${API_URL}/portfolios/${portfolioId}`);
      toast.success('Portfolio deleted');
      fetchPortfolios();
    } catch (error) {
      toast.error('Failed to delete portfolio');
    }
  };

  const canCreateMore = () => {
    if (user?.subscription_tier === 'free') return portfolios.length < 1;
    if (user?.subscription_tier === 'pro') return portfolios.length < 5;
    return true; // enterprise
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="dashboard-page">
      {/* Navbar */}
      <nav className="border-b border-emerald-500/20 backdrop-blur-sm bg-black/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="https://customer-assets.emergentagent.com/job_91f5d044-998c-47b3-970c-f12d04c4f8fd/artifacts/ne4azb2e_Botiy.png" alt="Botiee" className="w-10 h-10" />
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Botiee</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} className="text-gray-300 hover:text-emerald-400">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-300 hover:text-red-400">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
            Your AI Portfolios
          </h1>
          <p className="text-gray-400" style={{fontFamily: 'Inter, sans-serif'}}>
            Manage your portfolio chatbots and track their performance
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <span className="text-emerald-400 font-semibold">{user?.subscription_tier?.toUpperCase()} PLAN</span>
            </div>
            <div className="text-gray-400">
              {portfolios.length} / {user?.subscription_tier === 'free' ? '1' : user?.subscription_tier === 'pro' ? '5' : '∞'} portfolios
            </div>
          </div>
        </div>

        {/* Create New Button */}
        {canCreateMore() ? (
          <Button
            onClick={() => navigate('/builder')}
            className="mb-8 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold"
            data-testid="create-portfolio-btn"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create New Portfolio
          </Button>
        ) : (
          <div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-yellow-400 mb-3">You've reached your portfolio limit</p>
            <Button onClick={() => navigate('/#pricing')} className="bg-gradient-to-r from-emerald-500 to-lime-500 text-black">
              Upgrade Plan
            </Button>
          </div>
        )}

        {/* Portfolios Grid */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading portfolios...</div>
        ) : portfolios.length === 0 ? (
          <div className="text-center py-16">
            <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No portfolios yet</h3>
            <p className="text-gray-500 mb-6">Create your first AI-powered portfolio</p>
            <Button
              onClick={() => navigate('/builder')}
              className="bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Portfolio
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300"
                data-testid={`portfolio-card-${portfolio.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-black" />
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
                    onClick={() => window.open(`/p/${portfolio.custom_url}`, '_blank')}
                    className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                    data-testid={`view-portfolio-${portfolio.id}`}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
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
                    onClick={() => handleDelete(portfolio.id)}
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
      </div>
    </div>
  );
};

export default DashboardPage;