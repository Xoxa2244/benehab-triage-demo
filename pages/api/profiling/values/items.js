// pages/api/profiling/values/items.js

import { supabaseAdmin } from '../../../../lib/supabase/server';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Пытаемся загрузить из базы данных
    let items = [];
    let fromDatabase = false;
    
    try {
      const { data, error } = await supabaseAdmin
        .from('concepts')
        .select('id, name')
        .order('name');
      
      if (!error && data && data.length > 0) {
        // Загружаем из базы данных
        items = data.map((concept, index) => ({
          id: concept.id,
          concept: concept.name,
          category: 'values', // По умолчанию, можно добавить категории в базу позже
          description: '' // Можно добавить описание в базу позже
        }));
        fromDatabase = true;
        console.log(`✅ Загружено ${items.length} понятий из базы данных`);
      }
    } catch (dbError) {
      console.log('⚠️  Ошибка загрузки из базы, используем CSV fallback:', dbError.message);
    }
    
    // Fallback: если база данных пуста или произошла ошибка, используем CSV
    if (!fromDatabase || items.length === 0) {
      console.log('📄 Загрузка понятий из CSV файла (fallback)...');
      
      const csvPath = path.join(process.cwd(), 'data', 'values_concepts.csv');
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      
      // Парсим CSV с учетом запятых в тексте
      const lines = csvContent.trim().split('\n');
      items = [];
      
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
        values.push(current.trim());
        
        if (values.length >= 4) {
          const id = parseInt(values[0]);
          const concept = values[1].replace(/"/g, '');
          const category = values[2];
          const description = values[3].replace(/"/g, '');
          
          if (!isNaN(id) && concept && category && description) {
            items.push({
              id: id.toString(),
              concept,
              category,
              description
            });
          }
        }
      }
    }

    // Группируем по категориям
    const categories = {};
    items.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });

    res.status(200).json({
      success: true,
      items,
      total: items.length,
      categories: Object.keys(categories).map(cat => ({
        name: cat,
        count: categories[cat].length,
        items: categories[cat]
      })),
      source: fromDatabase ? 'database' : 'csv'
    });
  } catch (error) {
    console.error('Ошибка загрузки понятий:', error);
    res.status(500).json({ 
      error: 'Ошибка загрузки понятий',
      details: error.message 
    });
  }
}
