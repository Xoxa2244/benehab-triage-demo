export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    // GET /api/assignments/[id] - получить назначение по ID
    try {
      // В демо-режиме возвращаем заглушку
      res.status(200).json({ 
        assignment: {
          id,
          type: 'прием препарата',
          title: 'Демо назначение',
          description: 'Это демо-назначение для тестирования',
          scheduledAt: new Date().toISOString(),
          notif1: 'PT3M',
          notif2: 'PT1M',
          postInterval: 'PT3M',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Ошибка получения назначения:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PATCH') {
    // PATCH /api/assignments/[id] - обновить назначение
    try {
      const { type, title, description, scheduledAt, notif1, notif2, postInterval } = req.body;
      
      if (!type || !title || !scheduledAt) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const updatedAssignment = {
        id,
        type,
        title,
        description: description || '',
        scheduledAt,
        notif1,
        notif2,
        postInterval,
        updatedAt: new Date().toISOString()
      };

      // В демо-режиме просто возвращаем обновленное назначение
      res.status(200).json({ assignment: updatedAssignment });
    } catch (error) {
      console.error('Ошибка обновления назначения:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'DELETE') {
    // DELETE /api/assignments/[id] - удалить назначение
    try {
      // В демо-режиме просто возвращаем успех
      res.status(200).json({ message: 'Assignment deleted successfully' });
    } catch (error) {
      console.error('Ошибка удаления назначения:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
