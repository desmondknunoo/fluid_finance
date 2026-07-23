"use client";

import { motion } from "framer-motion";
import { Check, Star, Globe, Shield, Users, Trophy } from "lucide-react";

const partners = [
    { name: "Ghana Stock Exchange", icon: Globe },
    { name: "Bank of Ghana", icon: Shield },
    { name: "SEC Ghana", icon: Users },
    { name: "Refinitiv", icon: Trophy }
];

const testimonials = [
    {
        quote: "The real-time indices and active movers table saved me hours of manual tracking. Fluid Finance is a game changer for GSE traders.",
        author: "Akosua O.",
        role: "Retail Investor"
    },
    {
        quote: "Professional grade analytics with the convenience of Mobile Money. Best financial tool built for the Ghanaian market.",
        author: "Eric T.",
        role: "Portfolio Manager"
    }
];

export const SocialProof = () => {
    const stats = [
        { label: "Active Investors", value: "10,000+", delay: 0.1 },
        { label: "Assets Tracked", value: "5,000+", delay: 0.2 },
        { label: "Total Volume", value: "GHS 500M+", delay: 0.3 },
        { label: "Uptime", value: "99.99%", delay: 0.4 }
    ];

    return (
        <section className="py-24 bg-black border-t border-white/[0.05]">
            <div className="container mx-auto px-4 md:px-6">
                {/* Partner Logos */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center text-xs font-bold uppercase tracking-[0.3em] text-white/20 mb-12"
                >
                    Trusted by Institutions & Data Partners
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-30 grayscale hover:opacity-60 transition-opacity mb-24"
                >
                    {partners.map((partner, idx) => (
                        <motion.div
                            key={partner.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 + idx * 0.1 }}
                            whileHover={{ scale: 1.1 }}
                            className="flex items-center gap-3"
                        >
                            <partner.icon size={24} className="text-white" />
                            <span className="font-bold text-white tracking-widest text-sm">{partner.name}</span>
                        </motion.div>
                    ))}
                </motion.div>

                {/* User Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24">
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: stat.delay }}
                            className="text-center"
                        >
                            <h4 className="text-3xl md:text-5xl font-bold text-white mb-2">{stat.value}</h4>
                            <p className="text-xs text-white/40 uppercase tracking-widest">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Testimonials */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {testimonials.map((t, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: idx === 0 ? -30 : 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.2 }}
                            whileHover={{ y: -5 }}
                            className="p-10 rounded-3xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all"
                        >
                            <div className="flex gap-1 text-white/40 mb-6">
                                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" stroke="none" />)}
                            </div>
                            <p className="text-lg text-white/80 italic mb-8">"{t.quote}"</p>
                            <div>
                                <h5 className="font-bold text-white">{t.author}</h5>
                                <p className="text-sm text-white/40">{t.role}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export const PricingPlans = () => {
    return (
        <section id="pricing" className="py-24 bg-black border-t border-white/[0.05]">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
                    <p className="text-white/40 max-w-2xl mx-auto">
                        Choose the plan that fits your trading style. From casual tracking to institutional-grade analytics.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Plan */}
                    <div className="p-10 rounded-3xl bg-white/[0.03] border border-white/[0.08] flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-2">Free Tier</h3>
                        <p className="text-sm text-white/40 mb-6 font-poppins">Delayed data for casual monitoring.</p>
                        <div className="text-4xl font-bold text-white mb-8">GHS 0<span className="text-lg text-white/30 font-normal">/mo</span></div>

                        <div className="flex flex-col gap-4 mb-12 flex-1">
                            {[
                                "15-minute delayed data",
                                "Basic stock screener",
                                "1 Personal Watchlist",
                                "Standard email alerts",
                                "Community support"
                            ].map((feature) => (
                                <div key={feature} className="flex gap-3 text-sm text-white/60 font-poppins">
                                    <Check size={18} className="text-gray-500" /> {feature}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => window.location.href = "/legacy/index.html"}
                            className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors font-poppins"
                        >
                            Get Started
                        </button>
                    </div>

                    {/* Pro Plan */}
                    <div className="p-10 rounded-3xl bg-white/[0.06] border border-white/20 flex flex-col relative overflow-hidden">
                        <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-widest">
                            Most Popular
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 font-poppins">Pro Tier</h3>
                        <p className="text-sm text-white/40 mb-6 font-poppins">Real-time data for serious traders.</p>
                        <div className="text-4xl font-bold text-white mb-8">GHS 99<span className="text-lg text-white/30 font-normal">/mo</span></div>

                        <div className="flex flex-col gap-4 mb-12 flex-1">
                            {[
                                "Real-time GSE market data",
                                "Advanced technical indicators",
                                "Unlimited watchlists",
                                "SMS & WhatsApp alerts",
                                "Priority concierge support",
                                "Export to CSV/Excel"
                            ].map((feature) => (
                                <div key={feature} className="flex gap-3 text-sm text-white font-poppins">
                                    <Check size={18} className="text-white" /> {feature}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => window.location.href = "/legacy/index.html"}
                            className="w-full py-4 rounded-xl bg-white text-black font-medium hover:bg-gray-200 transition-colors font-poppins shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        >
                            Go Pro Now
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};
