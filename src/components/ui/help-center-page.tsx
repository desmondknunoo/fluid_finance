"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, HelpCircle, MessageCircle, Search, Phone, Video, FileText } from "lucide-react";

function HelpCenterPage() {
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

    const faqs = [
        {
            question: "How do I open a stock account and start trading on the GSE?",
            answer: "To open an account, click on any stock symbol and select \"Open Account.\". You'll need to provide identification documents, proof of address, and complete a KYC verification. The process typically takes 24-48 hours."
        },
        {
            question: "What is the minimum amount required to start investing?",
            answer: "You can start trading with as little as GHS 100. Most GSE stocks have a minimum transaction amount of GHS 50 per trade."
        },
        {
            question: "How do I withdraw my money from the platform?",
            answer: "You can withdraw funds through the stock detail page or by contacting our support team. Withdrawals are processed within 24-48 hours to your registered bank account."
        },
        {
            question: "What information do I need to provide for account verification?",
            answer: "You'll need your Ghana Card, passport, a utility bill (not more than 3 months old), and proof of income. All documents are securely stored and encrypted."
        },
        {
            question: "How accurate is the market data?",
            answer: "Our data is sourced directly from the Ghana Stock Exchange and is updated in real-time with a 15-20 minute delay. We verify all data against multiple sources for accuracy."
        }
    ];

    const supportTopics = [
        {
            icon: Search,
            title: "Getting Started",
            description: "Everything you need to know about opening an account, making your first trade, and understanding the platform.",
            articles: "15 articles"
        },
        {
            icon: FileText,
            title: "Trading Guide",
            description: "Comprehensive guides on technical analysis, fundamental analysis, and trading strategies.",
            articles: "23 articles"
        },
        {
            icon: Video,
            title: "Video Tutorials",
            description: "Step-by-step video guides for all platform features and investment concepts.",
            articles: "8 videos"
        },
        {
            icon: MessageCircle,
            title: "Community",
            description: "Connect with other investors, ask questions, and share your experiences.",
            articles: "Active forum"
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
                        className="text-center mb-12"
                    >
                        <Badge className="mb-6 bg-ink/[0.03] border border-ink/[0.08]">
                            Support & Help
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight font-poppins">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-ink to-ink/80">
                                Help Center
                            </span>
                        </h1>
                        <p className="text-xl text-ink/60 max-w-2xl mx-auto leading-relaxed">
                            Find answers to common questions, get help with trading, and connect with our support team.
                        </p>
                    </motion.div>

                    <motion.div
                        custom={1}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="mb-16"
                    >
                        <div className="relative max-w-2xl mx-auto">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ink/40" />
                            <input
                                type="text"
                                placeholder="Search for help..."
                                className="w-full pl-12 pr-4 py-4 bg-ink/[0.02] border border-ink/[0.08] rounded-xl focus:border-ink/20 focus:outline-none text-lg"
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        custom={2}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20"
                    >
                        {supportTopics.map((topic, index) => (
                            <Card
                                key={topic.title}
                                className="bg-ink/[0.02] border border-ink/[0.08] hover:bg-ink/[0.04] transition-all duration-300 cursor-pointer group"
                            >
                                <CardContent className="p-8">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 rounded-lg bg-ink/[0.05]">
                                            <topic.icon className="h-6 w-6 text-ink/60 group-hover:text-ink transition-colors" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold mb-2 font-poppins group-hover:text-ink transition-colors">
                                                {topic.title}
                                            </h3>
                                            <p className="text-sm text-ink/60">
                                                {topic.articles}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-ink/70 leading-relaxed">
                                        {topic.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>

                    <motion.div
                        custom={3}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="mb-20"
                    >
                        <h2 className="text-3xl font-bold mb-8 text-left font-poppins">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <Card
                                    key={index}
                                    className="bg-ink/[0.02] border border-ink/[0.08] hover:border-ink/20 transition-colors"
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <HelpCircle className="h-5 w-5 text-ink/40 mt-1 shrink-0" />
                                            <div>
                                                <h3 className="text-lg font-semibold mb-2 font-poppins">
                                                    {faq.question}
                                                </h3>
                                                <p className="text-ink/60 leading-relaxed">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        custom={4}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className="bg-gradient-to-br from-ink/[0.05] to-transparent border border-ink/[0.1] rounded-2xl p-8 md:p-12">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold mb-4 font-poppins">Still Need Help?</h2>
                                <p className="text-lg text-ink/60 mb-8 max-w-2xl mx-auto">
                                    Our support team is here to help you succeed. Get in touch with our experts.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button className="px-8 py-4 bg-ink text-canvas font-semibold rounded-xl hover:bg-ink/90 transition-colors">
                                        Contact Support
                                    </button>
                                    <button className="px-8 py-4 bg-ink/[0.02] border border-ink/[0.08] text-ink font-semibold rounded-xl hover:bg-ink/[0.04] transition-colors">
                                        Live Chat
                                    </button>
                                </div>
                                <div className="mt-8 p-6 bg-ink/[0.03] rounded-xl border border-ink/[0.08] max-w-md mx-auto">
                                    <p className="text-sm text-ink/60">
                                        <strong className="text-ink">Support Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM GMT
                                        <br />
                                        <strong className="text-ink">Response Time:</strong> Typically within 24 hours
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default HelpCenterPage;
