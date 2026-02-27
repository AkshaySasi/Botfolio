import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, User, Crown, Mail, Code, Copy, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API_URL = `${BACKEND_BASE}/api`;
const V1_URL = `${BACKEND_BASE}/v1`;

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getTierBadgeColor = (tier) => {
    if (tier === 'creator') return 'from-emerald-500 to-lime-500';
    if (tier === 'growth') return 'from-purple-500 to-pink-500';
    return 'from-gray-500 to-gray-600';
  };

  const [apiStatus, setApiStatus] = useState({ has_key: false, created_at: null });
  const [newKey, setNewKey] = useState(null);
  const [loadingKey, setLoadingKey] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchApiStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${V1_URL}/settings/api-key-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setApiStatus(res.data);
      } catch (err) {
        console.error("Failed to fetch API key status", err);
      }
    };
    if (user && user.subscription_tier === 'growth') {
      fetchApiStatus();
    }
  }, [user]);

  const generateApiKey = async () => {
    if (!window.confirm("Are you sure you want to generate a new API key? This will immediately invalidate your existing key (if any).")) return;

    setLoadingKey(true);
    try {
      const token = localStorage.getItem('token');
      const targetUrl = `${V1_URL}/settings/generate-key`;
      console.log(`Generating API key at: ${targetUrl}`);

      const res = await axios.post(targetUrl, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewKey(res.data.api_key);
      setApiStatus({ has_key: true, created_at: new Date().toISOString() });
      toast.success("API key successfully generated!");
    } catch (err) {
      console.error("API Key Gen Error:", err);
      const detail = err.response?.data?.detail || err.message || "Failed to generate key";
      toast.error(detail);
    } finally {
      setLoadingKey(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("API key copied to clipboard");
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
            <img src="/assets/botfolio-logo-bg.png" alt="Botfolio" className="w-10 h-10" />
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
                {user?.subscription_tier === 'creator' && 'Limited to 1 portfolio with extra benefits'}
                {user?.subscription_tier === 'growth' && 'Up to 3 portfolios & API Access'}
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
                {user?.subscription_tier === 'free' ? '1' : user?.subscription_tier === 'creator' ? '1' : '3'}
              </div>
              <div className="text-sm text-gray-400">Portfolio Limit</div>
            </div>
          </div>
        </div>

        {/* Developer API Section */}
        <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Code className="w-6 h-6 text-blue-400" />
              Developer API Access
            </h2>
            {user?.subscription_tier === 'growth' && (
              <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500 text-blue-400 text-sm font-semibold">Active</span>
            )}
          </div>

          <p className="text-gray-400 mb-6">Integrate your Botfolio AI directly into your own applications, websites, and portfolios using the developer API.</p>

          {user?.subscription_tier !== 'growth' ? (
            <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center z-10 transition-all">
                <Crown className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">Growth Plan Required</h3>
                <p className="text-gray-300 text-sm mb-4">Upgrade to generate developer API keys.</p>
                <Button onClick={() => navigate('/pricing')} className="bg-purple-600 hover:bg-purple-700">
                  View Plans
                </Button>
              </div>
              {/* Blurred mockup background */}
              <div className="opacity-30 blur-sm pointer-events-none">
                <div className="flex gap-4">
                  <div className="h-10 w-full bg-gray-800 rounded-lg flex items-center px-4 font-mono text-gray-500">sk_live_...</div>
                  <Button disabled className="w-32">Generate Key</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {newKey ? (
                <div className="p-4 border border-emerald-500/30 bg-emerald-500/10 rounded-xl relative">
                  <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Key Generated Successfully
                  </h3>
                  <p className="text-sm text-gray-300 mb-4">Please copy this key now. For your security, it will never be displayed again.</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-black border border-gray-700 px-4 py-3 rounded-lg flex-1 text-emerald-300 font-mono tracking-wider break-all">
                      {newKey}
                    </code>
                    <Button
                      onClick={handleCopy}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 px-6 h-[48px]"
                    >
                      {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#111] border border-gray-800 rounded-xl p-6 flex flex-col items-start gap-4">
                  {apiStatus.has_key ? (
                    <>
                      <div className="flex items-center gap-3 text-emerald-400 font-semibold mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        You have an active API key
                      </div>
                      <p className="text-sm text-gray-400 mb-2">Created on {new Date(apiStatus.created_at).toLocaleDateString()}</p>
                      <Button
                        onClick={generateApiKey}
                        disabled={loadingKey}
                        className="bg-gray-800 hover:bg-red-900/40 hover:text-red-400 hover:border-red-500/50 border border-gray-700 transition-all text-sm"
                      >
                        {loadingKey ? 'Generating...' : 'Roll/Regenerate API Key'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-white font-bold mb-1">No API Key Configured</h3>
                      <p className="text-sm text-gray-400 mb-4">Generate your first token to authenticate API requests to the Botfolio AI system.</p>
                      <Button
                        onClick={generateApiKey}
                        disabled={loadingKey}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {loadingKey ? 'Generating...' : 'Generate API Key'}
                      </Button>
                    </>
                  )}
                </div>
              )}

              <div className="p-5 bg-black border border-gray-800 rounded-xl">
                <h4 className="text-sm text-gray-400 font-bold mb-3 uppercase tracking-wider">Example Usage</h4>
                <pre className="text-xs text-gray-300 overflow-x-auto">
                  {`const response = await fetch('https://api.mybotfolio.com/v1/chat/your-bot-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'sk_live_your_secret_key'
  },
  body: JSON.stringify({ 
    message: "Tell me about your experience with React",
    visitor_name: "Recruiter" 
  })
});`}
                </pre>
              </div>
            </div>
          )}
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
