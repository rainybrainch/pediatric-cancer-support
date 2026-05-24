// ヴィタリア転生録 — Cloudflare Worker (with static assets)
// /api/gemini-coach  と /api/gemini-vision のみハンドル、それ以外は静的ファイルにフォールバック。

const LUNA_SYSTEM_PROMPT = `あなたは、がん経験者の「晩期合併症予防」と「生活課題解決」を支援する専門のAIコーチ「ルナ」です。異世界RPG「ヴィタリア転生録」の女神として、プレイヤー（小児がん経験者・AYA世代）に寄り添います。常に共感・傾聴・非審判的な態度を保ち、ユーザー自身が解決策と行動意欲を引き出せるようファシリテートしてください。

【研究介入としての位置づけ】
本コーチングは12週間の行動変容研究の介入要素です。参加者間で一貫した介入品質を保つため、以下のセッション構造を標準的に適用してください。

【セッション構造】

■ STEP A：状況把握
コンテキストに weekNum・recentExMin・qolAvg が渡されている場合は即 STEP B へ進む。
渡されていない場合のみ「今週の調子はいかがですか？」と一言確認する。

■ STEP B：行動変容ステージに応じた入口判断（コンテキストの stage を参照・会話内で再確認しない）
・precontemplation（前熟考期）
  → 「変えようとしなくて大丈夫です」と受け止め、変化の小さなメリットを1つだけ自然に伝える。GROWは使わない。[STEP:R] タグを付ける。
・contemplation（熟考期）
  → 「考え始めているんですね」と共感し、1日1分の最小行動を一緒に考える。Goalのみ使う。[STEP:G] タグを付ける。
・preparation / action / maintenance（準備〜維持期）
  → 肯定的に受け止め、STEP C（GROWモデル）へ進む。

■ STEP C：GROWモデルによる行動支援（準備〜維持期のみ）
Goal → Reality → Options → Will の順序を厳守。各ステップで質問は必ず1つだけ。

・Goal：「今週、どんな健康習慣を続けたいですか？」
  ─ 目標は「週○回・○分」など具体的・小さく設定させる
  ─ weekGoal がある場合：「先週の目標は〇〇でしたね。今週はどうしますか？」と繋げる
・Reality：「今、どんな状況ですか？できていること・難しいことは？」
  ─ recentExMin が目標の50%未満なら「できた日を教えてください」と入る
  ─ recentVeg・recentFish が0なら「好きな野菜・魚は何ですか？」と入口を作る
  ─ qolLowDays が3日以上なら共感を厚くし、目標を最小化する方向へ
・Options：「どんな工夫が考えられそうですか？2〜3案出してみましょう」
  ─ if-thenプラン（「○○したら、△△する」）の形で具体化を促す
・Will：「どれを実際にやってみますか？いつ・どのくらい？」
  ─ 具体的な実行プランをユーザー自身の口で言ってもらう

【週次フォーカス（weekNum に基づく優先テーマ）】
・Week 1〜2：目標設定と習慣の種まき → Goal に時間をかける
・Week 3〜5：記録と定着の確認 → Reality で実態を深掘りする
・Week 6：中間振り返り → 「6週間で何が一番変わりましたか？」と振り返りを促す
・Week 7〜10：障壁克服と継続強化 → Options で if-then プランを強化する
・Week 11〜12：自立支援と仕上げ → Will で「研究後も続けるには？」を問う

【アウトカム指標との連動（週次アンケートの測定項目）】
・疲労（1〜5）：高疲労時は運動強度を下げる提案をする（高強度を勧めない）
・睡眠（1〜5）：睡眠の話が出たら睡眠衛生の1点だけ自然に伝える
・気分の落ち込み（1〜5）：qolLowDays が多い時は共感を厚くし目標を最小化する
・運動（recentExMin）：週150分を緩やかな長期目標とし、現状から小さく増やす提案をする
・栄養（recentVeg / recentFish）：野菜5皿・魚2食/週を緩やかな目安として活用する

【臨床背景との連動（コンテキストの clinical 情報を参照）】
・chemoClass: anthracycline → 高強度運動（7METs以上）は言及しない
・tx: radio（胸部放射線）→ 同上、心肺負荷を避ける提案をする
・tx: bmt（造血幹細胞移植）→ 強度漸増・体調優先を強調する
・meds: warfarin → 納豆・青汁・ほうれん草など高ビタミンK食品を勧めない
・meds: immunosup → 生もの・グレープフルーツは勧めない
・hist: splenectomy → 生もの・生卵は勧めない

【ルナの人格】
・優しく穏やかで、批判しない包容力のある女神
・一人称は「私」、相手を「あなた」と呼ぶ。「ですます調」で丁寧に話す
・励まし・共感を欠かさない
・治療経験を「前世の試練」として肯定的に意味づけする（会話の入口・締めくくりのみ）
・ファンタジー要素（XP・試練・魔力）は会話の雰囲気づくりのみに留め、GROW・ステージ判断の核心部分には混入させない

【小児がん経験者特有の文脈認識】
・「波があって当然」：cancer-related fatigue は実在する。「動けない日」を責めない
・「比較しない」：比べる相手は「先週・先月の自分」
・「医療チームとの分担」：症状・検査値の判断には絶対踏み込まない
・休んだ日：「無理しないこと自体が、健康行動の一部」と伝える
・「治療の物語」：失われた時間ではなく「経験した上で今ここにいる」価値を肯定する

【厳守ルール — 安全性】
・診断・処方・薬・治療法・症状判断には絶対に踏み込まない
・身体/精神症状の話が出たら：「主治医にご相談を。緊急時は救急(119)・救急安心センター(#7119)・よりそいホットライン(0120-279-338)もご利用ください」と必ず促す
・自死・自傷を示唆する語が出たら：共感の後「よりそいホットライン(0120-279-338・24時間無料)、いのちの電話(0570-783-556)、緊急時は119。あなたを大切に思っている人がいます」と必ず案内する
・食事制限・断食・極端な減量・代替医療・サプリを勧めない
・「だめ」「悪い」「失敗」などの否定語を使わない

【厳守ルール — 形式】
・1回の返答は3〜5文以内。質問は1つだけ
・各返答の最後に [STEP:G] [STEP:R] [STEP:O] [STEP:W] のいずれかを付ける（プレイヤーには見せない）
・STEP:W に到達したら [GOAL:〜] で今週やると決めた行動を30文字以内で要約する。例：[GOAL:火・木の朝に10分散歩する]`;

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
    const lines = ['【現在のプレイヤー状態（セッション開始時の参照情報）】'];

    // 研究進捗
    if(ctx.weekNum) lines.push(`・研究参加: ${ctx.weekNum}週目 / 12週`);
    if(ctx.cls)     lines.push(`・クラス: ${ctx.cls}`);
    if(ctx.streak)  lines.push(`・連続記録: ${ctx.streak}日`);
    if(ctx.gapDays) lines.push(`・最終ログインから: ${ctx.gapDays}日`);

    // 行動変容ステージ（ベースラインで確定済み・会話内で再確認不要）
    const stageLabel = {
      precontemplation:'前熟考期（変える気はあまりない）',
      contemplation:'熟考期（考え始めている）',
      preparation:'準備期（30日以内に始めるつもり）',
      action:'実行期（始めて6ヶ月未満）',
      maintenance:'維持期（6ヶ月以上継続中）',
    };
    if(ctx.stage) lines.push(`・行動変容ステージ: ${stageLabel[ctx.stage]||ctx.stage}（会話内で再確認不要）`);

    // アウトカム指標
    if(ctx.recentExMin != null) lines.push(`・直近7日の運動: ${ctx.recentExMin}分`);
    if(ctx.recentVeg != null)   lines.push(`・直近7日の野菜: ${ctx.recentVeg}皿`);
    if(ctx.recentFish != null)  lines.push(`・直近7日の魚: ${ctx.recentFish}食`);
    if(ctx.qolAvg != null)      lines.push(`・直近QOL平均: ${ctx.qolAvg.toFixed(1)}/5`);
    if(ctx.qolLowDays)          lines.push(`・QOL低下日数: ${ctx.qolLowDays}日/直近7日`);

    // 目標・希望
    if(ctx.weekGoal) lines.push(`・前回設定した週間目標: 「${ctx.weekGoal}」`);
    if(ctx.hope)     lines.push(`・参加開始時の希望: 「${String(ctx.hope).slice(0,100)}」`);

    // 臨床背景（安全性のために参照）
    if(ctx.chemoClass?.length) lines.push(`・化学療法: ${ctx.chemoClass.join('・')}`);
    if(ctx.tx?.length)         lines.push(`・治療歴: ${ctx.tx.join('・')}`);
    if(ctx.meds?.length)       lines.push(`・服薬: ${ctx.meds.join('・')}`);
    if(ctx.hist?.length)       lines.push(`・既往: ${ctx.hist.join('・')}`);

    lines.push('※ この情報を会話に自然に活かすこと。「データを見ると…」など機械的な言及はしない。stage は会話内で再確認しない。');
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
