// ヴィタリア 睡眠ポイント（SP）システム
// ルナ（Luna）が管理する睡眠・疲労回復
// 健康の基盤となる睡眠を支援

// 睡眠時間（推奨：7-9時間）
const SLEEP_DURATION_OPTIONS = [
  { id: 'sleep-1', label: '5時間以下', hours: 5, points: 1, description: '不十分（要改善）' },
  { id: 'sleep-2', label: '6時間', hours: 6, points: 2, description: 'やや不足' },
  { id: 'sleep-3', label: '7時間', hours: 7, points: 3, description: '推奨範囲内' },
  { id: 'sleep-4', label: '8時間', hours: 8, points: 3, description: '推奨範囲内' },
  { id: 'sleep-5', label: '9時間', hours: 9, points: 3, description: '推奨範囲内' },
  { id: 'sleep-6', label: '10時間以上', hours: 10, points: 2, description: 'やや過眠' }
];

// 睡眠の質（1-5段階）
const SLEEP_QUALITY_OPTIONS = [
  { id: 'quality-1', label: '悪い', value: 1, description: 'ほぼ眠れず / 何度も目覚めた' },
  { id: 'quality-2', label: 'やや悪い', value: 2, description: '浅く / 何度か目覚めた' },
  { id: 'quality-3', label: '普通', value: 3, description: '比較的安定' },
  { id: 'quality-4', label: 'やや良い', value: 4, description: '深くぐっすり' },
  { id: 'quality-5', label: '良い', value: 5, description: '非常に深く / 回復した' }
];

// 日次目標
const DAILY_SLEEP_TARGET = {
  duration: 8,      // 8時間推奨
  quality: 4        // 質4（やや良い以上）
};

// 総合評価基準
const SP_RATING = {
  poor: { range: [0, 3], label: '要回復', icon: '😴' },
  fair: { range: [4, 6], label: '良好', icon: '😊' },
  good: { range: [7, 8], label: '優秀', icon: '✨' },
  excellent: { range: [9, 10], label: '完璧', icon: '🌟' }
};

/**
 * 睡眠時間オプションを取得
 * @param {string} optionId - オプションID
 * @returns {Object|null}
 */
function getSleepDurationOption(optionId) {
  return SLEEP_DURATION_OPTIONS.find(o => o.id === optionId) || null;
}

/**
 * すべての睡眠時間オプションを取得
 * @returns {Array}
 */
function getAllSleepDurationOptions() {
  return SLEEP_DURATION_OPTIONS;
}

/**
 * 睡眠の質オプションを取得
 * @param {string} optionId - オプションID
 * @returns {Object|null}
 */
function getSleepQualityOption(optionId) {
  return SLEEP_QUALITY_OPTIONS.find(o => o.id === optionId) || null;
}

/**
 * すべての睡眠の質オプションを取得
 * @returns {Array}
 */
function getAllSleepQualityOptions() {
  return SLEEP_QUALITY_OPTIONS;
}

/**
 * Sleep Point (SP) 記録を保存
 * @param {string} uid - ユーザーID
 * @param {Object} spData - {durationHours, durationPoints, qualityValue, qualityPoints, totalSP}
 */
function saveSleepPoints(uid, spData) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `vn_sp_${uid}_${today}`;
    localStorage.setItem(key, JSON.stringify({
      ...spData,
      timestamp: new Date().toISOString()
    }));
  } catch (e) {
    console.warn('Failed to save sleep points:', e);
  }
}

/**
 * 本日のSP記録を取得
 * @param {string} uid
 * @returns {Object}
 */
