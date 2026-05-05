const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (!groqKey) return json({ error: "GROQ_API_KEY 미설정" }, 500);

    const buf = await req.arrayBuffer();
    const { company_name, industry, solution, result, tags } = JSON.parse(
      new TextDecoder("utf-8").decode(buf)
    ) as { company_name?: string; industry?: string; solution?: string; result?: string; tags?: string };

    if (!company_name?.trim()) return json({ error: "company_name 필수" }, 400);

    const hasResult = !!result?.trim();

    const prompt = `당신은 기업의 비즈니스 모델과 운영 구조를 혁신하는 전략 기획 전문가이자 데이터 사이언티스트입니다.

아래 레퍼런스 사례를 분석하여 [원인]과 [수치 성과]를 도출하세요.

기업명: ${company_name}
업종: ${industry || "불명"}
도입 솔루션: ${solution || "불명"}
기존 성과 데이터: ${result || "없음 (예측 필요)"}
관련 태그: ${tags || "없음"}

[원인 분석 — 3단계 원칙]
1. 사실 너머의 가설: 결과론적 해석 금지. 업계 특성을 고려한 구체적 운영 병목(Bottleneck) 가설을 제시한다.
2. 기술과 숫자의 연결: 성과 수치가 솔루션과 어떻게 물리적으로 연결되는지 메커니즘을 추론한다.
3. 차별화된 통찰: 단순 트렌드 추종인지, 경쟁사 대비 전략적 우위 확보인지 독창적 시각을 제시한다.

[수치 성과]
${hasResult
  ? `기존 성과 데이터가 있으므로 그대로 반환한다: "${result}"`
  : `기존 성과 데이터가 없다. 업종(${industry || "불명"})과 솔루션(${solution || "불명"}) 기반으로 업계 평균 벤치마크를 참고하여 구체적인 수치 추정치 1~2문장을 작성한다. 예: "생산 공정 사이클 타임 25~35% 단축, 연간 품질 불량 처리 비용 약 15% 절감 추정"`
}

[출력 형식] 마크다운·코드블록 없이 순수 JSON만 반환:
{
  "problem": "원인 분석 2~3문장. '보인다' '있을 것이다' 같은 모호한 표현 금지. 확신 있는 어조.",
  "result": "수치 포함 성과 1~2문장"
}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.55,
        max_tokens: 600,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API ${res.status}: ${errText}`);
    }

    const data = JSON.parse(new TextDecoder("utf-8").decode(await res.arrayBuffer())) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = (data.choices?.[0]?.message?.content ?? "").trim();

    // JSON 파싱 (모델이 코드블록을 붙이는 경우 대비)
    const match = raw.match(/\{[\s\S]*\}/);
    let problem = "";
    let resultOut = "";
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as { problem?: string; result?: string };
        problem   = (parsed.problem ?? "").trim();
        resultOut = (parsed.result  ?? "").trim();
      } catch {
        problem = raw;
      }
    } else {
      problem = raw;
    }

    return json({ success: true, problem, result: resultOut });
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
});
