/**
 * The few Cloudflare Workers / Pages Functions types the functions use, declared locally so the
 * project needs no extra type package. Shapes follow @cloudflare/workers-types.
 */

interface PagesAssets {
    fetch(input: Request | URL | string, init?: RequestInit): Promise<Response>;
}

interface PagesEventContext<Env, Params extends string> {
    request: Request;
    env: Env;
    params: Record<Params, string | string[]>;
    next(input?: Request | string, init?: RequestInit): Promise<Response>;
    waitUntil(promise: Promise<unknown>): void;
}

type PagesFunction<Env = unknown, Params extends string = string> = (context: PagesEventContext<Env, Params>) => Response | Promise<Response>;

interface HTMLRewriterContentOptions {
    html?: boolean;
}

interface HTMLRewriterElement {
    remove(): HTMLRewriterElement;
    append(content: string, options?: HTMLRewriterContentOptions): HTMLRewriterElement;
    setInnerContent(content: string, options?: HTMLRewriterContentOptions): HTMLRewriterElement;
}

interface HTMLRewriterElementHandler {
    element?(element: HTMLRewriterElement): void | Promise<void>;
}

declare class HTMLRewriter {
    on(selector: string, handlers: HTMLRewriterElementHandler): HTMLRewriter;
    transform(response: Response): Response;
}
