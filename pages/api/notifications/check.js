// pages/api/notifications/check.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { assignmentId } = req.body;
    
    // В демо-режиме просто возвращаем информацию о проверке
    const now = new Date();
    const currentTime = now.toLocaleTimeString('ru-RU');
    
    console.log(`[${currentTime}] Проверка уведомлений для назначения:`, assignmentId);
    
    // Здесь должна быть логика проверки времени и отправки уведомлений
    // В реальном приложении это делается через cron-джобу
    
    res.status(200).json({
      message: 'Проверка уведомлений выполнена',
      timestamp: now.toISOString(),
      currentTime,
      assignmentId,
      note: 'В демо-режиме уведомления не отправляются автоматически. Используйте кнопку "Тестовое уведомление" на странице назначений.'
    });
    
  } catch (error) {
    console.error('Ошибка проверки уведомлений:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
