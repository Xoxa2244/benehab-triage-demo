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
    
    // Парсим CSV с учетом запятых в тексте
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const items = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Умный парсинг CSV с учетом запятых в тексте
      let values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // Добавляем последнее значение
      
      if (values.length >= 3) {
        const id = parseInt(values[0]);
        const question_text = values[1].replace(/"/g, '');
        const column = parseInt(values[2]);
        
        if (!isNaN(id) && !isNaN(column) && question_text) {
          items.push({
            id,
            question_text,
            column
          });
        }
      }
    }

    // Группируем вопросы по колонкам (исключаем null)
    const columns = {};
    items.forEach(item => {
      if (item.column && !isNaN(item.column)) {
        if (!columns[item.column]) {
          columns[item.column] = [];
        }
        columns[item.column].push(item);
      }
    });

    res.status(200).json({
      success: true,
      items,
      total: items.length,
      columns: Object.keys(columns)
        .filter(col => col !== 'null' && !isNaN(parseInt(col)))
        .map(col => ({
          column: parseInt(col),
          count: columns[col].length,
          questions: columns[col]
        }))
        .sort((a, b) => a.column - b.column) // Сортируем по номеру колонки
    });
  } catch (error) {
    console.error('Ошибка загрузки вопросов:', error);
    res.status(500).json({ 
      error: 'Ошибка загрузки вопросов',
      details: error.message 
    });
  }
}
