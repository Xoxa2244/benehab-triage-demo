// pages/api/chat.js - Улучшенная версия с проактивностью по назначениям
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

// Улучшенный fallback с проактивностью по назначениям
function getFallbackResponse(message, profile, context) {
  const lowerMessage = message.toLowerCase();
  
  let response = `Привет! Я Татьяна, ваш помощник по здоровью. 👋\n\n`;
  
  // ПРОАКТИВНОСТЬ: Сначала проверяем назначения
  if (context && context.activeAssignments && context.activeAssignments.length > 0) {
    response += `📋 **ВАЖНО! У вас есть ${context.activeAssignments.length} невыполненное назначение:**\n\n`;
    
    context.activeAssignments.forEach((assignment, index) => {
      response += `${index + 1}. **${assignment.title}** (${assignment.type})\n`;
      if (assignment.description) {
        response += `   ${assignment.description}\n`;
      }
      if (assignment.dueDate) {
        response += `   📅 Срок: ${new Date(assignment.dueDate).toLocaleDateString()}\n`;
      }
      response += `\n`;
    });
    
    response += `💡 **Рекомендую:**\n`;
    response += `• Выполнить назначения в ближайшее время\n`;
    response += `• Установить напоминания\n`;
    response += `• Обсудить сложности, если есть\n\n`;
  }
  
  // Анализируем сообщение и даем соответствующий ответ
  if (lowerMessage.includes('привет') || lowerMessage.includes('здравствуй')) {
    response += `Рада вас видеть! Как ваше самочувствие сегодня?`;
    
    // Дополнительная проактивность при приветствии
    if (context && context.activeAssignments && context.activeAssignments.length > 0) {
      response += `\n\nКстати, я вижу ваши назначения выше. Хотите, чтобы я помогла с их выполнением?`;
    }
  } else if (lowerMessage.includes('врач') || lowerMessage.includes('запись')) {
    response += `Хотите записаться к врачу? У нас есть свободные слоты: 13:00, 15:00, 17:00. Какое время вам удобно?`;
  } else if (lowerMessage.includes('препарат') || lowerMessage.includes('лекарство') || lowerMessage.includes('таблетка')) {
    response += `О препаратах могу дать общую информацию (показания, противопоказания, побочные эффекты), но дозировки определяет только врач. Что именно вас интересует?`;
  } else if (lowerMessage.includes('симптом') || lowerMessage.includes('болит') || lowerMessage.includes('плохо')) {
    response += `Понимаю, что вас что-то беспокоит. Расскажите подробнее - когда началось, что именно болит, есть ли другие симптомы?`;
  } else if (lowerMessage.includes('назначение') || lowerMessage.includes('помощь') || lowerMessage.includes('задача') || lowerMessage.includes('напомни') || lowerMessage.includes('что назначили')) {
    response += `Конечно, помогу с назначениями! `;
    
    if (context && context.activeAssignments && context.activeAssignments.length > 0) {
      response += `У вас есть ${context.activeAssignments.length} активное назначение. Давайте разберем каждое:\n\n`;
      
      context.activeAssignments.forEach((assignment, index) => {
        response += `**${assignment.title}** (${assignment.type})\n`;
        if (assignment.description) {
          response += `${assignment.description}\n`;
        }
        response += `Что именно нужно сделать? Есть ли сложности?\n\n`;
      });
      
      // Дополнительная помощь
      response += `💡 **Что могу предложить:**\n`;
      response += `• Помочь с планированием времени\n`;
      response += `• Обсудить сложности выполнения\n`;
      response += `• Настроить напоминания\n`;
      response += `• Адаптировать план под ваши возможности\n\n`;
      
      response += `С каким назначением нужна помощь в первую очередь?`;
    } else {
      response += `Сейчас у вас нет активных назначений. Хотите создать новое?`;
    }
  } else {
    response += `Интересный вопрос! Расскажите подробнее, что вас интересует.`;
  }
  
  // Добавляем информацию о профиле если есть
  if (profile && profile.demographics) {
    response += `\n\n👤 **О вас:** ${profile.demographics.age} лет, ${profile.demographics.gender === 'male' ? 'мужчина' : 'женщина'}. `;
    
    if (profile.demographics.age < 30) {
      response += `В вашем возрасте важно заботиться о здоровье для будущего! 💪`;
    } else if (profile.demographics.age > 60) {
      response += `В вашем возрасте особенно важно регулярно проходить обследования. 🏥`;
    }
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

    console.log('🎯 УЛУЧШЕННЫЙ API: Получено сообщение:', message);
    console.log('🎯 УЛУЧШЕННЫЙ API: Профиль:', profile ? 'Есть' : 'Нет');
    console.log('🎯 УЛУЧШЕННЫЙ API: Контекст назначений:', context ? 'Есть' : 'Нет');
    
    if (context && context.activeAssignments) {
      console.log('🎯 УЛУЧШЕННЫЙ API: Активные назначения:', context.activeAssignments.length);
      context.activeAssignments.forEach((assignment, index) => {
        console.log(`   ${index + 1}. ${assignment.title} (${assignment.type})`);
      });
    } else {
      console.log('🎯 УЛУЧШЕННЫЙ API: Контекст назначений отсутствует или пуст');
    }

    // Пытаемся использовать OpenAI если доступен
    if (openai) {
      try {
        console.log('🎯 УЛУЧШЕННЫЙ API: Пытаемся использовать OpenAI...');
        
        // УЛУЧШЕННЫЙ СИСТЕМНЫЙ ПРОМПТ С НАЗНАЧЕНИЯМИ
        let systemPrompt = `Ты — "Татьяна", ассистент по здоровью Benehab. Говори тёпло, с эмпатией, адаптируйся под пользователя. Не ставь диагнозы, не назначай лекарства. О препаратах давай только справочную информацию БЕЗ дозировок.

ОСОБЕННО ВАЖНО - БУДЬ ПРОАКТИВНОЙ ПО НАЗНАЧЕНИЯМ:
• Если у пользователя есть невыполненные назначения - ОБЯЗАТЕЛЬНО упомяни их
• Предложи конкретную помощь с каждым назначением
• Напомни о важности выполнения назначений
• Спроси о сложностях и помоги их решить
• Будь настойчивой, но доброжелательной

ТОН ОБЩЕНИЯ:
• Дружелюбный и поддерживающий
• Профессиональный, но не формальный
• Используй эмодзи для теплоты
• Задавай уточняющие вопросы при необходимости`;

        // Добавляем информацию о назначениях в промпт
        if (context && context.activeAssignments && context.activeAssignments.length > 0) {
          console.log('🎯 УЛУЧШЕННЫЙ API: Добавляю назначения в промпт OpenAI');
          
          systemPrompt += `\n\nАКТИВНЫЕ НАЗНАЧЕНИЯ ПОЛЬЗОВАТЕЛЯ (ОБЯЗАТЕЛЬНО УЧТИ):
У пользователя ${context.activeAssignments.length} невыполненное назначение:`;
          
          context.activeAssignments.forEach((assignment, index) => {
            systemPrompt += `\n${index + 1}. ${assignment.title} (${assignment.type})`;
            if (assignment.description) {
              systemPrompt += ` - ${assignment.description}`;
            }
            if (assignment.dueDate) {
              systemPrompt += ` - срок: ${new Date(assignment.dueDate).toLocaleDateString()}`;
            }
          });
          
          systemPrompt += `\n\nИНСТРУКЦИИ ПО НАЗНАЧЕНИЯМ:
- ОБЯЗАТЕЛЬНО упомяни назначения в ответе
- Предложи конкретную помощь с каждым
- Напомни о важности выполнения
- Спроси о сложностях
- Будь проактивной и настойчивой`;
          
          console.log('🎯 УЛУЧШЕННЫЙ API: Промпт OpenAI обновлен с назначениями');
        } else {
          console.log('🎯 УЛУЧШЕННЫЙ API: Назначений нет, промпт OpenAI без назначений');
        }
        
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
        console.log('🎯 УЛУЧШЕННЫЙ API: OpenAI ответ получен:', aiResponse.substring(0, 100) + '...');

        res.status(200).json({
          response: aiResponse,
          success: true,
          timestamp: new Date().toISOString(),
          note: 'AI ответ от OpenAI (УЛУЧШЕННЫЙ API)',
          assignments_count: context?.activeAssignments?.length || 0
        });
        return;
        
      } catch (openaiError) {
        console.log('🎯 УЛУЧШЕННЫЙ API: OpenAI недоступен, используем fallback:', openaiError.message);
      }
    } else {
      console.log('🎯 УЛУЧШЕННЫЙ API: OpenAI не инициализирован, используем fallback');
    }
    
    // Используем улучшенный fallback ответ
    console.log('🎯 УЛУЧШЕННЫЙ API: Используем fallback ответ');
    const fallbackResponse = getFallbackResponse(message, profile, context);
    
    res.status(200).json({
      response: fallbackResponse,
      success: true,
      timestamp: new Date().toISOString(),
      note: 'Улучшенный fallback ответ (УЛУЧШЕННЫЙ API)',
      openai_available: !!openai,
      assignments_count: context?.activeAssignments?.length || 0
    });

  } catch (error) {
    console.error('🎯 УЛУЧШЕННЫЙ API: Критическая ошибка:', error);
    
    // Критический fallback
    res.status(500).json({ 
      error: 'Критическая ошибка',
      details: error.message,
      fallback: 'Извините, у меня технические проблемы. Попробуйте написать еще раз через минуту.',
      note: 'Критический fallback (УЛУЧШЕННЫЙ API)'
    });
  }
}
