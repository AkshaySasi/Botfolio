import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Upload, Sparkles, ArrowLeft, CheckCircle, FileText, File, Shield, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000'}/api`;

// ── Subtle progress bar matching the emerald/dark theme ──────────────────────
const UploadProgressBar = ({ progress, label, visible }) => {
  if (!visible) return null;
  return (
    <div className="mb-6 overflow-hidden">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-emerald-400 font-medium tracking-wide">{label}</span>
        <span className="text-xs text-gray-500 tabular-nums">{Math.round(progress)}%</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #10b981, #84cc16)',
            boxShadow: progress > 5 ? '0 0 8px rgba(16,185,129,0.5)' : 'none',
          }}
        />
      </div>
    </div>
  );
};

const FileDropZone = ({ id, accept, label, hint, file, onChange, testId }) => (
  <div>
    <Label htmlFor={id} className="text-gray-300 mb-2 block">
      {label}
    </Label>
    <input id={id} type="file" accept={accept} onChange={onChange} className="hidden" data-testid={testId} />
    <label
      htmlFor={id}
      className={`flex items-center justify-center gap-3 p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer
        ${file
          ? 'border-emerald-500/60 bg-emerald-500/5'
          : 'border-emerald-500/30 bg-black/30 hover:border-emerald-500/50'
        }`}
    >
      {file ? (
        <>
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-emerald-300 text-sm truncate max-w-xs">{file.name}</span>
        </>
      ) : (
        <>
          <Upload className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <span className="text-gray-300 text-sm">{hint}</span>
        </>
      )}
    </label>
  </div>
);

const BuilderPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Uploading files...');
  const [formData, setFormData] = useState({
    name: '',
    customUrl: '',
    resume: null,
    details: null,
    textContent: '',
    tone: 'professional',
    contextAware: true,
  });

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) setFormData(prev => ({ ...prev, [type]: file }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error('Please enter a portfolio name'); return; }
    if (!formData.customUrl.trim()) { toast.error('Please enter a custom URL'); return; }
    if (!formData.resume) { toast.error('Please upload your resume'); return; }

    setLoading(true);
    setUploadProgress(0);
    setProgressLabel('Uploading files...');

    const data = new FormData();
    data.append('name', formData.name);
    data.append('custom_url', formData.customUrl);
    data.append('resume', formData.resume);
    if (formData.details) data.append('details', formData.details);
    if (formData.textContent) data.append('text_content', formData.textContent);
    data.append('tone', formData.tone);
    data.append('context_aware', formData.contextAware);

    try {
      await axios.post(`${API_URL}/portfolios/create`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) {
            const pct = Math.round((event.loaded / event.total) * 70); // 0–70 during upload
            setUploadProgress(pct);
            if (pct < 40) setProgressLabel('Uploading files...');
            else setProgressLabel('Processing your resume...');
          }
        },
      });

      setUploadProgress(85);
      setProgressLabel('Queuing AI training...');
      await new Promise(r => setTimeout(r, 600));

      setUploadProgress(100);
      setProgressLabel('Done!');

      toast.success('Portfolio created! AI training has started in the background.');
      setTimeout(() => navigate('/dashboard'), 700);

    } catch (error) {
      const detail = error.response?.data?.detail;
      if (detail) {
        toast.error(detail);
      } else if (error.message?.includes('Network')) {
        toast.error('Cannot reach the server. Check your connection.');
      } else {
        toast.error('Failed to create portfolio. Please try again.');
      }
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name.trim() && formData.customUrl.trim() && formData.resume;

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="builder-page">
      {/* Navbar */}
      <nav className="border-b border-emerald-500/20 backdrop-blur-sm bg-black/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <img
              src="/assets/botfolio-logo-bg.png"
              alt="Botfolio"
              className="w-10 h-10"
              style={{ animation: loading ? 'spin 2s linear infinite' : 'none' }}
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Botfolio
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Create Your <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">AI Chatbot</span>
          </h1>
          <p className="text-gray-400 text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
            Upload your resume and details to generate an intelligent portfolio chatbot
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-5 sm:p-8">

          {/* ── Progress bar — always rendered, only visible during upload ── */}
          <UploadProgressBar
            progress={uploadProgress}
            label={progressLabel}
            visible={loading}
          />

          <div className="space-y-6" data-testid="portfolio-form">
            {/* Portfolio Name */}
            <div>
              <Label htmlFor="name" className="text-gray-300 mb-2 block">Portfolio Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="My Professional Portfolio"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={loading}
                className="bg-black/50 border-emerald-500/30 text-white placeholder:text-gray-500 focus:border-emerald-500"
                data-testid="portfolio-name-input"
              />
            </div>

            {/* Custom URL */}
            <div>
              <Label htmlFor="customUrl" className="text-gray-300 mb-2 block">Custom URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">/p/</span>
                <Input
                  id="customUrl"
                  type="text"
                  placeholder="john-doe"
                  value={formData.customUrl}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customUrl: e.target.value.toLowerCase().replace(/\s/g, '-')
                  }))}
                  disabled={loading}
                  className="bg-black/50 border-emerald-500/30 text-white placeholder:text-gray-500 focus:border-emerald-500"
                  data-testid="custom-url-input"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">This will be your portfolio's public URL</p>
            </div>

            {/* Resume upload */}
            <FileDropZone
              id="resume"
              accept=".pdf"
              label="Upload Resume (PDF)"
              hint="Click to upload resume"
              file={formData.resume}
              onChange={(e) => handleFileChange(e, 'resume')}
              testId="resume-upload-input"
            />

            {/* Details upload */}
            <FileDropZone
              id="details"
              accept=".txt"
              label={<>Upload Career Details (TXT) <span className="text-gray-500 text-xs ml-2">(Optional)</span></>}
              hint="Click to upload details"
              file={formData.details}
              onChange={(e) => handleFileChange(e, 'details')}
              testId="details-upload-input"
            />

            {/* Text content */}
            <div>
              <Label htmlFor="textContent" className="text-gray-300 mb-2 block">
                Additional Details (Text) <span className="text-gray-500 text-xs ml-2">(Optional)</span>
              </Label>
              <textarea
                id="textContent"
                rows="4"
                placeholder="Paste your bio, skills, or any other info here..."
                value={formData.textContent}
                onChange={(e) => setFormData(prev => ({ ...prev, textContent: e.target.value }))}
                disabled={loading}
                className="w-full bg-black/50 border border-emerald-500/30 rounded-xl p-3 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            {/* Custom Personality Mode */}
            <div>
              <Label className="text-gray-300 mb-3 block">Chatbot Personality Tone</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { id: 'professional', label: 'Professional', desc: 'Polite & Formal' },
                  { id: 'confident', label: 'Confident', desc: 'Bold & Direct' },
                  { id: 'friendly', label: 'Friendly', desc: 'Warm & Helpful' },
                  { id: 'technical', label: 'Technical', desc: 'Precise & Detailed' },
                  { id: 'executive', label: 'Executive', desc: 'Concise & Impactful' },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, tone: tone.id }))}
                    className={`p-3 rounded-xl border transition-all text-left ${formData.tone === tone.id
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                      : 'border-white/10 bg-black/30 hover:border-white/20'
                      }`}
                  >
                    <div className={`text-xs font-bold mb-0.5 ${formData.tone === tone.id ? 'text-emerald-400' : 'text-gray-300'}`}>
                      {tone.label}
                    </div>
                    <div className="text-[10px] text-gray-500 leading-tight">
                      {tone.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Context-Aware Mode Add-on */}
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white leading-none">Context-Aware Guardrails</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3.5 h-3.5 text-gray-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px] bg-black border-emerald-500/30 text-xs">
                          Prevents your bot from answering off-topic questions (e.g. math, jokes) and keeps it focused strictly on your professional profile.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Recommended for recruiters & official use</p>
                </div>
              </div>
              <Switch
                checked={formData.contextAware}
                onCheckedChange={(val) => setFormData(p => ({ ...p, contextAware: val }))}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold py-6 disabled:opacity-50"
              data-testid="create-submit-btn"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating Portfolio...
                </span>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Create AI Portfolio
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuilderPage;
