import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';
import { ShieldCheck, CreditCard, ArrowLeft, AlertTriangle, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api`;

// Plan rank — higher = better plan
const PLAN_RANK = { free: 0, creator: 1, growth: 2 };

const PLAN_LABELS = { free: 'Explorer (Free)', creator: 'Creator', growth: 'Growth' };

const CheckoutPage = () => {
    const [searchParams] = useSearchParams();
    const planId = searchParams.get('plan');
    const isAnnual = searchParams.get('cycle') === 'annual';
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const plans = {
        creator: {
            name: 'Creator',
            price: isAnnual ? 990 : 99,
            features: ['1 Portfolio', '40 AI Conversations/month', 'Remove watermark', '5 Professional Themes', 'Custom personality tones', 'Detailed Analytics', 'Resume improvement suggestions'],
            description: isAnnual ? 'Annual Subscription (Save 16%)' : 'Monthly Subscription'
        },
        growth: {
            name: 'Growth',
            price: isAnnual ? 2490 : 249,
            features: ['3 Portfolios', '180 AI Conversations/month', 'Advanced Analytics', 'Advanced Customization', 'Dedicated Support', 'API Access', 'Recruiter Snapshot PDF export'],
            description: isAnnual ? 'Annual Subscription (Save 16%)' : 'Monthly Subscription'
        },
        credits_30: {
            name: '30 Extra Conversations',
            price: 39,
            features: ['30 One-time AI Conversations', 'Never Expires', 'Use when monthly limit is reached'],
            description: 'One-time Add-on'
        }
    };

    const plan = plans[planId];
    const currentTier = user?.subscription_tier || 'free';
    const isCredits = planId?.startsWith('credits_');

    // Determine upgrade vs downgrade vs same
    const getChangeType = () => {
        if (isCredits) return 'addon';
        const currentRank = PLAN_RANK[currentTier] ?? 0;
        const newRank = PLAN_RANK[planId] ?? 0;
        if (newRank > currentRank) return 'upgrade';
        if (newRank < currentRank) return 'downgrade';
        return 'renew';
    };

    const changeType = getChangeType();

    // Format expiry date
    const formatExpiry = (isoString) => {
        if (!isoString) return null;
        try {
            return new Date(isoString).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
        } catch { return null; }
    };

    useEffect(() => {
        if (!user) { navigate('/login'); }
        if (!plan) { navigate('/pricing'); }
    }, [user, plan, navigate]);

    // Show confirmation if user already has a paid plan (and it's not a credit add-on)
    const handleSubscribeClick = () => {
        if (currentTier !== 'free' && !isCredits) {
            setShowConfirm(true);
        } else {
            initiatePayment();
        }
    };

    const initiatePayment = async () => {
        setShowConfirm(false);
        setLoading(true);
        try {
            const orderResponse = await axios.post(`${API_URL}/payment/create-order`, {
                plan_id: isAnnual ? `${planId}_annual` : planId
            });

            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID,
                amount: orderResponse.data.amount,
                currency: orderResponse.data.currency,
                name: 'Botfolio',
                description: plan.description,
                order_id: orderResponse.data.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await axios.post(`${API_URL}/payment/verify`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan_id: isAnnual ? `${planId}_annual` : planId
                        });

                        if (isCredits) {
                            toast.success(`✨ ${plan.name} added to your account!`);
                        } else {
                            toast.success(`🎉 ${plan.name} plan activated successfully!`);
                        }
                        // Redirect after short delay so user sees toast
                        setTimeout(() => navigate('/dashboard'), 2000);
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        toast.error('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || ''
                },
                theme: { color: '#10b981' },
                modal: {
                    ondismiss: function () { setLoading(false); }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error('Payment failed. Please try again.');
                setLoading(false);
            });
            rzp.open();
        } catch (error) {
            console.error('Order creation error:', error);
            toast.error('Failed to create order. Please try again.');
            setLoading(false);
        }
    };

    if (!plan) return null;

    // Change type config
    const changeConfig = {
        upgrade: {
            icon: <ArrowUp className="w-5 h-5 text-emerald-400" />,
            color: 'border-emerald-500/40 bg-emerald-500/5',
            label: 'Plan Upgrade',
            labelColor: 'text-emerald-400',
            message: `You're upgrading from ${PLAN_LABELS[currentTier]} to ${plan.name}. Your new plan takes effect immediately and your conversation counter resets.`
        },
        downgrade: {
            icon: <ArrowDown className="w-5 h-5 text-yellow-400" />,
            color: 'border-yellow-500/40 bg-yellow-500/5',
            label: 'Plan Downgrade',
            labelColor: 'text-yellow-400',
            message: `You're downgrading from ${PLAN_LABELS[currentTier]} to ${plan.name}. Some features may no longer be available. The change takes effect immediately.`
        },
        renew: {
            icon: <RefreshCw className="w-5 h-5 text-blue-400" />,
            color: 'border-blue-500/40 bg-blue-500/5',
            label: 'Plan Renewal',
            labelColor: 'text-blue-400',
            message: `You're renewing your ${plan.name} plan. Your expiry date will be extended by ${isAnnual ? '365 days (1 year)' : '30 days'} from today.`
        }
    };
    const cfg = changeConfig[changeType];

    return (
        <div className="min-h-screen bg-black">
            <Navbar />
            <div className="max-w-2xl mx-auto px-6 py-12 sm:py-20">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => navigate('/pricing')}
                    className="mb-6 text-gray-400 hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Pricing
                </Button>

                {/* Change-type Banner (shown only when switching from paid plan) */}
                {currentTier !== 'free' && !isCredits && cfg && (
                    <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${cfg.color}`}>
                        {cfg.icon}
                        <div>
                            <p className={`text-sm font-bold mb-1 ${cfg.labelColor}`}>{cfg.label}</p>
                            <p className="text-xs text-gray-400">{cfg.message}</p>
                            {user?.subscription_expiry && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Current plan expires: <span className="text-gray-300">{formatExpiry(user.subscription_expiry)}</span>
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <CreditCard className="w-8 h-8 text-emerald-400" />
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">Complete Your Purchase</h1>
                    </div>

                    {/* Plan Summary */}
                    <div className="mb-8 p-6 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 rounded-xl shadow-lg shadow-emerald-500/5">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                <p className="text-sm text-gray-400 capitalize">{plan.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-emerald-400">₹{plan.price}</p>
                                <p className="text-sm text-gray-400">{planId?.startsWith('credits') ? 'one-time' : (isAnnual ? '/year' : '/month')}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-700/50 pt-4 mt-4">
                            <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">What's Included</p>
                            <ul className="space-y-2">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Security Info */}
                    <div className="mb-6 flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5" />
                        <div className="text-sm text-gray-400">
                            <p className="font-semibold text-white mb-1">Secure Payment</p>
                            <ul className="space-y-1 text-xs">
                                <li>• Your payment is processed securely via Razorpay</li>
                                <li>• We never store your card details</li>
                                <li>• 30-day money-back guarantee</li>
                            </ul>
                        </div>
                    </div>

                    {/* Payment Button */}
                    <Button
                        onClick={handleSubscribeClick}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-extrabold text-lg py-7 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                    >
                        {loading ? 'Processing Secure Payment...' : `Complete Payment • ₹${plan.price}`}
                    </Button>

                    <p className="text-center text-gray-500 text-xs mt-4">
                        By proceeding, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>

            {/* ─── Upgrade / Downgrade Confirmation Modal ─── */}
            {showConfirm && cfg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        {/* Icon */}
                        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-5 ${cfg.color}`}>
                            <AlertTriangle className={`w-7 h-7 ${cfg.labelColor}`} />
                        </div>

                        <h3 className="text-xl font-bold text-white text-center mb-2">{cfg.label} Confirmation</h3>

                        {/* Current → New */}
                        <div className="flex items-center justify-center gap-3 my-5">
                            <div className="text-center">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Current Plan</p>
                                <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-700 text-gray-200">
                                    {PLAN_LABELS[currentTier]}
                                </span>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.color} border ${cfg.color.includes('emerald') ? 'border-emerald-500/40' : cfg.color.includes('yellow') ? 'border-yellow-500/40' : 'border-blue-500/40'}`}>
                                {cfg.icon}
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">New Plan</p>
                                <span className="px-3 py-1 rounded-full text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    {plan.name}
                                </span>
                            </div>
                        </div>

                        <p className="text-sm text-gray-400 text-center mb-2">{cfg.message}</p>
                        {user?.subscription_expiry && (
                            <p className="text-xs text-gray-500 text-center mb-6">
                                Your current plan expires <span className="text-gray-300 font-medium">{formatExpiry(user.subscription_expiry)}</span>. This purchase takes effect immediately.
                            </p>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={() => setShowConfirm(false)}
                                variant="outline"
                                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={initiatePayment}
                                className={`flex-1 font-bold text-black ${changeType === 'downgrade' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600'}`}
                            >
                                Yes, {changeType === 'upgrade' ? 'Upgrade' : changeType === 'downgrade' ? 'Downgrade' : 'Renew'} Now
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutPage;
