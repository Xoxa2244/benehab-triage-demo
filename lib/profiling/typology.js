// lib/profiling/typology.js

/**
 * Рассчитывает типологический профиль на основе ответов
 * @param {Array} answers - массив ответов [0,1] для 63 вопросов
 * @param {Object} thresholds - пороговые значения
 * @returns {Object} профиль с scores, dominant types и интерпретацией
 */
export function calculateTypologyProfile(answers, thresholds) {
  if (!answers || answers.length !== 63) {
    throw new Error('Необходимо 63 ответа для расчета профиля');
  }

  // Определяем вопросы для каждого столбца (1-9)
  const columnQuestions = {
    1: [1, 2, 3, 4, 5, 6, 7],      // Сензитивный
    2: [8, 9, 10, 11, 12, 13, 14], // Дистимический
    3: [15, 16, 17, 18, 19, 20, 21], // Демонстративный
    4: [22, 23, 24, 25, 26, 27, 28], // Возбудимый
    5: [29, 30, 31, 32, 33, 34, 35], // Тревожный
    6: [36, 37, 38, 39, 40, 41, 42], // Педантичный
    7: [43, 44, 45, 46, 47, 48, 49], // Экзальтированный
    8: [50, 51, 52, 53, 54, 55, 56], // Эмотивный
    9: [57, 58, 59, 60, 61, 62, 63]  // Застревающий
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

  // Определяем доминирующие типы согласно алгоритму
  const dominant = determineDominantTypes(scores, thresholds);

  // Генерируем интерпретацию профиля
  const interpretation = generateInterpretation(scores, dominant);

  return {
    version: 'B/1.0',
    scores,
    dominant,
    interpretation,
    raw_scores: scores,
    leading_types: dominant.map(type => getTypeLabel(type))
  };
}

/**
 * Определяет доминирующие типы согласно алгоритму
 * @param {Object} scores - баллы по всем типам
 * @param {Object} thresholds - пороговые значения
 * @returns {Array} массив доминирующих типов
 */
function determineDominantTypes(scores, thresholds) {
  const minScore = thresholds.minScoreDominant || 5;
  const margin = thresholds.margin || 2; // Увеличиваем margin до 2 согласно ТЗ
  
  // Сортируем типы по баллам (убывание)
  const sortedTypes = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .map(([type, score]) => ({ type, score }));

  const dominant = [];
  
  // Проверяем первый тип
  if (sortedTypes[0].score >= minScore) {
    const firstScore = sortedTypes[0].score;
    let isFirstDominant = true;
    
    // Проверяем, что первый тип на margin+ баллов выше остальных
    for (let i = 1; i < sortedTypes.length; i++) {
      if (sortedTypes[i].score >= firstScore - margin) {
        isFirstDominant = false;
        break;
      }
    }
    
    if (isFirstDominant) {
      dominant.push(sortedTypes[0].type);
    }
  }
  
  // Проверяем второй тип (если первый не доминирует)
  if (dominant.length === 0 && sortedTypes.length > 1 && sortedTypes[1].score >= minScore) {
    const secondScore = sortedTypes[1].score;
    let isSecondDominant = true;
    
    // Проверяем, что второй тип на margin+ баллов выше остальных
    for (let i = 2; i < sortedTypes.length; i++) {
      if (sortedTypes[i].score >= secondScore - margin) {
        isSecondDominant = false;
        break;
      }
    }
    
    if (isSecondDominant) {
      dominant.push(sortedTypes[1].type);
    }
  }
  
  // Если выявлено ≥3 выраженных шкал → считаем личность неакцентуированной
  if (dominant.length === 0) {
    const highScoringTypes = sortedTypes.filter(item => item.score >= minScore);
    if (highScoringTypes.length >= 3) {
      return ['unaccentuated']; // Неакцентуированная личность
    }
  }
  
  return dominant;
}

/**
 * Генерирует интерпретацию профиля
 * @param {Object} scores - баллы по всем типам
 * @param {Array} dominant - доминирующие типы
 * @returns {Object} объект с интерпретацией
 */
function generateInterpretation(scores, dominant) {
  if (dominant.includes('unaccentuated')) {
    return {
      type: 'unaccentuated',
      label: 'Неакцентуированная личность',
      description: 'У вас сбалансированный психологический профиль без выраженных акцентуаций. Это означает хорошую адаптивность и стабильность.',
      recommendation: 'Можете использовать стандартные подходы к коммуникации и лечению.'
    };
  }
  
  if (dominant.length === 0) {
    return {
      type: 'mixed',
      label: 'Смешанный профиль',
      description: 'У вас умеренно выраженные черты нескольких типов личности.',
      recommendation: 'Рекомендуется индивидуальный подход с учетом ваших особенностей.'
    };
  }
  
  // Для доминирующих типов
  const interpretations = dominant.map(type => {
    const typeInfo = getTypeInfo(type);
    return {
      type,
      label: typeInfo.label,
      description: typeInfo.description,
      promise: typeInfo.promise,
      characteristics: typeInfo.characteristics,
      voice_type: typeInfo.voice_type,
      interaction_frequency: typeInfo.interaction_frequency
    };
  });
  
  return {
    type: 'accentuated',
    dominant_types: interpretations,
    summary: `У вас выражены черты ${interpretations.map(i => i.label.toLowerCase()).join(' и ')} типов личности.`
  };
}

/**
 * Получает информацию о типе по номеру колонки
 * @param {string} column - номер колонки (1-9)
 * @returns {Object} информация о типе
 */
function getTypeInfo(column) {
  // Импортируем данные о типах
  const typesData = require('../../data/types_personality.json');
  return typesData[column] || {
    name: `Тип ${column}`,
    label: `Тип ${column}`,
    description: 'Описание типа',
    promise: 'Я помогу вам',
    characteristics: [],
    voice_type: 'Спокойный',
    interaction_frequency: 'Средняя'
  };
}

/**
 * Получает название типа по номеру колонки
 * @param {string} column - номер колонки (1-9)
 * @returns {string} название типа
 */
function getTypeLabel(column) {
  const typeInfo = getTypeInfo(column);
  return typeInfo.label || `Тип ${column}`;
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
    const typeInfo = getTypeInfo(type);
    
    // Применяем рекомендации по коммуникации
    if (typeInfo.positive_communication) {
      tone_mods.seek.push(...typeInfo.positive_communication);
    }
    
    if (typeInfo.negative_communication) {
      tone_mods.avoid.push(...typeInfo.negative_communication);
    }
    
    // Устанавливаем тон и частоту взаимодействия
    if (typeInfo.voice_type) {
      tone_mods.tone = typeInfo.voice_type.split(',')[0].trim().toLowerCase();
    }
    
    if (typeInfo.interaction_frequency) {
      if (typeInfo.interaction_frequency.includes('высокая')) {
        tone_mods.session_length = 'longer';
      } else if (typeInfo.interaction_frequency.includes('низкая')) {
        tone_mods.session_length = 'short';
      }
    }
  });

  return tone_mods;
}

/**
 * Парсит пороговые значения из CSV
 * @param {string} csvContent - содержимое CSV файла
 * @returns {Object} объект с пороговыми значениями
 */
export function parseTypologyThresholds(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  const thresholds = {};
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length >= 2) {
      const key = values[0].trim();
      const value = parseInt(values[1].trim());
      if (!isNaN(value)) {
        thresholds[key] = value;
      }
    }
  }
  
  return thresholds;
}
