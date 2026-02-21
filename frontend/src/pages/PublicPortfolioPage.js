import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { toast } from 'sonner';
import { Bot, Send, Loader2, Zap, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000'}/api`;

// Renders markdown with custom styling matching the dark theme
const MarkdownMessage = ({ content }) => (
  <ReactMarkdown
    components={{
      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
      strong: ({ children }) => (
        <strong className="font-semibold text-emerald-300">{children}</strong>
      ),
      em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
      ul: ({ children }) => (
        <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>
      ),
      li: ({ children }) => <li className="text-sm">{children}</li>,
      code: ({ inline, children }) =>
        inline ? (
          <code className="bg-emerald-500/10 text-emerald-300 px-1 rounded text-xs font-mono">
            {children}
          </code>
        ) : (
          <pre className="bg-black/40 border border-emerald-500/20 rounded-lg p-3 my-2 overflow-x-auto">
            <code className="text-emerald-300 text-xs font-mono">{children}</code>
          </pre>
        ),
      h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2">{children}</h1>,
      h2: ({ children }) => <h2 className="text-base font-bold text-white mb-1">{children}</h2>,
      h3: ({ children }) => <h3 className="text-sm font-semibold text-emerald-300 mb-1">{children}</h3>,
    }}
  >
    {content}
  </ReactMarkdown>
);

// Streaming text component — reveals text character by character
const StreamingMessage = ({ content, onDone }) => {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    if (!content) return;
    indexRef.current = 0;
    setDisplayed('');

    // Stream character by character at ~30 chars/tick for smooth UX
    const CHUNK = 3; // chars per tick
    const DELAY = 18; // ms per tick

    const interval = setInterval(() => {
      if (indexRef.current >= content.length) {
        clearInterval(interval);
        onDone?.();
        return;
      }
      const end = Math.min(indexRef.current + CHUNK, content.length);
      setDisplayed(content.slice(0, end));
      indexRef.current = end;
    }, DELAY);

    return () => clearInterval(interval);
  }, [content]);

  return (
    <>
      <MarkdownMessage content={displayed} />
      {displayed.length < content.length && (
        <span className="inline-block w-1.5 h-4 bg-emerald-400 ml-0.5 animate-pulse rounded-sm align-middle" />
      )}
    </>
  );
};

const PublicPortfolioPage = () => {
  const { customUrl } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [streamingIdx, setStreamingIdx] = useState(null); // which message is streaming
  const [showLimitModal, setShowLimitModal] = useState(false);
  const messagesEndRef = useRef(null);

  const recommendedQuestions = [
    "Tell me about your experience",
    "What are your key skills?",
    "What are your strengths?",
    "Describe your projects"
  ];

  useEffect(() => {
    fetchPortfolio();
  }, [customUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingIdx]);

  const fetchPortfolio = async () => {
    try {
      const response = await axios.get(`${API_URL}/public/${customUrl}`);
      setPortfolio(response.data);
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm the AI assistant for **${response.data.owner_name}**'s portfolio. Ask me anything about their experience, skills, projects, or qualifications!`
      }]);
    } catch (error) {
      toast.error('Portfolio not found');
    } finally {
      setLoading(false);
    }
  };

  const addAssistantMessage = (text) => {
    setMessages(prev => {
      const next = [...prev, { role: 'assistant', content: text }];
      setStreamingIdx(next.length - 1);
      return next;
    });
  };

  const sendMessage = async (text) => {
    const msg = text || inputMessage.trim();
    if (!msg || sending) return;
    setInputMessage('');
    setSending(true);
    setMessages(prev => [...prev, { role: 'user', content: msg }]);

    try {
      const response = await axios.post(`${API_URL}/chat/${customUrl}`, {
        portfolio_url: customUrl,
        message: msg,
      });
      addAssistantMessage(response.data.response);
    } catch (error) {
      if (error.response?.status === 429) {
        setShowLimitModal(true);
      } else {
        toast.error('Failed to get response');
        addAssistantMessage('Sorry, I encountered an error. Please try again.');
      }
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
            <img src="/assets/botfolio-logo-transparent.png" alt="Botfolio" className="w-16 h-16" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {portfolio.owner_name}'s
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            AI Portfolio Assistant
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
            Chat with the AI assistant to learn about experience, skills, and projects
          </p>
        </div>
      </header>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div
          className="bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl overflow-hidden"
          style={{ height: 'calc(100vh - 400px)', minHeight: '500px' }}
        >
          <div className="h-full overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${idx}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-black" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] p-4 rounded-2xl text-sm md:text-base leading-relaxed ${msg.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-500 to-lime-500 text-black font-medium'
                    : 'bg-black/50 border border-emerald-500/20 text-gray-100'
                    }`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {msg.role === 'user' ? (
                    msg.content
                  ) : idx === streamingIdx ? (
                    <StreamingMessage
                      content={msg.content}
                      onDone={() => setStreamingIdx(null)}
                    />
                  ) : (
                    <MarkdownMessage content={msg.content} />
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">You</span>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {sending && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center mt-1">
                  <Bot className="w-5 h-5 text-black" />
                </div>
                <div className="bg-black/50 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Recommended Questions */}
        <div className="flex gap-2 mb-2 mt-4 overflow-x-auto pb-2 scrollbar-none">
          {recommendedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              disabled={sending}
              className="whitespace-nowrap px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="mt-2 flex gap-3">
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
            onClick={() => sendMessage()}
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
            <img src="/assets/botfolio-logo-transparent.png" alt="Botfolio" className="w-6 h-6" />
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Botfolio</span>
          </div>
          <p className="text-gray-500 text-xs">
            Create your own AI portfolio chatbot &nbsp;·&nbsp;
            <Link to="/privacy" className="hover:text-emerald-400">Privacy</Link>
            &nbsp;·&nbsp;
            <Link to="/terms" className="hover:text-emerald-400">Terms</Link>
          </p>
        </div>
      </footer>

      {/* ─── Free Tier Request Limit Popup ─── */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-emerald-500/30 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl relative">
            <button onClick={() => setShowLimitModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Request Limit Reached</h3>
              <p className="text-gray-400 text-sm">
                This portfolio has reached its <strong className="text-white">5 free daily requests</strong>.
                Upgrade the account to unlock unlimited AI conversations.
              </p>
            </div>
            <div className="space-y-3">
              <Link to="/pricing">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold">
                  <Zap className="w-4 h-4 mr-2" /> View Plans
                </Button>
              </Link>
              <Button
                onClick={() => setShowLimitModal(false)}
                variant="outline"
                className="w-full border-gray-700 text-gray-400 hover:bg-gray-800"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicPortfolioPage;

