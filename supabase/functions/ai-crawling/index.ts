import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// ── Google News RSS 파싱 ─────────────────────────────────────────────────────
interface NewsItem { title: string; url: string; pubDate: string }

function parseNewsRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title   = (/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/.exec(block) ?? /<title>([\s\S]*?)<\/title>/.exec(block))?.[1]?.trim() ?? "";
    const url     = (/<link>([\s\S]*?)<\/link>/.exec(block))?.[1]?.trim() ?? "";
    const pubDate = (/<pubDate>([\s\S]*?)<\/pubDate>/.exec(block))?.[1]?.trim() ?? "";
    if (title && url) items.push({ title, url, pubDate });
  }
  return items.slice(0, 15);
}

// ── 뉴스 키워드 추출 ─────────────────────────────────────────────────────────
function extractNewsKeywords(titles: string[], companyName: string): string[] {
  const stop = new Set([
    "의","가","이","은","들","는","과","도","를","으로","자","에","와","한","하다",
    "있다","없다","하는","그","그리고","또한","및","등","을","대한","위한","합니다",
    "있습니다","됩니다","입니다","통해","위해","관련","대해","따른","따라","되어",
    "하여","제공","사용","가능","해당","경우","때문","이후","이전","올해","지난",
    "기자","뉴스","보도","기사","미디어","언론","매체","발표","발행","공개",
    "the","a","an","and","or","of","to","in","for","is","are","was","were",
    "it","this","that","with","from","by","at","on","as","be","have","has",
    "will","its","we","you","they","all","new","said","says",
  ]);
  const companyTokens = new Set(
    companyName.toLowerCase().replace(/[^가-힣a-z]/g, " ").split(/\s+/).filter(Boolean)
  );
  const freq: Record<string, number> = {};
  titles.join(" ")
    .replace(/[^가-힣a-zA-Z\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stop.has(w) && !companyTokens.has(w.toLowerCase()))
    .forEach(w => { freq[w] = (freq[w] ?? 0) + 1; });

  const BOOST = ["디지털","전환","클라우드","erp","sap","채용","자동화","솔루션","혁신","글로벌","스마트","투자","계약","수주","인수","합병","확장","성장"];
  Object.keys(freq).forEach(w => {
    if (BOOST.some(b => w.includes(b))) freq[w] += 5;
  });
  return Object.entries(freq).sort(([, a], [, b]) => b - a).slice(0, 10).map(([w]) => w);
}

// ── Claude 뉴스 분석 ─────────────────────────────────────────────────────────
interface ClaudeAnalysis { keywords: string[]; summary: string }

async function analyzeNewsWithClaude(
  companyName: string,
  newsTitles: string[],
  apiKey: string,
): Promise<ClaudeAnalysis> {
  const prompt = `아래는 "${companyName}" 관련 최근 뉴스 제목입니다.
B2B IT 영업(SAP/ERP/디지털 전환) 관점에서:
1. 핵심 키워드 5~10개 (투자·디지털화·채용·성장·이슈 등)
2. 영업 담당자용 2~3문장 요약

반드시 아래 JSON 형식으로만 응답해:
{"keywords":["키워드1",...],"summary":"요약..."}

--- 뉴스 제목 ---
${newsTitles.join("\n")}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}`);
  const data = await res.json() as { content: Array<{ text: string }> };
  const raw = data.content[0].text.trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("JSON 파싱 실패");
  const p = JSON.parse(match[0]) as Partial<ClaudeAnalysis>;
  return {
    keywords: Array.isArray(p.keywords) ? p.keywords as string[] : [],
    summary:  typeof p.summary === "string" ? p.summary : "",
  };
}

// ── 공공데이터포털 국민연금 API ───────────────────────────────────────────────
interface PublicPensionCompany {
  사업장명: string;
  사업장업종코드명: string;
  사업장도로명상세주소: string | null;
}

async function findPublicApiCompany(name: string, pubKey: string): Promise<PublicPensionCompany | null> {
  try {
    // Feb 2024 snapshot (최신 가용 데이터)
    const url = new URL("https://api.odcloud.kr/api/15083277/v1/uddi:c70b85ac-0146-41a9-8f4a-d2acafaa3c92");
    url.searchParams.set("serviceKey", pubKey);
    url.searchParams.set("page", "1");
    url.searchParams.set("perPage", "5");
    url.searchParams.set("returnType", "json");
    url.searchParams.set("cond[사업장명::LIKE]", name);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;

    const data = await res.json() as { data?: PublicPensionCompany[] };
    if (!Array.isArray(data.data) || data.data.length === 0) return null;

    const exact = data.data.find(
      c => c.사업장명 === name || c.사업장명 === `${name}(주)` || c.사업장명 === `(주)${name}`,
    );
    return exact ?? data.data[0];
  } catch {
    return null;
  }
}

