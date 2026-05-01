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
    "problem": "도입 전 문제점 1~2문장 (없으면 null)",
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

    if (cases.length === 0) return json({ success: true, inserted: 0, message: "관련 DX/솔루션 사례를 찾지 못했습니다." });

    // ── cases 테이블 저장 ────────────────────────────────────────────────────
    const inserted: string[] = [];
    for (const c of cases) {
      if (!c.company_name) continue;
      const { data } = await sb.from("cases").insert({
        company_name: String(c.company_name),
        industry:     c.industry     ? String(c.industry)     : null,
        company_size: c.company_size ? String(c.company_size) : null,
        problem:      c.problem      ? String(c.problem)      : null,
        solution:     c.solution     ? String(c.solution)     : null,
        result:       c.result       ? String(c.result)       : null,
        period:       c.period       ? String(c.period)       : null,
        source_url:   c.source_url   ? String(c.source_url)   : null,
        tags:         Array.isArray(c.tags) && c.tags.length ? c.tags.map(String) : null,
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
