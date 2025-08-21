// pages/api/profiling/typology/submit.js

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ 
        error: 'Необходимы ответы для расчета профиля' 
      });
    }

    // Загружаем справочник типов
    const typesPath = path.join(process.cwd(), 'data', 'types_personality.json');
    const typesContent = fs.readFileSync(typesPath, 'utf-8');
    const types = JSON.parse(typesContent);

    // Рассчитываем профиль
    const profile = calculateTypologyProfile(answers, types);

    res.status(200).json({
      success: true,
      profile,
      message: 'Профиль успешно рассчитан'
    });
  } catch (error) {
    console.error('Ошибка расчета профиля:', error);
    res.status(500).json({ 
      error: 'Ошибка расчета профиля',
      details: error.message 
    });
  }
}

/**
 * Рассчитывает типологический профиль на основе ответов
 * @param {Object} answers - объект с ответами { questionId: [{ optionId, ptype }] }
 * @param {Object} types - справочник типов личности
 * @returns {Object} профиль с scores, leading_types и интерпретацией
 */
function calculateTypologyProfile(answers, types) {
  // Подсчитываем баллы по каждому типу
  const scores = {};
  
  // Инициализируем все типы с 0 баллами
  Object.keys(types).forEach(type => {
    scores[type] = 0;
  });

  // Подсчитываем баллы на основе выбранных опций
  Object.values(answers).forEach(questionAnswers => {
    if (Array.isArray(questionAnswers)) {
      questionAnswers.forEach(answer => {
        if (answer.ptype && scores.hasOwnProperty(answer.ptype)) {
          scores[answer.ptype]++;
        }
      });
    }
  });

  // Определяем ведущие типы (с разницей ≥ 2 балла)
  const sortedTypes = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .map(([type, score]) => ({ type, score }));

  const leadingTypes = [];
  const margin = 2;

  // Проверяем первый тип
  if (sortedTypes[0].score > 0) {
    const firstScore = sortedTypes[0].score;
    let isFirstLeading = true;

    // Проверяем, что первый тип на margin+ баллов выше остальных
    for (let i = 1; i < sortedTypes.length; i++) {
      if (sortedTypes[i].score >= firstScore - margin) {
        isFirstLeading = false;
        break;
      }
    }

    if (isFirstLeading) {
      leadingTypes.push(sortedTypes[0].type);
    }
  }

  // Проверяем второй тип (если первый не лидирует)
  if (leadingTypes.length === 0 && sortedTypes.length > 1 && sortedTypes[1].score > 0) {
    const secondScore = sortedTypes[1].score;
    let isSecondLeading = true;

    // Проверяем, что второй тип на margin+ баллов выше остальных
    for (let i = 2; i < sortedTypes.length; i++) {
      if (sortedTypes[i].score >= secondScore - margin) {
        isSecondLeading = false;
        break;
      }
    }

    if (isSecondLeading) {
      leadingTypes.push(sortedTypes[1].type);
    }
  }

  // Если выявлено ≥3 выраженных шкал → считаем личность неакцентуированной
  if (leadingTypes.length === 0) {
    const highScoringTypes = sortedTypes.filter(item => item.score > 0);
    if (highScoringTypes.length >= 3) {
      return {
        version: 'B/2.0',
        scores,
        leading_types: ['unaccentuated'],
        interpretation: {
          type: 'unaccentuated',
          description: 'У вас сбалансированный психологический профиль с умеренной выраженностью нескольких черт.',
          recommendation: 'Рекомендуется стандартный подход к общению с учетом индивидуальных особенностей.'
        }
      };
    }
  }

  // Генерируем интерпретацию для ведущих типов
  const interpretation = generateInterpretation(leadingTypes, types, scores);

  return {
    version: 'B/2.0',
    scores,
    leading_types: leadingTypes,
    interpretation,
    raw_scores: scores
  };
}

/**
 * Генерирует интерпретацию профиля
 * @param {Array} leadingTypes - ведущие типы
 * @param {Object} types - справочник типов
 * @param {Object} scores - баллы по всем типам
 * @returns {Object} объект с интерпретацией
 */
function generateInterpretation(leadingTypes, types, scores) {
  if (leadingTypes.length === 0) {
    return {
      type: 'mixed',
      description: 'У вас умеренно выраженные черты нескольких типов личности.',
      recommendation: 'Рекомендуется гибкий подход к общению с адаптацией под текущие потребности.'
    };
  }

  if (leadingTypes.length === 1) {
    const mainType = types[leadingTypes[0]];
    return {
      type: 'accentuated',
      dominant_type: leadingTypes[0],
      description: mainType.short_desc,
      tone: mainType.tone,
      do: mainType.do,
      avoid: mainType.avoid,
      motivators: mainType.motivators,
      red_flags: mainType.red_flags,
      recommendation: `Рекомендуется ${mainType.tone} тон общения с акцентом на ${mainType.motivators.join(', ')}.`
    };
  }

  // Множественные ведущие типы
  const dominantTypes = leadingTypes.map(type => types[type]);
  return {
    type: 'mixed_dominant',
    dominant_types: leadingTypes,
    descriptions: dominantTypes.map(t => t.short_desc),
    recommendation: 'Рекомендуется комбинированный подход, учитывающий особенности нескольких типов личности.'
  };
}
