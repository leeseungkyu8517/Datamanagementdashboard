import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

interface NaverItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

async function searchNaver(query: string, clientId: string, clientSecret: string): Promise<NaverItem[]> {
  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=10&sort=sim`;
  const res = await fetch(url, {
    headers: { "X-Naver-Client-Id": clientId, "X-Naver-Client-Secret": clientSecret },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Naver API ${res.status}`);
  const buffer = await res.arrayBuffer();
  const text = new TextDecoder("utf-8").decode(buffer);
  const data = JSON.parse(text) as { items?: NaverItem[] };
  return data.items ?? [];
}

// ── Groq AI 사례 추출 ───────────────────────────────────────────────────────
async function extractWithGroq(
  companyName: string,
  articles: Array<{ title: string; description: string; url: string }>,
  apiKey: string,
): Promise<Array<Record<string, unknown>>> {
  const articleText = articles
    .map((a, i) => `[${i + 1}] 제목: ${a.title}\n내용: ${a.description}\nURL: ${a.url}`)
    .join("\n\n");

  const prompt = `당신은 B2B IT 영업 전문가입니다.
아래는 "${companyName}" 관련 뉴스 기사들입니다.
DX(디지털 전환), 솔루션 도입, IT 시스템 구축 사례를 분석하여 레퍼런스 데이터로 변환하세요.

반드시 아래 JSON 배열 형식으로만 응답하세요 (마크다운/코드블록 없이 순수 JSON만):
[
  {
    "company_name": "도입 기업명 (기사 속 실제 기업, 없으면 ${companyName})",
    "industry": "업종 (제조/IT/물류/금융/유통/건설/의료 등, 불명확 시 null)",
    "company_size": "대기업 또는 중견 또는 스타트업 (판단 불가 시 null)",
    "problem": "솔루션 도입 전 운영 병목(Bottleneck)에 대한 가설적 추론 1~2문장. 단순 '효율 개선 필요' 같은 결과론적 표현 금지. 업종 특성과 성과 수치를 연결한 전략적 분석으로 작성. 정보 부족 시 null",
    "solution": "도입한 솔루션/시스템 1~2문장",
    "result": "수치 포함 성과 1~2문장 (없으면 null)",
    "period": "도입 기간 (예: 6개월, 없으면 null)",
    "source_url": "기사 URL",
    "tags": ["관련태그1", "관련태그2"]
  }
]

사례가 없으면 빈 배열 [] 을 반환하세요.

--- 기사 목록 ---
${articleText}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 2048,
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API ${res.status}: ${errText}`);
  }
  const buf = await res.arrayBuffer();
  const data = JSON.parse(new TextDecoder("utf-8").decode(buf)) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = (data.choices?.[0]?.message?.content ?? "").trim();
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ── 규칙 기반 추출 (AI 실패 시 fallback) ────────────────────────────────────
function extractTags(text: string): string[] {
  const keywords = ["DX","디지털전환","ERP","SAP","클라우드","자동화","AI","스마트팩토리","MES","SCM","CRM","솔루션","시스템구축","디지털","혁신","SaaS","RPA","빅데이터","IoT"];
  return keywords.filter(k => text.toLowerCase().includes(k.toLowerCase())).slice(0, 5);
}

function guessIndustry(text: string): string | null {
  const map: [RegExp, string][] = [
    [/제조|공장|생산|SCM/i, "제조"],
    [/금융|은행|보험|증권/i, "금융"],
    [/유통|물류|배송|리테일/i, "유통/물류"],
    [/건설|건축|시공/i, "건설"],
    [/의료|헬스|병원|제약/i, "의료/헬스케어"],
    [/통신|이동|네트워크/i, "통신"],
    [/에너지|전력|가스/i, "에너지"],
    [/IT|소프트웨어|플랫폼|테크/i, "IT"],
  ];
  for (const [re, label] of map) if (re.test(text)) return label;
  return null;
}

function ruleBasedExtract(
  companyName: string,
  articles: Array<{ title: string; description: string; url: string }>,
): Array<Record<string, unknown>> {
  return articles.slice(0, 5).map(a => {
    const fullText = `${a.title} ${a.description}`;
    const tags = extractTags(fullText);
    return {
      company_name: companyName,
      industry:     guessIndustry(fullText),
      company_size: null,
      problem:      null,
      solution:     a.title,
      result:       a.description.slice(0, 200) || null,
      period:       null,
      source_url:   a.url,
      tags:         tags.length ? tags : null,
    };
  });
}

