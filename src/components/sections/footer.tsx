"use client";

import { motion } from "framer-motion";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

export const EnhancedFooter = () => {
    const footerLinks = [
        {
            title: "Product",
            links: [
                { label: "Market Snapshot", href: "#market-snapshot" },
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "Live Dashboard", href: "/legacy/index.html" }
            ],
            delay: 0.2
        },
        {
            title: "Resources",
            links: [
                { label: "Learning Center", href: "#education" },
                { label: "API Documentation", href: "#" },
                { label: "Market Reports", href: "#" },
                { label: "Help Center", href: "#" }
            ],
            delay: 0.3
        },
        {
            title: "Company",
            links: [
                { label: "About Us", href: "#" },
                { label: "Contact Support", href: "#" },
                { label: "Privacy Policy", href: "#" },
                { label: "Terms of Service", href: "#" }
            ],
            delay: 0.4
        }
    ];

    return (
        <footer className="bg-black pt-24 pb-12 border-t border-white/[0.05]">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand column */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="md:col-span-1"
                    >
                        <div className="text-xl font-bold text-white mb-6 font-poppins">Fluid Finance</div>
                        <p className="text-sm text-white/40 leading-relaxed mb-6 font-poppins">
                            The ultimate financial aggregator for the Ghana Stock Exchange.
                            Built for accuracy, speed, and ease of use.
                        </p>
                        <div className="flex gap-4">
                            <motion.div whileHover={{ scale: 1.2, y: -2 }} whileTap={{ scale: 0.95 }}>
                                <Twitter size={20} className="text-white/20 hover:text-white cursor-pointer transition-colors" />
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.2, y: -2 }} whileTap={{ scale: 0.95 }}>
                                <Linkedin size={20} className="text-white/20 hover:text-white cursor-pointer transition-colors" />
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.2, y: -2 }} whileTap={{ scale: 0.95 }}>
                                <Github size={20} className="text-white/20 hover:text-white cursor-pointer transition-colors" />
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.2, y: -2 }} whileTap={{ scale: 0.95 }}>
                                <Mail size={20} className="text-white/20 hover:text-white cursor-pointer transition-colors" />
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Links columns */}
                    {footerLinks.map((section) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: section.delay }}
                        >
                            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest font-poppins">{section.title}</h4>
                            <ul className="flex flex-col gap-4 text-sm text-white/40">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <a href={link.href} className="hover:text-white transition-colors font-poppins">{link.label}</a>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* Legal Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="pt-12 border-t border-white/[0.05] flex flex-col md:flex-row justify-between gap-8"
                >
                    <div className="max-w-2xl">
                        <p className="text-[10px] text-white/20 uppercase tracking-widest mb-4 font-bold">Disclaimer</p>
                        <p className="text-[11px] text-white/30 leading-relaxed font-poppins">
                            Trading stocks on the Ghana Stock Exchange (GSE) involves significant risk of loss and is not suitable
                            for every investor. Past performance is not indicative of future results. Information provided
                            by Fluid Finance is for educational purposes only and does not constitute financial advice.
                            <br /><br />
                            <span className="text-white/40 font-bold">Data Delay Notice:</span> Free tier market data is delayed by 15-20 minutes.
                            Upgrade to Pro for real-time streaming data.
                        </p>
                    </div>
                    <div className="text-right flex flex-col justify-end">
                        <p className="text-sm text-white/20 font-poppins">
                            © 2026 Fluid Finance. All rights reserved.
                        </p>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
};
