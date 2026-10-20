import type { MouseEvent } from "react";
import { PageIntro } from "@/components/ui/page-intro";

const slug = (title: string) => title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** The app routes on the hash, so in-page links scroll directly instead of rewriting it. */
function jumpTo(id: string) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
}

function TermsOfServicePage() {
    const sections = [
        {
            title: "Acceptance of Terms",
            content: (
                <>
                    <p>
                        By accessing or using the Fluid Finance platform, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you may not access the platform.
                    </p>
                    <p>
                        These terms apply to all users of the platform, including without limitation users who are browsers, vendors, customers, traders, and/or contributors of content.
                    </p>
                </>
            )
        },
        {
            title: "User Accounts",
            content: (
                <>
                    <p>
                        To use certain features of the platform, you must register for an account. You agree to:
                    </p>
                    <ul className="list-disc">
                        <li>Provide accurate, current, and complete information when registering</li>
                        <li>Maintain and update your information to keep it accurate and complete</li>
                        <li>Maintain the security of your account credentials</li>
                        <li>Be responsible for all activities that occur under your account</li>
                        <li>Notify us immediately of any unauthorized use of your account</li>
                    </ul>
                    <h3>Eligibility:</h3>
                    <p>You must be at least 18 years old and reside in a jurisdiction where trading financial instruments is permitted.</p>
                </>
            )
        },
        {
            title: "Financial Data & Market Information",
            content: (
                <>
                    <p>
                        Our platform provides real-time and historical financial data from the Ghana Stock Exchange and other sources. You agree that:
                    </p>
                    <ul className="list-disc">
                        <li>All market data is provided "as is" and may contain errors or delays</li>
                        <li>Trading decisions are your own responsibility</li>
                        <li>We are not a broker-dealer or investment advisor</li>
                        <li>Market data is for informational purposes only</li>
                    </ul>
                </>
            )
        },
        {
            title: "Trading & Investment Risks",
            content: (
                <>
                    <p>
                        Trading financial instruments involves substantial risk of loss. You acknowledge and understand that:
                    </p>
                    <ul className="list-disc">
                        <li>Past performance does not guarantee future results</li>
                        <li>You may lose some or all of your invested capital</li>
                        <li>You should not invest money you cannot afford to lose</li>
                        <li>Market conditions can change rapidly</li>
                    </ul>
                    <p>
                        <strong className="text-ink">Disclaimer:</strong> Nothing on this platform constitutes investment advice, a recommendation to buy or sell, or solicitation of any kind. You must do your own research and consult with qualified professionals.
                    </p>
                </>
            )
        },
        {
            title: "Payment & Billing",
            content: (
                <>
                    <p>
                        Some features of our platform may require payment. By providing payment information, you authorize us to charge applicable fees.
                    </p>
                    <ul className="list-disc">
                        <li>All fees are non-refundable unless otherwise specified</li>
                        <li>We reserve the right to change our fees at any time</li>
                        <li>You are responsible for all applicable taxes</li>
                    </ul>
                </>
            )
        },
        {
            title: "Termination",
            content: (
                <>
                    <p>
                        We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms of Service.
                    </p>
                    <p>
                        Upon termination, your right to use the platform will immediately cease.
                    </p>
                </>
            )
        },
        {
            title: "Governing Law",
            content: (
                <>
                    <p>
                        These Terms shall be governed by and construed in accordance with the laws of Ghana, without regard to its conflict of law provisions.
                    </p>
                    <p>
                        Any legal suit, action, or proceeding arising out of or related to these Terms or the platform shall be instituted exclusively in the competent courts of Ghana.
                    </p>
                </>
            )
        }
    ];

    return (
        <main className="page-container news-page">
            <PageIntro
                eyebrow="Legal"
                title="Terms of Service"
                description="Please read these terms carefully before using our financial platform."
            />

            <div className="news-columns news-columns--main">
                <article className="news-prose">
                    {sections.map((section) => (
                        <section key={section.title} id={slug(section.title)} aria-labelledby={`${slug(section.title)}-heading`}>
                            <h2 id={`${slug(section.title)}-heading`}>{section.title}</h2>
                            {section.content}
                        </section>
                    ))}
                </article>

                <aside className="news-rail" aria-label="Contents">
                    <h2 className="news-subhead">Contents</h2>
                    <ul className="news-list text-sm">
                        {sections.map((section) => (
                            <li key={section.title}>
                                <a href={`#${slug(section.title)}`} onClick={jumpTo(slug(section.title))} className="font-semibold hover:underline">{section.title}</a>
                            </li>
                        ))}
                    </ul>
                </aside>
            </div>
        </main>
    );
}

export default TermsOfServicePage;
