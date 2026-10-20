import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/links";
import { SOCIAL_ICONS } from "@/components/ui/social-icons";
import { useTheme } from "@/lib/theme";

export const FEED_LINKS = SOCIAL_LINKS.filter((social) => social.key !== "x");
type Social = typeof FEED_LINKS[number];

/** Official account widgets fetch their own current posts; portal drafts are never a feed source. */
export function SocialFeed() {
    const container = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const { resolved } = useTheme();

    useEffect(() => {
        if (!container.current) return;
        if (!("IntersectionObserver" in window)) { setVisible(true); return; }
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
        }, { rootMargin: "300px" });
        observer.observe(container.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={container}>
            <p className="border-b border-ink/[0.08] px-5 py-3 text-sm text-ink/65">Recent posts directly from our social accounts. If a feed is unavailable, open the account to see its latest posts.</p>
            <div className="grid max-w-4xl gap-px bg-ink/[0.08] md:grid-cols-2">
                {FEED_LINKS.map((social) => {
                    const Icon = SOCIAL_ICONS[social.key];
                    return (
                        <section key={social.key} aria-label={`${social.label} account feed`} className="min-w-0 bg-canvas">
                            <a href={social.href} target="_blank" rel="noreferrer noopener" className="flex items-center gap-3 px-5 py-4 text-sm font-semibold hover:underline">
                                <Icon size={18} className="shrink-0" />
                                <span>{social.label}</span>
                                <ArrowUpRight size={16} className="ml-auto" aria-hidden="true" />
                            </a>
                            {visible && social.key === "instagram" ? <iframe
                                title="Latest Fluid Finance posts on Instagram"
                                src="https://www.instagram.com/fluidfinanceonline/embed/"
                                referrerPolicy="strict-origin-when-cross-origin"
                                loading="lazy"
                                scrolling="no"
                                className="block h-[440px] w-full border-0 bg-white"
                            /> : visible ? <iframe
                                key={`${social.key}-${resolved}`}
                                title={`Latest Fluid Finance posts on ${social.label}`}
                                srcDoc={embedDocument(social)}
                                sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
                                referrerPolicy="strict-origin-when-cross-origin"
                                loading="lazy"
                                scrolling="no"
                                className="block h-[440px] w-full border-0 bg-white"
                            /> : <div className="px-5 py-8 text-sm text-ink/65">Feed loads when this section is in view.</div>}
                            <a href={social.href} target="_blank" rel="noreferrer noopener" className="news-text-link flex items-center gap-2 px-5 py-4">Open {social.label} <ArrowUpRight size={13} aria-hidden="true" /></a>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}

/** TikTok's official creator widget runs in an opaque frame, separate from the site session. */
function embedDocument(social: Social): string {
    const markup = `<blockquote class="tiktok-embed" cite="${social.href}" data-unique-id="fluid_finance" data-embed-type="creator" style="max-width:100%;min-width:288px;margin:0"><section><a target="_blank" rel="noopener noreferrer" href="${social.href}">@fluid_finance on TikTok</a></section></blockquote><script async src="https://www.tiktok.com/embed.js"></script>`;
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;padding:0;background:#fff;overflow:hidden;font:14px/1.6 Arial,sans-serif}a{color:#005c70}iframe{max-width:100%;height:430px!important;border:0}</style></head><body>${markup}</body></html>`;
}
