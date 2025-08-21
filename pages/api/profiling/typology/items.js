// pages/api/profiling/typology/items.js

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Читаем CSV файл с вопросами
    const csvPath = path.join(process.cwd(), 'data', 'typology_items.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Парсим CSV
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const items = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= 3) {
        items.push({
          id: parseInt(values[0]),
          question_text: values[1].replace(/"/g, ''),
          column: parseInt(values[2])
        });
      }
    }

    // Группируем вопросы по колонкам
    const columns = {};
    items.forEach(item => {
      if (!columns[item.column]) {
        columns[item.column] = [];
      }
      columns[item.column].push(item);
    });

    res.status(200).json({
      success: true,
      items,
      total: items.length,
      columns: Object.keys(columns).map(col => ({
        column: parseInt(col),
        count: columns[col].length,
        questions: columns[col]
      }))
    });
  } catch (error) {
    console.error('Ошибка загрузки вопросов:', error);
    res.status(500).json({ 
      error: 'Ошибка загрузки вопросов',
      details: error.message 
    });
  }
}
