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

/** HTML → 순수 텍스트 (8000자) */
function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}

/** 규칙 기반 키워드 추출 (빈도 기반, 상위 10개) */
function ruleKeywords(text: string): string[] {
  const stopwords = new Set([
    "의","가","이","은","들","는","좀","잘","걍","과","도","를","으로","자","에","와","한","하다",
    "있다","없다","하는","그","저","이","그리고","또한","및","등","을","대한","위한","합니다","있습니다",
    "the","a","an","and","or","of","to","in","for","is","are","was","were","it","this","that","with",
  ]);
  const words = text
    .toLowerCase()
    .replace(/[^가-힣a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopwords.has(w));

  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] ?? 0) + 1;

  // 영업 관련 키워드 가중치 부여
  const BOOST = ["디지털","전환","클라우드","ai","erp","sap","채용","자동화","솔루션","플랫폼","혁신","글로벌"];
  for (const k of BOOST) if (freq[k]) freq[k] += 5;

  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

/** 규칙 기반 요약 생성 */
function ruleSummary(companyName: string, text: string, keywords: string[]): string {
  const hasDigital = /디지털|digital|IT|클라우드|cloud|AI|인공지능|자동화/.test(text);
  const hasHiring  = /채용|hiring|recruit|인재|인력/.test(text);
  const hasGrowth  = /성장|확장|expansion|글로벌|global|해외/.test(text);
  const hasTech    = /기술|technology|솔루션|solution|플랫폼|platform/.test(text);

  const points: string[] = [];
  if (hasDigital) points.push("디지털 전환에 관심 있는 기업");
  if (hasHiring)  points.push("인재 채용이 활발한 성장 단계");
  if (hasGrowth)  points.push("글로벌/해외 확장 추진 중");
  if (hasTech)    points.push("기술·솔루션 도입에 적극적");

  const base = `${companyName}은(는) ${keywords.slice(0, 3).join(", ")} 등의 분야를 중점으로 하는 기업입니다.`;
  return base + (points.length ? ` ${points.join(". ")}.` : "");
}

/** Anthropic API 호출 → 키워드 + 요약 */
async function analyzeWithClaude(
  companyName: string,
  pageText: string,
  apiKey: string
): Promise<{ keywords: string[]; summary: string }> {
  const prompt = `아래는 "${companyName}" 기업 웹사이트에서 추출한 텍스트입니다.

B2B 영업(IT 솔루션/SAP/ERP/디지털 전환) 관점에서 분석해줘:
1. 핵심 키워드 5~10개 (디지털 전환, 채용, AI, 클라우드, ERP, 글로벌 확장 등 영업 접근에 유용한 것 위주)
2. 영업 담당자를 위한 2~3문장 요약 (기업 사업 특성, IT/디지털 투자 관심도, 영업 접근 포인트 중심)

반드시 아래 JSON 형식으로만 응답해:
{"keywords":["키워드1","키워드2",...],"summary":"요약 내용..."}

--- 웹사이트 텍스트 ---
${pageText.slice(0, 4000)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
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

  const parsed = JSON.parse(jsonMatch[0]) as { keywords?: unknown; summary?: unknown };
  return {
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords as string[] : [],
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
  };
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
    if (!company.website) return json({ error: "웹사이트 URL이 없습니다" }, 400);

    // 2. 웹사이트 크롤링
    let pageText = "";
    let crawledUrl = company.website as string;

    try {
      const res = await fetch(company.website as string, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BrycenBot/1.0)" },
        signal: AbortSignal.timeout(10_000),
      });
      pageText = extractText(await res.text());
      crawledUrl = res.url;
    } catch (_e) {
      pageText = "";
    }

    // 3. 분석: AI 우선, 없으면 규칙 기반 fallback
    let keywords: string[];
    let summary: string;

    if (!pageText) {
      // 크롤링 자체 실패
      keywords = (company.keywords as string[]) ?? [];
      summary = `${company.name as string} 웹사이트에 접근할 수 없습니다.`;
    } else if (apiKey) {
      // AI 분석
      try {
        const result = await analyzeWithClaude(company.name as string, pageText, apiKey);
        keywords = result.keywords;
        summary = result.summary;
      } catch (_e) {
        // AI 실패 → 규칙 기반으로 fallback
        keywords = ruleKeywords(pageText);
        summary = ruleSummary(company.name as string, pageText, keywords);
      }
    } else {
      // API 키 없음 → 규칙 기반
      keywords = ruleKeywords(pageText);
      summary = ruleSummary(company.name as string, pageText, keywords);
    }

    // 4. 크롤링 이력 저장
    const { error: insertErr } = await supabase.from("company_data_crawling").insert({
      company_data_id: company_id,
      url: crawledUrl,
      collected_at: new Date().toISOString(),
      keywords,
    });
    if (insertErr) throw insertErr;

    // 5. company_data 키워드·요약 업데이트
    await supabase
      .from("company_data")
      .update({ keywords, ai_summary: summary })
      .eq("id", company_id);

    return json({ success: true, keywords, summary });
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
});
