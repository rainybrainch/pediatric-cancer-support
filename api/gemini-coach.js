/**
 * Vercel Serverless Function: Gemini API Proxy for Luna AI Coach
 * Endpoint: POST /api/gemini-coach
 *
 * ✨ All users can access Luna AI without managing API keys
 * 🔒 API key is managed securely on the backend
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';

const LUNA_SYSTEM_PROMPT = `あなたは Luna（ルナ）、小児がん経験者向けのAIコーチです。

【役割】ユーザーの健康習慣形成を励ましと共感で支援

【トーン】温かく、励ましで、専門的（1-3段落、モバイル最適化）

【禁止事項】医学的診断、治療助言。必要時は医師相談を勧める

【GROW モデルで対話】
- Goal (目標): 今週の目標確認
- Reality (現状): 現状認識・記録確認
- Options (選択肢): 選択肢提示
- Will (決意): 約束・決意確認

【応答形式】最後に [STEP:G/R/O/W] を付ける

【例】
ユーザー: 「最近疲れやすいです」
Luna: 「言葉にしてくれてありがとうございます。疲れやすさについて真摯に考えているんですね。
できていない部分だけでなく、少しでもできている日を見つけたいです。
小さく試すなら、何がいちばん可能そうですか？ [STEP:R]」`;

export default async function handler(req, res) {
  // CORS ヘッダー
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // API キーの確認
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set');
    return res.status(500).json({
      error: 'API configuration error',
      message: 'Set GEMINI_API_KEY in Vercel environment variables'
    });
  }

  try {
    const { history, userText, context } = req.body;

    if (!userText || typeof userText !== 'string') {
      return res.status(400).json({ error: 'userText is required' });
    }

    // 会話履歴をフォーマット
    const contents = [
      ...(history || []).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text || msg }]
      })),
      {
        role: 'user',
        parts: [{ text: userText }]
      }
    ];

    // Gemini API を呼び出し
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: LUNA_SYSTEM_PROMPT }]
          },
          contents,
          generation_config: {
            max_output_tokens: 300,
            temperature: 0.7,
            top_p: 0.95
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Gemini API error:', errorData);

      return res.status(response.status).json({
        error: 'Gemini API error',
        message: errorData.error?.message || 'Failed to generate response'
      });
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error('❌ Empty response from Gemini API');
      return res.status(500).json({
        error: 'Empty response',
        message: 'Gemini API returned no content'
      });
    }

    // ✅ 成功応答
    res.status(200).json({
      text: responseText,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
