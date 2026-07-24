"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

function TermsOfServicePage() {
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
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight font-poppins">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-ink to-ink/80">
                                Terms of Service
                           </span>
                        </h1>
                        <p className="text-lg text-ink/60 max-w-2xl mx-auto leading-relaxed">
                            Please read these terms carefully before using our financial platform.
                        </p>
                    </motion.div>

                    <div className="space-y-8">
                        <motion.div
                            custom={1}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Card className="bg-ink/[0.02] border border-ink/[0.08] backdrop-blur-sm">
                                <CardContent className="p-8">
                                    <h2 className="text-2xl font-bold mb-6 font-poppins">Acceptance of Terms</h2>
                                    <div className="space-y-4 text-ink/70 leading-relaxed">
                                        <p>
                                            By accessing or using the Fluid Finance platform, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you may not access the platform.
                                        </p>
                                        <p>
                                            These terms apply to all users of the platform, including without limitation users who are browsers, vendors, customers, traders, and/or contributors of content.
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
                            <Card className="bg-ink/[0.02] border border-ink/[0.08] backdrop-blur-sm">
                                <CardContent className="p-8">
                                    <h2 className="text-2xl font-bold mb-6 font-poppins">User Accounts</h2>
                                    <div className="space-y-4 text-ink/70 leading-relaxed">
                                        <p>
                                            To use certain features of the platform, you must register for an account. You agree to:
                                        </p>
                                        <ul className="list-disc list-inside space-y-2 ml-4">
                                            <li>Provide accurate, current, and complete information when registering</li>
                                            <li>Maintain and update your information to keep it accurate and complete</li>
                                            <li>Maintain the security of your account credentials</li>
                                            <li>Be responsible for all activities that occur under your account</li>
                                            <li>Notify us immediately of any unauthorized use of your account</li>
                                        </ul>
                                        <p className="mt-4 font-semibold">Eligibility:</p>
                                        <p>You must be at least 18 years old and reside in a jurisdiction where trading financial instruments is permitted.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            custom={3}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Card className="bg-ink/[0.02] border border-ink/[0.08] backdrop-blur-sm">
                                <CardContent className="p-8">
                                    <h2 className="text-2xl font-bold mb-6 font-poppins">Financial Data & Market Information</h2>
                                    <div className="space-y-4 text-ink/70 leading-relaxed">
                                        <p>
                                            Our platform provides real-time and historical financial data from the Ghana Stock Exchange and other sources. You agree that:
                                        </p>
                                        <ul className="list-disc list-inside space-y-2 ml-4">
                                            <li>All market data is provided "as is" and may contain errors or delays</li>
                                            <li>Trading decisions are your own responsibility</li>
                                            <li>We are not a broker-dealer or investment advisor</li>
                                            <li>Market data is for informational purposes only</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            custom={4}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Card className="bg-ink/[0.02] border border-ink/[0.08] backdrop-blur-sm">
                                <CardContent className="p-8">
                                    <h2 className="text-2xl font-bold mb-6 font-poppins">Trading & Investment Risks</h2>
                                    <div className="space-y-4 text-ink/70 leading-relaxed">
                                        <p>
                                            Trading financial instruments involves substantial risk of loss. You acknowledge and understand that:
                                        </p>
                                        <ul className="list-disc list-inside space-y-2 ml-4">
                                            <li>Past performance does not guarantee future results</li>
                                            <li>You may lose some or all of your invested capital</li>
                                            <li>You should not invest money you cannot afford to lose</li>
                                            <li>Market conditions can change rapidly</li>
                                        </ul>
                                        <p className="mt-4">
                                            <strong className="text-ink">Disclaimer:</strong> Nothing on this platform constitutes investment advice, a recommendation to buy or sell, or solicitation of any kind. You must do your own research and consult with qualified professionals.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            custom={5}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Card className="bg-ink/[0.02] border border-ink/[0.08] backdrop-blur-sm">
                                <CardContent className="p-8">
                                    <h2 className="text-2xl font-bold mb-6 font-poppins">Payment & Billing</h2>
                                    <div className="space-y-4 text-ink/70 leading-relaxed">
                                        <p>
                                            Some features of our platform may require payment. By providing payment information, you authorize us to charge applicable fees.
                                        </p>
                                        <ul className="list-disc list-inside space-y-2 ml-4">
                                            <li>All fees are non-refundable unless otherwise specified</li>
                                            <li>We reserve the right to change our fees at any time</li>
                                            <li>You are responsible for all applicable taxes</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            custom={6}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Card className="bg-gradient-to-br from-ink/[0.05] to-transparent border border-ink/[0.1]">
                                <CardContent className="p-8">
                                    <h2 className="text-2xl font-bold mb-6 font-poppins">Termination</h2>
                                    <div className="space-y-4 text-ink/70 leading-relaxed">
                                        <p>
                                            We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms of Service.
                                        </p>
                                        <p>
                                            Upon termination, your right to use the platform will immediately cease.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            custom={7}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Card className="bg-ink/[0.02] border border-ink/[0.08] backdrop-blur-sm">
                                <CardContent className="p-8">
                                    <h2 className="text-2xl font-bold mb-6 font-poppins">Governing Law</h2>
                                    <div className="space-y-4 text-ink/70 leading-relaxed">
                                        <p>
                                            These Terms shall be governed by and construed in accordance with the laws of Ghana, without regard to its conflict of law provisions.
                                        </p>
                                        <p>
                                            Any legal suit, action, or proceeding arising out of or related to these Terms or the platform shall be instituted exclusively in the competent courts of Ghana.
                                        </p>
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

export default TermsOfServicePage;
