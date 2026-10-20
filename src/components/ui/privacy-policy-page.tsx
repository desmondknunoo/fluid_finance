import type { MouseEvent } from "react";
import { Shield, Lock, FileText, Cookie, Globe, Mail } from "lucide-react";
import { PageIntro } from "@/components/ui/page-intro";

const slug = (title: string) => title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** The app routes on the hash, so in-page links scroll directly instead of rewriting it. */
function jumpTo(id: string) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
}

function PrivacyPolicyPage() {
    const sections = [
        {
            icon: FileText,
            title: "Information We Collect",
            content: (
                <>
                    <p>
                        We collect information you provide directly when using our platform, including your name, email address, and trading preferences. This includes:
                    </p>
                    <ul className="list-disc">
                        <li>Account registration and authentication data</li>
                        <li>Trading activity and portfolio information</li>
                        <li>Communication preferences and support tickets</li>
                        <li>Payment information (processed securely through third-party processors)</li>
                    </ul>
                </>
            )
        },
        {
            icon: Lock,
            title: "How We Use Your Information",
            content: (
                <>
                    <p>We use your information to:</p>
                    <ul className="list-disc">
                        <li>Provide, operate, and maintain our financial platform services</li>
                        <li>Process and execute your trading orders and transactions</li>
                        <li>Send you updates, alerts, and market information</li>
                        <li>Improve our website and user experience</li>
                        <li>Monitor and analyze usage patterns for platform optimization</li>
                        <li>Detect, prevent, and address technical issues or fraud</li>
                    </ul>
                </>
            )
        },
        {
            icon: Shield,
            title: "Data Protection & Security",
            content: (
                <>
                    <p>
                        We implement industry-standard security measures to protect your personal and financial information:
                    </p>
                    <ul className="list-disc">
                        <li>SSL/TLS encryption for all data transmissions</li>
                        <li>Secure socket layer for all financial transactions</li>
                        <li>Regular security audits and penetration testing</li>
                        <li>Multi-factor authentication options</li>
                        <li>Limited access to sensitive data on a need-to-know basis</li>
                    </ul>
                    <p>
                        <strong className="text-ink">Important:</strong> While we strive to protect your information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.
                    </p>
                </>
            )
        },
        {
            icon: FileText,
            title: "Your Rights & Choices",
            content: (
                <>
                    <p>You have the right to:</p>
                    <ul className="list-disc">
                        <li>Access, update, or delete your personal information</li>
                        <li>Export your account data in a portable format</li>
                        <li>Opt-out of marketing communications</li>
                        <li>Request a copy of your stored data</li>
                        <li>Request deletion of your account and associated data</li>
                    </ul>
                    <p>
                        To exercise any of these rights, please contact us at privacy@fluidfinance.com. We will respond to your request within 30 days.
                    </p>
                </>
            )
        },
        {
            icon: Cookie,
            title: "Cookies & Tracking",
            content: (
                <>
                    <p>
                        We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                    </p>
                    <p>
                        However, if you do not accept cookies, you may not be able to use some portions of our platform effectively.
                    </p>
                </>
            )
        },
        {
            icon: Globe,
            title: "Third-Party Services",
            content: (
                <>
                    <p>
                        Our platform may use third-party services for payment processing, data analytics, and other services. These third parties have their own privacy policies and may collect information independently.
                    </p>
                    <p>
                        We encourage you to review the privacy policies of any third-party services we use.
                    </p>
                </>
            )
        },
        {
            icon: Shield,
            title: "Updates to This Policy",
            content: (
                <>
                    <p>
                        We may update our Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the effective date.
                    </p>
                    <p>
                        We encourage you to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                    </p>
                </>
            )
        }
    ];

    return (
        <main className="page-container news-page">
            <PageIntro
                eyebrow="Legal"
                title="Privacy Policy"
                description="Your financial information and personal data are protected with industry-standard security measures."
            />

            <div className="news-columns news-columns--main">
                <article className="news-prose">
                    {sections.map((section) => (
                        <section key={section.title} id={slug(section.title)} aria-labelledby={`${slug(section.title)}-heading`}>
                            <h2 id={`${slug(section.title)}-heading`} className="flex items-center gap-2">
                                <section.icon size={20} className="shrink-0" aria-hidden="true" />
                                {section.title}
                            </h2>
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
                        <li>
                            <a href="#have-questions" onClick={jumpTo("have-questions")} className="font-semibold hover:underline">Have Questions?</a>
                        </li>
                    </ul>
                </aside>
            </div>

            <section className="news-section" id="have-questions" aria-labelledby="have-questions-heading">
                <header className="news-section-header">
                    <h2 id="have-questions-heading" className="flex items-center gap-2">
                        <Mail size={20} aria-hidden="true" />
                        Have Questions?
                    </h2>
                </header>
                <div className="py-6">
                    <p className="news-standfirst">
                        We're committed to protecting your privacy. If you have any questions about this policy or our data practices, please reach out.
                    </p>
                    <a href="mailto:privacy@fluidfinance.com" className="news-button mt-6">
                        Contact Privacy Team
                    </a>
                </div>
            </section>
        </main>
    );
}

export default PrivacyPolicyPage;
