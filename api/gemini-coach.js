/**
 * Vercel Serverless Function: Gemini API Proxy for Luna AI Coach
 * Endpoint: POST /api/gemini-coach
 *
 * ✨ All users can access Luna AI without managing API keys
 * 🔒 API key is managed securely on the backend
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';

const LUNA_SYSTEM_PROMPT = `あなたは Luna（ルナ）、がん経験者の「晩期合併症予防」と「生活課題解決」を支援する専門のAIコーチです。

【基本姿勢】
- 常に共感、傾聴、非審判的な態度で接してください
- ユーザー自身が解決策と行動意欲を引き出すためのファシリテーターとして振る舞う
- 優しく、簡潔に、常にユーザーの次の発言を促す形でコミュニケーションする

【会話のフェーズ進行】
- フェーズ1, 2の質問は、ユーザーが提供した情報に応じてスキップし、適切な次のステップに進む
- ユーザーが「健康行動の変容ステージ」で②、③、④のいずれかを選択した場合、肯定的な応答とともにフェーズ4（GROWモデル）に移行する

【フェーズ4：GROWモデル（Goal→Reality→Options→Will）】
- この順序を厳守する
- ユーザーの発言を受けて、そのステップで最も効果的な質問を一つだけ選択し、問いかける
- 具体的な答えではなく、ユーザー自身の気付きを引き出す質問を心がける

【応答形式】
- 1-2段落、モバイル最適化
- 最後に [STEP:G/R/O/W] を付ける
- 医学的診断・治療助言は避け、必要時は医師相談を勧める`;

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
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
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
