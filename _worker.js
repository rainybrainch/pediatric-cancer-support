// ヴィタリア転生録 — Cloudflare Worker (with static assets)
// /api/gemini-coach  と /api/gemini-vision のみハンドル、それ以外は静的ファイルにフォールバック。

const LUNA_SYSTEM_PROMPT = `あなたは、がん経験者の「晩期合併症予防」と「生活課題解決」を支援する専門のAIコーチ「ルナ」です。異世界RPG「ヴィタリア転生録」の女神として、プレイヤー（小児がん経験者・AYA世代）に寄り添います。ユーザーの状況を深く理解し、常に共感・傾聴・非審判的な態度で接してください。

【あなたの役割とロジック】
1. あなたは「具体的な答えを与える」代わりに、ユーザー自身が解決策と行動意欲を引き出すためのファシリテーターです。
2. コミュニケーションは、優しく・簡潔に・常にユーザーの次の発言を促す形で構成してください。
3. 以下の【フェーズ進行ルール】に従い、ユーザーの状況を把握しながら会話を進めてください。

【フェーズ進行ルール】
フェーズ1〜2の質問は、ユーザーがすでに情報を提供している場合スキップして適切な次のステップへ進むこと。

■ フェーズ1：背景把握（必要に応じてスキップ可）
・治療経験・晩期合併症リスク・生活状況の把握
・「どんな治療を経験されましたか？」「今の生活で気になっていることは？」
・コンテキスト情報（chemoClass・tx・meds・hist）が渡されている場合は省略

■ フェーズ2：課題・困りごとの把握（必要に応じてスキップ可）
・運動・栄養・睡眠・ストレス・社会参加など、今困っていることを引き出す
・「今、生活の中でいちばん難しいと感じていることは何ですか？」

■ フェーズ3：行動変容ステージの確認
・以下の5つのステージをやわらかく確認し、ユーザーに合ったアプローチを選ぶ：
  ① 前熟考期：「健康習慣を変えることを、まだ考えていない」
  ② 熟考期：「変えた方がいいとは思うが、まだ始めていない」
  ③ 準備期：「変えようと準備中・近々始めようとしている」
  ④ 実行期：「すでに行動を変えて6ヶ月未満」
  ⑤ 維持期：「6ヶ月以上継続できている」
・コンテキストに stage 情報がある場合は直接フェーズ4へ。

【ステージ別対応方針】
・① 前熟考期 → 押しつけず「読むだけでOK」。変化のメリットを自然に伝える
・② 熟考期 → 迷いを受け止め、1日1分の小さな選択肢を提示
・③ 準備期 → 具体的な開始日時・if-thenプランを一緒に決める → フェーズ4へ
・④ 実行期 → 継続のコツを探る・障壁を一緒に解決する → フェーズ4へ
・⑤ 維持期 → 停滞しても責めない。長期継続を支える意味づけをする → フェーズ4へ
※ ③④⑤のいずれかの場合、肯定的な応答とともにフェーズ4（GROWモデル）へ移行すること。

■ フェーズ4：GROWモデルによる行動支援
Goal→Reality→Options→Willの順序を厳守し、そのステップで最も効果的な質問を一つだけ選び問いかけること。

・Goal（目標）：「今週、どんな健康習慣を続けたいですか？」
  ─ 目標は具体的・測定可能・小さくする（例：週3回10分散歩）
・Reality（現状）：「今、どんな状況ですか？できていること・難しいことは？」
  ─ コンテキストの運動分・野菜皿数・QOL・連続記録を自然に参照してよい
・Options（選択肢）：「どんな工夫が考えられそうですか？2〜3案出してみましょう」
  ─ if-thenプラン（「○○したら、△△する」）の形で具体化を促す
・Will（意志）：「どれを実際にやってみますか？いつ・どのくらい？」
  ─ 具体的な実行プランを自分の口で言ってもらう

【プロジェクトの目的（背景理論）】
・小児がん経験者の晩期合併症（心血管・代謝・骨・内分泌・第二がんリスク）予防
・運動・栄養・抗炎症食品（魚のオメガ3・ベリー類・緑黄色野菜・緑茶・ナッツ・発酵食品）の習慣化
・「我慢しないからリバウンドしない、苦しくないからやってみたい」が信条
・医学的根拠は必要に応じて、押し付けがましくなく自然に紹介する

【運動・カロリーの基礎知識（参考値として自然に活用）】
・消費kcal = METs × 体重(kg) × 時間(h) × 1.05
・METs目安：安静1.0 / 普通歩行3.0 / 速歩・階段4.0 / ジョギング6.0
・NEAT（家事・移動・立位）も立派な運動。「ジムだけが運動ではない」
・数値は「だいたい」「目安」を添えて断定しない

【ルナの人格】
・優しく穏やかで、批判しない包容力のある女神
・一人称は「私」、相手を「あなた」と呼ぶ
・「ですます調」で丁寧に話す
・励まし・共感を欠かさない
・治療経験を「前世の試練」として肯定的に意味づけし、希望を与える
・ファンタジー要素（XP・試練・魔力など）は会話に自然に織り交ぜてOK

【小児がん経験者特有の文脈認識】
・「波があって当然」：cancer-related fatigueは実在する。「動けない日」を責めない
・「比較しない」：比べる相手は「先週・先月の自分」
・「医療チームとの分担」：症状・検査値の判断には絶対踏み込まない
・「治療の物語」：失われた時間ではなく「経験した上で今ここにいる」価値を肯定
・休んだ日の話が出たら：「無理しないこと自体が、健康行動の一部」と伝える

【厳守ルール — 安全性】
・あなたは医師ではありません。診断・処方・薬・治療法・症状判断には絶対に踏み込まない
・身体/精神症状の話が出たら：「主治医にご相談を。緊急時は救急(119)・救急安心センター(#7119)・よりそいホットライン(0120-279-338)もご利用ください」と必ず促す
・自死・自傷を示唆する語が出たら：共感の言葉を述べた上で「よりそいホットライン(0120-279-338・24時間無料)、いのちの電話(0570-783-556)、緊急時は119。あなたを大切に思っている人がいます」と必ず案内する
・食事制限・断食・極端な減量・代替医療・サプリ・特殊な健康法を勧めない
・「だめ」「悪い」「失敗」などの否定語を使わない

【厳守ルール — 形式】
・1回の返答は3〜5文以内。質問は1つずつ
・必ず「？」で終わる質問を含めて対話を進める
・各返答の最後に [STEP:G] [STEP:R] [STEP:O] [STEP:W] のいずれかをタグとして追加し、現在のGROW段階を示す（プレイヤーには見せない）
・STEP:W に到達したら、その返答の最後に [GOAL:〜] という形でユーザーが今週やると決めた具体的な行動を1文（30文字以内）で要約する。例：[GOAL:火・木の朝に10分散歩する]`;

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

// 危機キーワード（サーバ側でも検知）
const CRISIS_KEYWORDS = [
  '死にたい','しにたい','消えたい','きえたい','自殺','じさつ',
  '殺したい','ころしたい','終わりにしたい','人生終わり',
  '生きていけない','楽になりたい','自傷','リストカット','リスカ',
  '飛び降り','とびおり','首吊り','くびつり',
];

function detectCrisis(text){
  if(!text) return false;
  const t = String(text).toLowerCase().replace(/\s/g, '');
  return CRISIS_KEYWORDS.some(k => t.includes(k.toLowerCase()));
}

// 危機検知時の返答（Geminiを呼ばずに即座に返す）
const CRISIS_REPLY = `あなたが、いまそういう気持ちでいることを、ちゃんと聞きました。

それを言葉にしてくれて、ありがとうございます。ひとりで抱えなくていいんですよ。いまのあなたのために、24時間つながる窓口があります：

📞 よりそいホットライン：0120-279-338（無料・24時間）
📞 いのちの電話：0570-783-556
🚑 緊急時：119

専門の方と話すだけで、少し気持ちが軽くなることがあります。話したくないなら、温かい飲み物を一杯飲むだけでもいい。あなたが、ここに居てくれることが、私にとっては大切です。

いまの気持ち、もう少し話してくれますか？それとも、少し休みますか？

[STEP:R]`;

// レート制限：簡易インメモリ（IPごと/分単位）
// Workers の単一インスタンス内でのみ動作する best-effort 実装
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1分
const RATE_LIMIT_MAX_REQS = 20;          // 1分20リクエスト
const RATE_LIMIT_DAILY_MAX = 200;        // 1日200リクエスト
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

function getClientIp(request){
  return request.headers.get('CF-Connecting-IP')
      || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
      || 'unknown';
}

function checkRateLimit(ip){
  const now = Date.now();
  // 古いエントリを掃除
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
  // 日次リセット
  if(now - entry.dailyStart > DAILY_WINDOW_MS){
    entry.dailyCount = 0;
    entry.dailyStart = now;
  }
  // 直近1分のリクエストのみ保持
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

function jsonResponse(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, ...extraHeaders } });
}

async function handleCoach(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

  // レート制限
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip);
  if(!rl.ok){
    return jsonResponse(429, {
      error: rl.reason === 'daily'
        ? 'リクエスト数が1日の上限に達しました。明日また来てくださいね。'
        : '少し早すぎます。1分ほど時間をおいて再度お試しください。',
      retryAfter: rl.retryAfter
    }, { 'Retry-After': String(rl.retryAfter) });
  }

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return jsonResponse(500, { error: 'Server-side GEMINI_API_KEY not configured' });

  let payload;
  try { payload = await request.json(); }
  catch (e) { return jsonResponse(400, { error: 'Invalid JSON' }); }

  const history = Array.isArray(payload.history) ? payload.history : [];
  const userText = typeof payload.userText === 'string' ? payload.userText.trim() : '';
  if (!userText) return jsonResponse(400, { error: 'userText is required' });
  if (userText.length > 2000) return jsonResponse(400, { error: 'userText too long (max 2000)' });

  // 危機キーワード検知 → Gemini呼ばずに即時応答
  if(detectCrisis(userText)){
    return jsonResponse(200, {
      text: CRISIS_REPLY,
      crisis: true
    });
  }

  const trimmed = history.slice(-40).filter(
    (m) => m && (m.role === 'user' || m.role === 'model') && typeof m.text === 'string'
  );
  const contents = trimmed.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: String(m.text).slice(0, 2000) }],
  }));

  // ユーザーコンテキスト（クライアントから送られた現在の状態を匿名で連結）
  const ctx = payload.context || null;
  let systemAddendum = '';
  if(ctx && typeof ctx === 'object'){
    const lines = ['【参考：いまのプレイヤーの状態（あくまで参考情報）】'];
    if(ctx.weekNum) lines.push(`・参加開始から${ctx.weekNum}週目`);
    if(ctx.cls)     lines.push(`・選択クラス: ${ctx.cls}`);
    if(ctx.streak)  lines.push(`・連続記録: ${ctx.streak}日`);
    if(ctx.recentExMin != null) lines.push(`・直近7日の運動: ${ctx.recentExMin}分`);
    if(ctx.recentVeg != null)   lines.push(`・直近7日の野菜: ${ctx.recentVeg}皿`);
    if(ctx.recentFish != null)  lines.push(`・直近7日の魚: ${ctx.recentFish}食`);
    if(ctx.qolAvg != null)      lines.push(`・直近のQOL平均: ${ctx.qolAvg.toFixed(1)}/5（5が最高）`);
    if(ctx.qolLowDays)          lines.push(`・直近のQOL低下日数: ${ctx.qolLowDays}日`);
    if(ctx.gapDays)             lines.push(`・最終ログインからの経過: ${ctx.gapDays}日`);
    if(ctx.weekGoal)            lines.push(`・今週ルナと決めた目標: ${ctx.weekGoal}`);
    if(ctx.hope)                lines.push(`・参加開始時に書いた希望: 「${String(ctx.hope).slice(0,100)}」`);
    lines.push('この情報を会話の中で自然に活かしてください（ただし「データを見ましたが…」のような機械的な言及はしない）。');
    systemAddendum = '\n\n' + lines.join('\n');
  }
  const systemPrompt = LUNA_SYSTEM_PROMPT + systemAddendum;

  contents.push({ role: 'user', parts: [{ text: userText }] });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.85, maxOutputTokens: 512, topP: 0.95 },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      return jsonResponse(502, { error: 'Upstream Gemini error', detail: errBody.slice(0, 500) });
    }
    const data = await res.json();
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 出力チェック：応答にも危機キーワードが混入していないか
    if(detectCrisis(raw)){
      // Geminiが不適切な応答を返した場合のフォールバック
      raw = `ごめんなさい、いまは少し言葉に詰まってしまいました…。\n\nもしつらい気持ちがあれば、よりそいホットライン (0120-279-338・24時間無料) でも話を聞いてもらえますよ。\n\nもう一度、気持ちを聞かせてくれますか？\n[STEP:R]`;
    }

    return jsonResponse(200, { text: raw });
  } catch (e) {
    return jsonResponse(502, { error: 'Fetch failed', detail: String(e?.message || e).slice(0, 500) });
  }
}

async function handleVision(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

  // レート制限（Visionは軽め）
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip);
  if(!rl.ok){
    return jsonResponse(429, {
      error: '少し早すぎます。1分ほど時間をおいて再度お試しください。',
      retryAfter: rl.retryAfter
    }, { 'Retry-After': String(rl.retryAfter) });
  }

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return jsonResponse(500, { error: 'Server-side GEMINI_API_KEY not configured' });

  let payload;
  try { payload = await request.json(); }
  catch (e) { return jsonResponse(400, { error: 'Invalid JSON' }); }

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
        contents: [{ parts: [
          { inline_data: { mime_type: mime, data: base64 } },
          { text: VISION_PROMPT },
        ]}],
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API ルート
    if (url.pathname === '/api/gemini-coach')  return handleCoach(request, env);
    if (url.pathname === '/api/gemini-vision') return handleVision(request, env);

    // ルート（"/"）→ homepage.html に内部書き換え
    if (url.pathname === '/' || url.pathname === '') {
      const newUrl = new URL(request.url);
      newUrl.pathname = '/homepage.html';
      const rewritten = new Request(newUrl.toString(), request);
      if (env.ASSETS) return env.ASSETS.fetch(rewritten);
    }

    // 静的アセットへのフォールバック
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response('Not found', { status: 404 });
  }
};
