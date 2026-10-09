// No sign-in: anyone with the link can read, save, update and delete reports. (Spam risk
// accepted for frictionless entry; git history has the Basic-auth version that gated writes.)
// import { FUEL_EDITOR_USERNAME, FUEL_EDITOR_PASSWORD } from "../../server/fuel-editor-credentials";
import { validateFuelReport, type FuelDraftRow } from "../../src/lib/fuel-prices";

export interface Context { request: Request; env: { SUPABASE_SERVICE_ROLE_KEY?: string } }
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const base = "https://agzazndvqrencvgpovyh.supabase.co/rest/v1/fuel_reports";

async function storageError(result: Response) {
    const error = await result.json() as { code?: string };
    return json({ error: ["42P01", "PGRST205"].includes(error.code ?? "") ? "Fuel storage is not set up yet. Apply the fuel_reports migration in Supabase." : "Could not access fuel storage. Check the server configuration and retry." }, 503);
}

export async function onRequest({ request, env }: Context): Promise<Response> {
    if (!["GET", "POST", "PUT", "DELETE"].includes(request.method)) return json({ error: "Method not allowed." }, 405);
    if (!env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Fuel storage is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the Cloudflare Pages project." }, 503);
    const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };
    try {
        if (request.method === "GET") {
            const result = await fetch(`${base}?select=*&order=report_date.desc,created_at.desc&limit=100`, { headers });
            if (!result.ok) return storageError(result);
            return json(await result.json(), 200);
        }
        if (request.method === "DELETE") {
            const id = new URL(request.url).searchParams.get("id");
            if (!id) return json({ error: "Report id is required." }, 400);
            const result = await fetch(`${base}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers });
            if (!result.ok) return storageError(result);
            const records = await result.json() as unknown[];
            if (!records.length) return json({ error: "Report not found." }, 404);
            return json({ deleted: true });
        }
        // POST saves a new edition; PUT updates one in place. Both share validation.
        const origin = request.headers.get("Origin");
        if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
        const text = await request.text();
        if (text.length > 300000) return json({ error: "Report is too large." }, 413);
        let data: unknown;
        try { data = JSON.parse(text); } catch { return json({ error: "Invalid report." }, 400); }
        if (!data || typeof data !== "object") return json({ error: "Invalid fuel report." }, 400);
        const record = data as { id?: unknown; report_date?: unknown; rows?: unknown };
        if (typeof record.report_date !== "string" || !Array.isArray(record.rows) || record.rows.some((row: unknown) => !row || typeof row !== "object" || ["name", "petrol", "diesel", "premium"].some(key => typeof (row as Record<string, unknown>)[key] !== "string"))) return json({ error: "Invalid fuel report." }, 400);
        let payload: { report_date: string; prices: ReturnType<typeof validateFuelReport> };
        try { payload = { report_date: record.report_date, prices: validateFuelReport(record.report_date, record.rows as FuelDraftRow[], true) }; }
        catch (error) { return json({ error: error instanceof Error ? error.message : "Invalid report." }, 400); }
        if (request.method === "PUT") {
            if (typeof record.id !== "string" || !record.id) return json({ error: "Report id is required." }, 400);
            const result = await fetch(`${base}?id=eq.${encodeURIComponent(record.id)}`, { method: "PATCH", headers, body: JSON.stringify(payload) });
            if (!result.ok) return storageError(result);
            const records = await result.json() as unknown[];
            if (!records.length) return json({ error: "Report not found." }, 404);
            return json(records[0]);
        }
        const result = await fetch(base, { method: "POST", headers, body: JSON.stringify(payload) });
        if (!result.ok) return storageError(result);
        const records = await result.json() as unknown[];
        return json(records[0], 201);
    } catch { return json({ error: "Could not reach fuel storage. Please retry." }, 503); }
}
