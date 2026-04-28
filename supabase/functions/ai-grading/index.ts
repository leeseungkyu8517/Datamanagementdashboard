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

type GradeLabel = "VIP" | "Core" | "Active" | "Manage" | "Inactive";

function calcSizeScore(size: string | null): number {
  switch (size) {
    case "대기업":   return 20;
    case "중견기업":  return 16;
    case "중기업":   return 12;
    case "소기업":   return 8;
    case "1인 기업": return 4;
    default:        return 8;
  }
}

function scoreToLabel(score: number): GradeLabel {
  if (score >= 71) return "VIP";
  if (score >= 51) return "Core";
  if (score >= 31) return "Active";
  if (score >= 16) return "Manage";
  return "Inactive";
}

function toValidScore(v: unknown, max: number): number {
  const n = typeof v === "number" ? Math.round(v) : 0;
  const step = max / 5;
  const valid = [max, max - step, max - step * 2, max - step * 3, max - step * 4].map(Math.round);
  return valid.includes(n) ? n : Math.round(max * 0.6); // 기본 C등급
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const debugLog: string[] = [];

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    debugLog.push("supabase client created");

    const body = await req.json();
    const company_id = body?.company_id;
    if (!company_id) return json({ error: "company_id 필수" }, 400);
    debugLog.push(`company_id: ${company_id}`);

    // 1. 기업 정보
    const { data: company, error: compErr } = await supabase
      .from("company_data")
      .select("*")
      .eq("id", company_id)
      .single();
    if (compErr || !company) {
      return json({ error: `기업 조회 실패: ${compErr?.message ?? "not found"}` }, 404);
    }
    debugLog.push(`company: ${company.name}`);

    // 2. 크롤링 키워드
    const { data: crawlingData } = await supabase
      .from("company_data_crawling")
      .select("keywords")
      .eq("company_data_id", company_id)
      .order("collected_at", { ascending: false })
      .limit(3);
    debugLog.push(`crawling rows: ${crawlingData?.length ?? 0}`);

    const allKeywords: string[] = [
      ...((company.keywords as string[]) ?? []),
      ...(crawlingData?.flatMap((c: { keywords: string[] | null }) => c.keywords ?? []) ?? []),
    ];

    // 3. 미팅 횟수
    let meetingCount = 0;
    try {
      const { data: projects } = await supabase
        .from("sales_projects")
        .select("id")
        .eq("company_name", company.name);
      const projectIds = (projects ?? []).map((p: { id: string }) => p.id);
      if (projectIds.length > 0) {
        const { count } = await supabase
          .from("meeting_notes")
          .select("id", { count: "exact", head: true })
          .in("sales_project_id", projectIds);
        meetingCount = count ?? 0;
      }
    } catch (_e) {
      debugLog.push(`meeting count error: ${_e}`);
    }
    debugLog.push(`meetingCount: ${meetingCount}`);

    const score_size = calcSizeScore(company.size as string | null);
    let score_solution = 18;
    let score_relation = 18;
    let score_growth = 6;
    let score_risk = 6;
    let reason = "";

    // 4. AI 판정
    if (apiKey) {
      debugLog.push("trying AI grading");
      try {
        const kwStr = allKeywords.slice(0, 20).join(", ") || "없음";
        const prompt = `B2B IT 영업(SAP/ERP/디지털 전환) 관점에서 아래 기업을 분석해 점수를 매겨줘.

기업명: ${company.name}
산업군: ${company.industry ?? "미상"}
규모: ${company.size ?? "미상"}
매출: ${company.revenue ?? "미상"}
크롤링 키워드: ${kwStr}
미팅 횟수: ${meetingCount}회

배점표:
① 솔루션 적합도 max 30: A=30, B=24, C=18, D=12, E=6
② 관계 밀도 max 30: A=30, B=24, C=18, D=12, E=6
③ 성장 시그널 max 10: A=10, B=8, C=6, D=4, E=2
④ 거래 리스크 max 10: A=10, B=8, C=6, D=4, E=2

JSON만 응답:
{"score_solution":24,"score_relation":18,"score_growth":8,"score_risk":6,"reason":"이유"}`;

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
          signal: AbortSignal.timeout(25_000),
        });

        if (res.ok) {
          const data = await res.json() as { content: Array<{ text: string }> };
          const text = data.content[0].text.trim();
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]) as Record<string, unknown>;
            score_solution = toValidScore(parsed.score_solution, 30);
            score_relation = toValidScore(parsed.score_relation, 30);
            score_growth   = toValidScore(parsed.score_growth, 10);
            score_risk     = toValidScore(parsed.score_risk, 10);
            reason = typeof parsed.reason === "string" ? parsed.reason : "";
            debugLog.push("AI grading success");
          }
        } else {
          debugLog.push(`Anthropic ${res.status}`);
        }
      } catch (_e) {
        debugLog.push(`AI error: ${_e}`);
      }
    }

    // 5. rule-based fallback reason
    if (!reason) {
      const kwStr = allKeywords.join(" ").toLowerCase();
      const SOLUTION_KW = ["erp", "sap", "디지털", "클라우드", "자동화", "it투자"];
      const GROWTH_KW   = ["채용", "투자", "지사", "설립", "확장"];
      const sHits = SOLUTION_KW.filter(k => kwStr.includes(k)).length;
      const gHits = GROWTH_KW.filter(k => kwStr.includes(k)).length;
      if (!apiKey) {
        score_solution = sHits >= 3 ? 30 : sHits >= 2 ? 24 : sHits >= 1 ? 18 : 12;
        score_relation = meetingCount >= 5 ? 30 : meetingCount >= 3 ? 24 : meetingCount >= 1 ? 18 : 12;
        score_growth   = gHits >= 2 ? 10 : gHits >= 1 ? 8 : 6;
        score_risk     = score_size >= 16 ? 8 : 6;
      }
      reason = `규칙 기반 판정. 규모: ${company.size ?? "미상"}, 미팅: ${meetingCount}회.`;
      debugLog.push("rule-based fallback");
    }

    const grade_score = score_size + score_solution + score_relation + score_growth + score_risk;
    const grade_label = scoreToLabel(grade_score);
    debugLog.push(`result: ${grade_label} ${grade_score}점`);

    // 6. DB 업데이트
    const updatePayload = { grade_label, grade_score, score_size, score_solution, score_relation, score_growth, score_risk, ai_summary: reason };
    debugLog.push(`updating: ${JSON.stringify(Object.keys(updatePayload))}`);

    const { error: updateErr } = await supabase
      .from("company_data")
      .update(updatePayload)
      .eq("id", company_id);

    if (updateErr) {
      return json({ error: `DB 업데이트 실패: ${updateErr.message}`, debug: debugLog }, 500);
    }

    return json({ success: true, grade_label, grade_score, score_size, score_solution, score_relation, score_growth, score_risk, reason, debug: debugLog });
  } catch (err) {
    return json({ error: String(err), debug: debugLog }, 500);
  }
});
