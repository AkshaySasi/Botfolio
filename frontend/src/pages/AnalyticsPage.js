import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, MessageSquare, Eye, TrendingUp, Calendar, Download, FileText, Zap, User } from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts';
import { jsPDF } from 'jspdf';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AnalyticsPage = () => {
  const { portfolioId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(null); // stores sessionId being summarized

  useEffect(() => {
    fetchData();
  }, [portfolioId]);

  const fetchData = async () => {
    try {
      const [analyticsRes, portfolioRes, sessionsRes] = await Promise.all([
        axios.get(`${API_URL}/portfolios/${portfolioId}/analytics`),
        axios.get(`${API_URL}/portfolios/${portfolioId}`),
        axios.get(`${API_URL}/portfolios/${portfolioId}/sessions`)
      ]);
      setAnalytics(analyticsRes.data);
      setPortfolio(portfolioRes.data);
      setSessions(sessionsRes.data);
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
            <img src="/assets/botfolio-logo-bg.png" alt="Botfolio" className="w-10 h-10" />
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

        {/* Recruiter & Skill Insights Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">

          {/* AI Skill Radar Chart */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-6 sm:p-8 flex flex-col h-[400px]">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Skill Radar</h2>
            </div>

            <div className="flex-1 w-full min-h-0">
              {Object.keys(analytics?.analytics?.skills_queried || {}).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={
                    Object.entries(analytics?.analytics?.skills_queried || {})
                      .map(([name, value]) => ({
                        subject: name.charAt(0).toUpperCase() + name.slice(1),
                        A: value,
                        fullMark: Math.max(...Object.values(analytics?.analytics?.skills_queried || [10]))
                      }))
                      .slice(0, 7) // Show top 7 skills
                  }>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                    <Radar
                      name="Queries"
                      dataKey="A"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.5}
                    />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid #10b98133', borderRadius: '8px', color: '#fff' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <TrendingUp className="w-12 h-12 mb-2" />
                  <p className="text-sm">Not enough skill data yet</p>
                  <p className="text-xs">Chat with the bot about your skills to populate this chart</p>
                </div>
              )}
            </div>
          </div>

          {/* Key Skill Signal */}
          <div className="bg-gradient-to-br from-lime-500/10 to-transparent border border-lime-500/20 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-lime-400" />
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Skill Interest Signal</h2>
            </div>

            <div className="space-y-4">
              {Object.entries(analytics?.analytics?.skills_queried || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([skill, count]) => (
                  <div key={skill} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-gray-300 font-medium capitalize">{skill}</span>
                      <span className="text-emerald-400 text-sm font-mono">{count} queries</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-lime-500 transition-all duration-500"
                        style={{ width: `${(count / (analytics?.total_interactions || count)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}

              {Object.keys(analytics?.analytics?.skills_queried || {}).length === 0 && (
                <div className="py-12 text-center text-gray-500 italic">
                  No skills tracked yet. The AI automatically detects and tracks skills mentioned in conversations.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Recruiter Interactions */}
        <div className="bg-black/40 border border-emerald-500/15 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-emerald-500/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Recent Interactions</h2>
            </div>
            <span className="text-xs text-emerald-500/60 font-mono">Last 20 Sessions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-emerald-500/5 bg-emerald-500/5">
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Visitor</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Msgs</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/5">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-emerald-500/5 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-gray-200 font-medium">{session.visitor_name || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                        {new Date(session.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {session.messages?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setSummarizing(session.id);
                          try {
                            const res = await axios.get(`${API_URL}/sessions/${session.id}/summary`);
                            const doc = new jsPDF();

                            // styling
                            doc.setFontSize(22);
                            doc.setTextColor(16, 185, 129); // emerald-500
                            doc.text("Botfolio - Recruiter Snapshot", 20, 20);

                            doc.setFontSize(14);
                            doc.setTextColor(100, 100, 100);
                            doc.text(`Candidate: ${portfolio?.name}`, 20, 30);
                            doc.text(`Portfolio URL: ${window.location.host}/p/${portfolio?.custom_url}`, 20, 38);
                            doc.text(`Date: ${new Date(session.created_at).toLocaleDateString()}`, 20, 46);

                            doc.setLineWidth(0.5);
                            doc.setDrawColor(16, 185, 129);
                            doc.line(20, 52, 190, 52);

                            doc.setFontSize(16);
                            doc.setTextColor(0, 0, 0);
                            doc.text("AI Conversation Summary", 20, 65);

                            doc.setFontSize(11);
                            doc.setTextColor(50, 50, 50);
                            const splitText = doc.splitTextToSize(res.data.summary, 170);
                            doc.text(splitText, 20, 75);

                            doc.save(`Recruiter_Snapshot_${session.visitor_name || 'Visitor'}.pdf`);
                            toast.success('Recruiter Snapshot exported as PDF!');
                          } catch (e) {
                            toast.error('Failed to generate summary');
                          } finally {
                            setSummarizing(null);
                          }
                        }}
                        className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-bold"
                        disabled={summarizing === session.id}
                      >
                        {summarizing === session.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Recruiter Snapshot (PDF)
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}

                {sessions.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500 italic">
                      No conversations recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
