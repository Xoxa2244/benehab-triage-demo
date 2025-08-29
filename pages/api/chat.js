// pages/api/chat.js - AI версия Татьяны
import OpenAI from 'openai';

const openai = OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Базовый промпт для Татьяны
function getBasePrompt() {
  return `Ты — "Татьяна", ассистент по здоровью Benehab.

ОСНОВНЫЕ ПРИНЦИПЫ:
• Говори тёпло и просто, с эмпатией
• Уважай выбор человека, не дави
• Не ставь диагнозы, не назначай лекарства
• Если есть опасные симптомы — советуй вызвать скорую
• Лёгкие симптомы — поддержка и отдых
• Средние симптомы — предложить записаться к врачу
• О препаратах давай только справочную информацию (показания, противопоказания, побочные эффекты) БЕЗ дозировок

ТОН ОБЩЕНИЯ:
• Дружелюбный и поддерживающий
• Профессиональный, но не формальный
• Используй эмодзи для теплоты
• Задавай уточняющие вопросы при необходимости
• Адаптируйся под индивидуальные особенности пациента

СЛОТЫ ДЛЯ ЗАПИСИ:
• 13:00, 15:00, 17:00 (только после согласия пользователя)
• После выбора: "Спасибо, вы записаны на [время]"

ПЕРСОНАЛИЗАЦИЯ:
• Учитывай возраст, пол и особенности пациента
• Адаптируй тон под психотип (если известен)
• Предлагай помощь с учетом индивидуальных потребностей`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, profile, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Получено сообщение:', message);
    console.log('Профиль:', profile ? 'Есть' : 'Нет');
    console.log('Контекст назначений:', context ? 'Есть' : 'Нет');

    // Формируем системный промпт
    let systemPrompt = getBasePrompt();
    
    // Добавляем информацию о профиле если есть
    if (profile) {
      if (profile.demographics) {
        systemPrompt += `\n\nИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ:\nВозраст: ${profile.demographics.age}, Пол: ${profile.demographics.gender}`;
        
        // Адаптируем тон под возраст
        if (profile.demographics.age < 30) {
          systemPrompt += '\n• Молодой пациент → более активный, мотивирующий тон';
        } else if (profile.demographics.age > 60) {
          systemPrompt += '\n• Пожилой пациент → более спокойный, уважительный тон, больше объяснений';
        }
      }
      
      // Простая персонализация на основе профилей
      if (profile.attitude_profile) {
        systemPrompt += '\n\nПРОФИЛЬ ОТНОШЕНИЯ К БОЛЕЗНИ: Учитывай особенности отношения к здоровью, адаптируй подход';
      }
      
      if (profile.accentuation_profile) {
        systemPrompt += '\n\nПСИХОТИП: Адаптируй общение под индивидуальные особенности личности';
      }
    }

    // Добавляем контекст назначений если есть
    if (context && context.activeAssignments && context.activeAssignments.length > 0) {
      systemPrompt += `\n\nАКТИВНЫЕ НАЗНАЧЕНИЯ:\nУ пользователя есть ${context.activeAssignments.length} активное назначение. Предложи конкретную помощь с планированием и выполнением.`;
      
      // Добавляем детали назначений
      context.activeAssignments.forEach((assignment, index) => {
        systemPrompt += `\n• ${assignment.title} (${assignment.type}) - ${assignment.description}`;
      });
      
      systemPrompt += '\n\nИНСТРУКЦИИ ПО НАЗНАЧЕНИЯМ:\n- Предложи конкретные действия для выполнения\n- Помоги с планированием времени\n- Поддержи мотивацию\n- При необходимости помоги адаптировать план';
    }

    console.log('Системный промпт готов, длина:', systemPrompt.length);

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

    console.log('Отправляем запрос к OpenAI...');

    // Вызываем OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    console.log('Получен ответ от OpenAI:', response.substring(0, 100) + '...');

    res.status(200).json({
      response: response,
      success: true,
      timestamp: new Date().toISOString(),
      note: 'AI версия Татьяны с персонализацией'
    });

  } catch (error) {
    console.error('Ошибка в API чата:', error);
    
    // Возвращаем понятную ошибку с fallback
    res.status(500).json({ 
      error: 'Ошибка обработки сообщения',
      details: error.message,
      fallback: 'Извините, у меня временные проблемы с AI. Но я здесь и готова помочь! Что вас беспокоит? Могу дать общие советы по здоровью.',
      note: 'Используется fallback ответ'
    });
  }
}
