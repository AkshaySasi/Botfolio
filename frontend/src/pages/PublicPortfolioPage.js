import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { toast } from 'sonner';
import { Bot, Send, Loader2 } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000'}/api`;

const PublicPortfolioPage = () => {
  const { customUrl } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchPortfolio();
  }, [customUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchPortfolio = async () => {
    try {
      const response = await axios.get(`${API_URL}/public/${customUrl}`);
      setPortfolio(response.data);
      
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm the AI assistant for ${response.data.owner_name}'s portfolio. Ask me anything about their experience, skills, projects, or qualifications!`
      }]);
    } catch (error) {
      toast.error('Portfolio not found');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || sending) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await axios.post(`${API_URL}/chat/${customUrl}`, {
        portfolio_url: customUrl,
        message: userMessage,
      });

      // Add AI response
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      toast.error('Failed to get response');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Portfolio Not Found</h1>
          <p className="text-gray-400">This portfolio doesn't exist or is no longer active.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="public-portfolio-page">
      {/* Header */}
      <header className="border-b border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-black to-transparent">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="https://customer-assets.emergentagent.com/job_91f5d044-998c-47b3-970c-f12d04c4f8fd/artifacts/ne4azb2e_Botiy.png" alt="Botiee" className="w-16 h-16" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
            {portfolio.owner_name}'s
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent mb-4" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
            AI Portfolio Assistant
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto" style={{fontFamily: 'Inter, sans-serif'}}>
            Chat with the AI assistant to learn about experience, skills, and projects
          </p>
        </div>
      </header>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl overflow-hidden" style={{height: 'calc(100vh - 400px)', minHeight: '500px'}}>
          {/* Messages */}
          <div className="h-full overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${idx}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-black" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-500 to-lime-500 text-black'
                      : 'bg-black/50 border border-emerald-500/20 text-white'
                  }`}
                >
                  <p className="text-sm md:text-base" style={{fontFamily: 'Inter, sans-serif'}}>{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">You</span>
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-black" />
                </div>
                <div className="bg-black/50 border border-emerald-500/20 p-4 rounded-2xl">
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="mt-4 flex gap-3">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything about this portfolio..."
            className="flex-1 bg-black/50 border-emerald-500/30 text-white placeholder:text-gray-500 focus:border-emerald-500 py-6"
            disabled={sending}
            data-testid="chat-input"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || sending}
            className="bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black px-8"
            data-testid="send-message-btn"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-emerald-500/20 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-gray-500 text-sm">Powered by</span>
            <img src="https://customer-assets.emergentagent.com/job_91f5d044-998c-47b3-970c-f12d04c4f8fd/artifacts/ne4azb2e_Botiy.png" alt="Botiee" className="w-6 h-6" />
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Botiee</span>
          </div>
          <p className="text-gray-500 text-xs">Create your own AI portfolio chatbot</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicPortfolioPage;
