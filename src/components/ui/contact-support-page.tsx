import { Mail, MessageCircle, Clock, MapPin, ArrowRight } from "lucide-react";
import { PageIntro } from "@/components/ui/page-intro";

const EMAIL = "info@fluidterra.com";

function ContactSupportPage() {
    const channels = [
        {
            icon: Mail,
            title: "Email Us",
            description: "Send us an email and we'll get back to you within 24 hours.",
            action: { label: "Send Email", href: `mailto:${EMAIL}` },
        },
        {
            icon: MessageCircle,
            title: "Live Chat",
            description: "Chat with our support team in real-time during business hours.",
            action: { label: "Start Chat", href: `mailto:${EMAIL}` },
        },
        {
            icon: Clock,
            title: "Response Time",
            description: "We aim to respond to all inquiries within 24-48 hours on business days.",
            action: null,
        },
        {
            icon: MapPin,
            title: "Location",
            description: "Ghana. Our team is available remotely to serve clients across the country.",
            action: null,
        },
    ];

    const ways = channels.filter((channel) => channel.action);
    const details = channels.filter((channel) => !channel.action);

    return (
        <main className="page-container news-page">
            <PageIntro
                eyebrow="Support"
                title="Contact Support"
                description="Have a question or need assistance? Our team is here to help you with anything related to Fluid Finance."
            />

            <div className="news-columns news-columns--main">
                <div>
                    <section aria-labelledby="contact-ways">
                        <h2 id="contact-ways" className="news-subhead">Ways to reach us</h2>
                        <div className="news-tiles news-tiles--2">
                            {ways.map((channel) => (
                                <article key={channel.title} className="news-tile">
                                    <h3 className="flex items-start gap-2">
                                        <channel.icon size={20} className="mt-0.5 shrink-0 text-fluid-cyan-ink" aria-hidden="true" />
                                        <span>{channel.title}</span>
                                    </h3>
                                    <p>{channel.description}</p>
                                    {channel.action && (
                                        <a href={channel.action.href} className="news-text-link mt-4">
                                            {channel.action.label}
                                            <ArrowRight size={14} aria-hidden="true" />
                                        </a>
                                    )}
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="news-section" aria-labelledby="contact-start">
                        <header className="news-section-header">
                            <h2 id="contact-start">Ready to Get Started?</h2>
                        </header>
                        <div className="py-6">
                            <p className="news-standfirst">
                                Whether you have a question about features, pricing, or anything else — our team is ready to answer all your questions.
                            </p>
                            <a href={`mailto:${EMAIL}`} className="news-button mt-6">
                                Contact Us
                            </a>
                        </div>
                    </section>
                </div>

                <aside className="news-rail" aria-label="Contact details">
                    <h2 className="news-subhead">Good to know</h2>
                    <ul className="news-list">
                        {details.map((channel) => (
                            <li key={channel.title}>
                                <h3 className="news-headline-sm flex items-center gap-2">
                                    <channel.icon size={18} className="shrink-0 text-fluid-cyan-ink" aria-hidden="true" />
                                    {channel.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-ink/[0.68]">{channel.description}</p>
                            </li>
                        ))}
                    </ul>
                </aside>
            </div>
        </main>
    );
}

export default ContactSupportPage;
