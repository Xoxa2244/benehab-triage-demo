// pages/api/profiling/attitude/submit.js

import fs from 'fs';
import path from 'path';
import { calculateAttitudeProfile, parseThresholds } from '../../../../lib/profiling/attitude';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, userId } = req.body;

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

    // Пытаемся сохранить профиль пользователю, если есть userId
    if (userId) {
      await saveProfileToBackend(userId, {
        attitude_profile: profile
      });
    }

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

  // Обрабатываем высокие уровни
  if (highScales.includes('severity')) {
    summary += 'Я вижу, что ты серьезно относишься к своему состоянию. ';
  }
  
  if (highScales.includes('secondary_gain')) {
    summary += 'Болезнь может давать тебе возможность получать поддержку и внимание. ';
  }
  
  if (highScales.includes('hide_resist')) {
    summary += 'Тебе может быть некомфортно обсуждать проблемы со здоровьем. ';
  }
  
  if (highScales.includes('work_escape')) {
    summary += 'Работа и активность помогают тебе отвлекаться от проблем со здоровьем. ';
  }
  
  if (highScales.includes('low_selfesteem')) {
    summary += 'Ты можешь быть склонен к самокритике. ';
  }
  
  if (highScales.includes('alt_med')) {
    summary += 'Ты открыт к альтернативным подходам к здоровью. ';
  }
  
  if (highScales.includes('addictions')) {
    summary += 'У тебя есть опыт борьбы с зависимостями. ';
  }
  
  if (highScales.includes('ignore')) {
    summary += 'Ты склонен надеяться, что проблемы решатся сами. ';
  }
  
  if (highScales.includes('anxiety')) {
    summary += 'Ты часто беспокоишься о своем здоровье. ';
  }

  // Добавляем рекомендации по коммуникации
  if (comm_flags.includes('crisis_intervention')) {
    summary += 'Я буду особенно внимателен и бережен в общении. ';
  }
  
  if (comm_flags.includes('gentle_approach')) {
    summary += 'Я буду избегать давления и спешки. ';
  }
  
  if (comm_flags.includes('build_trust')) {
    summary += 'Я постараюсь завоевать твое доверие. ';
  }
  
  if (comm_flags.includes('avoid_stigma')) {
    summary += 'Я буду избегать любых форм стигматизации. ';
  }

  summary += 'Если где-то станет тревожно — скажи, мы замедлимся.';
  
  return summary;
}

async function saveProfileToBackend(userId, payload) {
  try {
    const baseUrl = typeof window === 'undefined'
      ? process.env.INTERNAL_API_URL
      : process.env.NEXT_PUBLIC_API_URL;
    const backendUrl = baseUrl || 'http://localhost:8000';
    const endpoint = `${backendUrl}/api/users/${userId}/profiles`;

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Failed to save attitude profile:', response.status, text);
    }
  } catch (err) {
    console.error('Error saving attitude profile:', err);
  }
}
