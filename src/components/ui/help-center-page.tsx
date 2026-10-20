import { ChevronDown, MessageCircle, Search, Video, FileText, Mail } from "lucide-react";
import { PageIntro } from "@/components/ui/page-intro";
import { HELP_FAQS } from "@/lib/help-faqs";

function HelpCenterPage() {
    const faqs = HELP_FAQS;

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
        <main className="page-container news-page">
            <PageIntro
                eyebrow="Support"
                title="Help Center"
                description="Find answers to common questions, get help with trading, and connect with our support team."
            />

            <div className="relative max-w-2xl">
                <label htmlFor="help-search" className="sr-only">Search for help</label>
                <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/[0.68]" aria-hidden="true" />
                <input
                    id="help-search"
                    type="text"
                    placeholder="Search for help..."
                    className="news-input news-input--icon"
                />
            </div>

            <section className="news-section" aria-labelledby="help-topics">
                <header className="news-section-header">
                    <h2 id="help-topics">Browse by topic</h2>
                    <span>Guides, tutorials and the community</span>
                </header>
                <div className="news-tiles news-tiles--4 pt-4">
                    {supportTopics.map((topic) => (
                        <article key={topic.title} className="news-tile">
                            <h3 className="flex items-start gap-2">
                                <topic.icon size={20} className="mt-0.5 shrink-0 text-fluid-cyan-ink" aria-hidden="true" />
                                <span>{topic.title}</span>
                            </h3>
                            <p className="news-byline !mt-2">{topic.articles}</p>
                            <p>{topic.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="news-section" aria-labelledby="help-faq">
                <header className="news-section-header">
                    <h2 id="help-faq">Frequently Asked Questions</h2>
                </header>
                <ul className="news-list mt-5 max-w-[70ch]">
                    {faqs.map((faq, index) => (
                        <li key={index}>
                            <details className="group">
                                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-poppins text-[16px] font-semibold leading-snug [&::-webkit-details-marker]:hidden">
                                    <span>{faq.question}</span>
                                    <ChevronDown size={18} className="mt-0.5 shrink-0 text-ink/[0.68] transition-transform group-open:rotate-180" aria-hidden="true" />
                                </summary>
                                <p className="mt-3 text-sm leading-relaxed text-ink/[0.68]">
                                    {faq.answer}
                                </p>
                            </details>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="news-section" aria-labelledby="help-contact">
                <header className="news-section-header">
                    <h2 id="help-contact" className="flex items-center gap-2">
                        <Mail size={20} aria-hidden="true" />
                        Still Need Help?
                    </h2>
                </header>
                <div className="py-6">
                    <p className="news-standfirst">
                        Our support team is here to help you succeed. Get in touch with our experts.
                    </p>
                    <a href="mailto:info@fluidterra.com" className="news-button mt-6">
                        Contact Support
                    </a>
                </div>
            </section>
        </main>
    );
}

export default HelpCenterPage;
