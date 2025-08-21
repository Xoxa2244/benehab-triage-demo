// pages/api/profiling/typology/items.js

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Читаем CSV файл с вопросами
    const csvPath = path.join(process.cwd(), 'data', 'questions_personality.csv');
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
      
      if (values.length >= 5) {
        const id = parseInt(values[0]);
        const question_text = values[1].replace(/"/g, '');
        const option_id = parseInt(values[2]);
        const option_text = values[3].replace(/"/g, '');
        const ptype = values[4];
        
        if (!isNaN(id) && !isNaN(option_id) && question_text && option_text && ptype) {
          items.push({
            id,
            question_text,
            option_id,
            option_text,
            ptype
          });
        }
      }
    }

    // Группируем вопросы по номерам вопросов
    const questions = {};
    items.forEach(item => {
      if (!questions[item.id]) {
        questions[item.id] = {
          id: item.id,
          question_text: item.question_text,
          options: []
        };
      }
      questions[item.id].options.push({
        option_id: item.option_id,
        option_text: item.option_text,
        ptype: item.ptype
      });
    });

    // Преобразуем в массив и сортируем по ID вопроса
    const questionsArray = Object.values(questions).sort((a, b) => a.id - b.id);

    res.status(200).json({
      success: true,
      items: questionsArray,
      total: questionsArray.length,
      questions: questionsArray
    });
  } catch (error) {
    console.error('Ошибка загрузки вопросов:', error);
    res.status(500).json({ 
      error: 'Ошибка загрузки вопросов',
      details: error.message 
    });
  }
}
