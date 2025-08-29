// pages/api/chat.js
import OpenAI from 'openai';
import { getCommunicationInstructions, generatePersonalizedPrompt } from '../../lib/communication-instructions';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BASE = `Ты — "Татьяна", ассистент по здоровью Benehab.
Говори тёпло и просто. Уважай выбор человека. 
Не ставь диагнозы, не назначай лекарства.
Triage: если есть опасные симптомы — немедленно советуй вызвать скорую/обратиться в неотложку и не продолжай обычную беседу пока пользователь не подтвердит безопасность.
Лёгкие типичные симптомы — поддержка, отдых/жидкость/самонаблюдение.
Средние, требующие наблюдения — предложить записаться к врачу, но слоты давай только если человек согласился.
Препараты: допускается фактическая справка (показания, противопоказания, предосторожности, частые побочные эффекты) — БЕЗ дозировок и без назначения. Если просят дозу — напомни, что дозировки определяет врач.
Слоты для записи: 13:00, 15:00, 17:00 — только после явного согласия. После выбора скажи: "Спасибо, вы записаны".`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { messages = [], profile = null } = req.body || {};
    
    // Отладочная информация
    console.log('=== CHAT API DEBUG ===');
    console.log('Profile received:', JSON.stringify(profile, null, 2));
    console.log('Messages received:', messages.length);
    
    // Строим персонализированный промпт на основе профиля
    let personalization = '';
    
    if (profile) {
      try {
        // Используем новую систему коммуникационных инструкций
        const instructions = getCommunicationInstructions(
          profile.attitude_profile || profile.attitude, 
          profile.accentuation_profile || profile.typology
        );
        
        console.log('Instructions generated:', JSON.stringify(instructions, null, 2));
        
        // Генерируем персонализированный промпт
        personalization = generatePersonalizedPrompt(instructions);
        
        // Добавляем информацию о ценностях если есть
        if (profile.values_profile || profile.values) {
          const valuesProfile = profile.values_profile || profile.values;
          if (valuesProfile.communication_guidelines) {
            personalization += `\n\nДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ ПО ЦЕННОСТЯМ:\n`;
            personalization += `Стиль коммуникации: ${valuesProfile.communication_guidelines.communication_style || 'не определен'}\n`;
            
            if (valuesProfile.communication_guidelines.motivators) {
              personalization += `Мотиваторы: ${valuesProfile.communication_guidelines.motivators.join(', ')}\n`;
            }
            
            if (valuesProfile.communication_guidelines.avoid_topics) {
              personalization += `Избегать тем: ${valuesProfile.communication_guidelines.avoid_topics.join(', ')}\n`;
            }
          }
        }
        
        // Добавляем демографическую информацию
        if (profile.demographics) {
          personalization += `\nДЕМОГРАФИЧЕСКАЯ ИНФОРМАЦИЯ:\n`;
          personalization += `Возраст: ${profile.demographics.age || 'не указан'}\n`;
          personalization += `Пол: ${profile.demographics.gender || 'не указан'}\n`;
          personalization += `Вес: ${profile.demographics.weight || 'не указан'} кг\n`;
          personalization += `Рост: ${profile.demographics.height || 'не указан'} см\n`;
        }
        
        console.log('Personalization generated successfully');
        
      } catch (promptError) {
        console.error('Error generating personalization:', promptError);
        personalization = '\n\nОшибка генерации персонализированного промпта. Используйте базовые инструкции.';
      }
    }
    
    const system = BASE + personalization;
    
    console.log('System prompt length:', system.length);
    console.log('Personalization length:', personalization.length);
    console.log('=== END DEBUG ===');
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [{ role: 'system', content: system }, ...messages],
    });
    
    res.status(200).json({ 
      content: response.choices?.[0]?.message?.content || 'Готово.',
      profile_used: !!profile,
      profile_debug: profile ? Object.keys(profile) : [],
      personalization_length: personalization.length
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}
