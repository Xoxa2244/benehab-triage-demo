// pages/api/chat.js - Восстановленный рабочий API для Татьяны
import OpenAI from 'openai';

const openai = OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fallback ответы для разных типов вопросов
function getFallbackResponse(message, profile, context) {
  const lowerMessage = message.toLowerCase();
  
  let response = `Привет! Я Татьяна, ваш помощник по здоровью. 👋\n\n`;
  
  // Анализируем сообщение и даем соответствующий ответ
  if (lowerMessage.includes('привет') || lowerMessage.includes('здравствуй')) {
    response += `Рада вас видеть! Как ваше самочувствие сегодня?`;
  } else if (lowerMessage.includes('врач') || lowerMessage.includes('запись')) {
    response += `Хотите записаться к врачу? У нас есть свободные слоты: 13:00, 15:00, 17:00. Какое время вам удобно?`;
  } else if (lowerMessage.includes('препарат') || lowerMessage.includes('лекарство') || lowerMessage.includes('таблетка')) {
    response += `О препаратах могу дать общую информацию (показания, противопоказания, побочные эффекты), но дозировки определяет только врач. Что именно вас интересует?`;
  } else if (lowerMessage.includes('симптом') || lowerMessage.includes('болит') || lowerMessage.includes('плохо')) {
    response += `Понимаю, что вас что-то беспокоит. Расскажите подробнее - когда началось, что именно болит, есть ли другие симптомы?`;
  } else if (lowerMessage.includes('назначение') || lowerMessage.includes('помощь')) {
    response += `Конечно, помогу с назначениями! Что именно нужно сделать?`;
  } else {
    response += `Интересный вопрос! Расскажите подробнее, что вас интересует.`;
  }
  
  // Добавляем информацию о профиле если есть
  if (profile && profile.demographics) {
    response += `\n\nЯ вижу, что вы ${profile.demographics.age} лет, ${profile.demographics.gender === 'male' ? 'мужчина' : 'женщина'}. `;
    
    if (profile.demographics.age < 30) {
      response += `В вашем возрасте важно заботиться о здоровье для будущего! 💪`;
    } else if (profile.demographics.age > 60) {
      response += `В вашем возрасте особенно важно регулярно проходить обследования. 🏥`;
    }
  }
  
  // Добавляем информацию о назначениях если есть
  if (context && context.activeAssignments && context.activeAssignments.length > 0) {
    response += `\n\nУ вас есть ${context.activeAssignments.length} активное назначение. Хотите, чтобы я помогла с планированием?`;
  }
  
  response += `\n\nЯ здесь, чтобы поддержать вас! 💙`;
  
  return response;
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

    console.log('🔄 ВОССТАНОВЛЕННЫЙ API: Получено сообщение:', message);
    console.log('🔄 ВОССТАНОВЛЕННЫЙ API: Профиль:', profile ? 'Есть' : 'Нет');
    console.log('🔄 ВОССТАНОВЛЕННЫЙ API: Контекст назначений:', context ? 'Есть' : 'Нет');

    // Пытаемся использовать OpenAI
    try {
      console.log('🔄 ВОССТАНОВЛЕННЫЙ API: Пытаемся использовать OpenAI...');
      
      const systemPrompt = `Ты — "Татьяна", ассистент по здоровью Benehab. Говори тёпло, с эмпатией, адаптируйся под пользователя. Не ставь диагнозы, не назначай лекарства. О препаратах давай только справочную информацию БЕЗ дозировок.`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0].message.content;
      console.log('🔄 ВОССТАНОВЛЕННЫЙ API: OpenAI ответ получен:', aiResponse.substring(0, 100) + '...');

      res.status(200).json({
        response: aiResponse,
        success: true,
        timestamp: new Date().toISOString(),
        note: 'AI ответ от OpenAI (ВОССТАНОВЛЕННЫЙ API)'
      });
      
    } catch (openaiError) {
      console.log('🔄 ВОССТАНОВЛЕННЫЙ API: OpenAI недоступен, используем fallback:', openaiError.message);
      
      // Используем fallback ответ
      const fallbackResponse = getFallbackResponse(message, profile, context);
      
      res.status(200).json({
        response: fallbackResponse,
        success: true,
        timestamp: new Date().toISOString(),
        note: 'Fallback ответ (ВОССТАНОВЛЕННЫЙ API)',
        openai_error: openaiError.message
      });
    }

  } catch (error) {
    console.error('🔄 ВОССТАНОВЛЕННЫЙ API: Критическая ошибка:', error);
    
    // Критический fallback
    res.status(500).json({ 
      error: 'Критическая ошибка',
      details: error.message,
      fallback: 'Извините, у меня технические проблемы. Попробуйте написать еще раз через минуту.',
      note: 'Критический fallback (ВОССТАНОВЛЕННЫЙ API)'
    });
  }
}
