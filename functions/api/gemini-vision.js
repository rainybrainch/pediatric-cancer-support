// ヴィタリア転生録 — 食事写真認識 Gemini Vision プロキシ
// Cloudflare Pages Functions 版
// 環境変数 GEMINI_API_KEY を Cloudflare Pages の Settings → Environment variables で設定

const VISION_PROMPT = `この食事の写真を分析してください。含まれる料理・食材をすべて特定し、以下のJSONのみで返答してください。余分なテキストは不要です。

{
  "items": [
    { "name": "料理名（日本語）", "category": "veg|fruit|protein|grain|other", "amount": "1皿|1切|1杯 など", "note": "簡単な説明" }
  ],
  "comment": "全体的な栄養バランスへの一言コメント（30文字以内）"
}

カテゴリの判定基準：
- veg: 野菜、海藻、きのこ
- fruit: 果物
- protein: 魚、肉、卵、豆、乳製品
- grain: ごはん、パン、麺、芋
- other: 加工食品、菓子、飲料、調味料

写真にうつっていない食材は推測しないでください。`;

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

  const base64 = typeof payload.image === 'string' ? payload.image : '';
  const mime   = typeof payload.mime === 'string'  ? payload.mime  : 'image/jpeg';
  if (!base64) return jsonResponse(400, { error: 'image is required' });
  if (base64.length > 8_000_000) return jsonResponse(413, { error: 'image too large' });
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(mime)) {
    return jsonResponse(400, { error: 'unsupported mime' });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mime, data: base64 } },
            { text: VISION_PROMPT },
          ],
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
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
