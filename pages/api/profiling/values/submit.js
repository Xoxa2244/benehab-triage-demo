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
  // Анализируем цветовые ассоциации
  const colorAnalysis = analyzeColorAssociations(colorAssociations);
  
  // Анализируем ранжирование цветов
  const rankingAnalysis = analyzeColorRankings(colorRankings, colorAssociations);
  
  // Формируем общий профиль
  const profile = {
    version: 'V/1.0',
    color_associations: colorAnalysis,
    color_rankings: rankingAnalysis,
    value_indices: calculateValueIndices(colorAssociations, colorRankings),
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
    color_emotion_map: {}
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
    social_orientation: calculateSocialOrientationIndex(colorAssociations, colorRankings)
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

// Вспомогательные функции
function getConceptCategory(concept) {
  // Здесь должна быть логика определения категории понятия
  // Пока возвращаем заглушку
  return 'general';
}

function calculateLifeAttitude(rankings) {
  const positiveConcepts = ['Счастье', 'Радость', 'Надежда', 'Любовь', 'Семья'];
  const negativeConcepts = ['Страх', 'Тревога', 'Страдание', 'Одиночество', 'Смерть'];
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  rankings.forEach((concept, index) => {
    if (positiveConcepts.includes(concept)) {
      positiveScore += (rankings.length - index);
    } else if (negativeConcepts.includes(concept)) {
      negativeScore += (index + 1);
    }
  });
  
  return positiveScore > negativeScore ? 'positive' : 'negative';
}

function calculateLifeSatisfactionIndex(colorAssociations, colorRankings) {
  // Расчет индекса удовлетворенности жизнью на основе ранжирования цветов
  const positiveColors = colorRankings.slice(0, Math.ceil(colorRankings.length / 2));
  let positiveScore = 0;
  
  Object.values(colorAssociations).forEach(color => {
    if (positiveColors.includes(color)) {
      const rank = colorRankings.indexOf(color);
      positiveScore += (colorRankings.length - rank);
    }
  });
  
  return Math.round((positiveScore / (Object.keys(colorAssociations).length * colorRankings.length)) * 100);
}

function calculateFutureOrientationIndex(colorAssociations, colorRankings) {
  const futureConcepts = ['Будущее', 'Надежда', 'Перемены', 'Успех'];
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

function calculateTreatmentAttitudeIndex(colorAssociations, rankings) {
  const treatmentConcepts = ['Лечение', 'Врач', 'Медработники', 'Здоровье'];
  let positiveCount = 0;
  let totalCount = 0;
  
  treatmentConcepts.forEach(concept => {
    if (colorAssociations[concept]) {
      totalCount++;
      if (['green', 'blue', 'yellow'].includes(colorAssociations[concept])) {
        positiveCount++;
      }
    }
  });
  
  return totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 50;
}

function calculateFamilyImportanceIndex(rankings) {
  const familyConcepts = ['Семья', 'Любовь', 'Дружба'];
  let totalRank = 0;
  let count = 0;
  
  familyConcepts.forEach(concept => {
    const index = rankings.indexOf(concept);
    if (index !== -1) {
      totalRank += (rankings.length - index);
      count++;
    }
  });
  
  return count > 0 ? Math.round((totalRank / count) / rankings.length * 100) : 50;
}

function calculateHealthPriorityIndex(rankings) {
  const healthConcepts = ['Здоровье', 'Болезнь', 'Лечение'];
  let totalRank = 0;
  let count = 0;
  
  healthConcepts.forEach(concept => {
    const index = rankings.indexOf(concept);
    if (index !== -1) {
      totalRank += (rankings.length - index);
      count++;
    }
  });
  
  return count > 0 ? Math.round((totalRank / count) / rankings.length * 100) : 50;
}

function calculateSocialOrientationIndex(rankings) {
  const socialConcepts = ['Друзья', 'Коллеги', 'Соседи', 'Общение'];
  let totalRank = 0;
  let count = 0;
  
  socialConcepts.forEach(concept => {
    const index = rankings.indexOf(concept);
    if (index !== -1) {
      totalRank += (rankings.length - index);
      count++;
    }
  });
  
  return count > 0 ? Math.round((totalRank / count) / rankings.length * 100) : 50;
}

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
