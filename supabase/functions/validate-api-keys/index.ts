import "@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function validateDart(dartKey: string): Promise<boolean> {
  try {
    const url = `https://opendart.fss.or.kr/api/company.json?crtfc_key=${dartKey}&corp_code=00126380`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return false;
    const data = await res.json() as { status?: string };
    return data.status === "000";
  } catch {
    return false;
  }
}

async function validatePublicData(pubKey: string): Promise<boolean> {
  try {
    const url = new URL("https://api.odcloud.kr/api/15083277/v1/uddi:c70b85ac-0146-41a9-8f4a-d2acafaa3c92");
    url.searchParams.set("serviceKey", pubKey);
    url.searchParams.set("page", "1");
    url.searchParams.set("perPage", "1");
    url.searchParams.set("returnType", "json");
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8_000) });
    return res.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }
  try {
    const dartKey = Deno.env.get("DART_API_KEY") ?? "";
    const pubKey  = Deno.env.get("PUBLIC_DATA_API_KEY") ?? "";

    const [dartValid, pubValid] = await Promise.all([
      dartKey ? validateDart(dartKey) : Promise.resolve(false),
      pubKey  ? validatePublicData(pubKey) : Promise.resolve(false),
    ]);

    return json({ dart: dartValid, public: pubValid });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
