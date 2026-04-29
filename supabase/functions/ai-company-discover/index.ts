import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// ── RSS 파싱 (제목 + URL) ─────────────────────────────────────────────────
interface NewsItem { title: string; url: string }

function parseNewsRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title =
      (/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/.exec(block) ??
       /<title>([\s\S]*?)<\/title>/.exec(block))?.[1]?.trim() ?? "";
    // Google News RSS: 실제 URL은 <link> 다음 텍스트 or <guid>
    const url =
      (/<link>([\s\S]*?)<\/link>/.exec(block))?.[1]?.trim() ??
      (/<guid[^>]*>([\s\S]*?)<\/guid>/.exec(block))?.[1]?.trim() ?? "";
    if (title && url) items.push({ title, url });
  }
  return items.slice(0, 12);
}

// ── 기사 본문 fetch ────────────────────────────────────────────────────────
async function fetchArticleText(url: string): Promise<string> {
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      signal: AbortSignal.timeout(8_000),
      redirect: "follow",
    });
    if (!r.ok) return "";
    const html = await r.text();

    // 불필요한 태그 제거 후 텍스트 추출
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<aside[\s\S]*?<\/aside>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#[0-9]+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return text; // 전체 본문 반환
  } catch {
    return "";
  }
}

// ── 회사명 판별 데이터 ─────────────────────────────────────────────────────
const COMPANY_SUFFIXES = [
  "그룹","전자","화학","제철","건설","물산","중공업","에너지","카드","은행","생명","증권",
  "유통","제약","바이오","모빌리티","모터스","테크","시스템","솔루션","네트웍스","네트워크",
  "정보통신","정보","데이터","엔지니어링","산업","기계","철강","섬유","식품","자동차",
  "물류","항공","해운","조선","반도체","디스플레이","배터리","통신","헬스케어","홀딩스",
  "코리아","인터내셔널","파트너스","이노베이션","소프트웨어","서비스","컨설팅","로직스",
  "캐피탈","파이낸셜","에셋","화재","손보","손해보험","재보험","오토에버","SDS","CNS",
  "IDS","MDS","트레이딩","코퍼레이션","컴퍼니","임팩트","플랫폼","벤처스","인베스트먼트",
  "리서치","어드바이저리","매니지먼트","엔터테인먼트","미디어","스튜디오","로보틱스",
  "헬스","케어","웰니스","팜","메디칼","하이닉스","이앤씨","퓨얼셀","에어로스페이스",
];

const KNOWN_COMPANIES = new Set([
  "삼성","현대","LG","SK","롯데","한화","GS","신세계","CJ","두산","포스코","KT",
  "카카오","네이버","쿠팡","토스","크래프톤","넥슨","엔씨","한진","효성","코오롱",
  "HDC","OCI","DB","LS","HMM","KCC","동원","풀무원","오리온","농심","삼양","셀트리온",
  "SK하이닉스","삼성SDI","현대모비스","현대위아","현대오일뱅크",
  "카카오페이","카카오뱅크","카카오모빌리티","쏘카","야놀자","무신사","마켓컬리",
  "배달의민족","직방","리디","펄어비스","컴투스","게임빌",
  "한국전력","한국가스공사","한국수력원자력","한국도로공사","코레일",
  "우리은행","하나은행","KB국민은행","신한은행","기업은행","산업은행","농협은행",
  "교보생명","삼성생명","한화생명","미래에셋","키움","대신","유안타",
  "현대건설기계","두산밥캣","두산퓨얼셀","두산에너빌리티",
  "SK이노베이션","SK텔레콤","SK네트웍스","SK에코플랜트",
  "LG화학","LG에너지솔루션","LG유플러스","LG CNS","LG이노텍","LG전자","LG디스플레이",
  "롯데케미칼","롯데쇼핑","롯데제과","롯데칠성","롯데건설",
  "한화솔루션","한화에어로스페이스","한화오션","한화시스템",
  "GS칼텍스","GS리테일","GS건설","GS에너지",
  "신세계푸드","신세계I&C","이마트","스타벅스코리아",
  "CJ제일제당","CJ ENM","CJ대한통운","CJ올리브네트웍스","CJ CGV",
  "삼성물산","삼성SDS","삼성바이오로직스","삼성전기","삼성화재","삼성증권",
  "현대자동차","현대제철","현대로템","현대중공업","현대글로비스","현대오토에버",
  "포스코홀딩스","포스코인터내셔널","포스코DX","포스코이앤씨",
]);

interface DiscoveredCompany { name: string; industry: string | null; reason: string }

