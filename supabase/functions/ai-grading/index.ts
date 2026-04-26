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

/** 기업 규모 → 기본 점수 */
function sizeScore(size: string | null): number {
  if (size === "대기업")  return 3;
  if (size === "중견기업") return 2;
  if (size === "중소기업") return 1;
  return 0;
}

/** 매출 문자열 파싱 → 억원 단위 숫자 */
function parseRevenue(revenue: string | null): number {
  if (!revenue) return 0;
  const num = parseFloat(revenue.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return 0;
  if (/조/.test(revenue))  return num * 10000; // 조 → 억
  if (/억/.test(revenue))  return num;
  if (/천억/.test(revenue)) return num * 1000;
  return num;
}

/** 매출 → 점수 */
function revenueScore(revenue: string | null): number {
  const r = parseRevenue(revenue);
  if (r >= 10000) return 3; // 1조 이상
  if (r >= 1000)  return 2; // 1000억 이상
  if (r >= 100)   return 1; // 100억 이상
  return 0;
}

/** 키워드 → 영업 관심도 점수 */
function keywordScore(keywords: string[]): number {
  const HIGH = ["디지털 전환", "digital transformation", "채용", "AI", "클라우드", "ERP", "SAP", "IT투자"];
  const MID  = ["성장", "확장", "글로벌", "해외진출", "혁신", "자동화"];
  let score = 0;
  const all = keywords.join(" ").toLowerCase();
  for (const k of HIGH) if (all.includes(k.toLowerCase())) score += 2;
  for (const k of MID)  if (all.includes(k.toLowerCase())) score += 1;
  return Math.min(score, 3); // 최대 3점
}

/** 총점 → 1~5 등급 */
function calcGrade(total: number): number {
  if (total >= 8) return 5;
  if (total >= 6) return 4;
  if (total >= 4) return 3;
  if (total >= 2) return 2;
  return 1;
}

/** 등급 근거 문장 생성 */
function buildReason(
  grade: number,
  size: string | null,
  revenue: string | null,
  keywords: string[],
  hasRecentCrawl: boolean
): string {
  const parts: string[] = [];
  if (size)    parts.push(`기업 규모: ${size}`);
  if (revenue) parts.push(`매출: ${revenue}`);
  if (hasRecentCrawl) parts.push("웹사이트 크롤링 데이터 보유");

  const highKw = keywords.filter(k =>
    ["디지털", "채용", "AI", "클라우드", "ERP"].some(h => k.toLowerCase().includes(h.toLowerCase()))
  );
  if (highKw.length) parts.push(`주요 키워드: ${highKw.slice(0, 3).join(", ")}`);

  const gradeLabel = ["", "영업 가치 낮음", "관심도 낮음", "보통", "우선 공략", "최우선 공략"][grade];
  return `${gradeLabel} (${grade}등급). ${parts.join(" / ") || "추가 정보 필요"}.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
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

    // 2. 크롤링 이력 조회 (최근 3건)
    const { data: crawlingData } = await supabase
      .from("company_data_crawling")
      .select("keywords")
      .eq("company_data_id", company_id)
      .order("collected_at", { ascending: false })
      .limit(3);

    // 3. 점수 계산
    const allKeywords = [
      ...(company.keywords ?? []),
      ...(crawlingData?.flatMap((c: { keywords: string[] | null }) => c.keywords ?? []) ?? []),
    ];

    const total =
      sizeScore(company.size) +
      revenueScore(company.revenue) +
      keywordScore(allKeywords);

    const grade  = calcGrade(total);
    const reason = buildReason(
      grade,
      company.size,
      company.revenue,
      allKeywords,
      (crawlingData?.length ?? 0) > 0
    );

    // 4. 등급 업데이트
    const { error: updateErr } = await supabase
      .from("company_data")
      .update({ grade, ai_summary: reason })
      .eq("id", company_id);

    if (updateErr) throw updateErr;

    return json({ success: true, grade, reason, score: total });
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
});
