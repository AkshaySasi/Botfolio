import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Sparkles, MessageSquare, Globe, BarChart, Zap, Send } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const ContactForm = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/contact`, formData);
      toast.success("Message sent successfully!");
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left max-w-md mx-auto">
      <div>
        <Input
          placeholder="Your Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="bg-gray-900 border-gray-800 text-white"
        />
      </div>
      <div>
        <Input
          type="email"
          placeholder="Your Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="bg-gray-900 border-gray-800 text-white"
        />
      </div>
      <div>
        <textarea
          placeholder="How can we help?"
          rows="4"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          required
          className="w-full bg-gray-900 border border-gray-800 text-white rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
        {loading ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
};

import AdBanner from '@/components/AdBanner';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePayment = async (planId) => {
    if (!user) {
      toast.error("Please login to upgrade");
      navigate('/login');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/payment/create-order`, { plan_id: planId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_placeholder", // Env var for production, fallback for dev
        amount: res.data.amount,
        currency: res.data.currency,
        name: "Botfolio",
        description: `Upgrade to ${planId.toUpperCase()} Plan`,
        order_id: res.data.id,
        handler: async function (response) {
          try {
            await axios.post(`${API_URL}/api/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: planId
            }, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            toast.success(`Successfully upgraded to ${planId.toUpperCase()}!`);
            window.location.reload();
          } catch (err) {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: "#10b981"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (error) {
      toast.error("Failed to initiate payment");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-black to-lime-500/10"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-6">
              <Bot className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-emerald-400">Build your AI Portfolio</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <span className="bg-gradient-to-r from-emerald-400 via-lime-400 to-yellow-400 bg-clip-text text-transparent">
                Build Your AI Portfolio
              </span>
              <br />
              <span className="text-white">With Smart Personal Chatbot</span>
            </h1>

            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              Transform your resume into a stunning portfolio website with an intelligent AI chatbot that answers questions about your experience, skills, and projects. Let your portfolio work for you 24/7.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" onClick={() => navigate('/register')} className="bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold text-lg px-8 py-6" data-testid="get-started-btn">
                <Sparkles className="mr-2 h-5 w-5" />
                Start Building Free
              </Button>
              <Button size="lg" variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 px-8 py-6">
                <MessageSquare className="mr-2 h-5 w-5" />
                See How It Works
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-400">5 Min</div>
                <div className="text-sm text-gray-500 mt-1">Setup Time</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-400">99%</div>
                <div className="text-sm text-gray-500 mt-1">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-400">4.9/5</div>
                <div className="text-sm text-gray-500 mt-1">User Rating</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-400">&lt;1s</div>
                <div className="text-sm text-gray-500 mt-1">Response Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="py-24 bg-gradient-to-b from-black to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Our Vision
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              Democratizing professional portfolio creation with AI. Every professional deserves a portfolio that works as hard as they do - answering questions, showcasing achievements, and making connections while they sleep.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Instant AI Generation</h3>
              <p className="text-gray-400">
                Upload your resume and watch AI instantly extract your experience, skills, and achievements to build a professional portfolio in under 5 minutes.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-gradient-to-br from-lime-500/10 to-transparent border border-lime-500/20 hover:border-lime-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-lime-500 to-yellow-500 flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">24/7 AI Assistant</h3>
              <p className="text-gray-400">
                Your personal AI chatbot knows everything about your career. It answers recruiter questions, highlights your strengths, and never sleeps.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Share Anywhere</h3>
              <p className="text-gray-400">
                Get a beautiful portfolio URL to share on LinkedIn, in emails, or your resume. Make it easy for opportunities to find you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Powerful Features
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              Everything you need to create a professional AI-powered portfolio
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Bot, title: "AI Resume Parser", desc: "Automatically extracts and organizes your resume data" },
              { icon: MessageSquare, title: "Smart Chatbot", desc: "Answers questions about your experience intelligently" },
              { icon: Globe, title: "Custom URLs", desc: "Get your own branded portfolio link" },
              { icon: BarChart, title: "Analytics Dashboard", desc: "Track who's viewing and engaging with your portfolio" },
              { icon: Sparkles, title: "Beautiful Templates", desc: "Professional designs that make you stand out" },
              { icon: Zap, title: "Lightning Fast", desc: "Optimized for speed and performance" },
            ].map((feature, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300">
                <feature.icon className="w-10 h-10 text-emerald-400 mb-4" />
                <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gradient-to-b from-[#0a0a0a] to-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              Start free, upgrade as you grow. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-800/50 to-transparent border border-gray-700 hover:border-gray-600 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Free</h3>
              <p className="text-gray-400 mb-6">Perfect for getting started</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">₹0</span>
                <span className="text-gray-400">/forever</span>
              </div>
              <Button className="w-full bg-gray-700 hover:bg-gray-600 text-white" onClick={() => navigate('/register')} data-testid="free-plan-btn">
                Start Free
              </Button>
              <ul className="mt-8 space-y-4">
                {[
                  "1 Portfolio",
                  "5 Daily Questions (Limited)",
                  "Basic Analytics",
                  "Custom URL",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                      <span className="text-xs">✓</span>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Starter Plan */}
            <div className="relative p-8 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-lime-500/10 border-2 border-emerald-500 hover:border-emerald-400 transition-all duration-300 transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-lime-500 rounded-full text-black text-sm font-bold">
                MOST POPULAR
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Starter</h3>
              <p className="text-gray-300 mb-6">For hobbyists & students</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">₹99</span>
                <span className="text-gray-300">/month</span>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold"
                onClick={() => handlePayment('starter')}
                data-testid="starter-plan-btn"
              >
                Get Starter
              </Button>
              <ul className="mt-8 space-y-4">
                {[
                  "1 Portfolio",
                  "50 Daily Questions",
                  "Detailed Analytics",
                  "Custom URLs",
                  "Priority Support",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center text-white">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center mr-3">
                      <span className="text-xs text-black">✓</span>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-700 hover:border-purple-600 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-purple-700 flex items-center justify-center mb-4">
                <BarChart className="w-6 h-6 text-purple-200" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Pro</h3>
              <p className="text-gray-400 mb-6">For power users</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">₹499</span>
                <span className="text-gray-400">/month</span>
              </div>
              <Button
                className="w-full bg-purple-700 hover:bg-purple-600 text-white"
                onClick={() => handlePayment('pro')}
                data-testid="pro-plan-btn"
              >
                Go Pro
              </Button>
              <ul className="mt-8 space-y-4">
                {[
                  "5 Portfolios",
                  "Unlimited Questions",
                  "Advanced Analytics",
                  "Custom Domains",
                  "Dedicated Support",
                  "API Access",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-purple-700 flex items-center justify-center mr-3">
                      <span className="text-xs">✓</span>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-gradient-to-b from-black to-[#0a0a0a] border-t border-emerald-500/10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Get in Touch
          </h2>
          <p className="text-gray-400 mb-12" style={{ fontFamily: 'Inter, sans-serif' }}>
            Have questions about our Enterprise plan or need support? We're here to help.
          </p>

          <ContactForm />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-12">
        <AdBanner slotId="0987654321" />
      </div>

      {/* Footer */}
      <footer className="border-t border-emerald-500/20 py-12 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src="/assets/botfolio-logo-transparent.png" alt="Botfolio" className="w-8 h-8" />
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Botfolio</span>
            </div>
            <p className="text-gray-500 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              © 2025 Botfolio. Transforming careers with AI.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-500 hover:text-emerald-400 transition-colors">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-emerald-400 transition-colors">Terms</a>
              <a href="#" className="text-gray-500 hover:text-emerald-400 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;