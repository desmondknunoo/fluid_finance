import { Fragment, type ReactNode } from "react";

/**
 * Fluid Finance - rich text
 *
 * Articles and posts are stored as a small Markdown subset and rendered to React elements, never
 * to raw HTML, so member-written text cannot inject markup. Supported:
 *
 *   # / ## / ###   headings            > quote          - item / 1. item   lists
 *   **bold**  *italic*  `code`         [text](https://…) links            blank line = paragraph
 */

type Block =
    | { kind: "heading"; level: 1 | 2 | 3; text: string }
    | { kind: "paragraph"; text: string }
    | { kind: "quote"; text: string }
    | { kind: "list"; ordered: boolean; items: string[] };

export function parseBlocks(source: string): Block[] {
    const lines = source.replace(/\r\n?/g, "\n").split("\n");
    const blocks: Block[] = [];
    let paragraph: string[] = [];
    let quote: string[] = [];
    let list: { ordered: boolean; items: string[] } | null = null;

    const flush = () => {
        if (paragraph.length) blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
        if (quote.length) blocks.push({ kind: "quote", text: quote.join(" ") });
        if (list) blocks.push({ kind: "list", ordered: list.ordered, items: list.items });
        paragraph = [];
        quote = [];
        list = null;
    };

    for (const raw of lines) {
        const line = raw.trimEnd();
        if (!line.trim()) { flush(); continue; }

        const heading = line.match(/^(#{1,3})\s+(.+)$/);
        if (heading) { flush(); blocks.push({ kind: "heading", level: heading[1].length as 1 | 2 | 3, text: heading[2].trim() }); continue; }

        const quoted = line.match(/^>\s?(.*)$/);
        if (quoted) {
            if (paragraph.length || list) flush();
            quote.push(quoted[1]);
            continue;
        }

        const bullet = line.match(/^\s*[-*]\s+(.+)$/);
        const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
        if (bullet || numbered) {
            const ordered = Boolean(numbered);
            if (paragraph.length || quote.length || (list && list.ordered !== ordered)) flush();
            if (!list) list = { ordered, items: [] };
            list.items.push((bullet ?? numbered)![1]);
            continue;
        }

        if (quote.length || list) flush();
        paragraph.push(line.trim());
    }
    flush();
    return blocks;
}

const INLINE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;

export function renderInline(text: string): ReactNode[] {
    const parts = text.split(INLINE).filter((part) => part !== "");
    return parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`")) return <code key={index} className="rounded bg-ink/[0.08] px-1.5 py-0.5 font-mono text-[0.9em]">{part.slice(1, -1)}</code>;
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={index}>{part.slice(1, -1)}</em>;
        const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
        if (link) {
            return (
                <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer nofollow" className="text-fluid-cyan-ink underline decoration-fluid-cyan/40 underline-offset-4 hover:decoration-fluid-cyan">
                    {link[1]}
                </a>
            );
        }
        return <Fragment key={index}>{part}</Fragment>;
    });
}

/** Full article body with headings, lists and quotes. */
export function RichText({ source, className }: { source: string; className?: string }) {
    const blocks = parseBlocks(source);
    return (
        <div className={className}>
            {blocks.map((block, index) => {
                switch (block.kind) {
                    case "heading": {
                        const Tag = block.level === 1 ? "h2" : block.level === 2 ? "h3" : "h4";
                        const size = block.level === 1 ? "text-2xl md:text-3xl mt-10" : block.level === 2 ? "text-xl md:text-2xl mt-8" : "text-lg mt-6";
                        return <Tag key={index} className={`${size} mb-3 font-bold tracking-tight text-ink font-poppins`}>{renderInline(block.text)}</Tag>;
                    }
                    case "quote":
                        return <blockquote key={index} className="my-5 border-l-2 border-fluid-cyan/60 pl-4 text-ink/70 italic">{renderInline(block.text)}</blockquote>;
                    case "list": {
                        const Tag = block.ordered ? "ol" : "ul";
                        return (
                            <Tag key={index} className={`my-4 space-y-1.5 pl-6 text-ink/80 ${block.ordered ? "list-decimal" : "list-disc"}`}>
                                {block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}
                            </Tag>
                        );
                    }
                    default:
                        return <p key={index} className="my-4 leading-relaxed text-ink/80">{renderInline(block.text)}</p>;
                }
            })}
        </div>
    );
}

/** Comments and forum posts: paragraphs and inline marks only, so a reply cannot shout in headings. */
export function PostText({ source, className }: { source: string; className?: string }) {
    const paragraphs = source.replace(/\r\n?/g, "\n").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    return (
        <div className={className}>
            {paragraphs.map((paragraph, index) => (
                <p key={index} className="whitespace-pre-line leading-relaxed text-ink/85 [&:not(:first-child)]:mt-3">{renderInline(paragraph)}</p>
            ))}
        </div>
    );
}
