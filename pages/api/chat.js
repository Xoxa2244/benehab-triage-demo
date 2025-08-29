// pages/api/chat.js - Простая версия без OpenAI
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

    // Простой ответ без OpenAI для восстановления работоспособности
    let response = `Привет! Я Татьяна, ваш помощник по здоровью. 👋

Вы написали: "${message}"

Я здесь, чтобы помочь вам! Что вас беспокоит?`;

    // Добавляем информацию о профиле если есть
    if (profile && profile.demographics) {
      response += `\n\nЯ вижу, что вы ${profile.demographics.age} лет, ${profile.demographics.gender === 'male' ? 'мужчина' : 'женщина'}.`;
    }

    // Добавляем информацию о назначениях если есть
    if (context && context.activeAssignments && context.activeAssignments.length > 0) {
      response += `\n\nУ вас есть ${context.activeAssignments.length} активное назначение. Хотите, чтобы я помогла с ними?`;
    }

    // Добавляем общие советы
    response += `\n\nЯ могу помочь с:
• Общими вопросами о здоровье
• Информацией о препаратах (без дозировок)
• Записью к врачу
• Планированием назначений
• Поддержкой и мотивацией

Просто скажите, что вас интересует! 💪`;

    console.log('Ответ готов, отправляем...');

    res.status(200).json({
      response: response,
      success: true,
      timestamp: new Date().toISOString(),
      note: 'Простая версия Татьяны для восстановления работоспособности'
    });

  } catch (error) {
    console.error('Ошибка в API чата:', error);
    
    res.status(500).json({ 
      error: 'Ошибка обработки сообщения',
      details: error.message,
      fallback: 'Извините, произошла ошибка. Попробуйте еще раз.'
    });
  }
}
