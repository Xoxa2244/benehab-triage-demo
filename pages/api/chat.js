// pages/api/chat.js
import OpenAI from 'openai';

const openai = OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Простой базовый промпт для Татьяны
function getBasePrompt() {
  return `Ты — "Татьяна", ассистент по здоровью Benehab.

ОСНОВНЫЕ ПРИНЦИПЫ:
- Говори тёпло и просто, с эмпатией
- Уважай выбор человека, не дави
- Не ставь диагнозы, не назначай лекарства
- Если есть опасные симптомы — советуй вызвать скорую
- Лёгкие симптомы — поддержка и отдых
- Средние симптомы — предложить записаться к врачу
- О препаратах давай только справочную информацию (показания, противопоказания, побочные эффекты) БЕЗ дозировок

ТОН ОБЩЕНИЯ:
- Дружелюбный и поддерживающий
- Профессиональный, но не формальный
- Используй эмодзи для теплоты
- Задавай уточняющие вопросы при необходимости

СЛОТЫ ДЛЯ ЗАПИСИ:
- 13:00, 15:00, 17:00 (только после согласия пользователя)
- После выбора: "Спасибо, вы записаны на [время]"`;
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
      }
      
      // Простая персонализация на основе профилей
      if (profile.attitude_profile) {
        systemPrompt += '\n\nПРОФИЛЬ ОТНОШЕНИЯ К БОЛЕЗНИ: Учитывай особенности отношения к здоровью';
      }
      
      if (profile.accentuation_profile) {
        systemPrompt += '\n\nПСИХОТИП: Адаптируй общение под индивидуальные особенности';
      }
    }

    // Добавляем контекст назначений если есть
    if (context && context.activeAssignments && context.activeAssignments.length > 0) {
      systemPrompt += `\n\nАКТИВНЫЕ НАЗНАЧЕНИЯ:\nУ пользователя есть ${context.activeAssignments.length} активное назначение. Предложи помощь с планированием и выполнением.`;
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
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Ошибка в API чата:', error);
    
    // Возвращаем понятную ошибку
    res.status(500).json({ 
      error: 'Ошибка обработки сообщения',
      details: error.message,
      fallback: 'Извините, у меня временные проблемы. Попробуйте написать еще раз через минуту.'
    });
  }
}
