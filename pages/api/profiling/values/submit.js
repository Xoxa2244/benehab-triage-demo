// pages/api/profiling/values/submit.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { colorAssociations, colorRankings } = req.body;

    if (!colorAssociations || !colorRankings) {
      return res.status(400).json({ 
        error: 'Необходимы данные о цветовых ассоциациях и ранжировании цветов' 
      });
    }

    // Рассчитываем ценностную модель
    const profile = calculateValuesProfile(colorAssociations, colorRankings);

    res.status(200).json({
      success: true,
      profile,
      message: 'Ценностная модель успешно рассчитана'
    });
  } catch (error) {
    console.error('Ошибка расчета ценностной модели:', error);
    res.status(500).json({ 
      error: 'Ошибка расчета ценностной модели',
      details: error.message 
    });
  }
}

/**
 * Рассчитывает ценностную модель на основе цветовых ассоциаций и ранжирования цветов
 * @param {Object} colorAssociations - цветовые ассоциации для каждого понятия
 * @param {Array} colorRankings - ранжирование цветов по привлекательности
 * @returns {Object} профиль с индексами и рекомендациями
 */
function calculateValuesProfile(colorAssociations, colorRankings) {
  console.log('🔍 Отладка calculateValuesProfile:');
  console.log('colorAssociations:', colorAssociations);
  console.log('colorRankings:', colorRankings);
  
  // Анализируем цветовые ассоциации
  const colorAnalysis = analyzeColorAssociations(colorAssociations);
  
  // Анализируем ранжирование цветов
  const rankingAnalysis = analyzeColorRankings(colorRankings, colorAssociations);
  
  // Рассчитываем индексы ценностей
  const valueIndices = calculateValueIndices(colorAssociations, colorRankings);
  console.log('📊 Рассчитанные индексы ценностей:', valueIndices);
  
  // Формируем общий профиль
  const profile = {
    version: 'V/1.0',
    color_associations: colorAnalysis,
    color_rankings: rankingAnalysis,
    value_indices: valueIndices,
    communication_guidelines: generateCommunicationGuidelines(colorAnalysis, rankingAnalysis)
  };

  return profile;
}

/**
 * Анализирует цветовые ассоциации
 */
