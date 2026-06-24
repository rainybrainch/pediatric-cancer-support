// ヴィタリア 栄養ポイント（NP）システム
// METs・時システムと対称的な設計
// 8つの栄養カテゴリー × 1-4ポイント方式

const NUTRITION_QUESTS = {
  // 🥬 野菜（目標：350g/日）
  vegetable: [
    { id: 'veg-1', label: '少量', points: 1, description: 'サラダ少し、トマト数個' },
    { id: 'veg-2', label: '1皿', points: 2, description: 'サラダ1皿' },
    { id: 'veg-3', label: '多め', points: 3, description: '野菜たっぷり定食' },
    { id: 'veg-4', label: 'かなり多い', points: 4, description: '350g近く摂取' }
  ],

  // 🥩 タンパク質（目標：毎食1品）
  protein: [
    { id: 'pro-1', label: '少量', points: 1, description: '卵1個' },
    { id: 'pro-2', label: '普通', points: 2, description: '鶏肉100g' },
    { id: 'pro-3', label: '多め', points: 3, description: '肉魚＋卵' },
    { id: 'pro-4', label: '高タンパク', points: 4, description: 'プロテイン含む' }
  ],

  // 💧 水分補給（目標：1.5〜2L）
  water: [
    { id: 'wat-1', label: 'コップ1杯', points: 1, description: '約200ml' },
    { id: 'wat-2', label: '500ml', points: 2, description: 'ペットボトル半分' },
    { id: 'wat-3', label: '1L', points: 3, description: '1000ml' },
    { id: 'wat-4', label: '1.5L以上', points: 4, description: '推奨量達成' }
  ],

  // 🍎 果物（目標：200g程度）
  fruit: [
    { id: 'fru-1', label: '少量', points: 1, description: 'みかん1個' },
    { id: 'fru-2', label: '普通', points: 2, description: 'バナナ1本' },
    { id: 'fru-3', label: '多め', points: 3, description: '果物2〜3種類' },
    { id: 'fru-4', label: '目標達成', points: 4, description: '200g以上' }
  ],

  // 🌾 食物繊維（目標：20g以上）
  fiber: [
    { id: 'fib-1', label: '少量', points: 1, description: '野菜少し' },
    { id: 'fib-2', label: '普通', points: 2, description: '野菜＋海藻' },
    { id: 'fib-3', label: '多め', points: 3, description: '豆類追加' },
    { id: 'fib-4', label: 'かなり良い', points: 4, description: '野菜・豆・海藻' }
  ],

  // 🍚 主食（目標：適量摂取）
  grains: [
    { id: 'gra-1', label: '少量', points: 1, description: '小盛り' },
    { id: 'gra-2', label: '普通', points: 2, description: '茶碗1杯' },
    { id: 'gra-3', label: '活動量多い', points: 3, description: '大盛り' },
    { id: 'gra-4', label: '適切管理', points: 4, description: '活動量に応じて調整' }
  ],

  // 🥛 乳製品（目標：カルシウム補給）
  dairy: [
    { id: 'dai-1', label: '少量', points: 1, description: 'チーズ' },
    { id: 'dai-2', label: '普通', points: 2, description: '牛乳1杯' },
    { id: 'dai-3', label: '多め', points: 3, description: 'ヨーグルト＋牛乳' },
    { id: 'dai-4', label: '十分', points: 4, description: '推奨量達成' }
  ],

  // 🍬 間食管理（目標：摂りすぎ防止）
  snack: [
    { id: 'snk-0', label: '食べ過ぎ', points: 0, description: '控えたい' },
    { id: 'snk-1', label: '普通', points: 1, description: '普通程度' },
    { id: 'snk-2', label: '控えめ', points: 2, description: '控えめに摂取' },
    { id: 'snk-3', label: '理想的', points: 3, description: '理想的に管理' }
  ]
};

// 日次目標（各カテゴリーの理想値）
const DAILY_NP_TARGET = {
  vegetable: 4,   // 野菜350g相当
  protein: 4,     // 毎食1品程度
  water: 4,       // 1.5〜2L目標
  fruit: 4,       // 果物200g相当
  fiber: 4,       // 食物繊維20g以上
  grains: 3,      // 適量摂取
  dairy: 3,       // カルシウム補給
  snack: 2        // 控えめな間食管理
};

// 総合評価基準
const NP_RATING = {
  poor: { range: [0, 9], label: '要改善', icon: '⚠️' },
  fair: { range: [10, 15], label: '良好', icon: '✅' },
  good: { range: [16, 20], label: '優秀', icon: '⭐' },
  excellent: { range: [21, 32], label: '理想的', icon: '🌟' }
};

/**
 * クエストを取得
 * @param {string} category - 'vegetable', 'protein', 'water', 'fruit', 'fiber', 'grains', 'dairy', 'snack'
 * @param {string} questId - クエストID
 * @returns {Object|null}
 */
function getNutritionQuest(category, questId) {
  if (!NUTRITION_QUESTS[category]) return null;
  return NUTRITION_QUESTS[category].find(q => q.id === questId) || null;
}

/**
 * カテゴリー内のすべてのクエストを取得
 * @param {string} category
 * @returns {Array}
 */
function getNutritionQuestsByCategory(category) {
  return NUTRITION_QUESTS[category] || [];
}

/**
 * すべてのカテゴリーを取得
 * @returns {Array} ['vegetable', 'protein', 'water', 'fruit', 'fiber', 'grains', 'dairy', 'snack']
 */
function getAllNutritionCategories() {
  return Object.keys(NUTRITION_QUESTS);
}

