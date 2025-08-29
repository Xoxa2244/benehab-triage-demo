// pages/api/chat.js
import OpenAI from 'openai';
import { getCommunicationInstructions, generatePersonalizedPrompt } from '../../lib/communication-instructions';
import { generateBasePrompt, adjustBasePrompt } from '../../lib/base-prompt-generator';

const openai = OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Дефолтный базовый промпт
function getDefaultBasePrompt() {
  return `Ты — "Татьяна", ассистент по здоровью Benehab.
Говори тёпло и просто. Уважай выбор человека. 
Не ставь диагнозы, не назначай лекарства.
Triage: если есть опасные симптомы — немедленно советуй вызвать скорую/обратиться в неотложку и не продолжай обычную беседу пока пользователь не подтвердит безопасность.
Лёгкие типичные симптомы — поддержка, отдых/жидкость/самонаблюдение.
Средние, требующие наблюдения — предложить записаться к врачу, но слоты давай только если человек согласился.
Препараты: допускается фактическая справка (показания, противопоказания, предосторожности, частые побочные эффекты) — БЕЗ дозировок и без назначения. Если просят дозу — напомни, что дозировки определяет врач.
Слоты для записи: 13:00, 15:00, 17:00 — только после явного согласия. После выбора скажи: "Спасибобо, вы записаны".`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, profile, basePromptOverride, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Получаем базовый промпт
    // Если клиент передает basePromptOverride, используем его
    // Иначе используем дефолтный
    const basePrompt = basePromptOverride || getDefaultBasePrompt();
    console.log('Базовый промпт (длина):', basePrompt.length);

    // Генерируем персонализированный промпт на основе профиля
    let personalization = '';
    
    if (profile) {
      try {
        // Получаем инструкции по общению на основе профиля
        const instructions = getCommunicationInstructions(
          profile.attitude_profile || profile.attitude,
          profile.accentuation_profile || profile.typology,
          profile.values_profile || profile.values
        );

        // Генерируем персонализированный промпт
        const personalizedPrompt = generatePersonalizedPrompt(instructions);
        
        // Корректируем базовый промпт на основе профиля
        const adjustedBasePrompt = adjustBasePrompt(basePrompt, profile);
        
        personalization = `\n\nПЕРСОНАЛИЗАЦИЯ НА ОСНОВЕ ПРОФИЛИРОВАНИЯ:\n${personalizedPrompt}`;
        
        // Добавляем демографические данные если есть
        if (profile.demographics) {
          personalization += `\n\nДЕМОГРАФИЧЕСКИЕ ДАННЫЕ:\nВозраст: ${profile.demographics.age}, Пол: ${profile.demographics.gender}, Вес: ${profile.demographics.weight}кг, Рост: ${profile.demographics.height}см`;
        }
        
        console.log('Персонализация (длина):', personalization.length);
      } catch (error) {
        console.error('Ошибка генерации персонализации:', error);
        personalization = '\n\nОШИБКА ПЕРСОНАЛИЗАЦИИ: Используется базовый промпт без адаптации.';
      }
    }

    // Добавляем контекст назначений если есть
    let assignmentsContext = '';
    if (context && (context.activeAssignments || context.allAssignments)) {
      assignmentsContext = '\n\nКОНТЕКСТ НАЗНАЧЕНИЙ:\n';
      
      if (context.activeAssignments && context.activeAssignments.length > 0) {
        assignmentsContext += `АКТИВНЫЕ НАЗНАЧЕНИЯ (${context.activeAssignments.length}):\n`;
        context.activeAssignments.forEach((assignment, index) => {
          assignmentsContext += `${index + 1}. ${assignment.title} (${assignment.type}) - ${assignment.description}\n`;
          if (assignment.scheduledDate) {
            assignmentsContext += `   Запланировано на: ${assignment.scheduledDate}\n`;
          }
        });
      }
      
      if (context.allAssignments && context.allAssignments.length > 0) {
        assignmentsContext += `\nВСЕГО НАЗНАЧЕНИЙ: ${context.allAssignments.length}\n`;
      }
      
      if (context.occurrences && context.occurrences.length > 0) {
        const pendingOccurrences = context.occurrences.filter(occ => occ.status === 'PENDING');
        if (pendingOccurrences.length > 0) {
          assignmentsContext += `\nОЖИДАЮТ ВЫПОЛНЕНИЯ: ${pendingOccurrences.length} вхождений\n`;
        }
      }
      
      assignmentsContext += '\nИНСТРУКЦИИ ПО НАЗНАЧЕНИЯМ:\n';
      assignmentsContext += '- Если пользователь просит помощи с назначениями, предложите конкретные действия\n';
      assignmentsContext += '- Помогите с планированием и мотивацией выполнения\n';
      assignmentsContext += '- Предложите адаптировать назначения под возможности пользователя\n';
      assignmentsContext += '- При необходимости помогите записаться к врачу для корректировки\n';
      
      console.log('Контекст назначений добавлен (длина):', assignmentsContext.length);
    }

    // Формируем итоговый системный промпт
    const systemPrompt = basePrompt + personalization + assignmentsContext;
    const total_prompt_length = systemPrompt.length;
    
    console.log('Итоговый промпт (общая длина):', total_prompt_length);

    // Формируем сообщения для OpenAI
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: message
      }
    ];

    // Вызываем OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

    res.status(200).json({
      response: response,
      prompt_length: total_prompt_length,
      has_profile: !!profile,
      has_assignments: !!(context && (context.activeAssignments || context.allAssignments))
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
