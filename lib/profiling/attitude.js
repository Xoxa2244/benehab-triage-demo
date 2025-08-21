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

  // Определяем вопросы для каждой шкалы согласно инструкции GPT
  const scaleQuestions = {
    severity: [1, 2, 13, 23, 33], // 5 вопросов
    secondary_gain: [3, 14, 24, 34], // 4 вопроса
    hide_resist: [4, 15, 25, 35], // 4 вопроса
    work_escape: [5, 16, 26, 36], // 4 вопроса
    low_selfesteem: [6, 7, 17, 18, 27, 28, 37, 38], // 8 вопросов (4 обратных)
    alt_med: [8, 19, 29, 39], // 4 вопроса
    addictions: [9, 10, 20, 30, 40], // 5 вопросов (5 обратных)
    ignore: [11, 21, 31, 41], // 4 вопроса
    anxiety: [12, 22, 32] // 3 вопроса
  };

  // Рассчитываем сырые баллы для каждой шкалы
  const raw = {};
  Object.keys(scaleQuestions).forEach(scale => {
    const questions = scaleQuestions[scale];
    let score = 0;
    
    questions.forEach(qIndex => {
      const answer = answers[qIndex - 1]; // ответы нумеруются с 1
      if (answer !== undefined && answer !== null) {
        // Получаем информацию об обратном пункте
        const itemIndex = qIndex - 1;
        const isReverse = getItemReverse(itemIndex);
        
        if (isReverse) {
          // Для обратных пунктов: 0→2, 1→1, 2→0
          score += (2 - answer);
        } else {
          // Для обычных пунктов: просто добавляем ответ
          score += answer;
        }
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

  // Генерируем risk_tags на основе уровней согласно инструкции
  const risk_tags = [];
  if (levels.severity === 'high') risk_tags.push('suicide_risk', 'depression_risk');
  if (levels.secondary_gain === 'high') risk_tags.push('secondary_gain_flag');
  if (levels.hide_resist === 'high') risk_tags.push('treatment_resistance');
  if (levels.work_escape === 'high') risk_tags.push('work_overload');
  if (levels.low_selfesteem === 'high') risk_tags.push('depression_risk');
  if (levels.alt_med === 'high') risk_tags.push('alt_medicine_pref');
  if (levels.addictions === 'high') risk_tags.push('substance_abuse');
  if (levels.ignore === 'high') risk_tags.push('treatment_avoidance');
  if (levels.anxiety === 'high') risk_tags.push('high_anxiety');

  // Генерируем comm_flags для коммуникации
  const comm_flags = [];
  if (levels.severity === 'high') comm_flags.push('crisis_intervention', 'gentle_approach');
  if (levels.secondary_gain === 'high') comm_flags.push('address_underlying_issues');
  if (levels.hide_resist === 'high') comm_flags.push('build_trust', 'avoid_stigma');
  if (levels.work_escape === 'high') comm_flags.push('work_life_balance');
  if (levels.low_selfesteem === 'high') comm_flags.push('positive_reinforcement');
  if (levels.alt_med === 'high') comm_flags.push('evidence_based_education');
  if (levels.addictions === 'high') comm_flags.push('addiction_support');
  if (levels.ignore === 'high') comm_flags.push('treatment_importance');
  if (levels.anxiety === 'high') comm_flags.push('anxiety_management');

  return {
    version: 'A/0.2',
    raw,
    levels,
    risk_tags,
    comm_flags
  };
}

/**
 * Получает информацию об обратном пункте
 * @param {number} itemIndex - индекс вопроса (0-40)
 * @returns {boolean} true если пункт обратный
 */
function getItemReverse(itemIndex) {
  // Список обратных пунктов согласно CSV
  const reverseItems = [6, 7, 8, 9, 10, 17, 18, 19, 20, 27, 28, 29, 30, 37, 38, 39, 40];
  return reverseItems.includes(itemIndex + 1); // +1 потому что itemIndex начинается с 0
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
