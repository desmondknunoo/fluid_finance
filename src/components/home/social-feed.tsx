import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/links";
import { SOCIAL_ICONS } from "@/components/ui/social-icons";
import { useTheme } from "@/lib/theme";

export const FEED_LINKS = SOCIAL_LINKS.filter((social) => social.key !== "x");
type Social = typeof FEED_LINKS[number];

/**
 * Instagram's profile embed has a fixed layout at every width: a 157px header, a 400px post grid
 * that scrolls inside itself and a 64px footer, plus its 1px border. It never reports a usable
 * height (its MEASURE message says 0), so the frame is sized to that layout exactly.
 */
const INSTAGRAM_HEIGHT = 625;
/** TikTok's height before its widget reports one; replaced as soon as it measures itself. */
const INITIAL_HEIGHT = 480;
const MAX_HEIGHT = 1400;
const clampHeight = (value: number) => Math.min(MAX_HEIGHT, Math.max(120, Math.ceil(value)));

/**
 * Official account widgets fetch their own current posts; portal drafts are never a feed source.
 * Each frame wraps its content: Instagram's embed posts a MEASURE message with its height, and
 * the sandboxed TikTok document reports its own height, so neither leaves blank space or crops.
 */
export function SocialFeed() {
    const container = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const [heights, setHeights] = useState<Record<string, number>>({});
    const instagramFrame = useRef<HTMLIFrameElement>(null);
    const tiktokFrame = useRef<HTMLIFrameElement>(null);
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

    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            // Instagram: '{"type":"MEASURE","details":{"height":N}}' from its own origin and frame.
            if (event.origin === "https://www.instagram.com" && event.source === instagramFrame.current?.contentWindow) {
                try {
                    const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
                    const height = Number(data?.details?.height);
                    if (data?.type === "MEASURE" && Number.isFinite(height) && height > 0) setHeights((current) => ({ ...current, instagram: clampHeight(height) }));
                } catch { /* not a measure message */ }
                return;
            }
            // TikTok: the sandboxed srcdoc frame has an opaque origin, so trust only its window.
            if (event.source === tiktokFrame.current?.contentWindow && event.data?.type === "fluid-feed-height") {
                const height = Number(event.data.height);
                if (Number.isFinite(height) && height > 0) setHeights((current) => ({ ...current, tiktok: clampHeight(height) }));
            }
        };
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, []);

    return (
        <div ref={container}>
            <p className="border-b border-ink/[0.08] px-5 py-3 text-sm text-ink/65">Recent posts directly from our social accounts. If a feed is unavailable, open the account to see its latest posts.</p>
            <div className="grid max-w-4xl items-start divide-y divide-ink/[0.08] md:grid-cols-2 md:divide-x md:divide-y-0">
                {FEED_LINKS.map((social) => {
                    const Icon = SOCIAL_ICONS[social.key];
                    const height = heights[social.key] ?? (social.key === "instagram" ? INSTAGRAM_HEIGHT : INITIAL_HEIGHT);
                    return (
                        <section key={social.key} aria-label={`${social.label} account feed`} className="min-w-0 bg-canvas">
                            <a href={social.href} target="_blank" rel="noreferrer noopener" className="flex items-center gap-3 px-5 py-4 text-sm font-semibold hover:underline">
                                <Icon size={18} className="shrink-0" />
                                <span>{social.label}</span>
                                <ArrowUpRight size={16} className="ml-auto" aria-hidden="true" />
                            </a>
                            {visible && social.key === "instagram" ? <iframe
                                ref={instagramFrame}
                                title="Latest Fluid Finance posts on Instagram"
                                src="https://www.instagram.com/fluidfinanceonline/embed/"
                                referrerPolicy="strict-origin-when-cross-origin"
                                loading="lazy"
                                scrolling="no"
                                style={{ height }}
                                className="block w-full border-0 bg-white"
                            /> : visible ? <iframe
                                ref={tiktokFrame}
                                key={`${social.key}-${resolved}`}
                                title={`Latest Fluid Finance posts on ${social.label}`}
                                srcDoc={embedDocument(social)}
                                sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
                                referrerPolicy="strict-origin-when-cross-origin"
                                loading="lazy"
                                scrolling="no"
                                style={{ height }}
                                className="block w-full border-0 bg-white"
                            /> : <div className="px-5 py-8 text-sm text-ink/65">Feed loads when this section is in view.</div>}
                            <a href={social.href} target="_blank" rel="noreferrer noopener" className="news-text-link flex items-center gap-2 px-5 py-4">Open {social.label} <ArrowUpRight size={13} aria-hidden="true" /></a>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * TikTok's official creator widget runs in an opaque frame, separate from the site session. The
 * document reports its rendered height to the page whenever it changes (the widget grows once its
 * own frame loads), so the outer frame always wraps the posts.
 */
function embedDocument(social: Social): string {
    const markup = `<blockquote class="tiktok-embed" cite="${social.href}" data-unique-id="fluid_finance" data-embed-type="creator" style="max-width:100%;min-width:288px;margin:0"><section><a target="_blank" rel="noopener noreferrer" href="${social.href}">@fluid_finance on TikTok</a></section></blockquote><script async src="https://www.tiktok.com/embed.js"></script>`;
    const reporter = `<script>(function(){var last=0;window.addEventListener("message",function(e){var d=e.data;if(typeof d==="string"){try{d=JSON.parse(d);}catch(x){return;}}if(!d||typeof d.signalSource!=="string"||d.signalSource.indexOf("__tt_embed__")!==0)return;var h=Number(d.height);if(!(h>0&&h<3000))return;var frames=document.querySelectorAll("iframe");for(var i=0;i<frames.length;i++){frames[i].style.height=h+"px";frames[i].style.maxHeight=h+"px";}send();});function send(){var h=Math.ceil(document.documentElement.getBoundingClientRect().height);if(h&&h!==last){last=h;parent.postMessage({type:"fluid-feed-height",height:h},"*");}}if("ResizeObserver" in window){new ResizeObserver(send).observe(document.documentElement);}new MutationObserver(send).observe(document.documentElement,{subtree:true,childList:true,attributes:true});window.addEventListener("load",send);setInterval(send,1000);send();})();</script>`;
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;padding:0;background:#fff;overflow:hidden;font:14px/1.6 Arial,sans-serif}a{color:#005c70}iframe{max-width:100%;border:0;display:block}</style></head><body>${markup}${reporter}</body></html>`;
}
