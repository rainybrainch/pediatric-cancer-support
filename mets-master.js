// ヴィタリア METs マスターテーブル
// 参考：厚生労働省 身体活動メッツ表

const METS_MASTER = [
  // 日常生活
  { category: '日常生活', name: '座る', mets: 1.0 },
  { category: '日常生活', name: '立つ', mets: 1.3 },
  { category: '日常生活', name: '家事（軽い）', mets: 2.5 },
  { category: '日常生活', name: '掃除機', mets: 3.3 },
  { category: '日常生活', name: '風呂掃除', mets: 3.5 },
  { category: '日常生活', name: '洗車', mets: 3.5 },
  { category: '日常生活', name: '階段を上る', mets: 6.0 },
  { category: '日常生活', name: '階段を下る', mets: 3.5 },

  // 歩行
  { category: '歩行', name: 'ゆっくり歩く', mets: 2.5 },
  { category: '歩行', name: '普通歩行', mets: 3.0 },
  { category: '歩行', name: '速歩き', mets: 4.0 },
  { category: '歩行', name: 'ハイキング', mets: 6.0 },

  // ストレッチ・ヨガ
  { category: 'ストレッチ', name: '軽いストレッチ', mets: 2.3 },
  { category: 'ストレッチ', name: 'ヨガ', mets: 2.5 },
  { category: 'ストレッチ', name: 'ラジオ体操', mets: 4.0 },

  // 筋トレ
  { category: '筋トレ', name: '軽い筋トレ', mets: 3.5 },
  { category: '筋トレ', name: '自重トレーニング', mets: 5.0 },
  { category: '筋トレ', name: '高強度筋トレ', mets: 6.0 },

  // 有酸素
  { category: '有酸素', name: 'エアロバイク', mets: 5.5 },
  { category: '有酸素', name: 'ダンス', mets: 5.0 },
  { category: '有酸素', name: '縄跳び', mets: 10.0 },

  // ランニング
  { category: 'ランニング', name: '軽いジョギング', mets: 7.0 },
  { category: 'ランニング', name: 'ランニング', mets: 8.5 },
  { category: 'ランニング', name: '速いランニング', mets: 10.0 },

  // 自転車
  { category: '自転車', name: 'ゆっくり', mets: 4.0 },
  { category: '自転車', name: '普通', mets: 6.0 },
  { category: '自転車', name: '速い', mets: 8.0 },

  // 水泳
  { category: '水泳', name: '軽く泳ぐ', mets: 6.0 },
  { category: '水泳', name: '普通に泳ぐ', mets: 8.0 },
  { category: '水泳', name: '競技レベル', mets: 10.0 }
];

// METs・時からVitalityへの換算
const METS_TIME_TO_VITALITY = 100; // 1 METs・時 = 100 Vitality

// METs・時を計算
function calculateMETsTime(mets, minutes) {
  const hours = minutes / 60;
  return (mets * hours).toFixed(2);
}

// VitalityPointを計算
function calculateVitality(metsTime) {
  return Math.round(metsTime * METS_TIME_TO_VITALITY);
}

// カテゴリ別にMETsを取得
function getMETsByCategory(category) {
  return METS_MASTER.filter(m => m.category === category);
}

// すべてのカテゴリを取得
function getAllCategories() {
  const categories = new Set();
  METS_MASTER.forEach(m => categories.add(m.category));
  return Array.from(categories);
}

// 活動名からMETs値を取得
function getMETSByName(name) {
  const activity = METS_MASTER.find(m => m.name === name);
  return activity ? activity.mets : null;
}
