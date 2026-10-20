import { lazy, type ComponentType } from "react";

/**
 * React.lazy for code-split routes, safe across deploys. Chunk names are content-hashed, so a tab
 * opened before a release can ask for a chunk the new deployment no longer has. Instead of a
 * blank page, reload once to pick up the current build; a second failure surfaces normally.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the same bound React.lazy uses
export function lazyRoute<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
    return lazy(() => load().catch((error: unknown) => {
        const key = `fluidfinance:chunk-reload:${window.location.pathname}`;
        try {
            if (!sessionStorage.getItem(key)) {
                sessionStorage.setItem(key, String(Date.now()));
                window.location.reload();
                return new Promise<{ default: T }>(() => { /* the page is reloading */ });
            }
            sessionStorage.removeItem(key);
        } catch {
            /* storage unavailable: fall through to the error */
        }
        throw error;
    }));
}
