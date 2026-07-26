"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageCircle, Clock, MapPin } from "lucide-react";

const EMAIL = "info@fluidterra.com";

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

    const channels = [
        {
            icon: Mail,
            title: "Email Us",
            description: "Send us an email and we'll get back to you within 24 hours.",
            action: { label: "Send Email", href: `mailto:${EMAIL}` },
        },
        {
            icon: MessageCircle,
            title: "Live Chat",
            description: "Chat with our support team in real-time during business hours.",
            action: { label: "Start Chat", href: `mailto:${EMAIL}` },
        },
        {
            icon: Clock,
            title: "Response Time",
            description: "We aim to respond to all inquiries within 24-48 hours on business days.",
            action: null,
        },
        {
            icon: MapPin,
            title: "Location",
            description: "Ghana. Our team is available remotely to serve clients across the country.",
            action: null,
        },
    ];

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-canvas">
            <div className="absolute inset-0 bg-gradient-to-br from-ink/[0.05] via-transparent to-ink/[0.05] blur-3xl" />

            <div className="page-container relative z-10 py-12 sm:py-16 md:py-20">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        custom={0}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 tracking-tight font-poppins">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-ink to-ink/80">
                                Contact Support
                            </span>
                        </h1>
                        <p className="text-xl text-ink/60 max-w-2xl mx-auto leading-relaxed">
                            Have a question or need assistance? Our team is here to help you with anything related to Fluid Finance.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                        {channels.map((channel, i) => (
                            <motion.div
                                key={channel.title}
                                custom={i + 1}
                                variants={fadeUpVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <Card className="bg-ink/[0.02] border border-ink/[0.08] h-full">
                                    <CardContent className="p-8">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 rounded-lg bg-ink/[0.05]">
                                                <channel.icon className="h-6 w-6 text-ink/60" />
                                            </div>
                                            <h3 className="text-xl font-bold font-poppins">{channel.title}</h3>
                                        </div>
                                        <p className="text-ink/60 leading-relaxed mb-6">{channel.description}</p>
                                        {channel.action && (
                                            <a
                                                href={channel.action.href}
                                                className="inline-block px-6 py-3 bg-fluid-cyan/10 text-fluid-cyan-ink border border-fluid-cyan/25 font-semibold rounded-xl hover:bg-fluid-cyan/20 transition-colors"
                                            >
                                                {channel.action.label}
                                            </a>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        custom={5}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className="bg-gradient-to-br from-ink/[0.05] to-transparent border border-ink/[0.1] rounded-2xl p-8 md:p-12 text-center">
                            <h2 className="text-3xl font-bold mb-4 font-poppins">Ready to Get Started?</h2>
                            <p className="text-lg text-ink/60 mb-8 max-w-2xl mx-auto">
                                Whether you have a question about features, pricing, or anything else — our team is ready to answer all your questions.
                            </p>
                            <a
                                href={`mailto:${EMAIL}`}
                                className="inline-block px-10 py-4 bg-fluid-cyan text-fluid-action-ink font-semibold rounded-xl shadow-glow hover:bg-fluid-cyan-hover hover:shadow-glow-lg transition-all text-lg"
                            >
                                Contact Us
                            </a>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default ContactSupportPage;
