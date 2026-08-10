"use client";

import { motion } from "framer-motion";
import {
    Database,
    Zap,
    Bell,
    Newspaper,
    TrendingUp,
    Layers,
} from "lucide-react";

const features = [
    {
        icon: Database,
        title: "Full Data Coverage",
        description: "Every equity listed on the Ghana Stock Exchange, with company fundamentals and full price history."
    },
    {
        icon: Layers,
        title: "Advanced Tools",
        description: "Stock screeners, sector heatmaps, and table, grid and heatmap views of the whole exchange."
    },
    {
        icon: Bell,
        title: "Real-time Alerts",
        description: "Set custom price triggers and get instant notifications via SMS, Email, or WhatsApp as market conditions change."
    },
    {
        icon: Newspaper,
        title: "AI News Aggregation",
        description: "Curated financial news from Bloomberg, Reuters, and local GSE sources, summarized by AI for quick reading."
    }
];

const educationalStories = [
    {
        category: "Business & Financial Times",
        title: "B&FT",
        snippet: "Ghana's leading financial newspaper covering business, finance, and economic news.",
        link: "https://thebftonline.com"
    },
    {
        category: "Business News",
        title: "Ghana Business News",
        snippet: "Comprehensive coverage of Ghana's business landscape and economic developments.",
        link: "https://ghanabusinessnews.com"
    },
    {
        category: "Business News",
        title: "Business Day Ghana",
        snippet: "In-depth business journalism and market analysis for the Ghanaian market.",
        link: "https://businessdayghana.com"
    },
    {
        category: "Business News",
        title: "Graphic Online Business",
        snippet: "Business and financial news from Ghana's most established media house.",
        link: "https://www.graphic.com.gh/business/business-news.html"
    },
    {
        category: "News",
        title: "Citi Business News",
        snippet: "Breaking news and comprehensive coverage of Ghana's business and economic affairs.",
        link: "https://www.citinewsroom.com/category/business/"
    },
    {
        category: "Business News",
        title: "BusinessGhana",
        snippet: "Business news, company profiles, and economic analysis for Ghana.",
        link: "https://businessghana.com"
    }
];

export const FeatureHighlights = () => {
    return (
        <section id="features" className="py-14 sm:py-20 md:py-24 bg-canvas">
            <div className="page-container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-ink mb-4">The Next Level of Analysis</h2>
                    <p className="text-ink/40 max-w-2xl mx-auto">
                        Experience tools that were previously reserved for institutional investors,
                        now available at your fingertips.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="group p-8 rounded-3xl bg-ink/[0.03] border border-ink/[0.08] hover:bg-ink/[0.05] hover:border-ink/20 transition-all"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-ink/5 flex items-center justify-center mb-6 text-ink group-hover:scale-110 transition-transform">
                                <feature.icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-ink mb-3">{feature.title}</h3>
                            <p className="text-sm text-ink/40 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export const EducationalSection = () => {
    return (
        <section id="education" className="py-14 sm:py-20 md:py-24 bg-canvas border-t border-ink/[0.05]">
            <div className="page-container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4"
                >
                    <div className="text-left">
                        <h2 className="text-3xl md:text-5xl font-bold text-ink mb-4">Market Insights</h2>
                        <p className="text-ink/40 max-w-xl">
                            Stay ahead of the curve with curated financial news from Ghana's top business publications.
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.location.hash = "#/market-education"}
                        className="flex items-center gap-2 text-ink font-medium hover:text-ink/60 transition-colors"
                    >
                        Learn More <TrendingUp size={18} />
                    </motion.button>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {educationalStories.map((story, idx) => (
                        <motion.a
                            key={story.title}
                            href={story.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="block p-8 rounded-3xl bg-gradient-to-br from-ink/[0.05] to-transparent border border-ink/[0.08] hover:border-ink/20 transition-all cursor-pointer group"
                        >
                            <span className="text-xs font-bold uppercase tracking-widest text-ink/30 mb-6 block group-hover:text-ink/60 transition-colors">
                                {story.category}
                            </span>
                            <h3 className="text-xl font-bold text-ink mb-4 leading-tight group-hover:translate-x-1 transition-transform">
                                {story.title}
                            </h3>
                            <p className="text-sm text-ink/40 mb-6 leading-relaxed">
                                {story.snippet}
                            </p>
                            <div className="flex items-center justify-between text-xs text-ink/20">
                                <span className="flex items-center gap-1 group-hover:text-ink transition-colors">
                                    Visit <Zap size={10} />
                                </span>
                            </div>
                        </motion.a>
                    ))}
                </div>
            </div>
        </section>
    );
};