/**
 * カテゴリーのラベルを取得
 * @param {string} category
 * @returns {Object} {icon, label}
 */
function getCategoryLabel(category) {
  const labels = {
    vegetable: { icon: '🥬', label: '野菜' },
    protein: { icon: '🥩', label: 'タンパク質' },
    water: { icon: '💧', label: '水分' },
    fruit: { icon: '🍎', label: '果物' },
    fiber: { icon: '🌾', label: '食物繊維' },
    grains: { icon: '🍚', label: '主食' },
    dairy: { icon: '🥛', label: '乳製品' },
    snack: { icon: '🍬', label: '間食' }
  };
  return labels[category] || { icon: '❓', label: category };
}

/**
 * Nutrition Point (NP) 記録を保存
 * @param {string} uid - ユーザーID
 * @param {Object} npData - {vegetable: 3, protein: 2, water: 4, fruit: 2, fiber: 3, grains: 2, dairy: 1, snack: 2}
 */
function saveNutritionPoints(uid, npData) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `vn_np_${uid}_${today}`;
    localStorage.setItem(key, JSON.stringify({
      ...npData,
      timestamp: new Date().toISOString()
    }));
  } catch (e) {
    console.warn('Failed to save nutrition points:', e);
  }
}

/**
 * 本日のNP記録を取得
 * @param {string} uid
 * @returns {Object}
 */
function getTodayNutritionPoints(uid) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `vn_np_${uid}_${today}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {
        vegetable: 0,
        protein: 0,
        water: 0,
        fruit: 0,
        fiber: 0,
        grains: 0,
        dairy: 0,
        snack: 0
      };
    }
    return JSON.parse(raw);
  } catch (e) {
    return {
      vegetable: 0,
      protein: 0,
      water: 0,
      fruit: 0,
      fiber: 0,
      grains: 0,
      dairy: 0,
      snack: 0
    };
  }
}

/**
 * NPをVitalityに変換
 * 総NP合計を Vitality に変換
 * @param {Object} npData
 * @returns {number} 総Vitality（最大320pt = 8カテゴリー × 40）
 */
function calculateVitalityFromNutrition(npData) {
  let totalNP = 0;
  getAllNutritionCategories().forEach(category => {
    totalNP += (npData[category] || 0);
  });
  // NP合計から Vitality を計算（最大320pt）
  // 総目標NP = 26（vegetable4+protein4+water4+fruit4+fiber4+grains3+dairy3+snack2）
  const maxTarget = Object.values(DAILY_NP_TARGET).reduce((a, b) => a + b, 0);
  const ratio = Math.min(1, totalNP / maxTarget);
  return Math.round(ratio * 320);
}

/**
 * 総NP値を取得
 * @param {Object} npData
 * @returns {number}
 */
function getTotalNP(npData) {
  return Object.values(npData).reduce((sum, p) => sum + p, 0);
}

/**
 * NPの総合評価を取得
 * @param {number} totalNP
 * @returns {Object} {label, icon, range}
 */
function getNPRating(totalNP) {
  if (totalNP >= NP_RATING.excellent.range[0]) {
    return NP_RATING.excellent;
  } else if (totalNP >= NP_RATING.good.range[0]) {
    return NP_RATING.good;
  } else if (totalNP >= NP_RATING.fair.range[0]) {
    return NP_RATING.fair;
  } else {
    return NP_RATING.poor;
  }
}

/**
 * サラ（栄養AI）用：不足カテゴリー分析
 * @param {Object} npData
 * @returns {Array} 不足カテゴリーのリスト（多い順）
 */
function analyzeNutritionDeficiency(npData) {
  const deficient = [];
  getAllNutritionCategories().forEach(category => {
    const points = npData[category] || 0;
    const target = DAILY_NP_TARGET[category];
    if (points < target) {
      deficient.push({
        category: category,
        current: points,
        target: target,
        deficit: target - points,
        label: getCategoryLabel(category)
      });
    }
  });
  return deficient.sort((a, b) => b.deficit - a.deficit);
}

/**
 * サラ（栄養AI）のアドバイスメッセージ生成
 * 不足カテゴリーを見て、最初に出すアドバイスを決める
 * @param {Object} npData
 * @returns {string}
 */
function generateSaraAdvice(npData) {
  const totalNP = getTotalNP(npData);
  const deficient = analyzeNutritionDeficiency(npData);

  // すべて達成
  if (deficient.length === 0) {
    return '🌟 素晴らしい！今日の栄養バランスは理想的です。この調子で続けてね！';
  }

  // 最も不足している1つを提案
  const worst = deficient[0];
  const { icon, label } = worst.label;

  const adviceMap = {
    vegetable: `${icon} ${label}をもう一品追加できたら、栄養バランスが良くなりますよ。`,
    protein: `${icon} ${label}を意識してみましょう。卵や肉・魚など、筋肉や体力回復に大切です。`,
    water: `${icon} ${label}がまだ足りませんね。コップ1杯、水やお茶を飲んでみましょう！`,
    fruit: `${icon} ${label}も大切です。みかんやバナナなど、今食べやすい果物はありますか？`,
    fiber: `${icon} ${label}はお腹の健康に大切。野菜や豆類、海藻がおすすめです。`,
    grains: `${icon} ${label}の量を確認してみましょう。活動量に応じた適量摂取が大切です。`,
    dairy: `${icon} ${label}を意識してみましょう。牛乳やヨーグルトでカルシウムを補給できます。`,
    snack: `${icon} ${label}を少し控えめにしてみましょう。その分、栄養のある食事に充てるといいですよ。`
  };

  return adviceMap[worst.category] || '栄養バランスを大切にしてね！';
}
