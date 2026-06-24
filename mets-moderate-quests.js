// ヴィタリア 中強度クエスト
// 3.0～5.9 METs（WHO推奨の中強度範囲）
// 小児がん経験者向けにシンプル設計

const MODERATE_QUESTS = [
  {
    id: 'walk-normal',
    icon: '🚶',
    label: '普通歩行',
    mets: 3.0,
    defaultMinutes: 10,
    description: '通常のペースで歩く'
  },
  {
    id: 'bike-light',
    icon: '🚲',
    label: '軽い自転車',
    mets: 3.5,
    defaultMinutes: 10,
    description: 'ゆっくり漕ぐ自転車'
  },
  {
    id: 'walk-medium',
    icon: '🚶‍♂️',
    label: '少し速い歩行',
    mets: 3.8,
    defaultMinutes: 10,
    description: '普通より少し早いペース'
  },
  {
    id: 'walk-fast',
    icon: '⚡',
    label: '速歩き',
    mets: 4.0,
    defaultMinutes: 10,
    description: '少し頑張った歩行'
  },
  {
    id: 'radio-taiso',
    icon: '📻',
    label: 'ラジオ体操',
    mets: 4.3,
    defaultMinutes: 10,
    description: 'NHK ラジオ体操'
  },
  {
    id: 'dog-walk',
    icon: '🐕',
    label: '犬の散歩',
    mets: 4.5,
    defaultMinutes: 10,
    description: 'ペットとの散歩'
  },
  {
    id: 'dance-light',
    icon: '💃',
    label: '軽いダンス',
    mets: 4.8,
    defaultMinutes: 10,
    description: 'ゆっくりなダンス'
  },
  {
    id: 'strength-light',
    icon: '💪',
    label: '軽い筋トレ',
    mets: 5.0,
    defaultMinutes: 10,
    description: '自重運動やダンベル'
  },
  {
    id: 'hiking',
    icon: '🏞️',
    label: 'ハイキング',
    mets: 5.3,
    defaultMinutes: 10,
    description: 'ゆっくりなハイキング'
  },
  {
    id: 'aerobic-light',
    icon: '🏃',
    label: 'エアロビクス',
    mets: 5.5,
    defaultMinutes: 10,
    description: 'リズムに合わせた運動'
  }
];

// 高強度クエスト（将来実装用）
const HIGH_INTENSITY_QUESTS = [
  // 6.0～11.0 METs
  // 例：ジョギング、ランニング、激しいダンス等
];

/**
 * クエストボタンを1タップした場合の計算
 * @param {Object} quest - クエストオブジェクト
 * @param {number} taps - タップ回数（デフォルト1）
 * @returns {Object} {metsTime, vitality, minutes}
 */
function calculateQuestReward(quest, taps = 1) {
  const totalMinutes = quest.defaultMinutes * taps;
  const hours = totalMinutes / 60;
  const metsTime = parseFloat((quest.mets * hours).toFixed(2));
  const vitality = Math.round(metsTime * 100); // 1 METs・時 = 100 Vitality

  return {
    minutes: totalMinutes,
    metsTime: metsTime,
    vitality: vitality,
    displayText: `${quest.label} ${totalMinutes}分 = ${metsTime} METs・時 = ${vitality} Vitality`
  };
}

/**
 * 複数回タップした場合の合計を計算
 * @param {Array} questsWithTaps - [{quest, taps}, ...]
 * @returns {Object} {totalMinutes, totalMetsTime, totalVitality}
 */
function calculateTotalReward(questsWithTaps) {
  let totalMinutes = 0;
  let totalMetsTime = 0;
  let totalVitality = 0;

  questsWithTaps.forEach(({ quest, taps }) => {
    const reward = calculateQuestReward(quest, taps);
    totalMinutes += reward.minutes;
    totalMetsTime += reward.metsTime;
    totalVitality += reward.vitality;
  });

  return {
    totalMinutes: totalMinutes,
    totalMetsTime: parseFloat(totalMetsTime.toFixed(2)),
    totalVitality: totalVitality
  };
}

/**
 * クエストを取得
 * @param {string} questId - クエストID
 * @returns {Object|null}
 */
function getQuest(questId) {
  return MODERATE_QUESTS.find(q => q.id === questId) || null;
}

/**
 * すべてのクエストを取得
 * @returns {Array}
 */
function getAllQuests() {
  return MODERATE_QUESTS;
}