// ── 원인 AI + 수치 성과 AI: 가설/추론 기반 자동 채우기 ──────────────────────
async function predictFields(
  companyName: string,
  industry: string | null,
  solution: string | null,
  result: string | null,
  tags: string[] | null,
  groqKey: string,
): Promise<{ problem: string | null; result: string | null }> {
  const hasResult = !!result?.trim();

  const prompt = `당신은 기업의 비즈니스 모델과 운영 구조를 혁신하는 전략 기획 전문가이자 데이터 사이언티스트입니다.

아래 레퍼런스 사례를 분석하여 [원인]과 [수치 성과]를 도출하세요.

기업명: ${companyName}
업종: ${industry || "불명"}
도입 솔루션: ${solution || "불명"}
기존 성과 데이터: ${result || "없음 (예측 필요)"}
관련 태그: ${tags?.join(", ") || "없음"}

[원인 분석 — 3단계 원칙]
1. 사실 너머의 가설: 결과론적 해석 금지. 업계 특성을 고려한 구체적 운영 병목(Bottleneck) 가설을 제시한다.
2. 기술과 숫자의 연결: 성과 수치가 솔루션과 어떻게 물리적으로 연결되는지 메커니즘을 추론한다.
3. 차별화된 통찰: 단순 트렌드 추종인지, 경쟁사 대비 전략적 우위 확보인지 독창적 시각을 제시한다.

[수치 성과]
${hasResult
  ? `기존 성과 데이터가 있으므로 그대로 반환한다: "${result}"`
  : `기존 성과 데이터가 없다. 업종(${industry || "불명"})과 솔루션(${solution || "불명"}) 기반으로 업계 평균 벤치마크를 참고하여 구체적인 수치 추정치 1~2문장을 작성한다.`
}

[출력 형식] 마크다운·코드블록 없이 순수 JSON만:
{
  "problem": "원인 분석 2~3문장. 모호한 표현 금지. 확신 있는 어조.",
  "result": "수치 포함 성과 1~2문장"
}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.55,
        max_tokens: 600,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return { problem: null, result: null };
    const data = JSON.parse(new TextDecoder("utf-8").decode(await res.arrayBuffer())) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = (data.choices?.[0]?.message?.content ?? "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { problem: raw || null, result: null };
    try {
      const parsed = JSON.parse(match[0]) as { problem?: string; result?: string };
      return {
        problem: parsed.problem?.trim() || null,
        result:  parsed.result?.trim()  || null,
      };
    } catch {
      return { problem: raw || null, result: null };
    }
  } catch {
    return { problem: null, result: null };
  }
}

// ── 메인 핸들러 ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const sb          = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const groqKey     = Deno.env.get("GROQ_API_KEY");
    const naverId     = Deno.env.get("NAVER_CLIENT_ID");
    const naverSecret = Deno.env.get("NAVER_CLIENT_SECRET");

    if (!naverId || !naverSecret) return json({ error: "NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 미설정" }, 500);

    const reqBuffer = await req.arrayBuffer();
    const reqText   = new TextDecoder("utf-8").decode(reqBuffer);
    const { company_name, keywords: customKeywords } = JSON.parse(reqText) as {
      company_name: string;
      keywords?: string[];
    };
    if (!company_name?.trim()) return json({ error: "company_name 필수" }, 400);

    const searchKeywords = Array.isArray(customKeywords) && customKeywords.length > 0
      ? customKeywords
      : ["DX 사례", "솔루션 도입"];

    // ── 네이버 뉴스 검색 (키워드별 병렬) ────────────────────────────────────
    const searchResults = await Promise.allSettled(
      searchKeywords.map(kw => searchNaver(`${company_name} ${kw}`, naverId, naverSecret))
    );

    const allItems: NaverItem[] = searchResults
      .filter((r): r is PromiseFulfilledResult<NaverItem[]> => r.status === "fulfilled")
      .flatMap(r => r.value);

    if (allItems.length === 0) return json({ error: `"${company_name}" 관련 뉴스를 찾을 수 없습니다.` }, 404);

    // 중복 제거
    const seen = new Set<string>();
    const uniqueArticles = allItems
      .filter(item => {
        const key = item.originallink || item.link;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 15)
      .map(item => ({
        title:       stripHtml(item.title),
        description: stripHtml(item.description),
        url:         item.originallink || item.link,
      }));

    // ── AI 또는 규칙 기반 추출 ───────────────────────────────────────────────
    let cases: Array<Record<string, unknown>>;
    let usedAI = false;

    let aiError = "";
    if (groqKey) {
      try {
        cases  = await extractWithGroq(company_name, uniqueArticles, groqKey);
        usedAI = true;
      } catch (e) {
        aiError = String(e);
        console.error("Groq 실패, fallback:", e);
        cases = ruleBasedExtract(company_name, uniqueArticles);
      }
    } else {
      aiError = "GROQ_API_KEY 없음";
      cases = ruleBasedExtract(company_name, uniqueArticles);
    }

    // 선택한 기업명으로 company_name 고정 (AI가 기사 속 다른 기업명을 추출하는 것 방지)
    cases = cases.map(c => ({ ...c, company_name }));

    if (cases.length === 0) return json({ success: true, inserted: 0, message: "관련 DX/솔루션 사례를 찾지 못했습니다." });

    // ── cases 테이블 저장 ────────────────────────────────────────────────────
    const inserted: string[] = [];
    for (const c of cases) {
      if (!c.company_name) continue;

      const industry   = c.industry     ? String(c.industry)     : null;
      const solution   = c.solution     ? String(c.solution)     : null;
      const tagsArr    = Array.isArray(c.tags) && c.tags.length ? c.tags.map(String) : null;

      let problem = c.problem ? String(c.problem) : null;
      let result  = c.result  ? String(c.result)  : null;

      // problem 또는 result가 없으면 AI로 자동 채우기
      if ((!problem || !result) && groqKey) {
        const predicted = await predictFields(String(c.company_name), industry, solution, result, tagsArr, groqKey);
        if (!problem) problem = predicted.problem;
        if (!result)  result  = predicted.result;
      }

      const { data } = await sb.from("cases").insert({
        company_name: String(c.company_name),
        industry,
        company_size: c.company_size ? String(c.company_size) : null,
        problem,
        solution,
        result,
        period:       c.period       ? String(c.period)       : null,
        source_url:   c.source_url   ? String(c.source_url)   : null,
        tags:         tagsArr,
      }).select("id").single();
      if (data?.id) inserted.push(String(data.id));
    }

    return json({
      success:     true,
      inserted:    inserted.length,
      total_found: cases.length,
      used_ai:     usedAI,
      message:     `${inserted.length}개 사례가 라이브러리에 추가되었습니다.${usedAI ? " (AI 분석 적용)" : ""}`,
    });
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
});
