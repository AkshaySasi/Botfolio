import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Upload, Sparkles, ArrowLeft } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000'}/api`;

const BuilderPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    customUrl: '',
    resume: null,
    details: null,
  });

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, [type]: file });
    }
  };

  const handleSubmit = async () => {
    if (!formData.resume) {
      toast.error('Please upload your resume');
      return;
    }

    setLoading(true);
    setProgress(10);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('custom_url', formData.customUrl);
    data.append('resume', formData.resume);
    if (formData.details) {
      data.append('details', formData.details);
    }
    if (formData.textContent) {
      data.append('text_content', formData.textContent);
    }

    try {
      setProgress(30);
      const response = await axios.post(`${API_URL}/portfolios/create`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setProgress(60);

      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProgress(90);

      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(100);

      toast.success('Portfolio created successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create portfolio');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

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
            <img src="https://customer-assets.emergentagent.com/job_91f5d044-998c-47b3-970c-f12d04c4f8fd/artifacts/ne4azb2e_Botiy.png" alt="Botiee" className="w-10 h-10 animate-spin-slow" style={{ animation: loading ? 'spin 2s linear infinite' : 'none' }} />
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Botiee</span>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Create Your <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">AI Chatbot</span>
          </h1>
          <p className="text-gray-400 text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
            Upload your resume and details to generate an intelligent portfolio chatbot
          </p>
        </div>

        {loading && (
          <div className="mb-8 p-6 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <img src="https://customer-assets.emergentagent.com/job_91f5d044-998c-47b3-970c-f12d04c4f8fd/artifacts/ne4azb2e_Botiy.png" alt="Processing" className="w-10 h-10 animate-spin" />
              <span className="text-emerald-400 font-semibold">Creating your AI portfolio...</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-gray-400 text-sm mt-3">
              {progress < 30 && 'Uploading files...'}
              {progress >= 30 && progress < 60 && 'Parsing resume with AI...'}
              {progress >= 60 && progress < 90 && 'Training your chatbot...'}
              {progress >= 90 && 'Finalizing portfolio...'}
            </p>
          </div>
        )}

        <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-8">
          {step === 1 && (
            <div className="space-y-6" data-testid="portfolio-form">
              <div>
                <Label htmlFor="name" className="text-gray-300 mb-2 block">Portfolio Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="My Professional Portfolio"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-black/50 border-emerald-500/30 text-white placeholder:text-gray-500 focus:border-emerald-500"
                  data-testid="portfolio-name-input"
                />
              </div>

              <div>
                <Label htmlFor="customUrl" className="text-gray-300 mb-2 block">Custom URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">/p/</span>
                  <Input
                    id="customUrl"
                    type="text"
                    placeholder="john-doe"
                    value={formData.customUrl}
                    onChange={(e) => setFormData({ ...formData, customUrl: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                    required
                    className="bg-black/50 border-emerald-500/30 text-white placeholder:text-gray-500 focus:border-emerald-500"
                    data-testid="custom-url-input"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">This will be your portfolio's public URL</p>
              </div>

              <div>
                <Label htmlFor="resume" className="text-gray-300 mb-2 block">Upload Resume (PDF)</Label>
                <div className="relative">
                  <input
                    id="resume"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, 'resume')}
                    className="hidden"
                    data-testid="resume-upload-input"
                  />
                  <label
                    htmlFor="resume"
                    className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-emerald-500/30 rounded-xl hover:border-emerald-500/50 transition-colors cursor-pointer bg-black/30"
                  >
                    <Upload className="w-6 h-6 text-emerald-400" />
                    <span className="text-gray-300">
                      {formData.resume ? formData.resume.name : 'Click to upload resume'}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="details" className="text-gray-300 mb-2 block">Upload Career Details (TXT) <span className="text-gray-500 text-xs ml-2">(Optional)</span></Label>
                <div className="relative">
                  <input
                    id="details"
                    type="file"
                    accept=".txt"
                    onChange={(e) => handleFileChange(e, 'details')}
                    className="hidden"
                    data-testid="details-upload-input"
                  />
                  <label
                    htmlFor="details"
                    className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-emerald-500/30 rounded-xl hover:border-emerald-500/50 transition-colors cursor-pointer bg-black/30"
                  >
                    <Upload className="w-6 h-6 text-emerald-400" />
                    <span className="text-gray-300">
                      {formData.details ? formData.details.name : 'Click to upload details'}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="textContent" className="text-gray-300 mb-2 block">Additional Details (Text) <span className="text-gray-500 text-xs ml-2">(Optional)</span></Label>
                <textarea
                  id="textContent"
                  rows="4"
                  placeholder="Paste your bio, skills, or any other info here..."
                  value={formData.textContent || ''}
                  onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                  className="w-full bg-black/50 border border-emerald-500/30 rounded-xl p-3 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.name || !formData.customUrl || !formData.resume}
                className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold py-6"
                data-testid="create-submit-btn"
              >
                {loading ? (
                  'Creating Portfolio...'
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Create AI Portfolio
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuilderPage;
