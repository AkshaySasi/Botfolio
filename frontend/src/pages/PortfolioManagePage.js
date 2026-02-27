import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowLeft, Upload, BarChart, RefreshCw, FileText,
  MessageSquare, Eye, Edit3, Save, Globe, Check, Shield, Info
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000'}/api`;

const PortfolioManagePage = () => {
  const { portfolioId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState({ resume: null, details: null });

  // Edit tab state
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editTone, setEditTone] = useState('professional');
  const [editContextAware, setEditContextAware] = useState(true);
  const [editDirty, setEditDirty] = useState(false);

  useEffect(() => { fetchData(); }, [portfolioId]);

  const fetchData = async () => {
    try {
      const [portfolioRes, analyticsRes] = await Promise.all([
        axios.get(`${API_URL}/portfolios/${portfolioId}`),
        axios.get(`${API_URL}/portfolios/${portfolioId}/analytics`),
      ]);
      setPortfolio(portfolioRes.data);
      setAnalytics(analyticsRes.data);
      setEditName(portfolioRes.data.name || '');
      setEditUrl(portfolioRes.data.custom_url || '');
      setEditTone(portfolioRes.data.chatbot_config?.tone || 'professional');
      setEditContextAware(portfolioRes.data.chatbot_config?.context_aware !== false); // default true
    } catch (error) {
      toast.error('Failed to load portfolio data');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) setFiles({ ...files, [type]: file });
  };

  // ── Save name / URL ──────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editName.trim()) { toast.error('Portfolio name cannot be empty'); return; }
    if (!editUrl.trim()) { toast.error('Portfolio URL cannot be empty'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', editName.trim());
      fd.append('custom_url', editUrl.trim().toLowerCase().replace(/\s+/g, '-'));
      fd.append('tone', editTone);
      fd.append('context_aware', editContextAware);
      await axios.patch(`${API_URL}/portfolios/${portfolioId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Portfolio updated successfully!');
      setEditDirty(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update portfolio');
    } finally {
      setSaving(false);
    }
  };

  // ── Retrain chatbot ──────────────────────────────────────────────────
  const handleUpdateFiles = async () => {
    if (!files.resume && !files.details) {
      toast.error('Please select at least one file to update');
      return;
    }
    setUpdating(true);
    const formData = new FormData();
    if (files.resume) formData.append('resume', files.resume);
    if (files.details) formData.append('details', files.details);
    try {
      await axios.post(`${API_URL}/portfolios/${portfolioId}/update-files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Files updated and chatbot retrained successfully!');
      setFiles({ resume: null, details: null });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update files');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-emerald-400 text-xl animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="portfolio-manage-page">
      {/* Navbar */}
      <nav className="border-b border-emerald-500/20 backdrop-blur-sm bg-black/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/assets/botfolio-logo-bg.png" alt="Botfolio" className="w-10 h-10" />
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Botfolio</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {portfolio?.name}
            </h1>
            <p className="text-gray-400 text-sm">
              <span className="text-emerald-400 font-mono">/p/{portfolio?.custom_url}</span>
              {' · '}Manage your portfolio chatbot
            </p>
          </div>
          <Button
            onClick={() => window.open(`/p/${portfolio?.custom_url}`, '_blank')}
            className="bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold w-full sm:w-auto"
          >
            <Eye className="mr-2 h-5 w-5" />
            View Live
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/50 border border-emerald-500/20 mb-6">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-lime-500 data-[state=active]:text-black text-xs sm:text-sm">
              <BarChart className="w-4 h-4 mr-1 sm:mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="edit" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-lime-500 data-[state=active]:text-black text-xs sm:text-sm">
              <Edit3 className="w-4 h-4 mr-1 sm:mr-2" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="update" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-lime-500 data-[state=active]:text-black text-xs sm:text-sm">
              <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
              Retrain
            </TabsTrigger>
          </TabsList>

          {/* ── Analytics Tab ── */}
          <TabsContent value="analytics">
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
                <MessageSquare className="w-8 h-8 text-blue-400 mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{analytics?.total_chats || 0}</div>
                <div className="text-sm text-gray-400">Total Conversations</div>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                <MessageSquare className="w-8 h-8 text-emerald-400 mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{analytics?.total_messages || 0}</div>
                <div className="text-sm text-gray-400">Total Messages</div>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                <Eye className="w-8 h-8 text-purple-400 mb-3" />
                <div className="text-3xl font-bold text-white mb-1">—</div>
                <div className="text-sm text-gray-400">Portfolio Views</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-8 text-center py-16">
              <BarChart className="w-14 h-14 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400">Detailed analytics coming soon</p>
              <p className="text-gray-600 text-sm mt-2">Track visitor behavior, popular questions, and engagement trends</p>
            </div>
          </TabsContent>

          {/* ── Edit Tab ── */}
          <TabsContent value="edit">
            <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-6 sm:p-8 max-w-xl">
              <h3 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Edit Portfolio</h3>
              <p className="text-gray-400 text-sm mb-6">Change your portfolio's display name or public link.</p>

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <Label htmlFor="edit-name" className="text-gray-300 mb-2 block">Portfolio Name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={e => { setEditName(e.target.value); setEditDirty(true); }}
                    placeholder="e.g. John Doe"
                    className="bg-black/50 border-emerald-500/30 text-white focus:border-emerald-500"
                  />
                </div>

                {/* Custom URL */}
                <div>
                  <Label htmlFor="edit-url" className="text-gray-300 mb-2 block">Portfolio URL</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 px-3 py-2 rounded-lg bg-black/60 border border-emerald-500/20 text-gray-500 text-sm font-mono">
                      /p/
                    </div>
                    <Input
                      id="edit-url"
                      value={editUrl}
                      onChange={e => { setEditUrl(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setEditDirty(true); }}
                      placeholder="your-name"
                      className="bg-black/50 border-emerald-500/30 text-white focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <p className="text-gray-600 text-xs mt-1.5">Only lowercase letters, numbers, and hyphens. 3–40 characters.</p>
                </div>

                {/* Tone */}
                <div>
                  <Label className="text-gray-300 mb-3 block">Chatbot Tone</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
                    {[
                      { id: 'professional', label: 'Professional' },
                      { id: 'confident', label: 'Confident' },
                      { id: 'friendly', label: 'Friendly' },
                      { id: 'technical', label: 'Technical' },
                      { id: 'executive', label: 'Executive' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => { setEditTone(t.id); setEditDirty(true); }}
                        className={`p-2 rounded-lg border text-center transition-all ${editTone === t.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-white/10 bg-black/30 text-gray-400 hover:border-white/20'
                          }`}
                      >
                        <div className="text-[10px] font-bold">{t.label}</div>
                      </button>
                    ))}
                  </div>

                  {/* Context Aware Toggle */}
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-white">Smart Guardrails</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-3.5 h-3.5 text-gray-500 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>Keep AI focused on your professional profile only.</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={editContextAware}
                      onCheckedChange={(v) => { setEditContextAware(v); setEditDirty(true); }}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>

                {/* Live preview */}
                <div className="flex items-center gap-2 px-4 py-3 bg-black/40 rounded-xl border border-emerald-500/15">
                  <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-emerald-400 text-sm font-mono truncate">
                    {window.location.origin}/p/{editUrl || portfolio?.custom_url}
                  </span>
                </div>

                <Button
                  onClick={handleSaveEdit}
                  disabled={saving || !editDirty}
                  className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold py-5"
                >
                  {saving ? (
                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" />Save Changes</>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Retrain Tab ── */}
          <TabsContent value="update">
            <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Retrain Chatbot</h3>
              <p className="text-gray-400 text-sm mb-6">Upload an updated resume or details file to retrain your AI chatbot with fresh information.</p>

              <div className="space-y-6">
                {/* Resume upload */}
                <div>
                  <Label htmlFor="resume-update" className="text-gray-300 mb-2 block">New Resume (PDF)</Label>
                  <input id="resume-update" type="file" accept=".pdf" onChange={e => handleFileChange(e, 'resume')} className="hidden" data-testid="resume-update-input" />
                  <label htmlFor="resume-update" className={`flex items-center justify-center gap-3 p-6 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${files.resume ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-emerald-500/25 hover:border-emerald-500/45 bg-black/30'}`}>
                    {files.resume ? <Check className="w-5 h-5 text-emerald-400" /> : <Upload className="w-5 h-5 text-emerald-400" />}
                    <span className="text-gray-300 text-sm">{files.resume ? files.resume.name : 'Click to upload new resume'}</span>
                  </label>
                </div>

                {/* Details upload */}
                <div>
                  <Label htmlFor="details-update" className="text-gray-300 mb-2 block">Career Details (TXT)</Label>
                  <input id="details-update" type="file" accept=".txt" onChange={e => handleFileChange(e, 'details')} className="hidden" data-testid="details-update-input" />
                  <label htmlFor="details-update" className={`flex items-center justify-center gap-3 p-6 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${files.details ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-emerald-500/25 hover:border-emerald-500/45 bg-black/30'}`}>
                    {files.details ? <Check className="w-5 h-5 text-emerald-400" /> : <FileText className="w-5 h-5 text-emerald-400" />}
                    <span className="text-gray-300 text-sm">{files.details ? files.details.name : 'Click to upload career details'}</span>
                  </label>
                </div>

                <Button
                  onClick={handleUpdateFiles}
                  disabled={updating || (!files.resume && !files.details)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold py-6"
                  data-testid="update-files-btn"
                >
                  {updating ? (
                    <><RefreshCw className="mr-2 h-5 w-5 animate-spin" />Retraining Chatbot…</>
                  ) : (
                    <><RefreshCw className="mr-2 h-5 w-5" />Update &amp; Retrain Chatbot</>
                  )}
                </Button>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    <strong>Note:</strong> Retraining replaces the chatbot's knowledge with your new files. This usually takes 30–60 seconds.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PortfolioManagePage;
