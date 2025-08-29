// pages/api/test-chat.js - Простой тестовый API для диагностики
export default function handler(req, res) {
  console.log('🧪 ТЕСТОВЫЙ API: Получен запрос:', req.method);
  console.log('🧪 ТЕСТОВЫЙ API: Headers:', req.headers);
  console.log('🧪 ТЕСТОВЫЙ API: Body:', req.body);
  
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Тестовый API работает!',
      method: req.method,
      timestamp: new Date().toISOString(),
      note: 'GET запрос успешен'
    });
  }
  
  if (req.method === 'POST') {
    const { message } = req.body;
    
    console.log('🧪 ТЕСТОВЫЙ API: POST сообщение:', message);
    
    return res.status(200).json({
      message: 'Тестовый API POST работает!',
      received_message: message,
      method: req.method,
      timestamp: new Date().toISOString(),
      note: 'POST запрос успешен'
    });
  }
  
  return res.status(405).json({
    error: 'Method not allowed',
    allowed_methods: ['GET', 'POST'],
    received_method: req.method
  });
}
