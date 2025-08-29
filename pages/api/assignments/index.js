export default async function handler(req, res) {
  if (req.method === 'GET') {
    // GET /api/assignments - получить все назначения
    try {
      // В демо-режиме возвращаем пустой массив
      // В реальном приложении здесь была бы работа с БД
      res.status(200).json({ assignments: [] });
    } catch (error) {
      console.error('Ошибка получения назначений:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    // POST /api/assignments - создать новое назначение
    try {
      const { type, title, description, scheduledAt, notif1, notif2, postInterval } = req.body;
      
      if (!type || !title || !scheduledAt) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newAssignment = {
        id: `assignment_${Date.now()}`,
        type,
        title,
        description: description || '',
        scheduledAt,
        notif1,
        notif2,
        postInterval,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // В демо-режиме просто возвращаем созданное назначение
      // В реальном приложении здесь была бы запись в БД
      res.status(201).json({ assignment: newAssignment });
    } catch (error) {
      console.error('Ошибка создания назначения:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
