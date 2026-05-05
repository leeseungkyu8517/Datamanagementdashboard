import "@supabase/functions-js/edge-runtime.d.ts";
import https from "node:https";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function formatBizrNo(raw: string): string {
  const d = raw.replace(/\D/g, "");
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : raw;
}

// node:https 사용 — rustls 대신 OpenSSL로 TLS 처리 (DART 서버 호환)
function dartFetch(url: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let body = "";
      res.on("data", (chunk: unknown) => { body += String(chunk); });
      res.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`응답 파싱 오류: ${e}`)); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function getCompanyDetail(key: string, corpCode: string) {
  const detail = await dartFetch(
    `https://opendart.fss.or.kr/api/company.json?crtfc_key=${key}&corp_code=${corpCode}`
  ) as Record<string, string>;
  if (detail.status !== "000") return null;
  return {
    status: "found" as const,
    corp_code: corpCode,
    matched_name: detail.corp_name ?? null,
    ceo_nm: detail.ceo_nm ?? null,
    adres: detail.adres ?? null,
    bizr_no: detail.bizr_no ? formatBizrNo(detail.bizr_no) : null,
    induty_code: detail.induty_code ?? null,
    phn_no: detail.phn_no ?? null,
    hm_url: detail.hm_url ?? null,
    corp_cls: detail.corp_cls ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const DART_API_KEY = Deno.env.get("DART_API_KEY");
  if (!DART_API_KEY) return json({ status: "error", message: "DART_API_KEY 환경변수가 설정되지 않았습니다." }, 500);

  let body: Record<string, string>;
  try { body = await req.json(); }
  catch { return json({ status: "error", message: "요청 본문을 파싱할 수 없습니다." }, 400); }

  // ── 모드 A: corp_code 직접 조회 ──────────────────────────────────────────
  if (body.corp_code) {
    try {
      const detail = await getCompanyDetail(DART_API_KEY, body.corp_code.trim());
      if (!detail) return json({ status: "not_found", message: "기업 상세 정보를 가져올 수 없습니다." });
      return json(detail);
    } catch (err) {
      return json({ status: "error", message: `상세 조회 오류: ${err instanceof Error ? err.message : String(err)}` });
    }
  }

  // ── 모드 B: 기업명 검색 ──────────────────────────────────────────────────
  const corpName = (body.corp_name ?? "").trim();
  if (!corpName) return json({ status: "error", message: "corp_name 또는 corp_code가 필요합니다." }, 400);

  try {
    const listData = await dartFetch(
      `https://opendart.fss.or.kr/api/list.json` +
      `?crtfc_key=${DART_API_KEY}` +
      `&corp_name=${encodeURIComponent(corpName)}` +
      `&bgn_de=20150101&page_no=1&page_count=100`
    ) as Record<string, unknown>;

    if (listData.status === "013" || !Array.isArray(listData.list) || listData.list.length === 0) {
      return json({ status: "not_found", message: "관련 기업명이 없습니다." });
    }
    if (listData.status !== "000") {
      return json({ status: "error", message: `DART 오류 (${listData.status}): ${listData.message}` });
    }

    // corp_code 기준 중복 제거
    const seen = new Map<string, string>();
    for (const item of listData.list as { corp_code: string; corp_name: string }[]) {
      if (!seen.has(item.corp_code)) seen.set(item.corp_code, item.corp_name);
    }

    // 정확히 일치하는 단일 기업 → 바로 상세 조회
    const exactMatches = [...seen.entries()].filter(([, name]) => name === corpName);
    if (exactMatches.length === 1 || seen.size === 1) {
      const corpCode = exactMatches[0]?.[0] ?? [...seen.keys()][0];
      const detail = await getCompanyDetail(DART_API_KEY, corpCode);
      if (detail) return json(detail);
    }

    // 후보 여럿 → 목록 반환
    const candidates = [...seen.entries()].slice(0, 15).map(([corp_code, corp_name]) => ({ corp_code, corp_name }));
    return json({ status: "candidates", candidates });

  } catch (err) {
    return json({ status: "error", message: `DART 검색 오류: ${err instanceof Error ? err.message : String(err)}` });
  }
});
