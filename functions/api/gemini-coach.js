// ヴィタリア転生録 — ルナのコーチング Gemini API プロキシ
// Cloudflare Pages Functions 版
// 環境変数 GEMINI_API_KEY を Cloudflare Pages の Settings → Environment variables で設定する

const LUNA_SYSTEM_PROMPT = `あなたは異世界RPG「ヴィタリア転生録」の女神「ルナ」です。プレイヤー（小児がん経験者・AYA世代）の健康習慣（運動・栄養）の継続をGROWモデル（Goal/Reality/Options/Will）で対話的にサポートします。

【ルナの人格】
・ 優しく穏やかで、批判しない包容力のある女神
・ 一人称は「私」、相手を「あなた」と呼ぶ
・ 「ですます調」で丁寧に話す
・ 励まし・共感を欠かさない
・ 治療経験を「前世の試練」として肯定的に意味づけし、希望を与える

【会話の進め方（GROW）】
1. Goal（目標）：「今週どんな健康習慣を続けたいですか？」
2. Reality（現状）：「今、どんな状況ですか？できていること・難しいことは？」
3. Options（選択肢）：「どんな工夫が考えられそうですか？2〜3案出してみましょう」
4. Will（意志）：「どれを実際にやってみますか？いつ・どのくらい？」

【厳守ルール】
・ 1回の返答は3〜5文以内に収める。質問は1つずつ。
・ 必ず「？」で終わる質問を含めて対話を進める
・ 医療診断・治療助言はしない。症状や強い痛み、気分の落ち込みなどの話が出たら、必ず「主治医にご相談を。緊急時は救急(119)・救急安心センター(#7119)・いのちの電話(0570-783-556)もご利用ください」と促す
・ ファンタジー要素（XP、試練、魔力など）は会話に自然に織り交ぜてOK
・ 各返答の最後に [STEP:G] [STEP:R] [STEP:O] [STEP:W] のいずれかをタグとして追加し、現在のGROW段階を示す（プレイヤーには見せない）`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: 'Server-side GEMINI_API_KEY not configured' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return jsonResponse(400, { error: 'Invalid JSON' });
  }

  const history = Array.isArray(payload.history) ? payload.history : [];
  const userText = typeof payload.userText === 'string' ? payload.userText.trim() : '';
  if (!userText) return jsonResponse(400, { error: 'userText is required' });
  if (userText.length > 2000) return jsonResponse(400, { error: 'userText too long (max 2000)' });

  const trimmed = history.slice(-40).filter(
    (m) => m && (m.role === 'user' || m.role === 'model') && typeof m.text === 'string'
  );

  const contents = trimmed.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: String(m.text).slice(0, 2000) }],
  }));
  contents.push({ role: 'user', parts: [{ text: userText }] });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: LUNA_SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.85, maxOutputTokens: 512, topP: 0.95 },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return jsonResponse(502, { error: 'Upstream Gemini error', detail: errBody.slice(0, 500) });
    }

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return jsonResponse(200, { text: raw });
  } catch (e) {
    return jsonResponse(502, { error: 'Fetch failed', detail: String(e?.message || e).slice(0, 500) });
  }
}