function isCompanyName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 20) return false;
  if (!/[가-힣A-Z]/.test(name)) return false;
  if (/^\d/.test(name)) return false;
  if (KNOWN_COMPANIES.has(name)) return true;
  return COMPANY_SUFFIXES.some(sfx => name.endsWith(sfx));
}

// ── DART API 존재 확인 ────────────────────────────────────────────────────
async function checkDartExists(name: string, dartKey: string): Promise<boolean> {
  if (!dartKey) return false;
  try {
    const today = new Date();
    const endDe   = today.toISOString().slice(0, 10).replace(/-/g, "");
    const startDe = `${today.getFullYear() - 3}0101`;
    const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${dartKey}&corp_name=${encodeURIComponent(name)}&bgn_de=${startDe}&end_de=${endDe}&page_count=5`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return false;
    const data = await res.json() as { status: string; list?: Array<{ corp_name: string }> };
    if (data.status !== "000" || !data.list?.length) return false;
    return data.list.some(c => {
      const n = c.corp_name.replace(/\(주\)|주식회사|\(유\)/g, "").trim();
      return n === name || n.includes(name) || name.includes(n);
    });
  } catch {
    return false;
  }
}

// ── 공공데이터 API 존재 확인 ──────────────────────────────────────────────
async function checkPublicExists(name: string, pubKey: string): Promise<boolean> {
  if (!pubKey) return false;
  try {
    const url = new URL("https://api.odcloud.kr/api/15083277/v1/uddi:c70b85ac-0146-41a9-8f4a-d2acafaa3c92");
    url.searchParams.set("serviceKey", pubKey);
    url.searchParams.set("page", "1");
    url.searchParams.set("perPage", "5");
    url.searchParams.set("returnType", "json");
    url.searchParams.set("cond[사업장명::LIKE]", name);
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return false;
    const data = await res.json() as { data?: Array<{ 사업장명: string }> };
    if (!Array.isArray(data.data) || !data.data.length) return false;
    return data.data.some(c => {
      const n = c.사업장명.replace(/\(주\)|주식회사|\(유\)/g, "").trim();
      return n === name || n.includes(name) || name.includes(n);
    });
  } catch {
    return false;
  }
}

// ── Rule-based 기업명 추출 ────────────────────────────────────────────────
function extractCompaniesFromText(
  articles: { title: string; body: string; keyword: string }[],
  existingNames: Set<string>,
): DiscoveredCompany[] {
  const freq = new Map<string, { keyword: string; count: number }>();

  const suffixRe = new RegExp(
    `([가-힣A-Za-z·&]{2,15}(?:${COMPANY_SUFFIXES.join("|")}))`,
    "g",
  );

  for (const { title, body, keyword } of articles) {
    const fullText = `${title} ${body}`;
    const candidates = new Set<string>();

    // 접미어 패턴 매칭 (제목 + 본문)
    for (const m of fullText.matchAll(suffixRe)) {
      candidates.add(m[1]);
    }
    // 알려진 회사명 직접 검색 (제목 + 본문)
    for (const name of KNOWN_COMPANIES) {
      if (fullText.includes(name)) candidates.add(name);
    }

    for (const name of candidates) {
      if (isCompanyName(name) && !existingNames.has(name)) {
        // 제목에 있으면 가중치 2배
        const inTitle = title.includes(name) ? 2 : 1;
        freq.set(name, {
          keyword,
          count: (freq.get(name)?.count ?? 0) + inTitle,
        });
      }
    }
  }

  return Array.from(freq.entries())
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([name, { keyword }]) => ({
      name,
      industry: null,
      reason: `${keyword} 관련 뉴스 기사에서 언급`,
    }));
}

// ── Claude 기업명 추출 ────────────────────────────────────────────────────
async function extractCompaniesWithClaude(
  articles: { title: string; body: string; keyword: string }[],
  existingNames: string[],
  apiKey: string,
): Promise<DiscoveredCompany[]> {
  const articlesText = articles
    .map(a => `[${a.keyword}] ${a.title}\n${a.body.slice(0, 500)}`)
    .join("\n\n---\n\n");
  const excludeText = existingNames.slice(0, 60).join(", ");

  const prompt = `아래 뉴스 기사(제목+본문 일부)에서 B2B IT 솔루션 영업 대상이 될 만한 국내 기업명을 최대 10개 추출해줘.

제외할 기존 고객: ${excludeText || "없음"}

뉴스 기사:
${articlesText}

조건:
- 실제 기업 이름만 추출 (사람 이름, 언론사, 정부기관 제외)
- 기존 고객 목록에 있는 기업 제외
- 중복 없이 최대 10개

반드시 아래 JSON 형식으로만 응답:
{"companies":[{"name":"기업명","industry":"업종 또는 null","reason":"영업 접근 근거 1문장"}]}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`Claude API ${res.status}`);
  const data = await res.json() as { content: Array<{ text: string }> };
  const raw = data.content[0].text.trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("JSON 파싱 실패");
  const p = JSON.parse(match[0]) as { companies?: DiscoveredCompany[] };
  return Array.isArray(p.companies) ? p.companies : [];
}

