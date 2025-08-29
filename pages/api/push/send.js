// API для отправки push-уведомлений (демо-режим)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subscription, payload } = req.body;

    if (!subscription || !payload) {
      return res.status(400).json({ error: 'Missing subscription or payload' });
    }

    // В демо-режиме просто возвращаем успех
    // В реальном приложении здесь была бы отправка через web-push
    console.log('Отправка push-уведомления:', { subscription, payload });

    // Имитируем отправку
    await new Promise(resolve => setTimeout(resolve, 100));

    res.status(200).json({ 
      success: true, 
      message: 'Push-уведомление отправлено (демо-режим)',
      sentAt: new Date().toISOString(),
      note: 'В демо-режиме уведомления не отправляются реально'
    });

  } catch (error) {
    console.error('Ошибка отправки push-уведомления:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
