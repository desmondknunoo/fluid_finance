"use client";

import { motion } from "framer-motion";
import { Layers, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";

/**
 * Honest trust band.
 *
 * Everything here is a verifiable statement about what the product actually
 * does — where its data comes from, and structural facts (refresh cadence, the
 * three views, free access). No invented metrics, and no implied endorsement
 * from any institution or regulator.
 */
const facts = [
    { icon: Layers, value: "All", label: "Listed GSE equities", delay: 0.1 },
    { icon: RefreshCw, value: "30s", label: "Data refresh", delay: 0.2 },
    { icon: ShieldCheck, value: "3", label: "Table · Grid · Heatmap", delay: 0.3 },
    { icon: Sparkles, value: "Free", label: "No account needed", delay: 0.4 },
];

export const SocialProof = () => {
    return (
        <section className="py-24 bg-canvas border-t border-ink/[0.05]">
            <div className="page-container">
                {/* Data provenance — a source statement, not an endorsement */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center text-xs font-bold uppercase tracking-[0.3em] text-ink/30 mb-16"
                >
                    Market data sourced from the Ghana Stock Exchange
                </motion.p>

                {/* What the product actually offers */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {facts.map((fact) => (
                        <motion.div
                            key={fact.label}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: fact.delay }}
                            className="flex flex-col items-center text-center"
                        >
                            <fact.icon size={22} className="text-ink/40 mb-4" />
                            <span className="text-3xl md:text-5xl font-bold text-ink mb-2">{fact.value}</span>
                            <span className="text-xs text-ink/40 uppercase tracking-widest">{fact.label}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
