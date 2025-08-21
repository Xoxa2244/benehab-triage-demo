// lib/profiling/attitude.js

/**
 * Рассчитывает профиль отношения к болезни на основе ответов
 * @param {Array} answers - массив ответов [0,1,2] для 41 вопроса
 * @param {Object} thresholds - пороговые значения для шкал
 * @returns {Object} профиль с raw scores, levels, risk_tags и comm_flags
 */
export function calculateAttitudeProfile(answers, thresholds) {
  if (!answers || answers.length !== 41) {
    throw new Error('Необходимо 41 ответ для расчета профиля');
  }

  // Определяем вопросы для каждой шкалы
  const scaleQuestions = {
    severity: [1, 7, 21, 29, 37],
    trust: [2, 23, 31],
    alt_med: [3, 13],
    work_escape: [4],
    family_support: [5, 25, 33, 41],
    info_seeking: [6, 18, 22, 26, 28, 30, 34, 36, 38, 40],
    fear_progression: [7, 15],
    effectiveness: [8],
    avoidance: [9, 19, 27, 35]
  };

  // Рассчитываем сырые баллы для каждой шкалы
  const raw = {};
  Object.keys(scaleQuestions).forEach(scale => {
    const questions = scaleQuestions[scale];
    let score = 0;
    
    questions.forEach(qIndex => {
      const answer = answers[qIndex - 1]; // ответы нумеруются с 1
      if (answer !== undefined && answer !== null) {
        score += answer;
      }
    });
    
    raw[scale] = score;
  });

  // Определяем уровни для каждой шкалы
  const levels = {};
  Object.keys(raw).forEach(scale => {
    const score = raw[scale];
    const threshold = thresholds[scale];
    
    if (score <= threshold.low_max) {
      levels[scale] = 'low';
    } else if (score <= threshold.med_max) {
      levels[scale] = 'medium';
    } else {
      levels[scale] = 'high';
    }
  });

  // Генерируем risk_tags на основе уровней
  const risk_tags = [];
  if (levels.alt_med === 'high') risk_tags.push('alt_medicine_pref');
  if (levels.work_escape === 'high') risk_tags.push('work_overload');
  if (levels.severity === 'high') risk_tags.push('depression_risk_check');
  if (levels.trust === 'high') risk_tags.push('trust_issues');
  if (levels.avoidance === 'high') risk_tags.push('medical_avoidance');
  if (levels.family_support === 'high') risk_tags.push('family_conflict');
  if (levels.fear_progression === 'high') risk_tags.push('progression_fear');

  // Генерируем comm_flags для коммуникации
  const comm_flags = [];
  if (levels.severity === 'high') comm_flags.push('normalize_fears');
  if (levels.alt_med === 'high') comm_flags.push('explain_benefits');
  if (levels.avoidance === 'high') comm_flags.push('avoid_pressure');
  if (levels.info_seeking === 'high') comm_flags.push('provide_details');
  if (levels.trust === 'high') comm_flags.push('build_trust');
  if (levels.family_support === 'high') comm_flags.push('family_involvement');

  return {
    version: 'A/0.1',
    raw,
    levels,
    risk_tags,
    comm_flags
  };
}

/**
 * Загружает пороговые значения из CSV
 * @param {string} csvContent - содержимое CSV файла
 * @returns {Object} объект с пороговыми значениями
 */
export function parseThresholds(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  const thresholds = {};
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const scale = values[0];
    thresholds[scale] = {
      low_min: parseInt(values[1]),
      low_max: parseInt(values[2]),
      med_min: parseInt(values[3]),
      med_max: parseInt(values[4]),
      high_min: parseInt(values[5]),
      high_max: parseInt(values[6])
    };
  }
  
  return thresholds;
}
