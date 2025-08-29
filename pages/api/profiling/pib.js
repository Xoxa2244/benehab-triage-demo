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
    console.log('🔍 DEBUG: Полученные профили:');
    console.log('Attitude Profile:', JSON.stringify(attitude_profile, null, 2));
    console.log('Accentuation Profile:', JSON.stringify(accentuation_profile, null, 2));
    console.log('Values Profile:', JSON.stringify(values_profile, null, 2));

    // Проверяем наличие хотя бы одного профиля
    if (!attitude_profile && !accentuation_profile && !values_profile) {
      return res.status(400).json({ 
        error: 'Необходим хотя бы один профиль для генерации PIB' 
      });
    }

    // Генерируем PIB
    const pib = generatePIB(attitude_profile, accentuation_profile, values_profile, demographics, patient_meta);

    // Генерируем промпт для ИИ
    let prompt = '';
    
    try {
      // Получаем инструкции по коммуникации (передаем правильные параметры)
      const instructions = getCommunicationInstructions(attitude_profile, accentuation_profile);
      
      // Отладочная информация
      console.log('🔍 DEBUG: Сгенерированные инструкции:', JSON.stringify(instructions, null, 2));
      
      // Генерируем персонализированный промпт
      prompt = generatePersonalizedPrompt(instructions);
      
      // Добавляем информацию о ценностях если есть
      if (values_profile && values_profile.communication_guidelines) {
        prompt += `\n\nДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ ПО ЦЕННОСТЯМ:\n`;
        prompt += `Стиль коммуникации: ${values_profile.communication_guidelines.communication_style || 'не определен'}\n`;
        
        if (values_profile.communication_guidelines.motivators) {
          prompt += `Мотиваторы: ${values_profile.communication_guidelines.motivators.join(', ')}\n`;
        }
        
        if (values_profile.communication_guidelines.avoid_topics) {
          prompt += `Избегать тем: ${values_profile.communication_guidelines.avoid_topics.join(', ')}\n`;
        }
      }
      
      // Добавляем демографическую информацию
      if (demographics) {
        prompt += `\nДЕМОГРАФИЧЕСКАЯ ИНФОРМАЦИЯ:\n`;
        prompt += `Возраст: ${demographics.age || 'не указан'}\n`;
        prompt += `Пол: ${demographics.gender || 'не указан'}\n`;
        prompt += `Вес: ${demographics.weight || 'не указан'} кг\n`;
        prompt += `Рост: ${demographics.height || 'не указан'} см\n`;
      }
      
    } catch (promptError) {
      console.error('Ошибка генерации промпта:', promptError);
      prompt = 'Ошибка генерации персонализированного промпта. Используйте базовые инструкции.';
    }

    res.status(200).json({
      success: true,
      pib,
      prompt,
      message: 'PIB и промпт успешно сгенерированы'
    });
  } catch (error) {
    console.error('Ошибка генерации PIB:', error);
    res.status(500).json({ 
      error: 'Ошибка генерации PIB',
      details: error.message 
    });
  }
}
