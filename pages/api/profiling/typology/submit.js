// pages/api/profiling/typology/submit.js

import fs from 'fs';
import path from 'path';
import { calculateTypologyProfile, parseTypologyThresholds } from '../../../../lib/profiling/typology';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length !== 56) {
      return res.status(400).json({ 
        error: 'Необходимо 56 ответов для расчета профиля' 
      });
    }

    // Проверяем, что все ответы валидны
    const validAnswers = answers.every(answer => 
      answer === 0 || answer === 1
    );

    if (!validAnswers) {
      return res.status(400).json({ 
        error: 'Ответы должны быть 0 или 1' 
      });
    }

    // Загружаем пороговые значения
    const thresholdsPath = path.join(process.cwd(), 'data', 'typology_thresholds.csv');
    const thresholdsContent = fs.readFileSync(thresholdsPath, 'utf-8');
    const thresholds = parseTypologyThresholds(thresholdsContent);

    // Рассчитываем профиль
    const profile = calculateTypologyProfile(answers, thresholds);

    // Формируем бережное резюме для пользователя
    const summary = generateSummary(profile);

    res.status(200).json({
      success: true,
      profile,
      summary,
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
 * Генерирует бережное резюме профиля для пользователя
 * @param {Object} profile - рассчитанный профиль
 * @returns {string} резюме на русском языке
 */
function generateSummary(profile) {
  const { scores, dominant, tone_mods } = profile;
  
  let summary = 'Понятно, что тебе ближе ';
  
  // Описываем доминирующие типы
  if (dominant.length > 0) {
    const dominantLabels = {
      'sensitive': 'спокойный темп и бережное отношение',
      'dysthymic': 'постепенность и поддержка',
      'demonstrative': 'внимание и признание',
      'unstable': 'стабильность и простота',
      'anxious': 'ясность и уверенность',
      'pedantic': 'детальность и структура',
      'exalted': 'вдохновение и позитив',
      'emotive': 'эмоциональная поддержка'
    };
    
    const labels = dominant.map(type => dominantLabels[type] || type);
    summary += labels.join(' и ') + '. ';
  } else {
    summary += 'сбалансированный подход. ';
  }

  // Добавляем рекомендации по коммуникации
  if (tone_mods.avoid && tone_mods.avoid.length > 0) {
    const avoidLabels = {
      'pressure': 'давления',
      'rush': 'спешки',
      'uncertainty': 'неопределенности',
      'overwhelming_info': 'перегрузки информацией'
    };
    
    const avoids = tone_mods.avoid.map(item => avoidLabels[item] || item);
    summary += `Я постараюсь избегать ${avoids.join(' и ')}. `;
  }
  
  if (tone_mods.seek && tone_mods.seek.length > 0) {
    const seekLabels = {
      'slow_pacing': 'медленного темпа',
      'clarity': 'ясности',
      'structure': 'структуры',
      'reassurance': 'поддержки'
    };
    
    const seeks = tone_mods.seek.map(item => seekLabels[item] || item);
    summary += `Буду стремиться к ${seeks.join(' и ')}. `;
  }

  summary += 'Если что — поправляй меня.';
  
  return summary;
}
