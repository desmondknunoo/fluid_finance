"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Newspaper, TrendingUp, Brain, BarChart3, Database } from "lucide-react";

function ContactSupportPage() {
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

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-canvas">
            <div className="absolute inset-0 bg-gradient-to-br from-ink/[0.05] via-transparent to-ink/[0.05] blur-3xl" />

            <div className="page-container relative z-10 py-20">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        custom={0}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-center mb-12"
                    >
                        <Badge className="mb-6 bg-ink/[0.03] border border-ink/[0.08]">
                            Decisions That Build Wealth
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight font-poppins">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-ink to-ink/80">
                                Contact Support
                            </span>
                        </h1>
                        <p className="text-xl text-ink/60 max-w-2xl mx-auto leading-relaxed">
                            Reach out to our team for any questions about our financial platforms, investment strategies, or partnership opportunities.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                        <motion.div
                            custom={1}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Card className="bg-ink/[0.02] border border-ink/[0.08] backdrop-blur-sm">
                                <CardContent className="p-8">
                                    <h2 className="text-2xl font-bold mb-6 font-poppins">About Fluid Finance</h2>
                                    <div className="space-y-4 text-ink/70 leading-relaxed">
                                        <p>
                                            As a pioneering media-driven financial platform, Fluid Finance is positioned to be a comprehensive hub for financial empowerment through innovative digital platforms that merge publishing studies with active development. We believe in translating complex financial concepts into accessible, engaging educational content while keeping our audience updated on real-time market trends and macroeconomic shifts.
                                        </p>
                                        <p>
                                            Our technological edge is integrated into our development pipelines, enabling us to process complex market datasets into clear, actionable intelligence and predictive insights. This expanded scope moves us from being a pure educational resource to an active intelligence platform that significantly elevates the value for our audience.
                                        </p>
                                        <p>
                                            As we build out digital or decentralized financial platforms, our technological foundation positions us as leaders in the financial media space.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            custom={2}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Card className="bg-gradient-to-br from-ink/[0.05] to-transparent border border-ink/[0.1]">
                                <CardContent className="p-8">
                                    <h2 className="text-2xl font-bold mb-6 font-poppins">Our Core Pillars</h2>
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-lg bg-ink/[0.05]">
                                                <BookOpen className="h-6 w-6 text-ink/60" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold mb-2 font-poppins">Financial Literacy & Publication</h3>
                                                <p className="text-sm text-ink/60">Translating complex financial concepts into accessible, engaging content for wealth-building decisions.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-lg bg-ink/[0.05]">
                                                <Newspaper className="h-6 w-6 text-ink/60" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold mb-2 font-poppins">Business News & Market Education</h3>
                                                <p className="text-sm text-ink/60">Delivering real-time market updates, economic trends, and foundational education on stocks and equities.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-lg bg-ink/[0.05]">
                                                <BarChart3 className="h-6 w-6 text-ink/60" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold mb-2 font-poppins">Financial Insights & Data Analytics</h3>
                                                <p className="text-sm text-ink/60">Processing complex market datasets into clear, actionable intelligence and predictive insights.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-lg bg-ink/[0.05]">
                                                <Database className="h-6 w-6 text-ink/60" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold mb-2 font-poppins">Central Information Hub</h3>
                                                <p className="text-sm text-ink/60">Serving as the definitive, centralized platform where users access all financial news, education, and analytical tools.</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactSupportPage;
