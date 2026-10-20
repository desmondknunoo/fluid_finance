import { BookOpen, Newspaper, BarChart3, Database, Mail, ArrowUpRight } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/links";
import { SOCIAL_ICONS } from "@/components/ui/social-icons";
import { PageIntro } from "@/components/ui/page-intro";

function AboutUsPage() {
    const pillars = [
        {
            icon: BookOpen,
            title: "Financial Literacy Publishing",
            description: "Well-researched publications, insightful analysis, and practical learning resources that empower audiences to develop stronger financial awareness and make more informed decisions."
        },
        {
            icon: Newspaper,
            title: "Market Insights & Economic Education",
            description: "Delivering real-time financial news, educational content, market insights, and analytical tools covering business trends, economic developments, and market movements."
        },
        {
            icon: BarChart3,
            title: "Financial Intelligence & Data Analytics",
            description: "Transforming economic indicators, investment strategies, corporate developments, and market trends into meaningful insights that help users understand the forces shaping their financial environment."
        },
        {
            icon: Database,
            title: "Centralized Financial Hub",
            description: "A unified digital platform where users access personal finance, investing, business trends, economic developments, and market movements — eliminating the need for multiple fragmented sources."
        }
    ];

    return (
        <main className="page-container news-page">
            <PageIntro
                eyebrow="About"
                title="About Fluid Finance"
                description="Decisions that Build Wealth"
                align="center"
            />

            <section className="news-section !mt-0" aria-labelledby="about-mission">
                <header className="news-section-header">
                    <h2 id="about-mission" className="flex items-center gap-2">
                        <BookOpen size={20} aria-hidden="true" />
                        Our Mission
                    </h2>
                </header>
                <div className="py-6">
                    <p className="news-standfirst">
                        Decisions that Build Wealth
                    </p>
                    <div className="news-prose mt-6">
                        <p>
                            At the core of Fluid Finance is the belief that financial education should be accessible, engaging, and actionable. We focus on key areas including financial literacy publishing, business and economic education, investment knowledge, stock market education, and broader financial intelligence. By delivering well-researched publications, insightful analysis, and practical learning resources, we empower our audience to develop stronger financial awareness and make more informed decisions.
                        </p>
                        <p>
                            Our platform serves as a centralized financial information hub, bringing together financial news, educational content, market insights, and analytical tools within a unified digital experience. Users can access relevant information on personal finance, investing, business trends, economic developments, and market movements — eliminating the need to rely on multiple fragmented sources.
                        </p>
                    </div>
                </div>
            </section>

            <section className="news-section" aria-labelledby="about-pillars">
                <header className="news-section-header">
                    <h2 id="about-pillars">Our Core Pillars</h2>
                    <span>Four areas of focus</span>
                </header>
                <div className="news-tiles news-tiles--2 pt-4">
                    {pillars.map((pillar) => (
                        <article key={pillar.title} className="news-tile">
                            <h3 className="flex items-start gap-2">
                                <pillar.icon size={20} className="mt-0.5 shrink-0 text-fluid-cyan-ink" aria-hidden="true" />
                                <span>{pillar.title}</span>
                            </h3>
                            <p>{pillar.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="news-section" aria-labelledby="about-vision">
                <header className="news-section-header">
                    <h2 id="about-vision" className="flex items-center gap-2">
                        <BarChart3 size={20} aria-hidden="true" />
                        Our Vision
                    </h2>
                </header>
                <div className="news-prose py-6">
                    <p>
                        Through our content and technology platforms, Fluid Finance is committed to simplifying complex financial concepts and transforming them into clear, accessible, and engaging experiences. We translate economic indicators, investment strategies, corporate developments, and market trends into meaningful insights that help users better understand the forces shaping their financial environment.
                    </p>
                    <p>
                        Beyond education, Fluid Finance focuses on developing digital financial platforms that enhance how individuals interact with financial information. By combining data-driven tools, interactive experiences, and modern publishing capabilities, we are building a next-generation finance media company that goes beyond traditional financial reporting to deliver knowledge, analysis, and practical value.
                    </p>
                    <p>
                        The integration of our strong foundation in educational publishing with the continuous development of innovative financial technology platforms creates a powerful synergy. This positions Fluid Finance not only as a source of financial information but as a dynamic financial intelligence platform — connecting education, media, technology, and market insights to support a more financially informed society.
                    </p>
                    <p>
                        Through this approach, Fluid Finance aims to become a trusted partner for individuals seeking financial growth, businesses seeking economic understanding, and communities seeking greater financial empowerment.
                    </p>
                </div>
            </section>

            <section className="news-section" aria-labelledby="about-connect">
                <header className="news-section-header">
                    <h2 id="about-connect" className="flex items-center gap-2">
                        <Mail size={20} aria-hidden="true" />
                        Connect With Us
                    </h2>
                </header>
                <div className="py-6">
                    <p className="news-standfirst">
                        Join our community for financial insights, market updates, and educational content.
                    </p>
                    <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
                        {SOCIAL_LINKS.map((social) => {
                            const Icon = SOCIAL_ICONS[social.key];
                            return (
                                <li key={social.key}>
                                    <a
                                        href={social.href}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        aria-label={`Follow Fluid Finance on ${social.label}`}
                                        className="news-text-link"
                                    >
                                        <Icon size={16} aria-hidden="true" />
                                        {social.label}
                                        <ArrowUpRight size={14} aria-hidden="true" />
                                    </a>
                                </li>
                            );
                        })}
                        <li>
                            <a
                                href="mailto:info@fluidterra.com"
                                aria-label="Email Fluid Finance"
                                className="news-text-link"
                            >
                                <Mail size={16} aria-hidden="true" />
                                Email Us
                                <ArrowUpRight size={14} aria-hidden="true" />
                            </a>
                        </li>
                    </ul>
                </div>
            </section>
        </main>
    );
}

export default AboutUsPage;
