"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, Banknote, Building2, BookOpen, GraduationCap } from "lucide-react";

function MarketEducationPage() {
    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                delay: 0.5 + i * 0.1,
                ease: [0.25, 0.4, 0.25, 1] as any,
            },
        }),
    };

    const economicIndicators = [
        { label: "GSE All-Share Index", value: "12,456.78", change: "+1.2%", tone: "up", icon: TrendingUp },
        { label: "Inflation Rate", value: "32.1%", change: "-0.5%", tone: "down", icon: DollarSign },
        { label: "GDP Growth", value: "3.8%", change: "+0.2%", tone: "up", icon: Banknote },
        { label: "Interest Rate", value: "27.0%", change: "+0.25%", tone: "up", icon: Building2 }
    ];

    const educationalArticles = [
        {
            category: "Press Release",
            title: "GSE Press Releases & Announcements",
            author: "Ghana Stock Exchange",
            date: "2026",
            readTime: "5 min read",
            icon: TrendingUp,
            link: "https://gse.com.gh/press-release/"
        },
        {
            category: "Media",
            title: "GSE Testimonial Video",
            author: "Ghana Stock Exchange",
            date: "2026",
            readTime: "3 min watch",
            icon: DollarSign,
            link: "https://gse.com.gh/gse-testimonial-video/"
        },
        {
            category: "Financial Reports",
            title: "Financial Statements & Filings",
            author: "Ghana Stock Exchange",
            date: "2026",
            readTime: "10 min read",
            icon: Banknote,
            link: "https://gse.com.gh/financial-statements/"
        },
        {
            category: "Market Notices",
            title: "GSE Market Notices & Circulars",
            author: "Ghana Stock Exchange",
            date: "2026",
            readTime: "5 min read",
            icon: Building2,
            link: "https://gse.com.gh/gse-market-notice/"
        },
        {
            category: "Articles",
            title: "GSE Educational Articles",
            author: "Ghana Stock Exchange",
            date: "2026",
            readTime: "15 min read",
            icon: BookOpen,
            link: "http://gse.com.gh/gse-articles/"
        },
        {
            category: "Resources",
            title: "GSE Brochures & Guides",
            author: "Ghana Stock Exchange",
            date: "2026",
            readTime: "8 min read",
            icon: GraduationCap,
            link: "https://gse.com.gh/gse-brochures/"
        }
    ];

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-canvas">
            <div className="absolute inset-0 bg-gradient-to-br from-ink/[0.05] via-transparent to-ink/[0.05] blur-3xl" />

            <div className="page-container relative z-10 py-12 sm:py-16 md:py-20">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        custom={0}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 tracking-tight font-poppins">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-ink to-ink/80">
                                Market Education
                            </span>
                        </h1>
                        <p className="text-xl text-ink/60 max-w-2xl mx-auto leading-relaxed">
                            Master financial markets, economic indicators, and investment strategies through expert insights and comprehensive educational resources.
                        </p>
                    </motion.div>

                    <motion.div
                        custom={1}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20"
                    >
                        {economicIndicators.map((indicator) => (
                            <Card
                                key={indicator.label}
                                className="bg-ink/[0.02] border border-ink/[0.08] hover:bg-ink/[0.04] transition-all"
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-lg bg-ink/[0.05]">
                                            <indicator.icon className="h-5 w-5 text-ink/60" />
                                        </div>
                                        <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider">
                                            {indicator.label}
                                        </p>
                                    </div>
                                    <p className={`text-2xl font-bold mb-1 ${indicator.tone === "up" ? "text-emerald-400" : indicator.tone === "down" ? "text-rose-400" : "text-ink"}`}>
                                        {indicator.value}
                                    </p>
                                    <p className={`text-xs font-medium ${indicator.tone === "up" ? "text-emerald-400" : indicator.tone === "down" ? "text-rose-400" : "text-ink/60"}`}>
                                        {indicator.change}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>

                    <motion.div
                        custom={2}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="mb-20"
                    >
                        <h2 className="text-3xl font-bold mb-8 text-left font-poppins">Recent Educational Articles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {educationalArticles.map((article, index) => (
                                <motion.a
                                    key={article.title}
                                    href={article.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    custom={index}
                                    variants={fadeUpVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="block p-8 rounded-3xl bg-ink/[0.02] border border-ink/[0.08] hover:border-ink/20 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="p-3 rounded-lg bg-ink/[0.05]">
                                            <article.icon size={32} className="text-ink/20" />
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-ink/30 mb-4 block group-hover:text-ink/60 transition-colors">
                                        {article.category}
                                    </span>
                                    <h3 className="text-xl font-bold text-ink mb-4 leading-tight group-hover:translate-x-1 transition-transform">
                                        {article.title}
                                    </h3>
                                    <p className="text-sm text-ink/60 mb-2">
                                        By {article.author}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-ink/20">
                                        <span>{article.date}</span>
                                        <span>{article.readTime}</span>
                                    </div>
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}

export default MarketEducationPage;
