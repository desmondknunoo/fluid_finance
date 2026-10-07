// Editor sign-in is disabled for now: the pump report is public and read-only.
// To re-enable editing, restore the credentials import, the authorizeFuelEditor check in
// onRequest, and the POST handling below.
// import { FUEL_EDITOR_USERNAME, FUEL_EDITOR_PASSWORD } from "../../server/fuel-editor-credentials";

export interface Context { request: Request; env: { SUPABASE_SERVICE_ROLE_KEY?: string } }
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
// async function sameCredentials(actual: string, expected: string) {
//     const encoder = new TextEncoder();
//     const [a, b] = await Promise.all([actual, expected].map(value => crypto.subtle.digest("SHA-256", encoder.encode(value))));
//     const first = new Uint8Array(a), second = new Uint8Array(b);
//     let difference = 0;
//     for (let i = 0; i < first.length; i++) difference |= first[i] ^ second[i];
//     return difference === 0;
// }
// export async function authorizeFuelEditor(request: Request): Promise<boolean> {
//     const expected = `Basic ${btoa(`${FUEL_EDITOR_USERNAME}:${FUEL_EDITOR_PASSWORD}`)}`;
//     return sameCredentials(request.headers.get("Authorization") ?? "", expected);
// }
// Editor sign-in is disabled for now, so this always rejects. fuel-omcs.ts still imports it to
// keep its own endpoints gated; restore the comparison above to re-enable editing.
export async function authorizeFuelEditor(_request: Request): Promise<boolean> {
    return false;
}
export async function onRequest({ request, env }: Context): Promise<Response> {
    // if (!await authorizeFuelEditor(request)) return json({ error: "Incorrect username or password." }, 401);
    if (request.method === "POST") return json({ error: "Report editing is disabled for now." }, 403);
    if (request.method !== "GET") return json({ error: "Method not allowed." }, 405);
    if (!env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Fuel storage is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the Cloudflare Pages project." }, 503);
    try {
        const result = await fetch(`https://agzazndvqrencvgpovyh.supabase.co/rest/v1/fuel_reports?select=*&order=report_date.desc,created_at.desc&limit=100`, {
            method: "GET",
            headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
        });
        if (!result.ok) {
            const error = await result.json() as { code?: string };
            return json({ error: ["42P01", "PGRST205"].includes(error.code ?? "") ? "Fuel storage is not set up yet. Apply the fuel_reports migration in Supabase." : "Could not access fuel storage. Check the server configuration and retry." }, 503);
        }
        const records = await result.json() as unknown[];
        return json(records, 200);
    } catch { return json({ error: "Could not reach fuel storage. Please retry." }, 503); }
}
