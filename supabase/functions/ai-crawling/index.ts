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

/** 텍스트에서 의미 있는 키워드 상위 10개 추출 */
function extractKeywords(text: string): string[] {
  // 불용어 목록
  const stopwords = new Set([
    "의","가","이","은","들","는","좀","잘","걍","과","도","를","으로","자","에","와","한","하다",
    "있다","없다","하는","그","저","이","그리고","또한","및","등","을","을","대한","위한",
    "the","a","an","and","or","of","to","in","for","is","are","was","were","it","this","that",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^가-힣a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopwords.has(w));

  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] ?? 0) + 1;

  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

/** 텍스트에서 영업 관점 요약 생성 (규칙 기반) */
function buildSummary(companyName: string, text: string, keywords: string[]): string {
  const hasDigital   = /디지털|digital|IT|클라우드|cloud|AI|인공지능|자동화/.test(text);
  const hasHiring    = /채용|hiring|recruit|인재|인력/.test(text);
  const hasGrowth    = /성장|확장|expansion|글로벌|global|해외/.test(text);
  const hasTech      = /기술|technology|솔루션|solution|플랫폼|platform/.test(text);

  const points: string[] = [];
  if (hasDigital) points.push("디지털 전환에 관심 있는 기업");
  if (hasHiring)  points.push("인재 채용이 활발한 성장 단계");
  if (hasGrowth)  points.push("글로벌/해외 확장 추진 중");
  if (hasTech)    points.push("기술·솔루션 도입에 적극적");

  const base = `${companyName}은(는) ${keywords.slice(0, 3).join(", ")} 등의 분야를 중점으로 하는 기업입니다.`;
  const extra = points.length > 0 ? ` ${points.join(". ")}.` : "";
  return base + extra;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 Supabase Runtime이 자동 주입
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { company_id } = await req.json();
    if (!company_id) return json({ error: "company_id 필수" }, 400);

    // 1. 기업 정보 조회
    const { data: company, error: compErr } = await supabase
      .from("company_data")
      .select("*")
      .eq("id", company_id)
      .single();

    if (compErr || !company) return json({ error: "기업을 찾을 수 없습니다" }, 404);
    if (!company.website)   return json({ error: "웹사이트 URL이 없습니다" }, 400);

    // 2. 웹사이트 크롤링
    let pageText = "";
    let crawledUrl = company.website;

    try {
      const res = await fetch(company.website, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BrycenBot/1.0)" },
        signal: AbortSignal.timeout(10_000),
      });
      pageText = extractText(await res.text());
      crawledUrl = res.url; // 리다이렉트 최종 URL
    } catch (_e) {
      pageText = "";
    }

    // 3. 키워드 추출 + 요약 생성
    const keywords = pageText ? extractKeywords(pageText) : (company.keywords ?? []);
    const summary  = pageText
      ? buildSummary(company.name, pageText, keywords)
      : `${company.name} 웹사이트에 접근할 수 없습니다.`;

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
