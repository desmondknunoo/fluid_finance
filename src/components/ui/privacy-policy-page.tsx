"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, FileText, Cookie, Globe, Mail, ArrowUpRight } from "lucide-react";

function PrivacyPolicyPage() {
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

    const sections = [
        {
            icon: FileText,
            title: "Information We Collect",
            content: (
                <div className="space-y-4 text-ink/70 leading-relaxed">
                    <p>
                        We collect information you provide directly when using our platform, including your name, email address, and trading preferences. This includes:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Account registration and authentication data</li>
                        <li>Trading activity and portfolio information</li>
                        <li>Communication preferences and support tickets</li>
                        <li>Payment information (processed securely through third-party processors)</li>
                    </ul>
                </div>
            )
        },
        {
            icon: Lock,
            title: "How We Use Your Information",
            content: (
                <div className="space-y-4 text-ink/70 leading-relaxed">
                    <p>We use your information to:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Provide, operate, and maintain our financial platform services</li>
                        <li>Process and execute your trading orders and transactions</li>
                        <li>Send you updates, alerts, and market information</li>
                        <li>Improve our website and user experience</li>
                        <li>Monitor and analyze usage patterns for platform optimization</li>
                        <li>Detect, prevent, and address technical issues or fraud</li>
                    </ul>
                </div>
            )
        },
        {
            icon: Shield,
            title: "Data Protection & Security",
            content: (
                <div className="space-y-4 text-ink/70 leading-relaxed">
                    <p>
                        We implement industry-standard security measures to protect your personal and financial information:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>SSL/TLS encryption for all data transmissions</li>
                        <li>Secure socket layer for all financial transactions</li>
                        <li>Regular security audits and penetration testing</li>
                        <li>Multi-factor authentication options</li>
                        <li>Limited access to sensitive data on a need-to-know basis</li>
                    </ul>
                    <p className="mt-4">
                        <strong className="text-ink">Important:</strong> While we strive to protect your information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.
                    </p>
                </div>
            )
        },
        {
            icon: FileText,
            title: "Your Rights & Choices",
            content: (
                <div className="space-y-4 text-ink/70 leading-relaxed">
                    <p>You have the right to:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Access, update, or delete your personal information</li>
                        <li>Export your account data in a portable format</li>
                        <li>Opt-out of marketing communications</li>
                        <li>Request a copy of your stored data</li>
                        <li>Request deletion of your account and associated data</li>
                    </ul>
                    <p className="mt-4">
                        To exercise any of these rights, please contact us at privacy@fluidfinance.com. We will respond to your request within 30 days.
                    </p>
                </div>
            )
        },
        {
            icon: Cookie,
            title: "Cookies & Tracking",
            content: (
                <div className="space-y-4 text-ink/70 leading-relaxed">
                    <p>
                        We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                    </p>
                    <p>
                        However, if you do not accept cookies, you may not be able to use some portions of our platform effectively.
                    </p>
                </div>
            )
        },
        {
            icon: Globe,
            title: "Third-Party Services",
            content: (
                <div className="space-y-4 text-ink/70 leading-relaxed">
                    <p>
                        Our platform may use third-party services for payment processing, data analytics, and other services. These third parties have their own privacy policies and may collect information independently.
                    </p>
                    <p>
                        We encourage you to review the privacy policies of any third-party services we use.
                    </p>
                </div>
            )
        },
        {
            icon: Shield,
            title: "Updates to This Policy",
            content: (
                <div className="space-y-4 text-ink/70 leading-relaxed">
                    <p>
                        We may update our Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the effective date.
                    </p>
                    <p>
                        We encourage you to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                    </p>
                </div>
            )
        }
    ];

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
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight font-poppins">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-ink to-ink/80">
                                Privacy Policy
                            </span>
                        </h1>
                        <p className="text-lg text-ink/60 max-w-2xl mx-auto leading-relaxed">
                            Your financial information and personal data are protected with industry-standard security measures.
                        </p>
                    </motion.div>

                    <div className="space-y-8">
                        {sections.map((section, index) => (
                            <motion.div
                                key={section.title}
                                custom={index + 1}
                                variants={fadeUpVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <Card className="bg-ink/[0.02] border border-ink/[0.08]">
                                    <CardContent className="p-8">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="p-3 rounded-lg bg-ink/[0.05]">
                                                <section.icon className="h-6 w-6 text-ink/60" />
                                            </div>
                                            <h2 className="text-2xl font-bold font-poppins">{section.title}</h2>
                                        </div>
                                        {section.content}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                        
                        <motion.div
                            custom={sections.length + 1}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-gradient-to-br from-ink/[0.05] to-transparent border border-ink/[0.1] rounded-2xl p-8 md:p-12 text-center"
                        >
                            <div className="flex items-center justify-center gap-4 mb-4">
                                <div className="p-3 rounded-lg bg-ink/[0.05]">
                                    <Mail className="h-6 w-6 text-ink/60" />
                                </div>
                                <h2 className="text-3xl font-bold font-poppins">Have Questions?</h2>
                            </div>
                            <p className="text-lg text-ink/60 mb-8 max-w-2xl mx-auto">
                                We're committed to protecting your privacy. If you have any questions about this policy or our data practices, please reach out.
                            </p>
                            <a href="mailto:privacy@fluidfinance.com" className="inline-block px-8 py-4 bg-fluid-cyan text-fluid-action-ink font-semibold rounded-xl shadow-glow hover:bg-fluid-cyan-hover hover:shadow-glow-lg transition-all">
                                Contact Privacy Team
                            </a>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicyPage;
