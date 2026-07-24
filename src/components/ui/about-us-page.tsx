"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Newspaper, BarChart3, Database, Mail, ArrowUpRight } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/links";
import { SOCIAL_ICONS } from "@/components/ui/social-icons";

function AboutUsPage() {
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

    const pillars = [
        {
            icon: BookOpen,
            title: "Financial Literacy Publishing",
            description: "Well-researched publications, insightful analysis, and practical learning resources that empower audiences to develop stronger financial awareness and make more informed decisions."
        },
        {
            icon: Newspaper,
            title: "Market Insights & Economic Education",
            description: "Delivering real-time financial news, educational content, market insights, and analytical tools covering business trends, economic developments, and market movements."
        },
        {
            icon: BarChart3,
            title: "Financial Intelligence & Data Analytics",
            description: "Transforming economic indicators, investment strategies, corporate developments, and market trends into meaningful insights that help users understand the forces shaping their financial environment."
        },
        {
            icon: Database,
            title: "Centralized Financial Hub",
            description: "A unified digital platform where users access personal finance, investing, business trends, economic developments, and market movements — eliminating the need for multiple fragmented sources."
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
                                About Fluid Finance
                            </span>
                        </h1>
                        <p className="text-xl text-ink/60 max-w-2xl mx-auto leading-relaxed font-light">
                            Decisions that Build Wealth
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
<motion.div
                        custom={1}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="lg:col-span-2"
                    >
                        <Card className="bg-ink/[0.02] border border-ink/[0.08]">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-lg bg-ink/[0.05]">
                                        <BookOpen className="h-6 w-6 text-ink/60" />
                                    </div>
                                    <h2 className="text-2xl font-bold font-poppins">Our Mission</h2>
                                </div>
                                <div className="space-y-4 text-ink/70 leading-relaxed">
                                        <p>
                                            Decisions that Build Wealth
                                        </p>
                                        <p>
                                            At the core of Fluid Finance is the belief that financial education should be accessible, engaging, and actionable. We focus on key areas including financial literacy publishing, business and economic education, investment knowledge, stock market education, and broader financial intelligence. By delivering well-researched publications, insightful analysis, and practical learning resources, we empower our audience to develop stronger financial awareness and make more informed decisions.
                                        </p>
                                        <p>
                                            Our platform serves as a centralized financial information hub, bringing together financial news, educational content, market insights, and analytical tools within a unified digital experience. Users can access relevant information on personal finance, investing, business trends, economic developments, and market movements — eliminating the need to rely on multiple fragmented sources.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    <motion.div
                        custom={2}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="mb-20"
                    >
                        <h2 className="text-3xl font-bold mb-8 text-center font-poppins">Our Core Pillars</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {pillars.map((pillar) => (
                                <Card
                                    key={pillar.title}
                                    className="bg-ink/[0.02] border border-ink/[0.08] hover:bg-ink/[0.04] transition-colors duration-300"
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-lg bg-ink/[0.05]">
                                                <pillar.icon className="h-6 w-6 text-ink/60" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold mb-2 font-poppins">{pillar.title}</h3>
                                                <p className="text-ink/60 text-sm leading-relaxed">{pillar.description}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        custom={3}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <Card className="bg-gradient-to-br from-ink/[0.05] to-transparent border border-ink/[0.1]">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-lg bg-ink/[0.05]">
                                        <BarChart3 className="h-6 w-6 text-ink/60" />
                                    </div>
                                    <h2 className="text-2xl font-bold font-poppins">Our Vision</h2>
                                </div>
                                <div className="space-y-4 text-ink/70 leading-relaxed">
                                    <p>
                                        Through our content and technology platforms, Fluid Finance is committed to simplifying complex financial concepts and transforming them into clear, accessible, and engaging experiences. We translate economic indicators, investment strategies, corporate developments, and market trends into meaningful insights that help users better understand the forces shaping their financial environment.
                                    </p>
                                    <p>
                                        Beyond education, Fluid Finance focuses on developing digital financial platforms that enhance how individuals interact with financial information. By combining data-driven tools, interactive experiences, and modern publishing capabilities, we are building a next-generation finance media company that goes beyond traditional financial reporting to deliver knowledge, analysis, and practical value.
                                    </p>
                                    <p>
                                        The integration of our strong foundation in educational publishing with the continuous development of innovative financial technology platforms creates a powerful synergy. This positions Fluid Finance not only as a source of financial information but as a dynamic financial intelligence platform — connecting education, media, technology, and market insights to support a more financially informed society.
                                    </p>
                                    <p>
                                        Through this approach, Fluid Finance aims to become a trusted partner for individuals seeking financial growth, businesses seeking economic understanding, and communities seeking greater financial empowerment.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        custom={4}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="mt-20"
                    >
                        <Card className="bg-ink/[0.02] border border-ink/[0.08]">
                            <CardContent className="p-8">
                                <div className="text-center mb-8">
                                    <div className="flex items-center justify-center gap-4 mb-4">
                                        <div className="p-3 rounded-lg bg-ink/[0.05]">
                                            <Mail className="h-6 w-6 text-ink/60" />
                                        </div>
                                        <h2 className="text-2xl font-bold font-poppins">Connect With Us</h2>
                                    </div>
                                    <p className="text-ink/60 max-w-lg mx-auto">
                                        Join our community for financial insights, market updates, and educational content.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    {SOCIAL_LINKS.map((social) => {
                                        const Icon = SOCIAL_ICONS[social.key];
                                        return (
                                            <motion.a
                                                key={social.key}
                                                href={social.href}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                aria-label={`Follow Fluid Finance on ${social.label}`}
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                whileTap={{ scale: 0.97 }}
                                                className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-fluid-cyan/10 border border-fluid-cyan/25 hover:bg-fluid-cyan/20 hover:border-fluid-cyan/40 transition-all duration-200 group"
                                            >
                                                <Icon size={20} className="text-fluid-cyan-ink/70 group-hover:text-fluid-cyan-ink transition-colors" />
                                                <span className="text-sm font-medium text-fluid-cyan-ink group-hover:text-fluid-cyan-ink transition-colors font-poppins">{social.label}</span>
                                                <ArrowUpRight size={14} className="text-fluid-cyan-ink/40 group-hover:text-fluid-cyan-ink/70 transition-colors" />
                                            </motion.a>
                                        );
                                    })}
                                    <motion.a
                                        href="mailto:info@fluidterra.com"
                                        aria-label="Email Fluid Finance"
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-fluid-cyan/10 border border-fluid-cyan/25 hover:bg-fluid-cyan/20 hover:border-fluid-cyan/40 transition-all duration-200 group"
                                    >
                                        <Mail size={20} className="text-fluid-cyan-ink/70 group-hover:text-fluid-cyan-ink transition-colors" />
                                        <span className="text-sm font-medium text-fluid-cyan-ink group-hover:text-fluid-cyan-ink transition-colors font-poppins">Email Us</span>
                                        <ArrowUpRight size={14} className="text-fluid-cyan-ink/40 group-hover:text-fluid-cyan-ink/70 transition-colors" />
                                    </motion.a>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default AboutUsPage;