// ── DART API ─────────────────────────────────────────────────────────────────
interface DartCompany {
  corp_code: string;
  corp_name: string;
  corp_cls: string;   // Y=코스피, K=코스닥, N=코넥스, E=기타
  induty_code: string;
  adres: string;
  hm_url: string;
}

// KSIC 대분류 → 산업군 이름
function mapIndustryCode(code: string): string | null {
  if (!code) return null;
  const p = code.substring(0, 2);
  const m: Record<string, string> = {
    "01":"농업","02":"임업","03":"어업",
    "05":"에너지/광업","06":"금속광물","07":"비금속광물",
    "10":"식품제조","11":"음료제조","13":"섬유/의류","14":"의복/패션",
    "17":"펄프/종이","19":"석유정제","20":"화학/소재","21":"의약품/제약",
    "22":"고무/플라스틱","23":"세라믹/비금속","24":"철강/금속",
    "25":"금속가공","26":"전자/반도체/디스플레이","27":"전기장비/배터리",
    "28":"기계/장비","29":"자동차/부품","30":"조선/항공/방산",
    "35":"전기/가스/에너지","36":"수도","41":"건설/건축","42":"토목",
    "45":"자동차판매","46":"도매/무역","47":"소매/유통",
    "49":"육상운송/물류","50":"해운","51":"항공",
    "52":"물류/창고","55":"숙박/호텔","56":"외식/식음료",
    "58":"출판/미디어","59":"영상/콘텐츠","60":"방송",
    "61":"통신","62":"IT/소프트웨어","63":"정보서비스/IT",
    "64":"금융/은행","65":"보험","66":"금융투자/증권",
    "68":"부동산","70":"연구개발",
    "71":"법무/회계/컨설팅","72":"엔지니어링/설계",
    "73":"광고/마케팅","77":"사업지원서비스",
    "84":"공공행정","85":"교육",
    "86":"의료/헬스케어","87":"사회복지",
    "90":"예술/문화/스포츠","96":"개인서비스",
  };
  return m[p] ?? null;
}

function formatRevenue(amountStr: string): string | null {
  const amount = parseInt(amountStr.replace(/,/g, ""), 10);
  if (isNaN(amount) || amount <= 0) return null;
  if (amount >= 1_000_000_000_000)
    return `약 ${(amount / 1_000_000_000_000).toFixed(1)}조원`;
  if (amount >= 100_000_000)
    return `약 ${Math.round(amount / 100_000_000).toLocaleString()}억원`;
  return `약 ${amount.toLocaleString()}원`;
}

async function findDartCompany(name: string, dartKey: string): Promise<DartCompany | null> {
  try {
    const today = new Date();
    const endDe  = today.toISOString().slice(0, 10).replace(/-/g, "");
    const startDe = `${today.getFullYear() - 2}0101`;

    // 1. 공시 검색으로 corp_code 획득
    const listUrl = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${dartKey}&corp_name=${encodeURIComponent(name)}&bgn_de=${startDe}&end_de=${endDe}&page_count=10`;
    const listRes = await fetch(listUrl, { signal: AbortSignal.timeout(8_000) });
    if (!listRes.ok) return null;

    const listData = await listRes.json() as {
      status: string;
      list?: Array<{ corp_code: string; corp_name: string }>;
    };
    if (listData.status !== "000" || !listData.list?.length) return null;

    // 정확히 일치하는 이름 우선
    const best = listData.list.find(i => i.corp_name === name) ?? listData.list[0];

    // 2. 기업 상세 조회
    const detailRes = await fetch(
      `https://opendart.fss.or.kr/api/company.json?crtfc_key=${dartKey}&corp_code=${best.corp_code}`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!detailRes.ok) return null;

    const detail = await detailRes.json() as { status: string } & DartCompany;
    if (detail.status !== "000") return null;
    return detail;
  } catch {
    return null;
  }
}

