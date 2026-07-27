"use client";

import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/links";
import { SOCIAL_ICONS } from "@/components/ui/social-icons";
import { BrandLogo } from "@/components/ui/brand-logo";

export const EnhancedFooter = () => {
    const footerLinks = [
        {
            title: "Explore",
            links: [
                { label: "Market Snapshot", href: "#market-snapshot" },
                { label: "All Listed Companies", href: "#gse-live" },
                { label: "Features", href: "#features" },
            ],
            delay: 0.2
        },
        {
            title: "GSE Live",
            links: [
                { label: "Live Exchange", href: "#/gse-live" },
            ],
            delay: 0.25
        },
        {
            title: "Education",
            links: [
                { label: "Learning Center", href: "#/learning-center" },
                { label: "Market Education", href: "#/market-education" },
                { label: "Business & Economy News", href: "#/business-news" },
            ],
            delay: 0.25
        },
        {
            title: "Support",
            links: [
                { label: "Help Center", href: "#/help-center" },
                { label: "Contact Support", href: "#/contact-support" },
            ],
            delay: 0.3
        },
        {
            title: "Company",
            links: [
                { label: "About Us", href: "#/about-us" },
                { label: "Privacy Policy", href: "#/privacy-policy" },
                { label: "Terms of Service", href: "#/terms-of-service" },
            ],
            delay: 0.35
        }
    ];

    return (
        <footer className="bg-canvas pt-24 pb-12 border-t border-ink/[0.05]">
            <div className="page-container">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-12 mb-16">
                    {/* Brand column */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="md:col-span-1"
                    >
                        <BrandLogo variant="stacked" className="mb-4 h-[8.33rem]" />
                        <p className="text-sm text-ink/40 leading-relaxed mb-6 font-poppins">
                            Premium financial publisher for the Ghana Stock Exchange.
                            Built for accuracy, speed, and ease of use.
                        </p>
                        <div className="flex gap-4">
                            {SOCIAL_LINKS.map((social) => {
                                const Icon = SOCIAL_ICONS[social.key];
                                return (
                                    <motion.a
                                        key={social.key}
                                        href={social.href}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        aria-label={`Fluid Finance on ${social.label}`}
                                        whileHover={{ scale: 1.2, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="text-ink/20 hover:text-ink transition-colors"
                                    >
                                        <Icon size={20} />
                                    </motion.a>
                                );
                            })}
                            <motion.a
                                href="mailto:info@fluidterra.com"
                                aria-label="Email Fluid Finance"
                                whileHover={{ scale: 1.2, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="text-ink/20 hover:text-ink transition-colors"
                            >
                                <Mail size={20} />
                            </motion.a>
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
                            <h4 className="text-ink font-bold mb-6 text-sm uppercase tracking-widest font-poppins">{section.title}</h4>
                            <ul className="flex flex-col gap-4 text-sm text-ink/40">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <a href={link.href} className="hover:text-ink transition-colors font-poppins">{link.label}</a>
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
                    className="pt-12 border-t border-ink/[0.05] flex flex-col md:flex-row justify-between gap-8"
                >
                    <div className="max-w-2xl">
                        <p className="text-[10px] text-ink/20 uppercase tracking-widest mb-4 font-bold">Disclaimer</p>
                        <p className="text-[11px] text-ink/30 leading-relaxed font-poppins">
                            Fluid Finance is a financial publication and market education platform. It displays Ghana Stock
                            Exchange information only — it does not execute trades, hold client funds, or act as a broker.
                            Nothing on this site is an offer, a solicitation, or investment advice. Investing carries risk
                            of loss, and past performance does not indicate future results.
                            <br /><br />
                            <span className="text-ink/40 font-bold">Data Delay Notice:</span> Market data is sourced from the
                            Ghana Stock Exchange feed and may be delayed by 15-20 minutes.
                        </p>
                    </div>
                    <div className="text-right flex flex-col justify-end">
                        <p className="text-sm text-ink/20 font-poppins">
                            © 2026 Fluid Finance. All rights reserved.
                        </p>
                    </div>
                </motion.div>

                {/* Clickable background area to return to top */}
                <div
                    className="absolute inset-0 cursor-pointer"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    aria-label="Return to top of page"
                    role="button"
                />
            </div>
        </footer>
    );
};
