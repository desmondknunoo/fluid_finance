import { BookOpen, ChevronDown, GraduationCap, LineChart, Mail, MessageCircle, Search } from "lucide-react";
import { PageIntro } from "@/components/ui/page-intro";
import { HELP_FAQS } from "@/lib/help-faqs";

function HelpCenterPage() {
    const faqs = HELP_FAQS;

    const supportTopics = [
        {
            icon: GraduationCap,
            title: "Learning Center",
            description: "Courses, training and official resources for understanding the Ghana Stock Exchange and investing.",
            label: "Start learning",
            href: "/learning-center",
        },
        {
            icon: BookOpen,
            title: "Market Education",
            description: "Explainers on reading company data, market moves, the cedi and the economy.",
            label: "Read the explainers",
            href: "/market-education",
        },
        {
            icon: LineChart,
            title: "Market Data",
            description: "Live prices, company pages, the heatmap and the weekly market review.",
            label: "Open the market board",
            href: "/gse-live",
        },
        {
            icon: MessageCircle,
            title: "Community",
            description: "Ask questions and discuss markets, money and personal finance with other members.",
            label: "Visit the forum",
            href: "/forum",
        }
    ];

    return (
        <main className="page-container news-page">
            <PageIntro
                eyebrow="Support"
                title="Help Center"
                description="Answers about what Fluid Finance offers, where its data comes from and how to reach our team."
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
                        <a key={topic.title} href={topic.href} className="news-tile">
                            <h3 className="flex items-start gap-2">
                                <topic.icon size={20} className="mt-0.5 shrink-0 text-fluid-cyan-ink" aria-hidden="true" />
                                <span>{topic.title}</span>
                            </h3>
                            <p>{topic.description}</p>
                            <p className="news-byline !mt-3 font-semibold text-fluid-cyan-ink">{topic.label}</p>
                        </a>
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
                        Questions about the site, your community account, our research or market data? Email the Fluid Finance team. For accounts, payments or orders, contact support in the Fluid app.
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
