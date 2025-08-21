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

    if (!answers || !Array.isArray(answers) || answers.length !== 63) {
      return res.status(400).json({ 
        error: 'Необходимо 63 ответа для расчета профиля' 
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
  const { scores, dominant, interpretation } = profile;
  
  let summary = '';
  
  // Обрабатываем разные типы интерпретации
  if (interpretation.type === 'unaccentuated') {
    summary = 'У вас сбалансированный психологический профиль. Это означает хорошую адаптивность и стабильность. ';
    summary += 'Я буду общаться с вами в стандартном режиме, учитывая ваши индивидуальные особенности.';
  } else if (interpretation.type === 'mixed') {
    summary = 'У вас умеренно выраженные черты нескольких типов личности. ';
    summary += 'Я буду использовать гибкий подход, адаптируясь под ваши текущие потребности.';
  } else if (interpretation.type === 'accentuated') {
    summary = `У вас выражены черты ${interpretation.dominant_types.map(t => t.label.toLowerCase()).join(' и ')} типов личности. `;
    
    // Добавляем описание ведущего типа
    if (interpretation.dominant_types.length > 0) {
      const mainType = interpretation.dominant_types[0];
      summary += `${mainType.description} `;
      summary += `${mainType.promise} `;
    }
    
    summary += 'Я буду учитывать ваши особенности в общении и предоставлять информацию в наиболее подходящем для вас формате.';
  }
  
  return summary;
}
