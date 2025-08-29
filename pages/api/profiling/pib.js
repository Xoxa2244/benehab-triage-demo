// pages/api/profiling/pib.js

import { generatePIB } from '../../../lib/pib';
import { getCommunicationInstructions, generatePersonalizedPrompt } from '../../../lib/communication-instructions';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { attitude_profile, accentuation_profile, values_profile, demographics, patient_meta = {} } = req.body;

    // Отладочная информация
    console.log('🔍 DEBUG API PIB: Полученные профили:');
    console.log('Attitude Profile:', JSON.stringify(attitude_profile, null, 2));
    console.log('Accentuation Profile:', JSON.stringify(accentuation_profile, null, 2));
    console.log('Values Profile:', JSON.stringify(values_profile, null, 2));
    console.log('Demographics:', JSON.stringify(demographics, null, 2));

    // Проверяем наличие хотя бы одного профиля
    if (!attitude_profile && !accentuation_profile && !values_profile) {
      console.log('❌ API PIB: Нет профилей для генерации PIB');
      return res.status(400).json({ 
        error: 'Необходим хотя бы один профиль для генерации PIB' 
      });
    }

    // Генерируем PIB
    console.log('🚀 API PIB: Генерируем PIB...');
    const pib = generatePIB(attitude_profile, accentuation_profile, values_profile, demographics, patient_meta);
    console.log('✅ API PIB: PIB сгенерирован:', JSON.stringify(pib, null, 2));

    // Генерируем промпт для ИИ
    console.log('🚀 API PIB: Генерируем промпт для ИИ...');
    console.log('🔍 API PIB: Вызываем getCommunicationInstructions с:');
    console.log('- attitude_profile:', attitude_profile);
    console.log('- accentuation_profile:', accentuation_profile);
    
    const instructions = getCommunicationInstructions(attitude_profile, accentuation_profile);
    console.log('✅ API PIB: Инструкции получены:', JSON.stringify(instructions, null, 2));

    console.log('🚀 API PIB: Генерируем персонализированный промпт...');
    const prompt = generatePersonalizedPrompt(instructions);
    console.log('✅ API PIB: Промпт сгенерирован:', prompt);

    // Сохраняем PIB в localStorage (для демо-режима)
    if (req.headers['x-demo-mode'] === 'true') {
      console.log('💾 API PIB: Сохраняем PIB в localStorage (демо-режим)');
    }

    console.log('🎯 API PIB: Возвращаем успешный ответ');
    return res.status(200).json({
      success: true,
      pib: pib,
      prompt: prompt,
      message: 'PIB и промпт успешно сгенерированы',
      debug: {
        instructions_received: !!instructions,
        prompt_generated: !!prompt,
        prompt_length: prompt ? prompt.length : 0
      }
    });

  } catch (error) {
    console.error('❌ API PIB: Ошибка:', error);
    return res.status(500).json({ 
      error: 'Внутренняя ошибка сервера',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
