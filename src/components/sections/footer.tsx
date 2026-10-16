import { Mail } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/links";
import { SOCIAL_ICONS } from "@/components/ui/social-icons";
import { BrandLogo } from "@/components/ui/brand-logo";

const GROUPS = [
    { title: "Markets", links: [["GSE Live", "#/gse-live"], ["Market trends", "#/market-trends"], ["Currencies", "#/fx"], ["Fuel prices", "#/fuel"]] },
    { title: "Perspective", links: [["Research", "#/articles"], ["Business & economy", "#/business-news"], ["Community", "#/forum"], ["Join Fluid Finance", "#/register"]] },
    { title: "Learn", links: [["Learning center", "#/learning-center"], ["Market education", "#/market-education"], ["Help center", "#/help-center"], ["Contact support", "#/contact-support"]] },
    { title: "Fluid Finance", links: [["About us", "#/about-us"], ["Privacy policy", "#/privacy-policy"], ["Terms of service", "#/terms-of-service"]] },
];

export function EnhancedFooter() {
    return (
        <footer className="news-footer">
            <div className="page-container">
                <div className="news-footer-grid">
                    <div className="news-footer-brand">
                        <a href="#/" className="news-brand" aria-label="Fluid Finance home"><BrandLogo variant="horizontal" className="h-12 sm:h-14" /></a>
                        <p className="mt-4 max-w-xs text-xs leading-relaxed text-ink/60">Ghana's markets, research and financial education. A clearer view of the numbers that matter.</p>
                        <div className="mt-5 flex items-center gap-4">
                            {SOCIAL_LINKS.map((social) => { const Icon = SOCIAL_ICONS[social.key]; return <a key={social.key} href={social.href} target="_blank" rel="noreferrer noopener" aria-label={`Fluid Finance on ${social.label}`} className="inline-flex min-h-8 min-w-8 items-center justify-center text-ink/60 hover:text-ink"><Icon size={17} /></a>; })}
                            <a href="mailto:info@fluidterra.com" aria-label="Email Fluid Finance" className="inline-flex min-h-8 min-w-8 items-center justify-center text-ink/60 hover:text-ink"><Mail size={17} /></a>
                        </div>
                    </div>
                    {GROUPS.map((group) => <div key={group.title}><h3>{group.title}</h3><ul>{group.links.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul></div>)}
                </div>
                <div className="news-footer-legal">
                    <p>Fluid Finance is a financial publication and market education platform. It does not execute trades, hold client funds, or act as a broker. Nothing on this site is investment advice. Investing carries risk of loss. Market data may be delayed by 15–20 minutes.</p>
                    <span className="shrink-0">© {new Date().getFullYear()} Fluid Finance</span>
                </div>
            </div>
        </footer>
    );
}
