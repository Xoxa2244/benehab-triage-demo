import webpush from 'web-push';

// VAPID ключи (в демо-режиме используем заглушки)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa1HI0Z-NZcvtVq2kfKjEFKvdkJDIBFUCQoTfGa7u2XBAKN-WWd1W01sfFjId0';
const VAPID_PRIVATE_KEY = 'your-vapid-private-key-here';

webpush.setVapidDetails(
  'mailto:demo@benehab.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

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
      message: 'Push-уведомление отправлено',
      sentAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Ошибка отправки push-уведомления:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
