// Create: src/pages/SubscribePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SubscribePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-4xl mx-auto px-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-8 text-gray-300">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent mb-4" style={{fontFamily: 'Space Grotesk'}}>
            Upgrade to Pro
          </h1>
          <p className="text-xl text-gray-400">Unlock 5 portfolios + advanced features</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl border border-gray-700 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Your Current Plan</h3>
            <p className="text-gray-400 mb-6">{user?.subscription_tier?.toUpperCase()}</p>
            <div className="text-4xl font-bold text-white">₹0</div>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-lime-500/10 border-2 border-emerald-500 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-lime-500 text-black text-sm font-bold px-4 py-1 rounded-full">
              RECOMMENDED
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro Plan</h3>
            <p className="text-gray-300 mb-6">For serious professionals</p>
            <div className="text-5xl font-bold text-white mb-8">₹499<span className="text-2xl">/month</span></div>
            
            <Button size="lg" className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 text-black font-bold mb-6">
              <CreditCard className="w-5 h-5 mr-2" />
              Subscribe Now
            </Button>
            
            <ul className="space-y-3 text-white">
              {['5 Portfolios', 'Advanced AI', 'Detailed Analytics', 'Priority Support'].map((item, i) => (
                <li key={i} className="flex items-center">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs text-black font-bold">✓</span>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscribePage;