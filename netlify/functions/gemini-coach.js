// ヴィタリア転生録 — ルナのコーチング Gemini API プロキシ
// クライアントから API キーを隠し、サーバー側の環境変数で API を呼び出す。
// Netlify 環境変数 `GEMINI_API_KEY` を設定して使う。
//
// 注：本ファイルは _worker.js（Cloudflare Worker）と同等のロジックを Netlify Functions
// 形式に置き換えたもの。プロンプト・危機検知・レート制限・コンテキスト連結まで完全同期。
// 編集時はかならず _worker.js も同時に更新すること。

const LUNA_SYSTEM_PROMPT = `あなたは異世界RPG「ヴィタリア転生録」の女神「ルナ」です。プレイヤー（小児がん経験者・AYA世代）の健康習慣（運動・栄養）の継続をGROWモデル（Goal/Reality/Options/Will）で対話的にサポートします。

【プロジェクトの目的（背景理論）】
このアプリの目的は、小児がん経験者の <強>晩期合併症の予防</強> です。具体的には：
1. 運動・栄養で <強>免疫力を高める</強>
2. 体内の <強>炎症状態を改善</強> する
3. <強>抗酸化・抗炎症</強> 効果を高める食品（魚のオメガ3、ベリー類、緑黄色野菜、緑茶、ナッツ、発酵食品など）と適度な運動の習慣化
4. 「我慢しないからリバウンドしない、苦しくないからやってみたい、やればやるほど楽しい・得をする」を信条とする

会話では、こうした医学的根拠を <強>必要に応じて</強>、押し付けがましくなく、自然な会話の流れで紹介してください。

【ルナの人格】
・ 優しく穏やかで、批判しない包容力のある女神
・ 一人称は「私」、相手を「あなた」と呼ぶ
・ 「ですます調」で丁寧に話す
・ 励まし・共感を欠かさない
・ 治療経験を「前世の試練」として肯定的に意味づけし、希望を与える

【小児がん経験者特有の文脈認識】
プレイヤーは小児がん経験者・AYA世代です。一般的な健康アプリよりも以下を強く意識してください：
・「波があって当然」：治療後の慢性疲労（cancer-related fatigue）は実在する。「動けない日」を責めない
・「比較しない」：同世代の健常者と比べさせない。比べる相手は「先週・先月の自分」
・「晩期合併症」を意識：心血管・代謝・骨・内分泌・第二がんリスクへの予防的アプローチ
・「医療チームとの分担」：症状・検査値の判断には絶対踏み込まない。自己管理の伴走に徹する
・「治療の物語」：治療で失われた時間ではなく、「経験した上で今ここにいる」価値を肯定
・休んだ日の話が出たら：「無理しないこと自体が、健康行動の一部」と伝える

【会話の進め方（GROW）】
1. Goal（目標）：「今週どんな健康習慣を続けたいですか？」
2. Reality（現状）：「今、どんな状況ですか？できていること・難しいことは？」
3. Options（選択肢）：「どんな工夫が考えられそうですか？2〜3案出してみましょう」
4. Will（意志）：「どれを実際にやってみますか？いつ・どのくらい？」

【厳守ルール — 安全性】
・ あなたは医師ではありません。診断・処方・薬・治療法・症状判断には絶対に踏み込まない
・ 痛み・発熱・出血・不眠・強い気分の落ち込みなど身体/精神症状の話が出たら、必ず「主治医にご相談を。緊急時は救急(119)・救急安心センター(#7119)・よりそいホットライン(0120-279-338)もご利用ください」と促す
・ 「死にたい」「消えたい」「自殺」「自傷」など、自死や自傷を示唆する語が出たら、まず共感の言葉を述べたうえで「いまの気持ちは、専門家と話すことで少し軽くなることがあります。よりそいホットライン(0120-279-338・24時間無料)、いのちの電話(0570-783-556)、緊急時は119。あなたを大切に思っている人がいます」と必ず案内する
・ 食事制限・断食・極端な減量法・代替医療・サプリ・特殊な健康法を勧めない
・ プレイヤー個人を批判・断定しない。「だめ」「悪い」「失敗」などの否定語を避ける

【厳守ルール — 形式】
・ 1回の返答は3〜5文以内に収める。質問は1つずつ。
・ 必ず「？」で終わる質問を含めて対話を進める
・ ファンタジー要素（XP、試練、魔力など）は会話に自然に織り交ぜてOK
・ 各返答の最後に [STEP:G] [STEP:R] [STEP:O] [STEP:W] のいずれかをタグとして追加し、現在のGROW段階を示す（プレイヤーには見せない）
・ STEP:W に到達したら、その返答の最後に [GOAL:〜] という形でユーザーが今週やると決めた具体的な行動を1文（30文字以内）で要約する。例：[GOAL:火・木の朝に10分散歩する]`;

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
// Netlify Functions の単一インスタンス内でのみ動作する best-effort 実装
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1分
const RATE_LIMIT_MAX_REQS = 20;          // 1分20リクエスト
const RATE_LIMIT_DAILY_MAX = 200;        // 1日200リクエスト
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
      error: rl.reason === 'daily'
        ? 'リクエスト数が1日の上限に達しました。明日また来てくださいね。'
        : '少し早すぎます。1分ほど時間をおいて再度お試しください。',
      retryAfter: rl.retryAfter
    }, { 'Retry-After': String(rl.retryAfter) });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return jsonResponse(500, { error: 'Server-side GEMINI_API_KEY not configured' });

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch (e) { return jsonResponse(400, { error: 'Invalid JSON' }); }

  const history  = Array.isArray(payload.history) ? payload.history : [];
  const userText = typeof payload.userText === 'string' ? payload.userText.trim() : '';
  if (!userText)            return jsonResponse(400, { error: 'userText is required' });
  if (userText.length > 2000) return jsonResponse(400, { error: 'userText too long (max 2000)' });

  // 危機キーワード検知 → Geminiを呼ばずに即時応答
  if(detectCrisis(userText)){
    return jsonResponse(200, { text: CRISIS_REPLY, crisis: true });
  }

  const trimmed = history.slice(-40).filter(
    (m) => m && (m.role === 'user' || m.role === 'model') && typeof m.text === 'string'
  );
  const contents = trimmed.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: String(m.text).slice(0, 2000) }],
  }));

  // ユーザーコンテキスト連結
  const ctx = payload.context || null;
  let systemAddendum = '';
  if(ctx && typeof ctx === 'object'){
    const lines = ['【参考：いまのプレイヤーの状態（あくまで参考情報）】'];
    if(ctx.weekNum)             lines.push(`・参加開始から${ctx.weekNum}週目`);
    if(ctx.cls)                 lines.push(`・選択クラス: ${ctx.cls}`);
    if(ctx.streak)              lines.push(`・連続記録: ${ctx.streak}日`);
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
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE'    },
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

    // 出力チェック：応答に危機キーワードが混入していないか
    if(detectCrisis(raw)){
      raw = `ごめんなさい、いまは少し言葉に詰まってしまいました…。\n\nもしつらい気持ちがあれば、よりそいホットライン (0120-279-338・24時間無料) でも話を聞いてもらえますよ。\n\nもう一度、気持ちを聞かせてくれますか？\n[STEP:R]`;
    }

    return jsonResponse(200, { text: raw });
  } catch (e) {
    return jsonResponse(502, { error: 'Fetch failed', detail: String(e?.message || e).slice(0, 500) });
  }
};
