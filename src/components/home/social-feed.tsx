import { useState, type ComponentType } from "react";
import { ArrowUpRight, Facebook, Linkedin, MessageCircle } from "lucide-react";
import { formatRelative, type SocialFeedPost } from "@/lib/community";
import { safeExternalUrl } from "@/lib/content-media";
import { SOCIAL_LINKS } from "@/lib/links";
import { SOCIAL_ICONS } from "@/components/ui/social-icons";

/**
 * "From our socials": the posts the social desk has marked as posted, pulled from the Fluid
 * backend, plus the company profiles to follow. Everything links out to the live post; nothing
 * here embeds third-party scripts.
 */

type Icon = ComponentType<{ size?: number; className?: string }>;

const PLATFORMS: Record<SocialFeedPost["platform"], { label: string; icon: Icon }> = {
    x: { label: "X", icon: SOCIAL_ICONS.x },
    instagram: { label: "Instagram", icon: SOCIAL_ICONS.instagram },
    tiktok: { label: "TikTok", icon: SOCIAL_ICONS.tiktok },
    linkedin: { label: "LinkedIn", icon: Linkedin },
    facebook: { label: "Facebook", icon: Facebook },
    whatsapp: { label: "WhatsApp", icon: MessageCircle },
};

const PROFILE_BY_PLATFORM: Partial<Record<SocialFeedPost["platform"], string>> = Object.fromEntries(SOCIAL_LINKS.map((social) => [social.key, social.href]));

const handleOf = (href: string) => `@${new URL(href).pathname.replace(/\/+$/, "").split("/").pop()?.replace(/^@/, "") ?? ""}`;

/** Where a card should send the reader: the live post, else the company profile on that platform. */
function postLink(post: SocialFeedPost): string | null {
    return safeExternalUrl(post.published_url) ?? PROFILE_BY_PLATFORM[post.platform] ?? null;
}

export function SocialFeed({ posts }: { posts: SocialFeedPost[] }) {
    return (
        <>
            {posts.length === 0 ? (
                <p className="px-5 py-6 text-sm text-ink/50">Posts from the Fluid Finance social desk appear here as they go live. Follow us for market updates between editions.</p>
            ) : (
                <div className="grid gap-px bg-ink/[0.08] sm:grid-cols-2 lg:grid-cols-4">
                    {posts.slice(0, 8).map((post) => <PostCard key={post.id} post={post} />)}
                </div>
            )}
            <div className="grid gap-px border-t border-ink/[0.08] bg-ink/[0.08] sm:grid-cols-3">
                {SOCIAL_LINKS.map((social) => {
                    const Icon = SOCIAL_ICONS[social.key];
                    return (
                        <a key={social.key} href={social.href} target="_blank" rel="noreferrer noopener" className="flex items-center gap-3 bg-canvas px-5 py-3 text-sm hover:bg-ink/[0.02]">
                            <Icon size={16} className="shrink-0 text-ink/50" />
                            <span className="min-w-0"><span className="block font-semibold text-ink">Follow on {social.label}</span><span className="block truncate text-xs text-ink/45">{handleOf(social.href)}</span></span>
                            <ArrowUpRight size={14} className="ml-auto shrink-0 text-ink/30" aria-hidden="true" />
                        </a>
                    );
                })}
            </div>
        </>
    );
}

function PostCard({ post }: { post: SocialFeedPost }) {
    const platform = PLATFORMS[post.platform] ?? PLATFORMS.x;
    const Icon = platform.icon;
    const [broken, setBroken] = useState(false);
    const image = broken ? null : safeExternalUrl(post.asset_url);
    const link = postLink(post);
    const tags = post.hashtags.slice(0, 3);
    const external = link ? { href: link, target: "_blank", rel: "noreferrer noopener" } : null;
    return (
        <article className="flex flex-col bg-canvas">
            {image && (external ? <a {...external} tabIndex={-1} aria-hidden="true"><img src={image} alt="" loading="lazy" onError={() => setBroken(true)} className="aspect-[4/5] w-full object-cover" /></a> : <img src={image} alt="" loading="lazy" onError={() => setBroken(true)} className="aspect-[4/5] w-full object-cover" />)}
            <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-fluid-cyan-ink">
                    <Icon size={14} className="shrink-0" />
                    <span>{platform.label}</span>
                    {post.posted_at && <span className="ml-auto font-normal normal-case tracking-normal text-ink/45">{formatRelative(post.posted_at)}</span>}
                </div>
                <h3 className="mt-3 text-base font-bold leading-snug text-ink">{post.title}</h3>
                {post.caption && <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-ink/65">{post.caption}</p>}
                {tags.length > 0 && <p className="mt-2 text-xs text-ink/45">{tags.map((tag) => `#${tag.replace(/^#+/, "")}`).join(" ")}</p>}
                {external && <a {...external} className="news-text-link mt-auto pt-4">View on {platform.label} <ArrowUpRight size={13} aria-hidden="true" /></a>}
            </div>
        </article>
    );
}
