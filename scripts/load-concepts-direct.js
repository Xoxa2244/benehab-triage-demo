/**
 * Скрипт для прямой загрузки понятий в Supabase
 * Использование: node scripts/load-concepts-direct.js
 * 
 * Требует переменные окружения:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Проверяем переменные окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Ошибка: Необходимы переменные окружения NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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

console.log(`✅ Найдено ${concepts.length} понятий\n`);

// Загружаем понятия в базу
async function loadConcepts() {
  console.log('📤 Загрузка понятий в базу данных...\n');
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const concept of concepts) {
    try {
      // Проверяем, существует ли уже понятие
      const { data: existing } = await supabase
        .from('concepts')
        .select('id, name')
        .eq('name', concept.name)
        .single();
      
      if (existing) {
        console.log(`⚠️  ${concept.name} - уже существует, пропускаем`);
        skipCount++;
        continue;
      }
      
      // Создаем новое понятие
      const { data, error } = await supabase
        .from('concepts')
        .insert([{ name: concept.name }])
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') { // Unique violation
          console.log(`⚠️  ${concept.name} - уже существует (по constraint), пропускаем`);
          skipCount++;
        } else {
          console.log(`❌ ${concept.name} - ошибка: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`✅ ${concept.name} - загружено (ID: ${data.id})`);
        successCount++;
      }
    } catch (error) {
      console.log(`❌ ${concept.name} - ошибка: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Итого: ${successCount} загружено, ${skipCount} пропущено, ${errorCount} ошибок`);
}

// Обновляем M (ранг) на 11
async function updateRankConfig() {
  console.log('\n📤 Обновление M (ранг) на 11...');
  
  try {
    const { data, error } = await supabase
      .from('rank_config')
      .update({ M: 11, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();
    
    if (error) {
      console.log(`❌ Ошибка обновления M: ${error.message}`);
    } else {
      console.log(`✅ M обновлен на ${data.M}`);
    }
  } catch (error) {
    console.log(`❌ Ошибка обновления M: ${error.message}`);
  }
}

// Запускаем
async function main() {
  await loadConcepts();
  await updateRankConfig();
  console.log('\n✅ Готово!');
}

main().catch(console.error);

