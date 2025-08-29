export default async function handler(req, res) {
  if (req.method === 'POST') {
    // POST /api/subscriptions - сохранить push-подписку
    try {
      const { endpoint, p256dh, auth } = req.body;
      
      if (!endpoint || !p256dh || !auth) {
        return res.status(400).json({ error: 'Missing required subscription fields' });
      }

      const subscription = {
        id: `sub_${Date.now()}`,
        userId: 'demo_user', // В демо-режиме используем фиксированный ID
        endpoint,
        p256dh,
        auth,
        createdAt: new Date().toISOString()
      };

      // В демо-режиме просто возвращаем созданную подписку
      // В реальном приложении здесь была бы запись в БД
      res.status(201).json({ subscription });
    } catch (error) {
      console.error('Ошибка сохранения подписки:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
