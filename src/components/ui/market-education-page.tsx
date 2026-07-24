"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, Clock, DollarSign, Users, Newspaper, Cpu } from "lucide-react";

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
        { label: "GSE All-Share Index", value: "12,456.78", change: "+1.2%", tone: "up" },
        { label: "Inflation Rate", value: "32.1%", change: "-0.5%", tone: "down" },
        { label: "GDP Growth", value: "3.8%", change: "+0.2%", tone: "up" },
        { label: "Interest Rate", value: "27.0%", change: "+0.25%", tone: "up" }
    ];

    const educationalArticles = [
        {
            category: "Market Analysis",
            title: "Understanding Technical Analysis in the GSE",
            author: "Kwame Asante",
            date: "Jan 8, 2026",
            readTime: "12 min read",
            image: "📈"
        },
        {
            category: "Economics",
            title: "Monetary Policy Impact on Stock Markets",
            author: "Dr. Ama Nkrumah",
            date: "Jan 7, 2026",
            readTime: "15 min read",
            image: "💰"
        },
        {
            category: "Investing",
            title: "Dividend Investing Strategy for GSE Stocks",
            author: "Kofi Boakye",
            date: "Jan 6, 2026",
            readTime: "10 min read",
            image: "💸"
        },
        {
            category: "Sector Analysis",
            title: "Banking Sector Outlook 2026",
            author: "Esi Agyei",
            date: "Jan 5, 2026",
            readTime: "8 min read",
            image: "🏦"
        }
    ];

    const learningModules = [
        {
            title: "Economic Indicators Explained",
            description: "Master the key economic metrics that drive market movements and stock performance.",
            lessons: 8,
            level: "Intermediate",
            duration: "3 weeks",
            students: "2,341"
        },
        {
            title: "GSE Sector Analysis",
            description: "Deep dive into the six major sectors of the Ghana Stock Exchange and their performance drivers.",
            lessons: 12,
            level: "Advanced",
            duration: "4 weeks",
            students: "892"
        },
        {
            title: "Financial Statement Analysis",
            description: "Learn how to read balance sheets, income statements, and cash flow statements of GSE companies.",
            lessons: 10,
            level: "Beginner",
            duration: "2.5 weeks",
            students: "3,567"
        }
    ];

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-canvas">
            <div className="absolute inset-0 bg-gradient-to-br from-ink/[0.05] via-transparent to-ink/[0.05] blur-3xl" />

            <div className="page-container relative z-10 py-20">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        custom={0}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-center mb-16"
                    >
                        <Badge className="mb-6 bg-ink/[0.03] border border-ink/[0.08]">
                            Educate & Grow
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight font-poppins">
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
                        {economicIndicators.map((indicator, index) => (
                            <Card
                                key={indicator.label}
                                className="bg-ink/[0.02] border border-ink/[0.08] hover:bg-ink/[0.04] transition-all"
                            >
                                <CardContent className="p-6">
                                    <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-2">
                                        {indicator.label}
                                    </p>
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
                                <motion.div
                                    key={article.title}
                                    custom={index}
                                    variants={fadeUpVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="p-8 rounded-3xl bg-gradient-to-br from-ink/[0.05] to-transparent border border-ink/[0.08] hover:border-ink/20 transition-all cursor-pointer group"
                                >
                                    <div className="text-4xl mb-6">
                                        {article.image}
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
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        custom={3}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <h2 className="text-3xl font-bold mb-8 text-left font-poppins">Learning Modules</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {learningModules.map((module, index) => (
                                <Card
                                    key={module.title}
                                    className="bg-ink/[0.02] border border-ink/[0.08] hover:bg-ink/[0.04] transition-all duration-300 group"
                                >
                                    <CardContent className="p-8">
                                        <h3 className="text-xl font-bold mb-4 font-poppins group-hover:text-ink transition-colors">
                                            {module.title}
                                        </h3>
                                        <p className="text-sm text-ink/60 mb-6 leading-relaxed">
                                            {module.description}
                                        </p>
                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-ink/40">Level:</span>
                                                <span className="font-medium">{module.level}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-ink/40">Duration:</span>
                                                <span className="font-medium">{module.duration}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-ink/40">Lessons:</span>
                                                <span className="font-medium">{module.lessons}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-ink/40">Students:</span>
                                                <span className="font-medium">{module.students}</span>
                                            </div>
                                        </div>
                                        <button className="w-full py-3 px-4 bg-ink/5 border border-ink/[0.08] rounded-xl font-medium text-sm hover:bg-ink/[0.08] hover:border-ink/20 transition-colors">
                                            Start Module
                                        </button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default MarketEducationPage;
