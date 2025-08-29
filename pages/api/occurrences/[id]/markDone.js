export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Missing occurrence ID' });
    }

    // В демо-режиме просто возвращаем успех
    // В реальном приложении здесь была бы обновление БД
    res.status(200).json({ 
      message: 'Occurrence marked as done',
      occurrenceId: id,
      status: 'DONE',
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Ошибка отметки события:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
