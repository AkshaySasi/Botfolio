import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';
import { ShieldCheck, CreditCard, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api`;

const CheckoutPage = () => {
    const [searchParams] = useSearchParams();
    const planId = searchParams.get('plan');
    const isAnnual = searchParams.get('cycle') === 'annual';
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const plans = {
        starter: {
            name: isAnnual ? 'Pro (Annual)' : 'Pro',
            price: isAnnual ? 990 : 99,
            features: ['5 Portfolios', '50 queries/day', 'Recruiter Snapshots', 'AI Skill Radar'],
            description: isAnnual ? 'Annual Subscription' : 'Monthly Subscription'
        },
        pro: {
            name: isAnnual ? 'Elite (Annual)' : 'Elite',
            price: isAnnual ? 4980 : 499,
            features: ['Unlimited Portfolios', 'Unlimited Queries', 'Advanced Recruiter Analytics', 'Enterprise Support'],
            description: isAnnual ? 'Annual Subscription' : 'Monthly Subscription'
        },
        credits_50: {
            name: '50 Extra Credits',
            price: 49,
            features: ['50 One-time AI Queries', 'Never Expires', 'Use when daily limit is reached'],
            description: 'One-time Credit Purchase'
        },
        credits_200: {
            name: '200 Extra Credits',
            price: 149,
            features: ['200 One-time AI Queries', 'Never Expires', 'Best value for heavy users'],
            description: 'One-time Credit Purchase'
        }
    };

    const plan = plans[planId];

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
        if (!plan) {
            navigate('/pricing');
        }
    }, [user, plan, navigate]);

    const handlePayment = async () => {
        setLoading(true);
        try {
            // Create Razorpay order
            const orderResponse = await axios.post(`${API_URL}/payment/create-order`, {
                plan_id: planId
            });

            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_PLACEHOLDER', // TODO: Add to .env
                amount: orderResponse.data.amount,
                currency: orderResponse.data.currency,
                name: 'Botfolio',
                description: plan.description,
                order_id: orderResponse.data.id,
                handler: async function (response) {
                    try {
                        // Verify payment on backend
                        await axios.post(`${API_URL}/payment/verify`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan_id: planId
                        });

                        toast.success(`🎉 ${plan.name} activated successfully!`);
                        setTimeout(() => navigate('/dashboard'), 2000);
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        toast.error('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || ''
                },
                theme: {
                    color: '#10b981'
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
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
                                <p className="text-sm text-gray-400">{planId.startsWith('credits') ? 'one-time' : '/month'}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-700/50 pt-4 mt-4">
                            <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Checkout Summary</p>
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
                        onClick={handlePayment}
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
        </div>
    );
};

export default CheckoutPage;
