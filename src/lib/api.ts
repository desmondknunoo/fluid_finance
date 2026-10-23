import { authToken } from "@/lib/firebase";

/**
 * Fluid Finance - API client
 *
 * Every data call goes to the Fluid backend's editorial API with the Firebase ID token attached.
 * Errors arrive as RFC 7807 problem documents; the message shown to people is the `detail`.
 */

export const API_BASE: string = (import.meta.env.VITE_API_BASE_URL ?? "https://api.finance.fluidterra.com/api/v1").replace(/\/+$/, "");

export class ApiError extends Error {
    constructor(message: string, readonly status: number, readonly code: string) {
        super(message);
    }
}

type Query = Record<string, string | number | boolean | null | undefined>;

/**
 * Per-app wording. The public site speaks to readers (an outage is "this section is unavailable");
 * the portal speaks to staff who can act on it. Each app calls `configureApi` once in `main.tsx`
 * before rendering, so this file stays identical in both.
 */
const config = {
    networkErrorMessage: "This section is temporarily unavailable. Please try again shortly.",
};

export function configureApi(overrides: Partial<typeof config>): void {
    Object.assign(config, overrides);
}

export async function api<T>(path: string, options: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown; query?: Query; auth?: boolean } = {}): Promise<T> {
    const url = new URL(`${API_BASE}${path}`, window.location.origin);
    for (const [key, value] of Object.entries(options.query ?? {})) {
        if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = { Accept: "application/json" };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    const token = options.auth === false ? null : await authToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    let response: Response;
    try {
        response = await fetch(url.toString(), { method: options.method ?? "GET", headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
    } catch {
        // Covers the backend being unreachable as well as a genuinely offline client.
        throw new ApiError(config.networkErrorMessage, 0, "NETWORK");
    }
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    let data: unknown = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (!response.ok) {
        const problem = (data ?? {}) as { detail?: string; code?: string; title?: string };
        throw new ApiError(problem.detail || problem.title || `Request failed (${response.status}).`, response.status, problem.code ?? "ERROR");
    }
    return data as T;
}

/** Where the API serves uploaded media (covers, avatars, OMC logos). */
export const mediaUrl = (key: string) => `${API_BASE}/editorial/media/${key}`;
