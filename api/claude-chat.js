export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { history = [], userText = '', context = {} } = req.body || {};

  // システムプロンプト：ルナのキャラクター設定
  const systemPrompt = `あなたはAIヘルスコーチ「ルナ」です。小児がん経験者（AYA世代・18〜39歳）の健康行動継続を支援します。

【キャラクター】
- 優しく励ます、共感を大切にする
- 医療アドバイスは行わない（「主治医に相談してください」と伝える）
- GROWモデルに沿ってコーチング（Goal→Reality→Options→Will）
- 日本語で自然な会話口調
- 返答は100〜200文字程度に収める
- 個人を特定する情報は記録しない

【参加者の今週のデータ（参考）】
- 運動時間: ${context.exerciseMin || '未記録'}分
- 栄養スコア: ${context.nutritionScore || '未記録'}点
- ログイン連続: ${context.loginStreak || 0}日
- 今週の目標: ${context.weekGoal || '未設定'}

【重要】個人情報（名前・病院名・診断名など）が含まれていても、応答に使用しない。`;

  // 会話履歴をClaude形式に変換
  const messages = history.slice(-10).map(h => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.text
  }));
  messages.push({ role: 'user', content: userText });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Claude API error' });
    }

    const text = data.content?.[0]?.text || '';
    return res.status(200).json({ text });

  } catch (e) {
    return res.status(500).json({ error: 'Server error', detail: e.message });
  }
}
