"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Newspaper, TrendingUp, Brain, BarChart3, Database } from "lucide-react";

function LearningCenterPage() {
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

    const featuredArticles = [
        {
            category: "Featured Analysis",
            title: "MTN Ghana: Why Analysts are Bullish for Q3 2026",
            snippet: "A deep dive into the telco giant's expanding mobile money ecosystem and its impact on dividend yields.",
            date: "Jan 5, 2026",
            readTime: "8 min read"
        },
        {
            category: "Stock of the Week",
            title: "GCB Bank PLC (GCB)",
            snippet: "Stable growth and digital transformation makes GCB a top pick for retail investors this quarter.",
            date: "Jan 4, 2026",
            readTime: "6 min read"
        },
        {
            category: "Market Summary",
            title: "Week in Review: GSE Composite Index Gains 2.4%",
            snippet: "Financial stocks lead the rally as inflation fears subside and local investor participation hits record highs.",
            date: "Jan 3, 2026",
            readTime: "10 min read"
        },
        {
            category: "Beginner",
            title: "Understanding EPS: A Beginner's Guide",
            snippet: "Explaining earnings per share in simple terms for new investors getting started in the GSE.",
            date: "Dec 30, 2025",
            readTime: "5 min read"
        },
        {
            category: "Market Insights",
            title: "Sector Rotation: From Banking to Tech",
            snippet: "Analyzing the shift in investor preferences between traditional banking and emerging technology companies.",
            date: "Dec 28, 2025",
            readTime": "7 min read"
        },
        {
            category: "Economic Outlook",
            title: "Inflation Outlook and Monetary Policy Impact",
            snippet: "How Bank of Ghana's recent policy decisions will affect stock market performance in 2026.",
            date: "Dec 26, 2025",
            readTime: "9 min read"
        }
    ];

    const courses = [
        {
            title: "GSE Fundamentals",
            description: "A comprehensive introduction to Ghana Stock Exchange operations, trading, and investment strategies.",
            duration: "2 weeks",
            level: "Beginner",
            lessons: 12,
            students: "1,234"
        },
        {
            title: "Technical Analysis Masterclass",
            description: "Advanced chart patterns, indicators, and price action strategies for GSE stocks.",
            duration: "4 weeks",
            level: "Advanced",
            lessons: 24,
            students: "567"
        },
        {
            title: "Fundamental Stock Analysis",
            description: "Learning how to evaluate company financials, valuation, and growth prospects.",
            duration: "3 weeks",
            level: "Intermediate",
            lessons: 18,
            students: "892"
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
                            Expand Your Knowledge
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight font-poppins">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-ink to-ink/80">
                                Learning Center
                            </span>
                        </h1>
                        <p className="text-xl text-ink/60 max-w-2xl mx-auto leading-relaxed">
                            Expert analysis, educational content, and courses to help you navigate the Ghana Stock Exchange with confidence.
                        </p>
                    </motion.div>

                    <motion.div
                        custom={1}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="mb-20"
                    >
                        <h2 className="text-3xl font-bold mb-8 text-left font-poppins">Featured Articles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {featuredArticles.map((article, index) => (
                                <motion.div
                                    key={article.title}
                                    custom={index}
                                    variants={fadeUpVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="p-8 rounded-3xl bg-gradient-to-br from-ink/[0.05] to-transparent border border-ink/[0.08] hover:border-ink/20 transition-all cursor-pointer group"
                                >
                                    <span className="text-xs font-bold uppercase tracking-widest text-ink/30 mb-4 block group-hover:text-ink/60 transition-colors">
                                        {article.category}
                                    </span>
                                    <h3 className="text-xl font-bold text-ink mb-4 leading-tight group-hover:translate-x-1 transition-transform">
                                        {article.title}
                                    </h3>
                                    <p className="text-sm text-ink/40 mb-6 leading-relaxed">
                                        {article.snippet}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-ink/20">
                                        <span>{article.date}</span>
                                        <span className="flex items-center gap-1 group-hover:text-ink transition-colors">
                                            Read Article <TrendingUp size={10} />
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        custom={2}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <h2 className="text-3xl font-bold mb-8 text-left font-poppins">Learning Courses</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {courses.map((course, index) => (
                                <Card
                                    key={course.title}
                                    className="bg-ink/[0.02] border border-ink/[0.08] hover:bg-ink/[0.04] transition-all duration-300 group"
                                >
                                    <CardContent className="p-8">
                                        <h3 className="text-xl font-bold mb-4 font-poppins group-hover:text-ink transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-ink/60 mb-6 leading-relaxed">
                                            {course.description}
                                        </p>
                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-ink/40">Level:</span>
                                                <span className="font-medium">{course.level}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-ink/40">Duration:</span>
                                                <span className="font-medium">{course.duration}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-ink/40">Lessons:</span>
                                                <span className="font-medium">{course.lessons}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-ink/40">Students:</span>
                                                <span className="font-medium">{course.students}</span>
                                            </div>
                                        </div>
                                        <button className="w-full py-3 px-4 bg-ink/5 border border-ink/[0.08] rounded-xl font-medium text-sm hover:bg-ink/[0.08] hover:border-ink/20 transition-colors">
                                            Start Course
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

export default LearningCenterPage;
