import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';

const PricingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const plans = [
        {
            name: 'Free',
            price: '₹0',
            features: ['1 Portfolio', '5 queries/day', 'Basic chatbot', 'Community support'],
            cta: 'Current Plan',
            disabled: true
        },
        {
            name: 'Starter',
            price: '₹99',
            period: '/month',
            features: ['5 Portfolios', '50 queries/day', 'Advanced AI', 'Email support', 'No ads'],
            planId: 'starter'
        },
        {
            name: 'Pro',
            price: '₹499',
            period: '/month',
            features: [
                'Unlimited Portfolios',
                'Unlimited queries',
                'Premium AI model',
                'Priority support',
                'Custom domain',
                'No ads',
                'Advanced analytics'
            ],
            planId: 'pro',
            popular: true
        }
    ];

    const handleSubscribe = (planId) => {
        if (!user) {
            navigate('/register');
            return;
        }
        navigate(`/checkout?plan=${planId}`);
    };

    return (
        <div className="min-h-screen bg-black">
            <Navbar />
            <div className="max-w-7xl mx-auto px-6 py-12 sm:py-20">
                {/* Header */}
                <div className="text-center mb-12 sm:mb-16">
                    <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent mb-4"
                        style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        Choose Your Plan
                    </h1>
                    <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
                        Upgrade to unlock more features and grow your AI-powered portfolio
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`relative p-6 sm:p-8 rounded-2xl border transition-all hover:scale-105 ${plan.popular
                                    ? 'border-emerald-500 bg-gradient-to-b from-emerald-500/10 to-transparent shadow-xl shadow-emerald-500/20'
                                    : 'border-gray-800 bg-gray-900/50'
                                }`}
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-lime-500 text-black text-sm font-semibold rounded-full flex items-center gap-1">
                                    <Sparkles className="w-4 h-4" />
                                    Most Popular
                                </div>
                            )}

                            {/* Plan Name */}
                            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>

                            {/* Price */}
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-emerald-400">{plan.price}</span>
                                {plan.period && <span className="text-gray-400 text-lg">{plan.period}</span>}
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start text-gray-300 text-sm">
                                        <Check className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <Button
                                onClick={() => handleSubscribe(plan.planId)}
                                disabled={plan.disabled || (user?.subscription_tier === plan.planId?.toLowerCase())}
                                className={`w-full font-semibold ${plan.popular
                                        ? 'bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black'
                                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {user?.subscription_tier === plan.planId?.toLowerCase()
                                    ? 'Current Plan'
                                    : plan.cta || 'Get Started'}
                            </Button>
                        </div>
                    ))}
                </div>

                {/* FAQ or Additional Info */}
                <div className="mt-16 text-center text-gray-400 text-sm">
                    <p>All plans include 30-day money-back guarantee • Cancel anytime</p>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
