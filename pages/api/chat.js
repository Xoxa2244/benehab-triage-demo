// pages/api/chat.js - Тестовая версия для локального тестирования
import OpenAI from 'openai';

// Инициализируем OpenAI только если есть API ключ
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI инициализирован');
  } else {
    console.log('⚠️ OPENAI_API_KEY не найден, используем только fallback');
  }
} catch (error) {
  console.log('⚠️ Ошибка инициализации OpenAI:', error.message);
}

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

    console.log('🧪 ЛОКАЛЬНЫЙ ТЕСТ: Получено сообщение:', message);
    console.log('🧪 ЛОКАЛЬНЫЙ ТЕСТ: Профиль:', profile ? 'Есть' : 'Нет');
    console.log('🧪 ЛОКАЛЬНЫЙ ТЕСТ: Контекст назначений:', context ? 'Есть' : 'Нет');

    // Пытаемся использовать OpenAI если доступен
    if (openai) {
      try {
        console.log('🧪 ЛОКАЛЬНЫЙ ТЕСТ: Пытаемся использовать OpenAI...');
        
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
        console.log('🧪 ЛОКАЛЬНЫЙ ТЕСТ: OpenAI ответ получен:', aiResponse.substring(0, 100) + '...');

        res.status(200).json({
          response: aiResponse,
          success: true,
          timestamp: new Date().toISOString(),
          note: 'AI ответ от OpenAI (ЛОКАЛЬНЫЙ ТЕСТ)'
        });
        return;
        
      } catch (openaiError) {
        console.log('🧪 ЛОКАЛЬНЫЙ ТЕСТ: OpenAI недоступен, используем fallback:', openaiError.message);
      }
    } else {
      console.log('🧪 ЛОКАЛЬНЫЙ ТЕСТ: OpenAI не инициализирован, используем fallback');
    }
    
    // Используем fallback ответ
    const fallbackResponse = getFallbackResponse(message, profile, context);
    
    res.status(200).json({
      response: fallbackResponse,
      success: true,
      timestamp: new Date().toISOString(),
      note: 'Fallback ответ (ЛОКАЛЬНЫЙ ТЕСТ)',
      openai_available: !!openai
    });

  } catch (error) {
    console.error('🧪 ЛОКАЛЬНЫЙ ТЕСТ: Критическая ошибка:', error);
    
    // Критический fallback
    res.status(500).json({ 
      error: 'Критическая ошибка',
      details: error.message,
      fallback: 'Извините, у меня технические проблемы. Попробуйте написать еще раз через минуту.',
      note: 'Критический fallback (ЛОКАЛЬНЫЙ ТЕСТ)'
    });
  }
}
