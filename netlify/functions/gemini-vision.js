// ヴィタリア転生録 — 食事写真認識 Gemini Vision プロキシ
// クライアントから API キーを隠し、サーバー側の環境変数で API を呼び出す。
// Netlify 環境変数 `GEMINI_API_KEY` を使用（gemini-coach と共通）。
//
// 注：本ファイルは _worker.js（Cloudflare Worker）と同等のロジックを Netlify Functions
// 形式に置き換えたもの。レート制限まで完全同期。
// 編集時はかならず _worker.js も同時に更新すること。

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

// レート制限（Visionは軽め・coach と共有しないインメモリ）
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQS = 20;
const RATE_LIMIT_DAILY_MAX = 200;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

function getClientIp(event){
  const h = event.headers || {};
  return h['x-nf-client-connection-ip']
      || h['client-ip']
      || (h['x-forwarded-for'] || '').split(',')[0].trim()
      || 'unknown';
}

function checkRateLimit(ip){
  const now = Date.now();
  if(rateLimitMap.size > 5000){
    for(const [k, v] of rateLimitMap.entries()){
      if(now - v.lastTs > DAILY_WINDOW_MS) rateLimitMap.delete(k);
    }
  }
  let entry = rateLimitMap.get(ip);
  if(!entry){
    entry = { reqs: [], dailyCount: 0, dailyStart: now, lastTs: now };
    rateLimitMap.set(ip, entry);
  }
  if(now - entry.dailyStart > DAILY_WINDOW_MS){
    entry.dailyCount = 0;
    entry.dailyStart = now;
  }
  entry.reqs = entry.reqs.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  entry.lastTs = now;

  if(entry.dailyCount >= RATE_LIMIT_DAILY_MAX){
    return { ok: false, reason: 'daily', retryAfter: Math.ceil((entry.dailyStart + DAILY_WINDOW_MS - now)/1000) };
  }
  if(entry.reqs.length >= RATE_LIMIT_MAX_REQS){
    return { ok: false, reason: 'minute', retryAfter: 60 };
  }
  entry.reqs.push(now);
  entry.dailyCount++;
  return { ok: true };
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

function jsonResponse(statusCode, body, extraHeaders = {}) {
  return { statusCode, headers: { ...CORS, ...extraHeaders }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST')    return jsonResponse(405, { error: 'Method not allowed' });

  // レート制限
  const ip = getClientIp(event);
  const rl = checkRateLimit(ip);
  if(!rl.ok){
    return jsonResponse(429, {
      error: '少し早すぎます。1分ほど時間をおいて再度お試しください。',
      retryAfter: rl.retryAfter
    }, { 'Retry-After': String(rl.retryAfter) });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return jsonResponse(500, { error: 'Server-side GEMINI_API_KEY not configured' });

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch (e) { return jsonResponse(400, { error: 'Invalid JSON' }); }

  const base64 = typeof payload.image === 'string' ? payload.image : '';
  const mime   = typeof payload.mime === 'string'  ? payload.mime  : 'image/jpeg';
  if (!base64)                       return jsonResponse(400, { error: 'image is required' });
  if (base64.length > 8_000_000)     return jsonResponse(413, { error: 'image too large' });
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
};
