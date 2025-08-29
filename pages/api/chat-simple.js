// pages/api/chat-simple.js - Простая версия для диагностики
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Получено сообщение:', message);

    // Простой ответ без OpenAI для тестирования
    const simpleResponse = `Привет! Я Татьяна, ваш помощник по здоровью. 👋

Вы написали: "${message}"

К сожалению, у меня временные проблемы с подключением к AI-сервису. Но я здесь и готова помочь!

Что вас беспокоит? Могу дать общие советы по здоровью или помочь с назначениями.`;

    res.status(200).json({
      response: simpleResponse,
      success: true,
      timestamp: new Date().toISOString(),
      note: 'Это простая версия Татьяны для диагностики'
    });

  } catch (error) {
    console.error('Ошибка в простом API чата:', error);
    
    res.status(500).json({ 
      error: 'Ошибка обработки сообщения',
      details: error.message,
      fallback: 'Извините, произошла ошибка. Попробуйте еще раз.'
    });
  }
}