function analyzeColorAssociations(colorAssociations) {
  const analysis = {
    positive_colors: {},
    negative_colors: {},
    neutral_colors: {},
    dominant_color: null
  };

  // Подсчитываем частоту каждого цвета
  const colorCounts = {};
  Object.values(colorAssociations).forEach(color => {
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  });

  // Определяем доминирующий цвет
  analysis.dominant_color = Object.entries(colorCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

  // Классифицируем цвета по эмоциональной нагрузке
  const positiveColors = ['green', 'blue', 'yellow', 'pink'];
  const negativeColors = ['red', 'black', 'brown', 'gray'];
  const neutralColors = ['white', 'orange', 'purple'];

  Object.entries(colorAssociations).forEach(([concept, color]) => {
    if (positiveColors.includes(color)) {
      analysis.positive_colors[concept] = color;
    } else if (negativeColors.includes(color)) {
      analysis.negative_colors[concept] = color;
    } else {
      analysis.neutral_colors[concept] = color;
    }
  });

  return analysis;
}

/**
 * Анализирует ранжирование цветов
 */
function analyzeColorRankings(colorRankings, colorAssociations) {
  const analysis = {
    top_colors: colorRankings.slice(0, 5), // Топ-5 приятных цветов
    bottom_colors: colorRankings.slice(-5), // Топ-5 неприятных цветов
    concept_distribution: {},
    color_emotion_map: {},
    top_priorities: [],
    bottom_priorities: []
  };

  // Анализируем распределение понятий по цветам
  colorRankings.forEach((color, index) => {
    const conceptsWithThisColor = Object.keys(colorAssociations).filter(
      concept => colorAssociations[concept] === color
    );
    
    analysis.concept_distribution[color] = {
      rank: index + 1,
      concepts: conceptsWithThisColor,
      count: conceptsWithThisColor.length
    };
    
    // Маппинг эмоций по цветам
    analysis.color_emotion_map[color] = {
      rank: index + 1,
      emotion: index < colorRankings.length / 2 ? 'positive' : 'negative',
      intensity: Math.abs((colorRankings.length / 2) - index)
    };

    // Добавляем понятия в приоритеты
    if (index < 3) {
      analysis.top_priorities.push(...conceptsWithThisColor);
    } else if (index >= colorRankings.length - 3) {
      analysis.bottom_priorities.push(...conceptsWithThisColor);
    }
  });

  return analysis;
}

/**
 * Рассчитывает индексы ценностей на основе цветовых ассоциаций и ранжирования
 */
function calculateValueIndices(colorAssociations, colorRankings) {
  return {
    life_satisfaction: calculateLifeSatisfactionIndex(colorAssociations, colorRankings),
    future_orientation: calculateFutureOrientationIndex(colorAssociations, colorRankings),
    treatment_attitude: calculateTreatmentAttitudeIndex(colorAssociations, colorRankings),
    family_importance: calculateFamilyImportanceIndex(colorAssociations, colorRankings),
    health_priority: calculateHealthPriorityIndex(colorAssociations, colorRankings),
    social_orientation: calculateSocialOrientationIndex(colorAssociations, colorRankings),
    self_attitude: calculateSelfAttitudeIndex(colorAssociations, colorRankings),
    death_attitude: calculateDeathAttitudeIndex(colorAssociations, colorRankings),
    addiction_attitude: calculateAddictionAttitudeIndex(colorAssociations, colorRankings),
    needs_satisfaction: calculateNeedsSatisfactionIndex(colorAssociations, colorRankings)
  };
}

/**
 * Генерирует рекомендации по коммуникации
 */
function generateCommunicationGuidelines(colorAnalysis, rankingAnalysis) {
  const guidelines = {
    positive_values: Object.keys(colorAnalysis.positive_colors),
    sensitive_topics: Object.keys(colorAnalysis.negative_colors),
    communication_style: determineCommunicationStyle(colorAnalysis),
    motivators: rankingAnalysis.top_priorities.slice(0, 5),
    avoid_topics: rankingAnalysis.bottom_priorities.slice(0, 5)
  };

  return guidelines;
}

/**
 * Рассчитывает индекс удовлетворенности жизнью
 */
function calculateLifeSatisfactionIndex(colorAssociations, colorRankings) {
  const lifeConcepts = ['Счастье', 'Радость', 'Надежда', 'Любовь', 'Семья', 'Спокойствие'];
  let totalScore = 0;
  let count = 0;
  
  console.log('🔍 Отладка calculateLifeSatisfactionIndex:');
  console.log('lifeConcepts:', lifeConcepts);
  
  lifeConcepts.forEach(concept => {
    if (colorAssociations[concept]) {
      const color = colorAssociations[concept];
      const rank = colorRankings.indexOf(color);
      console.log(`✅ ${concept} -> ${color} -> rank ${rank}`);
      if (rank !== -1) {
        // Чем выше ранг (ближе к началу), тем лучше
        totalScore += (colorRankings.length - rank);
        count++;
      }
    } else {
      console.log(`❌ ${concept} не найден в colorAssociations`);
    }
  });
  
  const result = count > 0 ? Math.round((totalScore / count) / colorRankings.length * 100) : 50;
  console.log(`📊 Результат: totalScore=${totalScore}, count=${count}, result=${result}`);
  
  return result;
}

/**
 * Рассчитывает индекс ориентации на будущее
 */
function calculateFutureOrientationIndex(colorAssociations, colorRankings) {
  const futureConcepts = ['Будущее', 'Надежда', 'Перемены', 'Успех', 'Вдохновение'];
  let totalScore = 0;
  let count = 0;
  
  futureConcepts.forEach(concept => {
    if (colorAssociations[concept]) {
      const color = colorAssociations[concept];
      const rank = colorRankings.indexOf(color);
      if (rank !== -1) {
        totalScore += (colorRankings.length - rank);
        count++;
      }
    }
  });
  
  return count > 0 ? Math.round((totalScore / count) / colorRankings.length * 100) : 50;
}

/**
 * Рассчитывает индекс отношения к лечению
 */
function calculateTreatmentAttitudeIndex(colorAssociations, colorRankings) {
  const treatmentConcepts = ['Лечение', 'Врач', 'Медработники', 'Здоровье', 'Болезнь'];
  let totalScore = 0;
  let count = 0;
  
  treatmentConcepts.forEach(concept => {
    if (colorAssociations[concept]) {
      const color = colorAssociations[concept];
      const rank = colorRankings.indexOf(color);
      if (rank !== -1) {
        totalScore += (colorRankings.length - rank);
        count++;
      }
    }
  });
  
  return count > 0 ? Math.round((totalScore / count) / colorRankings.length * 100) : 50;
}

/**
 * Рассчитывает индекс важности семьи
 */
function calculateFamilyImportanceIndex(colorAssociations, colorRankings) {
  const familyConcepts = ['Семья', 'Любовь', 'Дружба', 'Свадьба', 'Дом'];
  let totalScore = 0;
  let count = 0;
  
  familyConcepts.forEach(concept => {
    if (colorAssociations[concept]) {
      const color = colorAssociations[concept];
      const rank = colorRankings.indexOf(color);
      if (rank !== -1) {
        totalScore += (colorRankings.length - rank);
        count++;
      }
    }
  });
  
  return count > 0 ? Math.round((totalScore / count) / colorRankings.length * 100) : 50;
}

/**
 * Рассчитывает индекс приоритета здоровья
 */
function calculateHealthPriorityIndex(colorAssociations, colorRankings) {
  const healthConcepts = ['Здоровье', 'Болезнь', 'Лечение', 'Спорт', 'Отдых'];
  let totalScore = 0;
  let count = 0;
  
  healthConcepts.forEach(concept => {
    if (colorAssociations[concept]) {
      const color = colorAssociations[concept];
      const rank = colorRankings.indexOf(color);
      if (rank !== -1) {
        totalScore += (colorRankings.length - rank);
        count++;
      }
    }
  });
  
  return count > 0 ? Math.round((totalScore / count) / colorRankings.length * 100) : 50;
}

/**
 * Рассчитывает индекс социальной ориентации
 */
function calculateSocialOrientationIndex(colorAssociations, colorRankings) {
  const socialConcepts = ['Друзья', 'Коллеги', 'Соседи', 'Общение', 'Волонтерство'];
  let totalScore = 0;
  let count = 0;
  
  socialConcepts.forEach(concept => {
    if (colorAssociations[concept]) {
      const color = colorAssociations[concept];
      const rank = colorRankings.indexOf(color);
      if (rank !== -1) {
        totalScore += (colorRankings.length - rank);
        count++;
      }
    }
  });
  
  return count > 0 ? Math.round((totalScore / count) / colorRankings.length * 100) : 50;
}

/**
 * Рассчитывает индекс отношения к себе
 */
function calculateSelfAttitudeIndex(colorAssociations, colorRankings) {
  const selfConcepts = ['Я сам', 'Гордость', 'Признание', 'Мудрость', 'Верность'];
  let totalScore = 0;
  let count = 0;
  
  selfConcepts.forEach(concept => {
    if (colorAssociations[concept]) {
      const color = colorAssociations[concept];
      const rank = colorRankings.indexOf(color);
      if (rank !== -1) {
        totalScore += (colorRankings.length - rank);
        count++;
      }
    }
  });
  
  return count > 0 ? Math.round((totalScore / count) / colorRankings.length * 100) : 50;
}

/**
 * Рассчитывает индекс отношения к смерти
 */
function calculateDeathAttitudeIndex(colorAssociations, colorRankings) {
  const deathConcepts = ['Смерть', 'Страх', 'Тревога', 'Страдание', 'Одиночество'];
  let totalScore = 0;
  let count = 0;
  
  deathConcepts.forEach(concept => {
    if (colorAssociations[concept]) {
      const color = colorAssociations[concept];
      const rank = colorRankings.indexOf(color);
      if (rank !== -1) {
        totalScore += (colorRankings.length - rank);
        count++;
      }
    }
  });
  
  return count > 0 ? Math.round((totalScore / count) / colorRankings.length * 100) : 50;
}

/**
 * Рассчитывает индекс отношения к аддикциям
 */
function calculateAddictionAttitudeIndex(colorAssociations, colorRankings) {
  // В CSV нет прямых понятий об аддикциях, используем косвенные
  const addictionConcepts = ['Страх', 'Тревога', 'Усталость', 'Страдание', 'Стыд'];
  let totalScore = 0;
  let count = 0;
  
  addictionConcepts.forEach(concept => {
    if (colorAssociations[concept]) {
      const color = colorAssociations[concept];
      const rank = colorRankings.indexOf(color);
      if (rank !== -1) {
        totalScore += (colorRankings.length - rank);
        count++;
      }
    }
  });
  
  return count > 0 ? Math.round((totalScore / count) / colorRankings.length * 100) : 50;
}

/**
 * Рассчитывает индекс удовлетворенности потребностей
 */
function calculateNeedsSatisfactionIndex(colorAssociations, colorRankings) {
  const needsConcepts = [
    'Богатство', 'Безопасность', 'Дружба', 'Признание', 'Власть',
    'Знания', 'Красота', 'Творчество', 'Работа', 'Семья', 'Спорт', 'Религия'
  ];
  let totalScore = 0;
  let count = 0;
  
  needsConcepts.forEach(concept => {
    if (colorAssociations[concept]) {
      const color = colorAssociations[concept];
      const rank = colorRankings.indexOf(color);
      if (rank !== -1) {
        totalScore += (colorRankings.length - rank);
        count++;
      }
    }
  });
  
  return count > 0 ? Math.round((totalScore / count) / colorRankings.length * 100) : 50;
}

/**
 * Определяет стиль коммуникации на основе анализа цветов
 */
function determineCommunicationStyle(colorAnalysis) {
  const positiveCount = Object.keys(colorAnalysis.positive_colors).length;
  const negativeCount = Object.keys(colorAnalysis.negative_colors).length;
  const totalCount = positiveCount + negativeCount + Object.keys(colorAnalysis.neutral_colors).length;
  
  const positiveRatio = positiveCount / totalCount;
  
  if (positiveRatio > 0.6) {
    return 'optimistic';
  } else if (positiveRatio < 0.4) {
    return 'supportive';
  } else {
    return 'balanced';
  }
}
