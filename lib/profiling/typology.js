// lib/profiling/typology.js

/**
 * Рассчитывает типологический профиль на основе ответов
 * @param {Array} answers - массив ответов [0,1] для 56 вопросов
 * @param {Object} thresholds - пороговые значения
 * @returns {Object} профиль с scores, dominant types и tone_mods
 */
export function calculateTypologyProfile(answers, thresholds) {
  if (!answers || answers.length !== 56) {
    throw new Error('Необходимо 56 ответов для расчета профиля');
  }

  // Определяем вопросы для каждого столбца
  const columnQuestions = {
    sensitive: [1, 2, 3, 4, 5, 6, 7],
    dysthymic: [8, 9, 10, 11, 12, 13, 14],
    demonstrative: [15, 16, 17, 18, 19, 20, 21],
    unstable: [22, 23, 24, 25, 26, 27, 28],
    anxious: [29, 30, 31, 32, 33, 34, 35],
    pedantic: [36, 37, 38, 39, 40, 41, 42],
    exalted: [43, 44, 45, 46, 47, 48, 49],
    emotive: [50, 51, 52, 53, 54, 55, 56]
  };

  // Рассчитываем баллы для каждого столбца
  const scores = {};
  Object.keys(columnQuestions).forEach(column => {
    const questions = columnQuestions[column];
    let score = 0;
    
    questions.forEach(qIndex => {
      const answer = answers[qIndex - 1]; // ответы нумеруются с 1
      if (answer === 1) {
        score++;
      }
    });
    
    scores[column] = score;
  });

  // Определяем доминирующие типы
  const minScore = thresholds.minScoreDominant || 5;
  const margin = thresholds.margin || 1;
  const dominant = [];

  Object.keys(scores).forEach(column => {
    const score = scores[column];
    if (score >= minScore) {
      // Проверяем, что этот тип на margin баллов выше соседних
      let isDominant = true;
      Object.keys(scores).forEach(otherColumn => {
        if (otherColumn !== column) {
          if (scores[otherColumn] >= score - margin) {
            isDominant = false;
          }
        }
      });
      
      if (isDominant) {
        dominant.push(column);
      }
    }
  });

  // Генерируем tone_mods на основе доминирующих типов
  const tone_mods = generateToneMods(dominant, scores);

  return {
    version: 'B/0.1',
    scores,
    dominant,
    tone_mods
  };
}

/**
 * Генерирует модификаторы тона на основе доминирующих типов
 * @param {Array} dominant - массив доминирующих типов
 * @param {Object} scores - баллы по всем типам
 * @returns {Object} объект с модификаторами тона
 */
function generateToneMods(dominant, scores) {
  const tone_mods = {
    tone: 'calm_supportive',
    session_length: 'medium',
    avoid: [],
    seek: []
  };

  // Модификаторы на основе доминирующих типов
  dominant.forEach(type => {
    switch (type) {
      case 'sensitive':
        tone_mods.tone = 'calm_supportive';
        tone_mods.session_length = 'short';
        tone_mods.avoid.push('pressure', 'rush', 'harsh_criticism');
        tone_mods.seek.push('recognize_fatigue', 'slow_pacing', 'gentle_approach');
        break;
      
      case 'dysthymic':
        tone_mods.tone = 'calm_supportive';
        tone_mods.session_length = 'short';
        tone_mods.avoid.push('pressure', 'rush', 'overwhelming_info');
        tone_mods.seek.push('patience', 'small_steps', 'encouragement');
        break;
      
      case 'demonstrative':
        tone_mods.tone = 'engaging_supportive';
        tone_mods.session_length = 'medium';
        tone_mods.avoid.push('boring_presentation', 'lack_of_attention');
        tone_mods.seek.push('recognition', 'interactive_approach', 'positive_feedback');
        break;
      
      case 'unstable':
        tone_mods.tone = 'stable_calm';
        tone_mods.session_length = 'short';
        tone_mods.avoid.push('sudden_changes', 'complex_decisions', 'pressure');
        tone_mods.seek.push('consistency', 'simple_choices', 'structure');
        break;
      
      case 'anxious':
        tone_mods.tone = 'reassuring_calm';
        tone_mods.session_length = 'short';
        tone_mods.avoid.push('uncertainty', 'pressure', 'overwhelming_info');
        tone_mods.seek.push('clarity', 'reassurance', 'step_by_step');
        break;
      
      case 'pedantic':
        tone_mods.tone = 'detailed_precise';
        tone_mods.session_length = 'longer';
        tone_mods.avoid.push('vagueness', 'incomplete_info', 'rushed_explanations');
        tone_mods.seek.push('full_info', 'structure', 'detailed_explanations');
        break;
      
      case 'exalted':
        tone_mods.tone = 'inspiring_supportive';
        tone_mods.session_length = 'medium';
        tone_mods.avoid.push('pessimism', 'boring_presentation');
        tone_mods.seek.push('positive_approach', 'inspiration', 'enthusiasm');
        break;
      
      case 'emotive':
        tone_mods.tone = 'empathetic_supportive';
        tone_mods.session_length = 'medium';
        tone_mods.avoid.push('cold_approach', 'lack_of_empathy');
        tone_mods.seek.push('emotional_connection', 'understanding', 'support');
        break;
    }
  });

  // Дополнительные модификаторы на основе высоких баллов
  Object.keys(scores).forEach(type => {
    const score = scores[type];
    if (score >= 4 && !dominant.includes(type)) {
      // Добавляем вторичные модификаторы
      if (type === 'anxious' && score >= 4) {
        tone_mods.avoid.push('stress');
        tone_mods.seek.push('calm_environment');
      }
      if (type === 'pedantic' && score >= 4) {
        tone_mods.seek.push('accuracy');
      }
    }
  });

  return tone_mods;
}

/**
 * Загружает пороговые значения из CSV
 * @param {string} csvContent - содержимое CSV файла
 * @returns {Object} объект с пороговыми значениями
 */
export function parseTypologyThresholds(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  const thresholds = {};
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    thresholds.minScoreDominant = parseInt(values[0]);
    thresholds.margin = parseInt(values[1]);
  }
  
  return thresholds;
}
