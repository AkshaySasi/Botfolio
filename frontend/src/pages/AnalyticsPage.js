import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, MessageSquare, Eye, TrendingUp, Calendar } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AnalyticsPage = () => {
  const { portfolioId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [portfolioId]);

  const fetchData = async () => {
    try {
      const [analyticsRes, portfolioRes] = await Promise.all([
        axios.get(`${API_URL}/portfolios/${portfolioId}/analytics`),
        axios.get(`${API_URL}/portfolios/${portfolioId}`)
      ]);
      setAnalytics(analyticsRes.data);
      setPortfolio(portfolioRes.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-emerald-400 text-xl">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="analytics-page">
      <nav className="border-b border-emerald-500/20 backdrop-blur-sm bg-black/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/assets/botfolio-logo-transparent.png" alt="Botfolio" className="w-10 h-10" />
            <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Botfolio</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {portfolio?.name} - Analytics
          </h1>
          <p className="text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
            Track engagement and performance of your portfolio chatbot
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="w-8 h-8 text-blue-400" />
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{analytics?.total_chats || 0}</div>
            <div className="text-sm text-gray-400">Total Conversations</div>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="w-8 h-8 text-emerald-400" />
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{analytics?.total_messages || 0}</div>
            <div className="text-sm text-gray-400">Total Messages</div>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-8 h-8 text-purple-400" />
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">-</div>
            <div className="text-sm text-gray-400">Portfolio Views</div>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-yellow-400" />
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{portfolio?.created_at ? new Date(portfolio.created_at).toLocaleDateString() : '-'}</div>
            <div className="text-sm text-gray-400">Created On</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Engagement Overview</h2>
          <div className="text-center py-12">
            <p className="text-gray-400">Detailed analytics coming soon...</p>
            <p className="text-gray-500 text-sm mt-2">Track visitor behavior, popular questions, and engagement trends</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
