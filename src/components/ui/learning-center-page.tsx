"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, GraduationCap, FileText, BookOpen } from "lucide-react";

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
            category: "Training",
            title: "BOG Center for Training & Capacity Development",
            snippet: "Official training programs and capacity development resources from the Bank of Ghana.",
            icon: GraduationCap,
            link: "https://www.bog.gov.gh/the-center-for-training-and-capacity-development/"
        },
        {
            category: "Training",
            title: "SEC Corporate Training Programs",
            snippet: "Professional development and corporate training offerings from the Securities and Exchange Commission.",
            icon: BookOpen,
            link: "https://sec.gov.gh/corporate-training/"
        },
        {
            category: "Courses",
            title: "ISOSEC Certified Security Courses",
            snippet: "Certified security courses and professional qualifications from the Institute of Securities Studies.",
            icon: FileText,
            link: "https://isosecghanaltd.com/certified-security-courses/"
        },
        {
            category: "Institute",
            title: "Ghana Securities Institute",
            snippet: "Comprehensive securities education and professional development programs.",
            icon: GraduationCap,
            link: "https://www.gisinstitute.org/"
        },
        {
            category: "Calendar",
            title: "GIS Training Calendar",
            snippet: "Upcoming training sessions and workshops from the Ghana Securities Institute.",
            icon: TrendingUp,
            link: "https://www.gisinstitute.org/training-calendar"
        },
        {
            category: "Courses",
            title: "ISOSEC Course Catalog",
            snippet: "Full range of courses offered by the Institute of Securities Studies.",
            icon: BookOpen,
            link: "https://isosecghanaltd.com/courses"
        },
        {
            category: "Regulation",
            title: "SEC Insider Trading Guidelines 2026",
            snippet: "Public consultation on draft securities industry insider trading guidelines.",
            icon: FileText,
            link: "https://sec.gov.gh/call-for-feedback-on-the-draft-securities-industry-insider-trading-guidelines-2026/"
        },
        {
            category: "Regulation",
            title: "SEC Commercial Papers Directive",
            snippet: "Directive to market operators on investments in commercial papers.",
            icon: FileText,
            link: "https://sec.gov.gh/directive-to-market-operators-on-investments-in-commercial-papers/"
        }
    ];

    const courses = [
        {
            title: "GSE Fundamentals",
            description: "A comprehensive introduction to Ghana Stock Exchange operations, trading, and investment strategies.",
            duration: "2 weeks",
            level: "Beginner",
            lessons: 12,
            students: "1,234",
            icon: BookOpen
        },
        {
            title: "Technical Analysis Masterclass",
            description: "Advanced chart patterns, indicators, and price action strategies for GSE stocks.",
            duration: "4 weeks",
            level: "Advanced",
            lessons: 24,
            students: "567",
            icon: TrendingUp
        },
        {
            title: "Fundamental Stock Analysis",
            description: "Learning how to evaluate company financials, valuation, and growth prospects.",
            duration: "3 weeks",
            level: "Intermediate",
            lessons: 18,
            students: "892",
            icon: FileText
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
                        <h2 className="text-3xl font-bold mb-8 text-left font-poppins">Courses and Learning</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {featuredArticles.map((article, index) => (
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
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 rounded-lg bg-ink/[0.05]">
                                            <article.icon className="h-6 w-6 text-ink/60" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-widest text-ink/30 mb-4 block group-hover:text-ink/60 transition-colors">
                                            {article.category}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-ink mb-4 leading-tight group-hover:translate-x-1 transition-transform">
                                        {article.title}
                                    </h3>
                                    <p className="text-sm text-ink/40 mb-6 leading-relaxed">
                                        {article.snippet}
                                    </p>
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default LearningCenterPage;
