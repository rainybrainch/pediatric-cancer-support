// ヴィタリア 高強度クエスト
// 6.0～11.0 METs（WHO推奨の高強度範囲）
// 小児がん経験者向けに計画的に配置
//
// 設計思想：
// - 1タップ = 10分固定
// - 中強度の2倍換算（10分実施 = 中強度20分相当）
// - 医師の許可が得られた人向けの高強度運動

const HIGH_INTENSITY_QUESTS = [
  {
    id: 'bike-fast',
    icon: '🚴',
    label: '速い自転車',
    mets: 6.0,
    defaultMinutes: 10,
    description: '速度を上げた自転車こぎ'
  },
  {
    id: 'hill-walk',
    icon: '⛰️',
    label: '坂道ウォーキング',
    mets: 6.5,
    defaultMinutes: 10,
    description: '坂道での歩行'
  },
  {
    id: 'jog-light',
    icon: '🏃‍♂️',
    label: '軽いジョギング',
    mets: 6.8,
    defaultMinutes: 10,
    description: 'ゆっくり~中程度のジョギング'
  },
  {
    id: 'jog-normal',
    icon: '🏃',
    label: 'ジョギング',
    mets: 7.0,
    defaultMinutes: 10,
    description: '通常のペースのジョギング'
  },
  {
    id: 'swim-light',
    icon: '🏊',
    label: '水泳',
    mets: 7.3,
    defaultMinutes: 10,
    description: '軽～中程度の泳ぎ'
  },
  {
    id: 'run-normal',
    icon: '⚡',
    label: 'ランニング',
    mets: 8.0,
    defaultMinutes: 10,
    description: '通常のペースで走る'
  },
  {
    id: 'jump-rope',
    icon: '🪢',
    label: '縄跳び',
    mets: 8.3,
    defaultMinutes: 10,
    description: '継続的な縄跳び'
  },
  {
    id: 'swim-strong',
    icon: '🌊',
    label: '水泳（強め）',
    mets: 9.0,
    defaultMinutes: 10,
    description: 'しっかり泳ぐ水泳'
  },
  {
    id: 'run-fast',
    icon: '🔥',
    label: '速いランニング',
    mets: 9.8,
    defaultMinutes: 10,
    description: '速いペースで走る'
  },
  {
    id: 'stairs-continuous',
    icon: '🪜',
    label: '階段昇降',
    mets: 10.0,
    defaultMinutes: 10,
    description: '階段をリズミカルに上り下り'
  },
  {
    id: 'aerobic-intense',
    icon: '💥',
    label: '激しいエアロビクス',
    mets: 10.3,
    defaultMinutes: 10,
    description: '高強度のエアロビクス'
  },
  {
    id: 'interval-training',
    icon: '🚀',
    label: 'インターバルトレーニング',
    mets: 11.0,
    defaultMinutes: 10,
    description: '高強度と低強度の交互'
  }
];

/**
 * 高強度クエストボタンを1タップした場合の計算
 * @param {Object} quest - クエストオブジェクト
 * @param {number} taps - タップ回数（デフォルト1）
 * @returns {Object} {metsTime, vitality, minutes, equivalentModerateMinutes}
 */
function calculateHighIntensityQuestReward(quest, taps = 1) {
  const totalMinutes = quest.defaultMinutes * taps;
  const hours = totalMinutes / 60;
  const metsTime = parseFloat((quest.mets * hours).toFixed(2));
  const vitality = Math.round(metsTime * 100); // 1 METs・時 = 100 Vitality

  // 中強度の2倍換算：高強度10分 = 中強度20分相当
  // （例：9 METs × 10分 = 1.5 METs・時、中強度3 METs × 20分 = 1.0 METs・時）
  // 高強度はより効率的なため、METs値が高いことで自動的に反映される
  const equivalentModerateMinutes = totalMinutes * 2;

  return {
    minutes: totalMinutes,
    metsTime: metsTime,
    vitality: vitality,
    equivalentModerateMinutes: equivalentModerateMinutes,
    displayText: `${quest.label} ${totalMinutes}分 = ${metsTime} METs・時 = ${vitality} Vitality（中強度${equivalentModerateMinutes}分相当）`
  };
}

/**
 * 複数の高強度クエストをタップした場合の合計を計算
 * @param {Array} questsWithTaps - [{quest, taps}, ...]
 * @returns {Object} {totalMinutes, totalMetsTime, totalVitality, totalEquivalentModerateMinutes}
 */
function calculateHighIntensityTotalReward(questsWithTaps) {
  let totalMinutes = 0;
  let totalMetsTime = 0;
  let totalVitality = 0;
  let totalEquivalentModerateMinutes = 0;

  questsWithTaps.forEach(({ quest, taps }) => {
    const reward = calculateHighIntensityQuestReward(quest, taps);
    totalMinutes += reward.minutes;
    totalMetsTime += reward.metsTime;
    totalVitality += reward.vitality;
    totalEquivalentModerateMinutes += reward.equivalentModerateMinutes;
  });

  return {
    totalMinutes: totalMinutes,
    totalMetsTime: parseFloat(totalMetsTime.toFixed(2)),
    totalVitality: totalVitality,
    totalEquivalentModerateMinutes: totalEquivalentModerateMinutes
  };
}

/**
 * 高強度クエストを取得
 * @param {string} questId - クエストID
 * @returns {Object|null}
 */
function getHighIntensityQuest(questId) {
  return HIGH_INTENSITY_QUESTS.find(q => q.id === questId) || null;
}

/**
 * すべての高強度クエストを取得
 * @returns {Array}
 */
function getAllHighIntensityQuests() {
  return HIGH_INTENSITY_QUESTS;
}
