import { TrendingUp, GraduationCap, FileText, BookOpen, ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/ui/page-intro";

function LearningCenterPage() {
    const featuredArticles = [
        {
            category: "Training",
            title: "BOG Center for Training & Capacity Development",
            snippet: "Official training programs and capacity development resources from the Bank of Ghana.",
            icon: GraduationCap,
            link: "https://www.bog.gov.gh/the-center-for-training-and-capacity-development/"
        },
        {
            category: "Training",
            title: "SEC Corporate Training Programs",
            snippet: "Professional development and corporate training offerings from the Securities and Exchange Commission.",
            icon: BookOpen,
            link: "https://sec.gov.gh/corporate-training/"
        },
        {
            category: "Courses",
            title: "ISOSEC Certified Security Courses",
            snippet: "Certified security courses and professional qualifications from the Institute of Securities Studies.",
            icon: FileText,
            link: "https://isosecghanaltd.com/certified-security-courses/"
        },
        {
            category: "Institute",
            title: "Ghana Securities Institute",
            snippet: "Comprehensive securities education and professional development programs.",
            icon: GraduationCap,
            link: "https://www.gisinstitute.org/"
        },
        {
            category: "Calendar",
            title: "GIS Training Calendar",
            snippet: "Upcoming training sessions and workshops from the Ghana Securities Institute.",
            icon: TrendingUp,
            link: "https://www.gisinstitute.org/training-calendar"
        },
        {
            category: "Courses",
            title: "ISOSEC Course Catalog",
            snippet: "Full range of courses offered by the Institute of Securities Studies.",
            icon: BookOpen,
            link: "https://isosecghanaltd.com/courses"
        },
        {
            category: "Regulation",
            title: "SEC Insider Trading Guidelines 2026",
            snippet: "Public consultation on draft securities industry insider trading guidelines.",
            icon: FileText,
            link: "https://sec.gov.gh/call-for-feedback-on-the-draft-securities-industry-insider-trading-guidelines-2026/"
        },
        {
            category: "Regulation",
            title: "SEC Commercial Papers Directive",
            snippet: "Directive to market operators on investments in commercial papers.",
            icon: FileText,
            link: "https://sec.gov.gh/directive-to-market-operators-on-investments-in-commercial-papers/"
        }
    ];

    // Topic groups in order of first appearance, so the page reads as a run of sections.
    const groups = featuredArticles.reduce<{ category: string; items: typeof featuredArticles }[]>((acc, article) => {
        const group = acc.find((entry) => entry.category === article.category);
        if (group) group.items.push(article);
        else acc.push({ category: article.category, items: [article] });
        return acc;
    }, []);

    return (
        <main className="page-container news-page">
            <PageIntro
                eyebrow="Learning Center"
                title="Learning Center"
                description="Expert analysis, educational content, and courses to help you navigate the Ghana Stock Exchange with confidence."
            />

            <section className="news-section !mt-0" aria-labelledby="learning-courses">
                <header className="news-section-header">
                    <h2 id="learning-courses">Courses and Learning</h2>
                    <span>{featuredArticles.length} resources from Ghana's regulators and institutes</span>
                </header>

                {groups.map((group) => (
                    <div key={group.category} className="mt-8" role="group" aria-labelledby={`learning-${group.category.toLowerCase()}`}>
                        <h3 id={`learning-${group.category.toLowerCase()}`} className="news-subhead flex items-baseline justify-between gap-4">
                            {group.category}
                            <span className="news-byline font-sans font-normal">{group.items.length} {group.items.length === 1 ? "resource" : "resources"}</span>
                        </h3>
                        <div className="news-tiles">
                        {group.items.map((article) => (
                            <a
                                key={article.title}
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="news-tile"
                            >
                                <h4 className="font-poppins text-[20px] font-semibold leading-tight tracking-[-.01em] flex items-start gap-2">
                                    <article.icon size={20} className="mt-0.5 shrink-0 text-fluid-cyan-ink" aria-hidden="true" />
                                    <span>{article.title}</span>
                                </h4>
                                <p>{article.snippet}</p>
                                <span className="news-byline mt-3 inline-flex items-center gap-1">
                                    {new URL(article.link).hostname.replace(/^www\./, "")}
                                    <ArrowUpRight size={12} aria-hidden="true" />
                                </span>
                            </a>
                        ))}
                        </div>
                    </div>
                ))}
            </section>
        </main>
    );
}

export default LearningCenterPage;
