import { supabaseAdmin } from '../../../../../lib/supabase/server'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    // Читаем CSV файл с понятиями
    const csvPath = path.join(process.cwd(), 'data', 'values_concepts.csv')
    
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'CSV file not found' 
      })
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    // Парсим CSV
    const lines = csvContent.trim().split('\n')
    const concepts = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      
      // Умный парсинг CSV с учетом запятых в тексте
      let values = []
      let current = ''
      let inQuotes = false
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())
      
      if (values.length >= 4) {
        const name = values[1].replace(/"/g, '').trim()
        
        if (name) {
          concepts.push({ name })
        }
      }
    }

    if (concepts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No concepts found in CSV' 
      })
    }

    // Загружаем понятия в базу
    let successCount = 0
    let skipCount = 0
    let errorCount = 0
    const errors = []

    for (const concept of concepts) {
      try {
        // Проверяем, существует ли уже понятие
        const { data: existing } = await supabaseAdmin
          .from('concepts')
          .select('id, name')
          .eq('name', concept.name)
          .single()

        if (existing) {
          skipCount++
          continue
        }

        // Создаем новое понятие
        const { data, error } = await supabaseAdmin
          .from('concepts')
          .insert([{ name: concept.name }])
          .select()
          .single()

        if (error) {
          if (error.code === '23505') { // Unique violation
            skipCount++
          } else {
            errorCount++
            errors.push({ concept: concept.name, error: error.message })
          }
        } else {
          successCount++
        }
      } catch (error) {
        errorCount++
        errors.push({ concept: concept.name, error: error.message })
      }
    }

    // Обновляем M (ранг) на 11
    try {
      await supabaseAdmin
        .from('rank_config')
        .update({ M: 11, updated_at: new Date().toISOString() })
        .eq('id', 1)
    } catch (error) {
      console.error('Error updating M:', error)
    }

    return res.status(200).json({
      success: true,
      summary: {
        total: concepts.length,
        loaded: successCount,
        skipped: skipCount,
        errors: errorCount
      },
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Error bulk loading concepts:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

