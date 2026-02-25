import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';

const PricingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isAnnual, setIsAnnual] = React.useState(false);


    const plans = [
        {
            name: 'Free',
            price: '₹0',
            features: [
                '1 Portfolio Chatbot',
                '5 AI Queries / day',
                'Standard UI',
                'Community Support'
            ],
            cta: 'Current Plan',
            disabled: true
        },
        {
            name: 'Pro',
            price: isAnnual ? '₹82' : '₹99',
            period: '/month',
            subtext: isAnnual ? 'Billed ₹990 annually' : 'Billed monthly',
            features: [
                '5 Portfolio Chatbots',
                '50 AI Queries / day',
                'Custom Personality Tones',
                'Recruiter Snapshot Export',
                'AI Skill Radar',
                'No Botfolio Branding'
            ],
            planId: 'starter',
            popular: true,
            badge: 'Limited: Founding Member'
        },
        {
            name: 'Elite',
            price: isAnnual ? '₹415' : '₹499',
            period: '/month',
            subtext: isAnnual ? 'Billed ₹4,980 annually' : 'Billed monthly',
            features: [
                'Unlimited Portfolio Chatbots',
                'Priority AI (No wait times)',
                'White-label Solution',
                'Custom Domains (Soon)',
                'Priority Engineering Support',
                'Advanced Recruiter Analytics'
            ],
            planId: 'pro',
            badge: 'Enterprise Grade'
        }
    ];

    const handleSubscribe = (planId) => {
        if (!user) {
            navigate('/register');
            return;
        }
        navigate(`/checkout?plan=${planId}${isAnnual ? '&cycle=annual' : ''}`);
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
                <div className="flex items-center justify-center gap-4 mb-12">
                    <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
                    <button
                        onClick={() => setIsAnnual(!isAnnual)}
                        className="w-14 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 p-1 transition-all relative"
                    >
                        <div className={`w-5 h-5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-sm ${isAnnual ? 'text-white' : 'text-gray-500'}`}>
                        Annual <span className="text-emerald-400 font-bold ml-1">(-20%)</span>
                    </span>
                </div>
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
