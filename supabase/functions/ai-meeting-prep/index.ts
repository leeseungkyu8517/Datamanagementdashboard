import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

export interface MeetingBrief {
  company_overview: string;       // 기업 현황 요약
  it_investment_signals: string;  // IT/디지털 투자 신호
  hiring_trends: string;          // 채용 트렌드 분석
  recent_news: string;            // 최근 뉴스/이슈
  sales_strategy: string;         // 영업 전략 어프로치
  agenda: string[];               // 추천 아젠다 (5~7개)
  suggested_questions: string[];  // 예상 질문/답변 (5개)
  risk_factors: string;           // 주의사항/리스크
}

// ── 규칙 기반 브리핑 (AI 없을 때 fallback) ─────────────────────────────────
function ruleBrief(
  companyName: string,
  keywords: string[],
  careerContent: string,
  newsContent: string,
  salesHistory: string,
): MeetingBrief {
  const kw = keywords.join(", ") || "정보 없음";
  const hasDigital = /디지털|digital|ai|클라우드|erp|sap/.test(keywords.join(" ").toLowerCase());
  const hasHiring  = /채용|recruit|인재/.test(careerContent.toLowerCase());

  return {
    company_overview: `${companyName} — 수집된 키워드: ${kw}. 웹사이트 크롤링 기반 정보입니다.`,
    it_investment_signals: hasDigital
      ? `디지털/IT 관련 키워드(${kw}) 감지. IT 솔루션 도입 가능성 높음.`
      : "IT 투자 신호 데이터 부족. 미팅에서 직접 확인 필요.",
    hiring_trends: hasHiring
      ? `채용 공고 감지: ${careerContent.slice(0, 200)}`
      : "채용 데이터 없음. 홈페이지 채용 페이지 미탐지.",
    recent_news: newsContent
      ? `최근 뉴스:\n${newsContent.slice(0, 500)}`
      : "뉴스 데이터 없음. 미팅 전 직접 검색 권장.",
    sales_strategy: salesHistory
      ? `이전 영업 이력:\n${salesHistory}`
      : "신규 고객. 기업 규모와 업종을 고려한 맞춤 제안 필요.",
    agenda: [
      "1. 기업 현황 및 주요 사업 소개 청취",
      "2. 현재 IT 인프라/시스템 현황 파악",
      "3. 디지털 전환 계획 및 니즈 확인",
      "4. 당사 솔루션 소개 및 레퍼런스 제시",
      "5. 도입 가능 범위 및 일정 협의",
    ],
    suggested_questions: [
      "현재 사용 중인 ERP/IT 시스템은 어떻게 되시나요?",
      "디지털 전환 관련 올해 계획이나 예산이 있으신가요?",
      "현재 업무 프로세스에서 가장 불편한 점은 무엇인가요?",
      "의사결정권자(IT 담당 임원)는 누구신가요?",
      "도입 시 우선순위를 두는 기능이 있으신가요?",
    ],
    risk_factors: "AI 분석 미적용 (ANTHROPIC_API_KEY 미설정). 크롤링 데이터 기반 기초 분석입니다.",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

    const {
      company_name,
      company_id,
      pain_points,
      meeting_purpose,
    } = await req.json() as {
      company_name: string;
      company_id?: string;
      pain_points?: string;
      meeting_purpose?: string;
    };

    if (!company_name) return json({ error: "company_name 필수" }, 400);

    // ── 1. 기업 데이터 조회 ───────────────────────────────────────────────
    let companyData: Record<string, unknown> | null = null;
    let crawlingRows: Array<{ source_type: string; keywords: string[] | null; raw_content: string | null; title: string | null; collected_at: string }> = [];

    if (company_id) {
      const { data } = await sb.from("company_data").select("*").eq("id", company_id).single();
      companyData = data;
    } else {
      const { data } = await sb.from("company_data").select("*")
        .ilike("name", `%${company_name}%`).limit(1).single();
      companyData = data;
    }

    // ── 2. 크롤링 이력 조회 (소스별) ─────────────────────────────────────
    const effectiveId = company_id ?? (companyData?.id as string | undefined);
    if (effectiveId) {
      const { data } = await sb.from("company_data_crawling")
        .select("source_type, keywords, raw_content, title, collected_at")
        .eq("company_data_id", effectiveId)
        .order("collected_at", { ascending: false })
        .limit(20);
      crawlingRows = data ?? [];
    }

    // ── 3. 소스별 데이터 분리 ─────────────────────────────────────────────
    const websiteRows = crawlingRows.filter(r => r.source_type === "website");
    const careerRows  = crawlingRows.filter(r => r.source_type === "career");
    const newsRows    = crawlingRows.filter(r => r.source_type === "news");

    const allKeywords = [...new Set([
      ...(companyData?.keywords as string[] ?? []),
      ...crawlingRows.flatMap(r => r.keywords ?? []),
    ])].slice(0, 30);

    const websiteContent = websiteRows.map(r => r.raw_content ?? "").join("\n").slice(0, 2000);
    const careerContent  = careerRows.map(r => (r.raw_content ?? "") + "\n" + (r.keywords ?? []).join(", ")).join("\n").slice(0, 2000);
    const newsContent    = newsRows.map(r => (r.raw_content ?? "") + "\n" + (r.keywords ?? []).join("\n")).join("\n").slice(0, 2000);

    // ── 4. 영업 이력 조회 ────────────────────────────────────────────────
    let salesHistory = "";
    if (effectiveId || company_name) {
      const { data: projects } = await sb.from("sales_projects")
        .select("project_name, stage, amount, summary, created_at")
        .or(effectiveId ? `company_id.eq.${effectiveId}` : `company_name.ilike.%${company_name}%`)
        .order("created_at", { ascending: false })
        .limit(5);
      if (projects?.length) {
        salesHistory = projects.map((p: Record<string, unknown>) =>
          `[${p.stage}] ${p.project_name}${p.amount ? ` (${Number(p.amount).toLocaleString()}원)` : ""} — ${p.summary ?? ""}`
        ).join("\n");
      }
    }

    // ── 5. 회의록 조회 (이전 미팅 컨텍스트) ─────────────────────────────
    let prevMeetings = "";
    if (effectiveId) {
      const { data: notes } = await sb.from("meeting_notes")
        .select("date, content, estimated_amount")
        .eq("sales_project_id", effectiveId)
        .order("date", { ascending: false })
        .limit(3);
      if (notes?.length) {
        prevMeetings = notes.map((n: Record<string, unknown>) =>
          `${n.date}: ${String(n.content ?? "").slice(0, 200)}`
        ).join("\n");
      }
    }

    // ── 6. AI 브리핑 생성 / fallback ─────────────────────────────────────
    let brief: MeetingBrief;

    if (apiKey) {
      const prompt = `당신은 B2B IT 영업 전문 어시스턴트입니다.
아래 데이터를 바탕으로 "${company_name}" 미팅 준비 브리핑을 작성해주세요.

## 기업 기본 정보
- 이름: ${company_name}
- 업종: ${companyData?.industry ?? "미상"}
- 규모: ${companyData?.size ?? "미상"}
- 매출: ${companyData?.revenue ?? "미상"}
- 등급: ${companyData?.grade ?? "미판정"}
- 키워드: ${allKeywords.join(", ") || "없음"}

## 홈페이지 크롤링 데이터
${websiteContent || "데이터 없음"}

## 채용 공고 데이터
${careerContent || "채용 데이터 없음 — 미탐지"}

## 최근 뉴스
${newsContent || "뉴스 데이터 없음"}

## 영업 이력
${salesHistory || "이력 없음 (신규 고객)"}

## 이전 회의 내용
${prevMeetings || "없음"}

## 미팅 목적 / 고객 니즈
${meeting_purpose ?? "미팅 목적 미입력"}
${pain_points ? `예상 고객 문제: ${pain_points}` : ""}

---
아래 JSON 형식으로만 답하세요 (다른 텍스트 없이):
{
  "company_overview": "기업 현황 3~4문장",
  "it_investment_signals": "IT/디지털 투자 신호 분석 2~3문장",
  "hiring_trends": "채용 트렌드 분석 — IT 인력 채용 여부, 투자 규모 추정 2~3문장",
  "recent_news": "최근 뉴스 요약 2~3문장",
  "sales_strategy": "영업 어프로치 전략 3~4문장",
  "agenda": ["아젠다1","아젠다2","아젠다3","아젠다4","아젠다5"],
  "suggested_questions": ["질문1","질문2","질문3","질문4","질문5"],
  "risk_factors": "주의사항/리스크 2문장"
}`;

      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1500,
            messages: [{ role: "user", content: prompt }],
          }),
          signal: AbortSignal.timeout(45_000),
        });
        if (!res.ok) throw new Error(`Claude API ${res.status}`);
        const data = await res.json() as { content: Array<{ text: string }> };
        const raw = data.content[0].text.trim();
        const m = raw.match(/\{[\s\S]*\}/);
        if (!m) throw new Error("JSON 파싱 실패");
        brief = JSON.parse(m[0]) as MeetingBrief;
      } catch (e) {
        console.error("Claude failed:", e);
        brief = ruleBrief(company_name, allKeywords, careerContent, newsContent, salesHistory);
      }
    } else {
      brief = ruleBrief(company_name, allKeywords, careerContent, newsContent, salesHistory);
    }

    return json({
      success: true,
      company_name,
      has_crawling_data: crawlingRows.length > 0,
      crawling_sources: [...new Set(crawlingRows.map(r => r.source_type))],
      last_crawled: crawlingRows[0]?.collected_at ?? null,
      brief,
    });
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
});