async function getDartRevenue(corpCode: string, dartKey: string): Promise<string | null> {
  const year = new Date().getFullYear();
  for (const bsnsYear of [year - 1, year - 2]) {
    try {
      const url = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${dartKey}&corp_code=${corpCode}&bsns_year=${bsnsYear}&reprt_code=11011`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
      if (!res.ok) continue;

      const data = await res.json() as {
        status: string;
        list?: Array<{ sj_div: string; account_nm: string; thstrm_amount: string }>;
      };
      if (data.status !== "000" || !data.list) continue;

      const rev = data.list.find(
        item =>
          (item.sj_div === "IS" || item.sj_div === "CIS") &&
          (item.account_nm === "매출액" || item.account_nm === "수익(매출액)"),
      );
      if (rev?.thstrm_amount) {
        const formatted = formatRevenue(rev.thstrm_amount);
        if (formatted) return `${formatted} (${bsnsYear}년 기준)`;
      }
    } catch { continue; }
  }
  return null;
}

// ── 메인 핸들러 ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const claudeKey = Deno.env.get("ANTHROPIC_API_KEY");
    const dartKey   = Deno.env.get("DART_API_KEY") ?? "";
    const pubKey    = Deno.env.get("PUBLIC_DATA_API_KEY") ?? "";

    const { company_id } = await req.json() as { company_id: string };
    if (!company_id) return json({ error: "company_id 필수" });

    const { data: co, error: ce } = await sb.from("company_data").select("*").eq("id", company_id).single();
    if (ce || !co) return json({ error: "기업 없음" });

    const now = new Date().toISOString();
    const companyName = co.name as string;

    // ── 뉴스 RSS + DART API 병렬 실행 ──────────────────────────────────────
    const cleanName = (name: string) =>
      name.replace(/[·•・\-_/\\()（）【】\[\]]/g, " ").replace(/\s+/g, " ").trim();

    const fetchRss = async (query: string) =>
      fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BrycenBot/1.0)" },
        signal: AbortSignal.timeout(15_000),
      });

    const [rssResult, dartResult] = await Promise.allSettled([
      fetchRss(companyName),
      dartKey ? findDartCompany(companyName, dartKey) : Promise.resolve(null),
    ]);

    // ── DART 결과 처리 ──────────────────────────────────────────────────────
    const dartCompany = dartResult.status === "fulfilled" ? dartResult.value : null;

    let pubCompany: PublicPensionCompany | null = null;
    if (!dartCompany && pubKey) {
      pubCompany = await findPublicApiCompany(companyName, pubKey);
    }

    const dartFound = dartCompany !== null || pubCompany !== null;

    let industry: string | null = null;
    let revenue:  string | null = null;
    let country:  string | null = null;

    if (dartCompany) {
      industry = mapIndustryCode(dartCompany.induty_code);
      country  = "한국";
      revenue = await getDartRevenue(dartCompany.corp_code, dartKey);
    } else if (pubCompany) {
      industry = pubCompany.사업장업종코드명 || null;
      country  = "한국";
    }

    // ── 뉴스 RSS 처리 ──────────────────────────────────────────────────────
    let r = rssResult.status === "fulfilled" ? rssResult.value : null;
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(companyName)}&hl=ko&gl=KR&ceid=KR:ko`;

    if (!r?.ok) {
      const fallback = cleanName(companyName);
      if (fallback !== companyName) r = await fetchRss(fallback);
    }

    if (!r?.ok) {
      return json({ error: `뉴스 RSS 접근 실패 — "${companyName}" 검색 불가`, dart_found: dartFound });
    }

    const xml = await r.text();
    const newsItems = parseNewsRss(xml);

    if (newsItems.length === 0) {
      return json({ error: `"${companyName}" 관련 뉴스를 찾을 수 없습니다.`, dart_found: dartFound });
    }

    const newsTitles = newsItems.map(n => n.title);
    const newsContent = newsItems.map(n => `${n.title} (${n.pubDate})`).join("\n");

    // ── 키워드 + 요약 추출 ──────────────────────────────────────────────────
    let keywords: string[];
    let summary: string;

    if (claudeKey) {
      try {
        ({ keywords, summary } = await analyzeNewsWithClaude(companyName, newsTitles, claudeKey));
      } catch {
        keywords = extractNewsKeywords(newsTitles, companyName);
        summary = `${companyName} 최근 뉴스 ${newsItems.length}건. 키워드: ${keywords.slice(0, 5).join(", ")}.`;
      }
    } else {
      keywords = extractNewsKeywords(newsTitles, companyName);
      summary = `${companyName} 최근 뉴스 ${newsItems.length}건. 키워드: ${keywords.slice(0, 5).join(", ")}.`;
    }

    // ── 크롤링 이력 저장 ────────────────────────────────────────────────────
    try {
      const { error: insertErr } = await sb.from("company_data_crawling").insert({
        company_data_id: company_id, url: rssUrl, collected_at: now,
        keywords, source_type: "news",
        title: `${companyName} 최근 뉴스 (${newsItems.length}건)`,
        raw_content: newsContent,
      });
      if (insertErr) {
        await sb.from("company_data_crawling").insert({
          company_data_id: company_id, url: rssUrl, collected_at: now, keywords,
        });
      }
    } catch {
      await sb.from("company_data_crawling").insert({
        company_data_id: company_id, url: rssUrl, collected_at: now, keywords,
      });
    }

    // ── company_data 업데이트 ───────────────────────────────────────────────
    const updateFields: Record<string, unknown> = { keywords, ai_summary: summary };
    if (industry) updateFields.industry = industry;
    if (revenue)  updateFields.revenue  = revenue;
    if (country)  updateFields.country  = country;
    await sb.from("company_data").update(updateFields).eq("id", company_id);

    return json({
      success: true, keywords, summary,
      industry, revenue, country,
      dart_found: dartFound,
      dart_registered: dartCompany !== null,
      public_registered: pubCompany !== null,
      dart_company_name: dartCompany?.corp_name ?? null,
      news_count: newsItems.length,
    });
  } catch (err) {
    console.error(err);
    return json({ error: String(err) });
  }
});
