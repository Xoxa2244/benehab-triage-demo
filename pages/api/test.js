// pages/api/test.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Проверяем переменные окружения
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    const openAIKeyLength = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0;
    
    res.status(200).json({
      message: 'API работает!',
      timestamp: new Date().toISOString(),
      environment: {
        hasOpenAIKey,
        openAIKeyLength,
        nodeEnv: process.env.NODE_ENV,
        vercel: process.env.VERCEL ? 'Да' : 'Нет'
      }
    });
  } catch (error) {
    console.error('Ошибка в тестовом API:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
