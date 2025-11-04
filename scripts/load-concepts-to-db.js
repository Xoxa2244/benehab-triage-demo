/**
 * Скрипт для загрузки понятий из CSV в базу данных
 * Использование: node scripts/load-concepts-to-db.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаем CSV файл
const csvPath = path.join(__dirname, '..', 'data', 'values_concepts.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Парсим CSV
const lines = csvContent.trim().split('\n');
const concepts = [];

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
    const name = values[1].replace(/"/g, '').trim();
    const category = values[2].trim();
    const description = values[3].replace(/"/g, '').trim();
    
    if (!isNaN(id) && name && category && description) {
      concepts.push({
        id,
        name,
        category,
        description
      });
    }
  }
}

console.log(`✅ Найдено ${concepts.length} понятий`);

// Загружаем понятия через API
// ВАЖНО: Этот скрипт должен запускаться на сервере с доступом к API
// Или можно использовать прямой доступ к Supabase

// Для загрузки через API (если запускается на сервере):
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function loadConcepts() {
  console.log('📤 Загрузка понятий в базу данных...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const concept of concepts) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/concepts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: concept.name
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ ${concept.name} - загружено`);
        successCount++;
      } else {
        if (data.error?.includes('already exists') || data.error?.includes('duplicate')) {
          console.log(`⚠️  ${concept.name} - уже существует, пропускаем`);
        } else {
          console.log(`❌ ${concept.name} - ошибка: ${data.error}`);
          errorCount++;
        }
      }
    } catch (error) {
      console.log(`❌ ${concept.name} - ошибка: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Итого: ${successCount} успешно, ${errorCount} ошибок`);
}

// Также обновляем M (ранг) на 11
async function updateRankConfig() {
  console.log('\n📤 Обновление M (ранг) на 11...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/ranks`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        M: 11
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ M обновлен на ${data.M}`);
    } else {
      console.log(`❌ Ошибка обновления M: ${data.error}`);
    }
  } catch (error) {
    console.log(`❌ Ошибка обновления M: ${error.message}`);
  }
}

// Экспортируем данные для использования в других скриптах
export { concepts, loadConcepts, updateRankConfig };

// Если запускается напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('⚠️  Для загрузки через API используйте:');
  console.log('   node scripts/load-concepts-direct.js');
  console.log('\nИли используйте прямой доступ к Supabase (см. load-concepts-direct.js)');
}