function getTodaySleepPoints(uid) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `vn_sp_${uid}_${today}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {
        durationHours: 0,
        durationPoints: 0,
        qualityValue: 0,
        qualityPoints: 0,
        totalSP: 0
      };
    }
    return JSON.parse(raw);
  } catch (e) {
    return {
      durationHours: 0,
      durationPoints: 0,
      qualityValue: 0,
      qualityPoints: 0,
      totalSP: 0
    };
  }
}

/**
 * SPをVitalityに変換
 * 睡眠時間 + 質 の合計を Vitality に変換
 * @param {Object} spData - {durationPoints, qualityPoints}
 * @returns {number} 総Vitality（最大300pt）
 */
function calculateVitalityFromSleep(spData) {
  // duration: 最大3pt、quality: 最大5pt
  // 合計最大8pt → 最大300pt（100pt/1pt換算）
  const totalSP = (spData.durationPoints || 0) + (spData.qualityPoints || 0);
  return Math.round((totalSP / 8) * 300);
}

/**
 * 睡眠スコア（0-10）を計算
 * @param {Object} spData - {durationPoints, qualityPoints}
 * @returns {number} 0-10スケール
 */
function calculateSleepScore(spData) {
  const totalPoints = (spData.durationPoints || 0) + (spData.qualityPoints || 0);
  return Math.round((totalPoints / 8) * 10);
}

/**
 * SPの総合評価を取得
 * @param {number} sleepScore - 0-10スケール
 * @returns {Object} {label, icon, range}
 */
function getSPRating(sleepScore) {
  if (sleepScore >= SP_RATING.excellent.range[0]) {
    return SP_RATING.excellent;
  } else if (sleepScore >= SP_RATING.good.range[0]) {
    return SP_RATING.good;
  } else if (sleepScore >= SP_RATING.fair.range[0]) {
    return SP_RATING.fair;
  } else {
    return SP_RATING.poor;
  }
}

/**
 * ルナ（睡眠AI）用：アドバイスメッセージ生成
 * @param {Object} spData - {durationHours, durationPoints, qualityValue, qualityPoints}
 * @returns {string}
 */
function generateLunaAdvice(spData) {
  const durationHours = spData.durationHours || 0;
  const qualityValue = spData.qualityValue || 0;
  const sleepScore = calculateSleepScore(spData);

  // 何も記録されていない
  if (durationHours === 0 && qualityValue === 0) {
    return '🌙 今日の睡眠を記録してみましょう。休息も大切な回復の一部です。';
  }

  // 完璧な睡眠
  if (durationHours >= 7 && qualityValue >= 4) {
    return '✨ 素晴らしい睡眠ですね！疲労がしっかり回復されています。この調子で続けてね。';
  }

  // 睡眠時間が不足
  if (durationHours <= 6) {
    return '😴 睡眠時間がやや不足していますね。7-9時間を心がけてみましょう。質の高い睡眠が体の回復につながります。';
  }

  // 睡眠時間が過剰
  if (durationHours >= 10) {
    return '🛌 睡眠時間が長めですね。からだが回復を必要としているのかもしれません。体調をチェックしてみてね。';
  }

  // 睡眠の質が低い
  if (qualityValue <= 2) {
    return '🌙 睡眠の質が低めのようです。寝る前のリラックスや寝室環境を工夫してみてはいかがでしょう？';
  }

  // 通常
  return '😊 睡眠のバランスが取れていますね。毎日の記録を続けることで、より良い睡眠習慣が築けます。';
}

/**
 * 睡眠記録の週間平均を取得
 * @param {string} uid
 * @returns {Object} {averageHours, averageQuality, averageScore}
 */
function getWeeklySleepAverage(uid) {
  const weekAverage = { duration: [], quality: [], scores: [] };

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    const key = `vn_sp_${uid}_${dateStr}`;
    const raw = localStorage.getItem(key);

    if (raw) {
      try {
        const data = JSON.parse(raw);
        weekAverage.duration.push(data.durationHours || 0);
        weekAverage.quality.push(data.qualityValue || 0);
        weekAverage.scores.push(calculateSleepScore(data));
      } catch (e) {
        // skip
      }
    }
  }

  const avgDuration = weekAverage.duration.length > 0
    ? (weekAverage.duration.reduce((a, b) => a + b, 0) / weekAverage.duration.length).toFixed(1)
    : 0;
  const avgQuality = weekAverage.quality.length > 0
    ? (weekAverage.quality.reduce((a, b) => a + b, 0) / weekAverage.quality.length).toFixed(1)
    : 0;
  const avgScore = weekAverage.scores.length > 0
    ? Math.round(weekAverage.scores.reduce((a, b) => a + b, 0) / weekAverage.scores.length)
    : 0;

  return {
    averageHours: parseFloat(avgDuration),
    averageQuality: parseFloat(avgQuality),
    averageScore: avgScore,
    recordedDays: weekAverage.scores.length
  };
}
