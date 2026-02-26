import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';

const PricingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isAnnual, setIsAnnual] = useState(false);

    const plans = [
        {
            name: 'Explorer (Free)',
            price: '₹0',
            features: [
                '7 AI Conversations / month',
                '1 Portfolio',
                'Botfolio branding watermark',
                'Basic theme (no customization)',
                'Public shareable link',
                'Professional tone only',
                'Recruiter interaction counter'
            ],
            cta: 'Current Plan',
            disabled: true,
            planId: 'free'
        },
        {
            name: 'Creator',
            price: isAnnual ? '₹990' : '₹99',
            period: isAnnual ? '/year' : '/month',
            subtext: isAnnual ? 'Save 16% billed annually' : 'Billed monthly',
            features: [
                '40 AI Conversations / month',
                '1 Portfolio',
                'Remove watermark',
                '5 Professional Themes',
                'Custom personality tones',
                'Detailed Analytics',
                'Resume improvement suggestions'
            ],
            planId: 'creator',
            popular: true,
            badge: 'Most Popular'
        },
        {
            name: 'Growth',
            price: isAnnual ? '₹2490' : '₹249',
            period: isAnnual ? '/year' : '/month',
            subtext: isAnnual ? 'Save 16% billed annually' : 'Billed monthly',
            features: [
                '180 AI Conversations / month',
                '3 Portfolios',
                'Advanced Analytics',
                'Advanced customization (no branding)',
                'Dedicated Support',
                'API Access',
                'Recruiter Snapshot PDF export'
            ],
            planId: 'growth',
            badge: 'AI Career Infrastructure'
        }
    ];

    const handleSubscribe = (planId) => {
        if (!user) {
            navigate('/register');
            return;
        }
        navigate(`/checkout?plan=${planId}${isAnnual && planId !== 'free' ? '&cycle=annual' : ''}`);
    };

    return (
        <div className="min-h-screen bg-black">
            <Navbar />
            <div className="max-w-7xl mx-auto px-6 py-12 sm:py-20">
                {/* Header */}
                <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-6"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Elevate Your <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">Career Presence</span>
                </h1>
                <p className="text-gray-400 text-base sm:text-xl max-w-2xl mx-auto mb-10">
                    Join the elite circle of professionals using AI to stand out.
                </p>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 mb-16">
                    <span className={`text-sm font-semibold transition-colors ${!isAnnual ? 'text-white' : 'text-gray-500'}`}>Monthly Billing</span>
                    <button
                        onClick={() => setIsAnnual(!isAnnual)}
                        className="relative w-16 h-8 rounded-full bg-[#1a1a1a] border border-white/10 p-1 transition-colors hover:border-emerald-500/50"
                    >
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 transition-transform duration-300 ${isAnnual ? 'translate-x-8' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-sm font-semibold transition-colors flex items-center gap-2 ${isAnnual ? 'text-white' : 'text-gray-500'}`}>
                        Annual Billing
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Save 16%</span>
                    </span>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
                {plans.map((plan, idx) => (
                    <div
                        key={idx}
                        className={`relative p-6 sm:p-8 rounded-2xl border transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl ${plan.popular
                            ? 'border-emerald-500 bg-gradient-to-b from-emerald-500/10 to-transparent shadow-emerald-500/20'
                            : 'border-gray-800 bg-gray-900/50 hover:border-gray-600'
                            }`}
                    >
                        {/* Badge */}
                        {(plan.popular || plan.badge) && (
                            <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] font-bold rounded-full flex items-center gap-1 whitespace-nowrap uppercase tracking-wider ${plan.popular
                                ? 'bg-gradient-to-r from-emerald-500 to-lime-500 text-black'
                                : 'bg-white/10 text-emerald-400 border border-emerald-400/20'
                                }`}>
                                <Sparkles className="w-3 h-3" />
                                {plan.badge || 'Most Popular'}
                            </div>
                        )}

                        {/* Plan Name */}
                        <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>

                        {/* Price */}
                        <div className="mb-6">
                            <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                            {plan.period && <span className="text-gray-500 text-lg">{plan.period}</span>}
                            {plan.subtext && <p className="text-[10px] text-gray-500 mt-1 font-medium">{plan.subtext}</p>}
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

            <div className="mt-16 text-center text-gray-400 text-sm">
                <p>All plans include 30-day money-back guarantee • Cancel anytime</p>
            </div>
        </div>
    );
};

export default PricingPage;
