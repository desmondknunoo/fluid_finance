"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Newspaper, TrendingUp, Brain, BarChart3, Database } from "lucide-react";

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
            title: "Financial Literacy & Publication",
            description: "Translating complex financial concepts into accessible, engaging educational content for wealth-building decisions."
        },
        {
            icon: Newspaper,
            title: "Business News & Market Education",
            description: "Delivering real-time market updates, economic trends, and foundational education on stocks and equities."
        },
        {
            icon: BarChart3,
            title: "Financial Insights & Data Analytics",
            description: "Processing complex market datasets into clear, actionable intelligence and predictive insights."
        },
        {
            icon: Database,
            title: "Central Information Hub",
            description: "Serving as the definitive, centralized platform where users access all financial news, education, and analytical tools."
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
                            Decisions That Build Wealth
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight font-poppins">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-ink to-ink/80">
                                About Fluid Finance
                            </span>
                        </h1>
                        <p className="text-xl text-ink/60 max-w-2xl mx-auto leading-relaxed font-light">
                            Ghana's premier market information hub combining financial education with real-time market intelligence.
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
                            <Card className="bg-ink/[0.02] border border-ink/[0.08] backdrop-blur-sm">
                                <CardContent className="p-8">
                                    <h2 className="text-2xl font-bold mb-6 font-poppins">Our Mission</h2>
                                    <div className="space-y-4 text-ink/70 leading-relaxed">
                                        <p>
                                            Fluid Finance is positioned to be a comprehensive hub for financial empowerment through innovative digital platforms that merge publishing studies with active development. By focusing on core areas including financial literacy publication, business and economy education, and stocks and co. education, we provide a highly valuable educational resource for our audience.
                                        </p>
                                        <p>
                                            Our platform serves as a central information hub where users can access financial news, education, and analytical tools in one place. We believe in translating complex financial concepts into accessible, engaging content while keeping readers updated on real-time market trends and macroeconomic shifts.
                                        </p>
                                        <p>
                                            Merging our strong foundation in educational publishing with the active development of digital financial platforms creates the perfect synergy for a media-driven finance company like Fluid Finance.
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
                            {pillars.map((pillar, index) => (
                                <Card
                                    key={index}
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
                                <h2 className="text-2xl font-bold mb-6 font-poppins">Our Technological Edge</h2>
                                <p className="text-ink/70 leading-relaxed mb-4">
                                    Integrating automated data pipelines and machine learning to drive our data analytics pillar will be a massive differentiator. This technical infrastructure enables us to process complex market datasets into clear, actionable intelligence and predictive insights.
                                </p>
                                <p className="text-ink/70 leading-relaxed mb-4">
                                    This expanded scope moves Fluid Finance from a pure educational resource to an active intelligence platform, adding analytics and actionable insights that significantly elevate the value for our audience.
                                </p>
                                <p className="text-ink/70 leading-relaxed">
                                    As we build out digital or decentralized financial platforms, our technological foundation positions us as leaders in the financial media space.
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default AboutUsPage;