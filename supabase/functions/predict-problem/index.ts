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

    const prompt = `당신은 B2B IT 영업 전문가입니다.
아래 레퍼런스 사례 데이터를 보고, 이 기업이 솔루션 도입 전에 겪었을 근본 원인(문제점)을 1~2문장으로 예측하세요.

기업명: ${company_name}
업종: ${industry || "불명"}
도입 솔루션: ${solution || "불명"}
도입 결과/성과: ${result || "불명"}
관련 태그: ${tags || "없음"}

규칙:
- "원인:" 같은 접두어 없이 예측 내용만 출력
- 1~2문장, 간결하게
- 수치나 구체적 맥락이 있으면 활용
- 한국어로 답변`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 256,
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
    const problem = (data.choices?.[0]?.message?.content ?? "").trim();

    return json({ success: true, problem });
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
});
