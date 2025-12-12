import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Upload, BarChart, RefreshCw, FileText, MessageSquare, Eye } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000'}/api`;

const PortfolioManagePage = () => {
  const { portfolioId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [files, setFiles] = useState({
    resume: null,
    details: null,
  });

  useEffect(() => {
    fetchData();
  }, [portfolioId]);

  const fetchData = async () => {
    try {
      const [portfolioRes, analyticsRes] = await Promise.all([
        axios.get(`${API_URL}/portfolios/${portfolioId}`),
        axios.get(`${API_URL}/portfolios/${portfolioId}/analytics`)
      ]);
      setPortfolio(portfolioRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      toast.error('Failed to load portfolio data');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [type]: file });
    }
  };

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
        headers: { 'Content-Type': 'multipart/form-data' }
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
        <div className="text-emerald-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="portfolio-manage-page">
      {/* Navbar */}
      <nav className="border-b border-emerald-500/20 backdrop-blur-sm bg-black/50 sticky top-0 z-50">
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

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {portfolio?.name}
            </h1>
            <p className="text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              Manage your portfolio chatbot and analytics
            </p>
          </div>
          <Button
            onClick={() => window.open(`/p/${portfolio?.custom_url}`, '_blank')}
            className="bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold"
          >
            <Eye className="mr-2 h-5 w-5" />
            View Portfolio
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/50 border border-emerald-500/20">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-lime-500 data-[state=active]:text-black">
              <BarChart className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="update" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-lime-500 data-[state=active]:text-black">
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Files
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
                <div className="flex items-center justify-between mb-4">
                  <MessageSquare className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{analytics?.total_chats || 0}</div>
                <div className="text-sm text-gray-400">Total Conversations</div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                <div className="flex items-center justify-between mb-4">
                  <MessageSquare className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{analytics?.total_messages || 0}</div>
                <div className="text-sm text-gray-400">Total Messages</div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <Eye className="w-8 h-8 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">Coming Soon</div>
                <div className="text-sm text-gray-400">Portfolio Views</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Engagement Overview</h3>
              <div className="text-center py-12">
                <BarChart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Detailed analytics and insights coming soon...</p>
                <p className="text-gray-500 text-sm mt-2">Track visitor behavior, popular questions, and engagement trends</p>
              </div>
            </div>
          </TabsContent>

          {/* Update Files Tab */}
          <TabsContent value="update" className="mt-6">
            <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Update Portfolio Files</h3>
                <p className="text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Upload new resume or details to retrain your AI chatbot with updated information
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="resume-update" className="text-gray-300 mb-2 block">Update Resume (PDF)</Label>
                  <div className="relative">
                    <input
                      id="resume-update"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, 'resume')}
                      className="hidden"
                      data-testid="resume-update-input"
                    />
                    <label
                      htmlFor="resume-update"
                      className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-emerald-500/30 rounded-xl hover:border-emerald-500/50 transition-colors cursor-pointer bg-black/30"
                    >
                      <Upload className="w-6 h-6 text-emerald-400" />
                      <span className="text-gray-300">
                        {files.resume ? files.resume.name : 'Click to upload new resume'}
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="details-update" className="text-gray-300 mb-2 block">Update Career Details (TXT)</Label>
                  <div className="relative">
                    <input
                      id="details-update"
                      type="file"
                      accept=".txt"
                      onChange={(e) => handleFileChange(e, 'details')}
                      className="hidden"
                      data-testid="details-update-input"
                    />
                    <label
                      htmlFor="details-update"
                      className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-emerald-500/30 rounded-xl hover:border-emerald-500/50 transition-colors cursor-pointer bg-black/30"
                    >
                      <FileText className="w-6 h-6 text-emerald-400" />
                      <span className="text-gray-300">
                        {files.details ? files.details.name : 'Click to upload new details'}
                      </span>
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleUpdateFiles}
                  disabled={updating || (!files.resume && !files.details)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold py-6"
                  data-testid="update-files-btn"
                >
                  {updating ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      Retraining Chatbot...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Update & Retrain Chatbot
                    </>
                  )}
                </Button>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    <strong>Note:</strong> Updating files will automatically retrain your chatbot with the new information. This may take a few moments.
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
