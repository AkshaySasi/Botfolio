import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import {
    Upload, MessageCircle, Globe, Zap, CheckCircle, ArrowRight,
    FileText, Brain, Share2, Users, ChevronDown,
} from 'lucide-react';

/* ── helpers ─────────────────────────────────────────────────────────── */
const useInView = (threshold = 0.2) => {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setInView(true); },
            { threshold }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, inView];
};

/* ── Animated chatbot demo ──────────────────────────────────────────── */
const ChatDemo = () => {
    const messages = [
        { from: 'user', text: 'What are your top skills?' },
        { from: 'bot', text: 'I specialize in React, Python, and AI/ML. I\'ve built 10+ production apps!' },
        { from: 'user', text: 'Do you have leadership experience?' },
        { from: 'bot', text: 'Yes! I led a team of 5 engineers at my last role, shipping 3 major features.' },
    ];
    const [visible, setVisible] = useState(0);
    const [ref, inView] = useInView(0.3);

    useEffect(() => {
        if (!inView) return;
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setVisible(i);
            if (i >= messages.length) clearInterval(interval);
        }, 900);
        return () => clearInterval(interval);
    }, [inView]);

    return (
        <div
            ref={ref}
            className="bg-[#0d0d0d] border border-emerald-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/5 w-full max-w-sm mx-auto"
        >
            {/* Browser chrome */}
            <div className="bg-[#111] border-b border-emerald-500/15 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                </div>
                <div className="flex-1 mx-3 bg-black/60 rounded-md px-3 py-1 text-xs text-gray-500 font-mono">
                    botfolio.live/<span className="text-emerald-400">yourname</span>
                </div>
            </div>

            {/* Chat area */}
            <div className="p-4 space-y-3 min-h-[200px]">
                {messages.slice(0, visible).map((m, i) => (
                    <div
                        key={i}
                        className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                        {m.from === 'bot' && (
                            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${m.from === 'user'
                                    ? 'bg-emerald-500/20 text-emerald-200 rounded-tr-sm'
                                    : 'bg-white/5 text-gray-200 rounded-tl-sm border border-white/5'
                                }`}
                        >
                            {m.text}
                        </div>
                    </div>
                ))}

                {/* Typing dot indicator */}
                {visible < messages.length && visible > 0 && visible % 2 === 0 && (
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-2xl rounded-tl-sm flex gap-1">
                            {[0, 1, 2].map(d => (
                                <div
                                    key={d}
                                    className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
                                    style={{ animationDelay: `${d * 150}ms` }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Input row */}
            <div className="border-t border-emerald-500/10 px-4 py-3 flex gap-2">
                <div className="flex-1 bg-black/40 rounded-full px-4 py-2 text-xs text-gray-600 border border-white/5">
                    Ask me anything…
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-3.5 h-3.5 text-black" />
                </div>
            </div>
        </div>
    );
};

/* ── Step card ────────────────────────────────────────────────────────── */
const Step = ({ number, icon: Icon, title, desc, color, delay, active }) => (
    <div
        className={`transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{ transitionDelay: `${delay}ms` }}
    >
        <div className={`relative p-6 sm:p-8 rounded-2xl border bg-[#0d0d0d] hover:shadow-xl transition-shadow group ${color}`}>
            {/* Step number */}
            <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-[#0a0a0a] border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">
                {number}
            </div>
            <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${color.replace('border-', 'bg-').replace('/20', '/10')}`}>
                <Icon className={`w-6 h-6 ${color.includes('emerald') ? 'text-emerald-400' : color.includes('blue') ? 'text-blue-400' : color.includes('purple') ? 'text-purple-400' : 'text-lime-400'}`} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
        </div>
    </div>
);

/* ── FAQ item ──────────────────────────────────────────────────────────── */
const FAQ = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-emerald-500/15 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-emerald-500/5 transition-colors"
            >
                <span className="text-white font-medium text-sm">{q}</span>
                <ChevronDown className={`w-4 h-4 text-emerald-400 flex-shrink-0 ml-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed animate-fade-in">
                    {a}
                </div>
            )}
        </div>
    );
};

/* ── Main page ─────────────────────────────────────────────────────────── */
const HowItWorksPage = () => {
    const [stepsRef, stepsInView] = useInView(0.1);
    const [flowRef, flowInView] = useInView(0.15);

    const steps = [
        {
            number: '01', icon: Upload, color: 'border-emerald-500/20',
            title: 'Upload Your Resume',
            desc: 'Drag & drop your resume (PDF) and any supporting documents. Our AI reads and indexes every detail—skills, experience, projects, certifications.',
        },
        {
            number: '02', icon: Brain, color: 'border-blue-500/20',
            title: 'AI Trains Your Chatbot',
            desc: 'In seconds, we build a personal RAG (Retrieval-Augmented Generation) model from your data. It learns your voice, achievements, and expertise.',
        },
        {
            number: '03', icon: Globe, color: 'border-purple-500/20',
            title: 'Publish & Share',
            desc: 'Get a sleek, unique URL — botfolio.live/yourname. Share it on LinkedIn, your email signature, or with recruiters directly.',
        },
        {
            number: '04', icon: Users, color: 'border-lime-500/20',
            title: 'Recruiters Chat 24/7',
            desc: 'Anyone can visit your link and ask the AI questions about you. It answers accurately, any time — even while you sleep.',
        },
    ];

    const faqs = [
        { q: 'How accurate is the chatbot?', a: 'The chatbot only answers based on the documents you upload, so it\'s accurate to whatever you provide. It won\'t hallucinate details not in your resume.' },
        { q: 'Can I update my portfolio later?', a: 'Yes! You can delete your current portfolio and create a new one with updated documents. Pro users can manage multiple portfolios simultaneously.' },
        { q: 'Is my data safe?', a: 'Absolutely. Your documents and personal data are encrypted at rest. We never share your data with third parties. See our Privacy Policy for full details.' },
        { q: 'What file types do you support?', a: 'We currently support PDF and DOCX formats for resume and document uploads. Best results come from text-based PDFs rather than scanned images.' },
        { q: 'How many messages can visitors send?', a: 'Free plan portfolios allow 5 AI interactions per day. Upgrade to Starter or Pro for 50+ daily interactions, giving every recruiter a full conversation.' },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <Navbar />

            {/* ─── Hero ─── */}
            <section className="relative overflow-hidden py-20 sm:py-32 px-4">
                {/* Animated blob bg */}
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/8 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6 text-sm text-emerald-400">
                        <Zap className="w-4 h-4" />
                        Simple · Fast · Powerful
                    </div>
                    <h1
                        className="text-4xl sm:text-6xl font-bold leading-tight mb-6"
                        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                    >
                        How{' '}
                        <span className="bg-gradient-to-r from-emerald-400 via-lime-400 to-yellow-400 bg-clip-text text-transparent">
                            Botfolio
                        </span>{' '}
                        Works
                    </h1>
                    <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
                        From resume upload to a live AI-powered portfolio chatbot in under 5 minutes.
                        No coding. No design skills. Just your story.
                    </p>
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold rounded-xl transition-all hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5"
                    >
                        Get Started Free <ArrowRight className="w-4.5 h-4.5" />
                    </Link>
                </div>
            </section>

            {/* ─── Live Demo animation ─── */}
            <section className="py-16 px-4" ref={flowRef}>
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            See it in action
                        </h2>
                        <p className="text-gray-400 max-w-xl mx-auto">Watch a live demo of a Botfolio AI chatbot answering real recruiter questions</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10 items-center">
                        <ChatDemo />

                        {/* Feature highlights */}
                        <div className="space-y-4">
                            {[
                                { icon: CheckCircle, color: 'text-emerald-400', title: 'Knows every detail of your resume', desc: 'Skills, experience, certifications, projects — all instantly accessible.' },
                                { icon: CheckCircle, color: 'text-emerald-400', title: 'Answers in your voice', desc: 'The AI adapts to your background and answers appropriately for your field.' },
                                { icon: CheckCircle, color: 'text-emerald-400', title: 'Available 24/7 worldwide', desc: 'Recruiters in any timezone can explore your portfolio without scheduling a call.' },
                                { icon: CheckCircle, color: 'text-lime-400', title: 'No hallucination — data-grounded', desc: 'Only answers from your documents. Zero made-up details.' },
                            ].map(({ icon: Icon, color, title, desc }, i) => (
                                <div
                                    key={i}
                                    className={`flex gap-4 p-4 rounded-xl bg-white/2 border border-white/5 hover:border-emerald-500/20 transition-all ${flowInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
                                    style={{ transition: `all 0.5s ease ${i * 100}ms` }}
                                >
                                    <Icon className={`w-5 h-5 ${color} flex-shrink-0 mt-0.5`} />
                                    <div>
                                        <p className="text-white text-sm font-semibold mb-1">{title}</p>
                                        <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── 4 Steps ─── */}
            <section className="py-16 px-4 bg-gradient-to-b from-transparent to-black/20" ref={stepsRef}>
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            4 steps to your{' '}
                            <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">AI portfolio</span>
                        </h2>
                        <p className="text-gray-400 max-w-xl mx-auto">Follow these simple steps and your smart portfolio chatbot will be live in minutes.</p>
                    </div>

                    {/* Connecting line (desktop) */}
                    <div className="hidden lg:block absolute left-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent pointer-events-none" style={{ width: '60%', transform: 'translateX(-50%)' }} />

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-4">
                        {steps.map((s, i) => (
                            <Step key={i} {...s} delay={i * 120} active={stepsInView} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Flow diagram (visual) ─── */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            The technology behind it
                        </h2>
                    </div>
                    <div className="relative">
                        {/* Flow nodes */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                            {[
                                { label: 'Your Resume', icon: FileText, color: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/30', text: 'text-emerald-400' },
                                { label: 'RAG Engine', icon: Brain, color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/30', text: 'text-blue-400' },
                                { label: 'Gemini AI', icon: Zap, color: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/30', text: 'text-purple-400' },
                                { label: 'Your Chatbot', icon: Share2, color: 'from-lime-500/20 to-lime-500/5', border: 'border-lime-500/30', text: 'text-lime-400' },
                            ].map(({ label, icon: Icon, color, border, text }, i, arr) => (
                                <React.Fragment key={label}>
                                    <div className={`flex flex-col items-center gap-3 px-6 py-5 rounded-2xl bg-gradient-to-br border ${color} ${border} min-w-[120px] text-center`}>
                                        <Icon className={`w-7 h-7 ${text}`} />
                                        <span className={`text-sm font-semibold ${text}`}>{label}</span>
                                    </div>
                                    {i < arr.length - 1 && (
                                        <div className="flex items-center">
                                            <ArrowRight className="w-5 h-5 text-gray-600 rotate-90 sm:rotate-0" />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                        <p className="text-center text-gray-500 text-sm mt-8 max-w-xl mx-auto">
                            Your documents are embedded into a vector store. When a recruiter asks a question, the RAG engine finds the most relevant context and Gemini AI generates a precise, natural answer.
                        </p>
                    </div>
                </div>
            </section>

            {/* ─── FAQ ─── */}
            <section className="py-16 px-4">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        Frequently asked questions
                    </h2>
                    <div className="space-y-3">
                        {faqs.map((f, i) => <FAQ key={i} {...f} />)}
                    </div>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="py-20 px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="p-10 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-lime-500/5 to-transparent border border-emerald-500/20">
                        <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            Ready to build yours?
                        </h2>
                        <p className="text-gray-400 mb-8">
                            Join 94+ professionals who already have an AI portfolio that speaks for them.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black font-bold rounded-xl transition-all hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5"
                            >
                                Start for Free <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                to="/#pricing"
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
                            >
                                View Pricing
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-emerald-500/20 py-8 text-center">
                <p className="text-gray-600 text-sm">
                    <Link to="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</Link>
                    {' · '}
                    <Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms</Link>
                    {' · '}
                    <Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link>
                </p>
            </footer>
        </div>
    );
};

export default HowItWorksPage;
