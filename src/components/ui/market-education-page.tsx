import { FileText, Video, Table2, Bell, BookOpen, GraduationCap, ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/ui/page-intro";

function MarketEducationPage() {
    const educationalArticles = [
        {
            category: "Press Release",
            title: "GSE Press Releases & Announcements",
            author: "Ghana Stock Exchange",
            date: "2026",
            readTime: "5 min read",
            icon: FileText,
            link: "https://gse.com.gh/press-release/"
        },
        {
            category: "Media",
            title: "GSE Testimonial Video",
            author: "Ghana Stock Exchange",
            date: "2026",
            readTime: "3 min watch",
            icon: Video,
            link: "https://gse.com.gh/gse-testimonial-video/"
        },
        {
            category: "Financial Reports",
            title: "Financial Statements & Filings",
            author: "Ghana Stock Exchange",
            date: "2026",
            readTime: "10 min read",
            icon: Table2,
            link: "https://gse.com.gh/financial-statements/"
        },
        {
            category: "Market Notices",
            title: "GSE Market Notices & Circulars",
            author: "Ghana Stock Exchange",
            date: "2026",
            readTime: "5 min read",
            icon: Bell,
            link: "https://gse.com.gh/gse-market-notice/"
        },
        {
            category: "Articles",
            title: "GSE Educational Articles",
            author: "Ghana Stock Exchange",
            date: "2026",
            readTime: "15 min read",
            icon: BookOpen,
            link: "http://gse.com.gh/gse-articles/"
        },
        {
            category: "Resources",
            title: "GSE Brochures & Guides",
            author: "Ghana Stock Exchange",
            date: "2026",
            readTime: "8 min read",
            icon: GraduationCap,
            link: "https://gse.com.gh/gse-brochures/"
        }
    ];

    return (
        <main className="page-container news-page">
            <PageIntro
                eyebrow="Market Education"
                title="Market Education"
                description="Master financial markets, economic indicators, and investment strategies through expert insights and comprehensive educational resources."
            />

            <section className="news-section !mt-0" aria-labelledby="education-recent">
                <header className="news-section-header">
                    <h2 id="education-recent">Recent Educational Articles</h2>
                    <span>From the Ghana Stock Exchange</span>
                </header>
                <div className="news-tiles news-tiles--2 pt-4">
                    {educationalArticles.map((article) => (
                        <a
                            key={article.title}
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="news-tile"
                        >
                            <p className="news-kicker !mt-0">{article.category}</p>
                            <h3 className="mt-2 flex items-start gap-2">
                                <article.icon size={20} className="mt-0.5 shrink-0 text-fluid-cyan-ink" aria-hidden="true" />
                                <span>{article.title}</span>
                            </h3>
                            <p>By {article.author}</p>
                            <p className="news-byline !mt-2 inline-flex flex-wrap items-center gap-x-2">
                                <span>{article.date}</span>
                                <span aria-hidden="true">·</span>
                                <span>{article.readTime}</span>
                                <ArrowUpRight size={12} aria-hidden="true" />
                            </p>
                        </a>
                    ))}
                </div>
            </section>
        </main>
    );
}

export default MarketEducationPage;
