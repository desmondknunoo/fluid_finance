import { authorizeFuelEditor, type Context } from "./fuel-reports";
import { OMC_LOGO_BASE } from "../../src/lib/fuel-prices";

const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
const base = "https://agzazndvqrencvgpovyh.supabase.co";

export async function onRequest({ request, env }: Context): Promise<Response> {
    if (!["GET", "POST"].includes(request.method)) return json({ error: "Method not allowed." }, 405);
    if (!await authorizeFuelEditor(request)) return json({ error: "Incorrect username or password." }, 401);
    if (!env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: "OMC storage is not configured." }, 503);
    const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
    try {
        if (request.method === "GET") {
            const result = await fetch(`${base}/rest/v1/fuel_omcs?select=name,logo_url&order=name.asc&limit=1000`, { headers });
            if (!result.ok) return json({ error: "Could not load the OMC library. Apply the OMC migration and retry." }, 503);
            return json(await result.json());
        }
        const origin = request.headers.get("Origin");
        if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
        const raw = await request.text();
        if (raw.length > 360000) return json({ error: "Logo is too large." }, 413);
        let input: { name?: unknown; image?: unknown };
        try { input = JSON.parse(raw); } catch { return json({ error: "Invalid logo upload." }, 400); }
        const name = typeof input?.name === "string" ? input.name.trim() : "";
        if (!name || name.length > 60) return json({ error: "Enter an OMC name of 1–60 characters before uploading its logo." }, 400);
        if (typeof input.image !== "string" || !/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(input.image)) return json({ error: "Upload a valid PNG logo." }, 400);
        let bytes: Uint8Array;
        try { bytes = Uint8Array.from(atob(input.image.split(",")[1]), char => char.charCodeAt(0)); } catch { return json({ error: "Invalid logo encoding." }, 400); }
        const view = new DataView(bytes.buffer);
        if (bytes.length < 33 || bytes.length > 262144 || [137,80,78,71,13,10,26,10].some((value, i) => bytes[i] !== value) || view.getUint32(16) < 1 || view.getUint32(20) < 1 || view.getUint32(16) > 512 || view.getUint32(20) > 512) return json({ error: "Logo must be a PNG up to 512×512 pixels and 256 KB." }, 400);
        const path = `${crypto.randomUUID()}.png`;
        const upload = await fetch(`${base}/storage/v1/object/omc-logos/${path}`, { method: "POST", headers: { ...headers, "Content-Type": "image/png", "Cache-Control": "31536000" }, body: bytes.buffer as ArrayBuffer });
        if (!upload.ok) return json({ error: "Could not upload the logo. Check the omc-logos storage bucket and retry." }, 503);
        const omc = { name, logo_url: `${OMC_LOGO_BASE}${path}` };
        const result = await fetch(`${base}/rest/v1/fuel_omcs?on_conflict=name_key&select=name,logo_url`, { method: "POST", headers: { ...headers, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(omc) });
        if (!result.ok) return json({ error: "Logo uploaded but the OMC library could not be saved. Apply the OMC migration and retry." }, 503);
        return json(omc, 201);
    } catch { return json({ error: "Could not reach OMC storage. Please retry." }, 503); }
}
