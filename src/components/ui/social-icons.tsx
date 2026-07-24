/** Brand marks not covered by lucide-react. */

interface IconProps {
    size?: number;
    className?: string;
}

export function XIcon({ size = 20, className }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

export function TikTokIcon({ size = 20, className }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path d="M16.6 5.82a4.28 4.28 0 0 1-1.05-2.82h-3.2v12.86a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1 0-5.18c.27 0 .53.04.77.12v-3.3a5.9 5.9 0 0 0-.77-.05 5.84 5.84 0 1 0 5.84 5.84V9.4a7.5 7.5 0 0 0 4.4 1.41V7.62a4.3 4.3 0 0 1-3.4-1.8z" />
        </svg>
    );
}

export const SOCIAL_ICONS = {
    x: XIcon,
    tiktok: TikTokIcon,
} as const;
