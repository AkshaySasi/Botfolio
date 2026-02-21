import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { toast } from 'sonner';
import { Mail, MessageSquare, Send, MapPin } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const ContactPage = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/contact`, formData);
            toast.success('Message sent! We\'ll get back to you within 24 hours.');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            toast.error('Failed to send message. Please try emailing us directly.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <Navbar />

            <div className="max-w-6xl mx-auto px-6 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        Get in <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">Touch</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Have a question, feedback, or need support? We'd love to hear from you.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Contact Information</h2>
                            <div className="space-y-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Email Support</p>
                                        <a href="mailto:support@botfolio.app" className="text-emerald-400 hover:underline">support@botfolio.app</a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <MessageSquare className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Response Time</p>
                                        <p className="text-gray-400">We typically respond within 24 hours on business days</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Location</p>
                                        <p className="text-gray-400">India 🇮🇳</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                            <h3 className="font-semibold text-white mb-3">Quick Links</h3>
                            <div className="space-y-2 text-sm">
                                <p><Link to="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link></p>
                                <p><Link to="/terms" className="text-emerald-400 hover:underline">Terms &amp; Conditions</Link></p>
                                <p><Link to="/pricing" className="text-emerald-400 hover:underline">Pricing Plans</Link></p>
                                <p><Link to="/dashboard" className="text-emerald-400 hover:underline">Dashboard</Link></p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/20">
                        <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Send a Message</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Name *</label>
                                    <Input
                                        placeholder="Your name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="bg-black/50 border-emerald-500/30 text-white placeholder:text-gray-600 focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Email *</label>
                                    <Input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className="bg-black/50 border-emerald-500/30 text-white placeholder:text-gray-600 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Subject *</label>
                                <Input
                                    placeholder="What's this about?"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                    className="bg-black/50 border-emerald-500/30 text-white placeholder:text-gray-600 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Message *</label>
                                <textarea
                                    placeholder="Tell us how we can help..."
                                    rows="6"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                    className="w-full bg-black/50 border border-emerald-500/30 text-white placeholder:text-gray-600 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold py-3"
                            >
                                {loading ? (
                                    'Sending...'
                                ) : (
                                    <><Send className="w-4 h-4 mr-2" />Send Message</>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            <footer className="border-t border-emerald-500/20 py-6 mt-12">
                <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
                    <p>© {new Date().getFullYear()} Botfolio. All rights reserved. &nbsp;|&nbsp;
                        <Link to="/privacy" className="hover:text-emerald-400 mx-2">Privacy</Link>
                        <Link to="/terms" className="hover:text-emerald-400 mx-2">Terms</Link>
                        <Link to="/contact" className="hover:text-emerald-400 mx-2">Contact</Link>
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default ContactPage;
