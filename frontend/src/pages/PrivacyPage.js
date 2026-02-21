import React from 'react';
import Navbar from '@/components/Navbar';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Privacy <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">Policy</span>
                </h1>
                <p className="text-gray-500 mb-10 text-sm">Last updated: February 21, 2026</p>

                <div className="space-y-10 text-gray-300 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
                        <p>Welcome to <strong className="text-emerald-400">Botfolio</strong> ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform at <a href="https://mybotfolio.vercel.app" className="text-emerald-400 hover:underline">mybotfolio.vercel.app</a>.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
                        <p className="mb-2">We collect information that you provide directly to us, including:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Name and email address (during account registration)</li>
                            <li>Resume and portfolio files you upload</li>
                            <li>Messages sent to AI chatbots on the platform</li>
                            <li>Payment information (processed securely through Razorpay — we do not store card details)</li>
                            <li>Preferences and settings you configure</li>
                        </ul>
                        <p className="mt-3">We also automatically collect certain information when you use our service:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                            <li>Log data (IP address, browser type, pages visited, timestamps)</li>
                            <li>Device information (operating system, device type)</li>
                            <li>Cookies and similar tracking technologies</li>
                            <li>Usage analytics to improve the service</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
                        <p className="mb-2">We use the information we collect to:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Provide, operate, and maintain the Botfolio platform</li>
                            <li>Generate and train AI chatbots based on your uploaded content</li>
                            <li>Process payments and manage subscriptions</li>
                            <li>Send transactional emails and service notifications</li>
                            <li>Analyze usage patterns and improve our services</li>
                            <li>Respond to your inquiries and provide customer support</li>
                            <li>Display relevant advertisements through Google AdSense</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. Cookies and Tracking</h2>
                        <p className="mb-2">We use cookies and similar technologies to:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Keep you logged in to your account</li>
                            <li>Remember your preferences</li>
                            <li>Analyze traffic and usage patterns</li>
                            <li>Serve personalized advertisements via Google AdSense</li>
                        </ul>
                        <p className="mt-3"><strong className="text-white">Google AdSense:</strong> We use Google AdSense to display advertisements. Google uses cookies to serve ads based on your prior visits to our website or other websites. You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer">Google Ad Settings</a>.</p>
                        <p className="mt-2">You can control cookies through your browser settings. Disabling cookies may affect the functionality of our service.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">5. Data Sharing and Disclosure</h2>
                        <p className="mb-2">We do not sell your personal data. We may share your information with:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><strong className="text-white">Supabase:</strong> Database and file storage provider</li>
                            <li><strong className="text-white">Google (Gemini API):</strong> AI processing for chatbot responses</li>
                            <li><strong className="text-white">Razorpay:</strong> Payment processing</li>
                            <li><strong className="text-white">Vercel:</strong> Frontend hosting</li>
                            <li><strong className="text-white">Render:</strong> Backend hosting</li>
                            <li>Law enforcement or government bodies when required by law</li>
                        </ul>
                        <p className="mt-3">All third-party service providers are bound by their own privacy policies and data protection agreements.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
                        <p>We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us. Uploaded portfolio files are deleted from our servers when you delete your portfolio or close your account.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
                        <p className="mb-2">Depending on your location, you may have the right to:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Access the personal data we hold about you</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Object to or restrict our processing of your data</li>
                            <li>Data portability</li>
                            <li>Withdraw consent at any time</li>
                        </ul>
                        <p className="mt-3">To exercise these rights, contact us at <a href="mailto:privacy@botfolio.app" className="text-emerald-400 hover:underline">privacy@botfolio.app</a>.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">8. Security</h2>
                        <p>We implement industry-standard security measures including HTTPS encryption, secure database storage, and access controls. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">9. Children's Privacy</h2>
                        <p>Our service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
                        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a notice on our website. Continued use of the service after changes constitutes acceptance of the updated policy.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">11. Contact Us</h2>
                        <p>If you have questions about this Privacy Policy, please contact us:</p>
                        <ul className="list-none space-y-1 mt-2 ml-2">
                            <li>📧 Email: <a href="mailto:privacy@botfolio.app" className="text-emerald-400 hover:underline">privacy@botfolio.app</a></li>
                            <li>🌐 Website: <Link to="/contact" className="text-emerald-400 hover:underline">Contact Form</Link></li>
                        </ul>
                    </section>
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

export default PrivacyPage;
