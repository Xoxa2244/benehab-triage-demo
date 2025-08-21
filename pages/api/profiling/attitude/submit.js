// pages/api/profiling/attitude/submit.js

import fs from 'fs';
import path from 'path';
import { calculateAttitudeProfile, parseThresholds } from '../../../../lib/profiling/attitude';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length !== 41) {
      return res.status(400).json({ 
        error: 'Необходимо 41 ответ для расчета профиля' 
      });
    }

    // Проверяем, что все ответы валидны
    const validAnswers = answers.every(answer => 
      answer === 0 || answer === 1 || answer === 2
    );

    if (!validAnswers) {
      return res.status(400).json({ 
        error: 'Ответы должны быть 0, 1 или 2' 
      });
    }

    // Загружаем пороговые значения
    const thresholdsPath = path.join(process.cwd(), 'data', 'attitude_thresholds.csv');
    const thresholdsContent = fs.readFileSync(thresholdsPath, 'utf-8');
    const thresholds = parseThresholds(thresholdsContent);

    // Рассчитываем профиль
    const profile = calculateAttitudeProfile(answers, thresholds);

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
  const { levels, risk_tags, comm_flags } = profile;
  
  let summary = 'Спасибо, что поделился информацией о себе. ';
  
  // Анализируем основные паттерны
  const highScales = Object.entries(levels)
    .filter(([_, level]) => level === 'high')
    .map(([scale, _]) => scale);
  
  const mediumScales = Object.entries(levels)
    .filter(([_, level]) => level === 'medium')
    .map(([scale, _]) => scale);

  if (highScales.includes('severity')) {
    summary += 'Я вижу, что ты серьезно относишься к своему здоровью и часто беспокоишься. ';
  }
  
  if (highScales.includes('alt_med')) {
    summary += 'Ты открыт к альтернативным подходам к здоровью. ';
  }
  
  if (highScales.includes('avoidance')) {
    summary += 'Тебе комфортнее избегать давления и спешки. ';
  }
  
  if (highScales.includes('info_seeking')) {
    summary += 'Ты ценишь подробную информацию и понимание. ';
  }
  
  if (highScales.includes('family_support')) {
    summary += 'Поддержка близких важна для тебя. ';
  }

  // Добавляем рекомендации по коммуникации
  if (comm_flags.includes('avoid_pressure')) {
    summary += 'Я буду объяснять спокойно и без давления. ';
  }
  
  if (comm_flags.includes('normalize_fears')) {
    summary += 'Твои переживания нормальны, и я здесь, чтобы помочь. ';
  }
  
  if (comm_flags.includes('explain_benefits')) {
    summary += 'Я буду объяснять пользу и риски понятно. ';
  }

  summary += 'Если где-то станет тревожно — скажи, мы замедлимся.';
  
  return summary;
}
