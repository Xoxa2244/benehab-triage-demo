// pages/api/profiling/attitude/items.js

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Читаем CSV файл с вопросами
    const csvPath = path.join(process.cwd(), 'data', 'attitude_items.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Парсим CSV
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const items = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= 4) {
        items.push({
          id: parseInt(values[0]),
          text: values[1],
          scale: values[2],
          reverse: values[3] === 'true'
        });
      }
    }

    res.status(200).json({
      success: true,
      items,
      total: items.length,
      scales: [...new Set(items.map(item => item.scale))]
    });
  } catch (error) {
    console.error('Ошибка загрузки вопросов:', error);
    res.status(500).json({ 
      error: 'Ошибка загрузки вопросов',
      details: error.message 
    });
  }
}
