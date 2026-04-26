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

const STAGE_FACTOR: Record<string, number> = {
  "미팅 요청": 0.70,
  "미팅 진행": 0.85,
  "견적서 발송": 1.00,
  "가격 협의": 1.10,
  "계약 진행": 1.25,
};

const SIZE_BASE: Record<string, number> = {
  "대기업":  500_000_000,
  "중견기업": 200_000_000,
  "중소기업":  50_000_000,
};
const DEFAULT_BASE = 30_000_000;

function sentimentFactor(notes: { content: string | null }[]): { factor: number; label: string } {
  const POSITIVE = ["긍정적", "관심", "진행하겠", "동의", "승인", "계약", "확정", "좋습니다", "검토하겠", "협의 완료", "제안 수락", "추진"];
  const NEGATIVE = ["어렵", "불가", "거절", "보류", "취소", "예산 부족", "검토 필요", "미정", "난색", "무관심"];

  let pos = 0, neg = 0;
  for (const note of notes) {
    const text = note.content ?? "";
    for (const kw of POSITIVE) if (text.includes(kw)) pos++;
    for (const kw of NEGATIVE) if (text.includes(kw)) neg++;
  }

  const net = pos - neg;
  if (net >= 3) return { factor: 1.15, label: "긍정적 회의 기조" };
  if (net >= 1) return { factor: 1.07, label: "우호적 분위기" };
  if (net === 0) return { factor: 1.00, label: "" };
  if (net >= -2) return { factor: 0.93, label: "일부 부정적 신호" };
  return { factor: 0.85, label: "부정적 신호 반영" };
}

function activityBonus(noteCount: number): number {
  return 1 + Math.min(noteCount * 0.03, 0.15);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { sales_project_id } = await req.json();
    if (!sales_project_id) return json({ error: "sales_project_id 필수" }, 400);

    // 1. Sales project 조회
    const { data: project, error: projErr } = await supabase
      .from("sales_projects")
      .select("*")
      .eq("id", sales_project_id)
      .single();
    if (projErr || !project) return json({ error: "프로젝트를 찾을 수 없습니다" }, 404);

    // 2. Company data by name match (company_data 테이블)
    const { data: cdList } = await supabase
      .from("company_data")
      .select("id, size, revenue, keywords, grade")
      .ilike("name", `%${project.company_name}%`)
      .limit(1);
    const cd = cdList?.[0] ?? null;

    // 3. 크롤링 키워드
    let crawlKw: string[] = [];
    if (cd?.id) {
      const { data: crawling } = await supabase
        .from("company_data_crawling")
        .select("keywords")
        .eq("company_data_id", cd.id)
        .order("collected_at", { ascending: false })
        .limit(3);
      crawlKw = crawling?.flatMap((c: { keywords: string[] | null }) => c.keywords ?? []) ?? [];
    }

    // 4. 전체 회의록
    const { data: notes } = await supabase
      .from("meeting_notes")
      .select("content, date")
      .eq("sales_project_id", sales_project_id)
      .order("date", { ascending: false });
    const noteList = notes ?? [];

    // 5. 기준 금액 결정
    const base = project.amount ?? (cd?.size ? (SIZE_BASE[cd.size] ?? DEFAULT_BASE) : DEFAULT_BASE);

    // 6. 단계 가중치
    const stageFactor = STAGE_FACTOR[project.stage] ?? 1.0;

    // 7. 회의록 감성 분석
    const { factor: sentiment, label: sentimentLabel } = sentimentFactor(noteList);

    // 8. 활동량 보너스
    const activity = activityBonus(noteList.length);

    // 9. 키워드 보너스
    const HIGH_KW = ["디지털 전환", "digital transformation", "채용", "AI", "클라우드", "ERP", "SAP", "IT투자"];
    const allKw = [...(cd?.keywords ?? []), ...crawlKw].join(" ").toLowerCase();
    const kwBonus = HIGH_KW.some(k => allKw.includes(k.toLowerCase())) ? 1.05 : 1.0;

    // 10. 등급 보너스
    const grade = cd?.grade ?? 0;
    const gradeBonus = grade >= 4 ? 1.10 : grade >= 3 ? 1.05 : 1.0;

    // 11. 최종 계산
    const amount = Math.round(base * stageFactor * sentiment * activity * kwBonus * gradeBonus);
    const min_amount = Math.round(amount * 0.7);
    const max_amount = Math.round(amount * 1.4);

    // 12. 산정 근거 생성
    const parts: string[] = [`${project.stage} 단계 (×${stageFactor})`];
    if (noteList.length > 0) parts.push(`회의록 ${noteList.length}건 반영`);
    if (cd?.size) parts.push(`기업 규모: ${cd.size}`);
    if (grade > 0) parts.push(`영업 등급: ${grade}등급`);
    if (kwBonus > 1) parts.push("IT/디지털 관심 기업");
    if (sentimentLabel) parts.push(sentimentLabel);
    const reason = `회의록 기반 AI 산정. ${parts.join(" / ")}.`;

    // 13. DB 업데이트
    const { error: upErr } = await supabase
      .from("sales_projects")
      .update({ amount, min_amount, max_amount })
      .eq("id", sales_project_id);
    if (upErr) throw upErr;

    return json({ success: true, amount, min_amount, max_amount, reason });
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
});