// ── 메인 핸들러 ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

    // 1. 키워드 조회
    const { data: kwRows } = await sb
      .from("brycen_keywords")
      .select("keyword")
      .order("created_at");
    if (!kwRows?.length) {
      return json({ error: "등록된 키워드가 없습니다. 키워드 목록관리에서 키워드를 추가해주세요." });
    }

    // 2. 기존 기업 목록
    const { data: existing } = await sb.from("company_data").select("name");
    const existingNames = new Set((existing ?? []).map(c => String(c.name).trim()));

    // 3. 키워드별 구글 뉴스 RSS 검색
    const rawItems: { title: string; url: string; keyword: string }[] = [];
    const seenTitles = new Set<string>();

    for (const { keyword } of kwRows.slice(0, 5)) {
      const encoded = encodeURIComponent(keyword);
      const rssUrl = `https://news.google.com/rss/search?q=${encoded}&hl=ko&gl=KR&ceid=KR:ko`;
      try {
        const r = await fetch(rssUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; BrycenBot/1.0)" },
          signal: AbortSignal.timeout(10_000),
        });
        if (!r.ok) continue;
        const xml = await r.text();
        for (const item of parseNewsRss(xml)) {
          if (
            item.title.toLowerCase().includes(keyword.toLowerCase()) &&
            !seenTitles.has(item.title)
          ) {
            seenTitles.add(item.title);
            rawItems.push({ ...item, keyword });
          }
        }
      } catch { continue; }
    }

    if (rawItems.length === 0) {
      return json({ error: "뉴스 수집 실패. 잠시 후 다시 시도해주세요." });
    }

    // 4. 기사 본문 병렬 fetch (키워드당 최대 5건, 전체 최대 15건)
    const fetchTargets = rawItems.slice(0, 15);
    const bodyResults = await Promise.allSettled(
      fetchTargets.map(item => fetchArticleText(item.url)),
    );

    const articles = fetchTargets.map((item, i) => ({
      title: item.title,
      keyword: item.keyword,
      body: bodyResults[i].status === "fulfilled" ? bodyResults[i].value : "",
    }));

    // 5. 기업명 추출
    let companies: DiscoveredCompany[];
    if (apiKey) {
      try {
        companies = await extractCompaniesWithClaude(articles, [...existingNames], apiKey);
      } catch {
        companies = extractCompaniesFromText(articles, existingNames);
      }
    } else {
      companies = extractCompaniesFromText(articles, existingNames);
    }

    // 6. 기존 기업 재필터
    companies = companies.filter(c => !existingNames.has(c.name.trim())).slice(0, 20);

    // 7. DART + 공공데이터 API 교차 검증 — 두 API 모두 존재하는 기업만 포함
    const dartKey = Deno.env.get("DART_API_KEY") ?? "";
    const pubKey  = Deno.env.get("PUBLIC_DATA_API_KEY") ?? "";

    if (dartKey || pubKey) {
      const checks = await Promise.allSettled(
        companies.map(async c => {
          const [dartOk, pubOk] = await Promise.all([
            checkDartExists(c.name, dartKey),
            checkPublicExists(c.name, pubKey),
          ]);
          return { company: c, dartOk, pubOk };
        }),
      );

      companies = checks
        .filter(r => r.status === "fulfilled" && (r.value.dartOk || r.value.pubOk))
        .map(r => {
          const { company, dartOk, pubOk } = (r as PromiseFulfilledResult<{ company: DiscoveredCompany; dartOk: boolean; pubOk: boolean }>).value;
          const tag = dartOk && pubOk ? "DART·공공데이터 검증" : dartOk ? "DART 검증" : "공공데이터 검증";
          return { ...company, reason: `${company.reason} (${tag} 완료)` };
        })
        .slice(0, 10);
    } else {
      companies = companies.slice(0, 10);
    }

    return json({
      success: true,
      companies,
      searched_keywords: kwRows.map(k => k.keyword),
      news_count: rawItems.length,
      sample_titles: rawItems.slice(0, 5).map(t => t.title),
    });
  } catch (err) {
    console.error(err);
    return json({ error: String(err) });
  }
});
