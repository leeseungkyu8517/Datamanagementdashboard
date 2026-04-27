import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

interface GradeResult {
  grade: number;
  score: number;
  reason: string;
}

/** Anthropic API 호출 → 등급 판정 */
async function gradeWithClaude(
  company: Record<string, unknown>,
  allKeywords: string[],
  apiKey: string
): Promise<GradeResult> {
  const prompt = `다음 기업 데이터를 B2B IT 영업(SAP/ERP/디지털 전환 솔루션) 관점에서 분석해서 등급을 판정해줘.

기업 정보:
- 기업명: ${company.name}
- 산업군: ${company.industry ?? "미상"}
- 기업 규모: ${company.size ?? "미상"}
- 매출: ${company.revenue ?? "미상"}
- 국가: ${company.country ?? "미상"}
- 웹사이트 크롤링 키워드: ${allKeywords.slice(0, 15).join(", ") || "없음"}

등급 기준 (IT 솔루션 영업 관점):
5등급: 최우선 공략 — 대기업 이상, 디지털 전환 적극 추진, 고매출, IT 투자 활발
4등급: 우선 공략 — 중견기업 이상, IT/디지털 관심 높음
3등급: 보통 — 중소~중견기업, IT 관심 있으나 소극적
2등급: 관심도 낮음 — 소규모, IT 투자 소극적
1등급: 영업 가치 낮음 — 정보 부족 또는 IT 비관련 업종

반드시 아래 JSON 형식으로만 응답해 (다른 텍스트 없이):
{"grade":4,"score":7,"reason":"판정 이유를 2~3문장으로 한국어로..."}

grade는 1~5 정수, score는 0~9 정수`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`Anthropic API ${res.status}: ${err.error?.message ?? "unknown"}`);
  }

  const data = await res.json() as { content: Array<{ text: string }> };
  const text = data.content[0].text.trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI 응답에서 JSON을 찾을 수 없습니다");

  const parsed = JSON.parse(jsonMatch[0]) as { grade?: unknown; score?: unknown; reason?: unknown };
  const grade = typeof parsed.grade === "number" ? Math.min(5, Math.max(1, Math.round(parsed.grade))) : 1;
  const score = typeof parsed.score === "number" ? Math.min(9, Math.max(0, Math.round(parsed.score))) : 0;
  const reason = typeof parsed.reason === "string" ? parsed.reason : `${grade}등급 판정`;

  return { grade, score, reason };
}

/** 규칙 기반 등급 (AI 미설정 또는 실패 시 fallback) */
function ruleBasedGrade(
  company: Record<string, unknown>,
  allKeywords: string[]
): GradeResult {
  let score = 0;

  const size = company.size as string | null;
  if (size === "대기업") score += 3;
  else if (size === "중견기업") score += 2;
  else if (size === "중소기업") score += 1;

  const revenue = company.revenue as string | null;
  if (revenue) {
    const num = parseFloat(revenue.replace(/[^0-9.]/g, ""));
    if (!isNaN(num)) {
      const inAeok = /조/.test(revenue) ? num * 10000 : num;
      if (inAeok >= 10000) score += 3;
      else if (inAeok >= 1000) score += 2;
      else if (inAeok >= 100) score += 1;
    }
  }

  const HIGH = ["디지털", "채용", "AI", "클라우드", "ERP", "SAP", "IT투자", "자동화"];
  const kwStr = allKeywords.join(" ").toLowerCase();
  for (const k of HIGH) if (kwStr.includes(k.toLowerCase())) score += 1;
  score = Math.min(score, 9);

  const grade = score >= 8 ? 5 : score >= 6 ? 4 : score >= 4 ? 3 : score >= 2 ? 2 : 1;
  const labels = ["", "영업 가치 낮음", "관심도 낮음", "보통", "우선 공략", "최우선 공략"];
  const reason = `${labels[grade]} (${grade}등급). 규모: ${size ?? "미상"}, 매출: ${revenue ?? "미상"}.`;

  return { grade, score, reason };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

    const { company_id } = await req.json();
    if (!company_id) return json({ error: "company_id 필수" }, 400);

    // 1. 기업 정보 조회
    const { data: company, error: compErr } = await supabase
      .from("company_data")
      .select("*")
      .eq("id", company_id)
      .single();

    if (compErr || !company) return json({ error: "기업을 찾을 수 없습니다" }, 404);

    // 2. 크롤링 이력 조회 (최근 3건)
    const { data: crawlingData } = await supabase
      .from("company_data_crawling")
      .select("keywords")
      .eq("company_data_id", company_id)
      .order("collected_at", { ascending: false })
      .limit(3);

    // 3. 전체 키워드 수집
    const allKeywords = [
      ...((company.keywords as string[]) ?? []),
      ...(crawlingData?.flatMap((c: { keywords: string[] | null }) => c.keywords ?? []) ?? []),
    ];

    // 4. AI 등급 판정
    let result: GradeResult;

    if (apiKey) {
      try {
        result = await gradeWithClaude(company as Record<string, unknown>, allKeywords, apiKey);
      } catch (_e) {
        console.error("Claude grading failed, using rule-based fallback:", _e);
        result = ruleBasedGrade(company as Record<string, unknown>, allKeywords);
      }
    } else {
      result = ruleBasedGrade(company as Record<string, unknown>, allKeywords);
    }

    const { grade, score, reason } = result;

    // 5. 등급 업데이트
    const { error: updateErr } = await supabase
      .from("company_data")
      .update({ grade, ai_summary: reason })
      .eq("id", company_id);

    if (updateErr) throw updateErr;

    return json({ success: true, grade, reason, score });
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
});
