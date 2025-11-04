// pages/api/profiling/values/colors.js
// API endpoint to get rank colors for the survey

import { supabaseAdmin } from '../../../../lib/supabase/server'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get current M value
    const { data: rankConfig } = await supabaseAdmin
      .from('rank_config')
      .select('M')
      .eq('id', 1)
      .single()

    const M = rankConfig?.M || 5

    // Get all rank colors
    const { data: colors, error } = await supabaseAdmin
      .from('rank_colors')
      .select('*')
      .order('rank')

    if (error) throw error

    // Ensure we have colors for all ranks 1..M
    const colorsMap = {}
    colors?.forEach(c => {
      colorsMap[c.rank] = c
    })

    // Fill missing ranks with default colors
    const allColors = []
    for (let rank = 1; rank <= M; rank++) {
      if (colorsMap[rank]) {
        allColors.push({
          rank: colorsMap[rank].rank,
          hex: colorsMap[rank].hex_color,
          name: colorsMap[rank].label?.toLowerCase().replace(/\s+/g, '') || `color${rank}`,
          label: colorsMap[rank].label || `Color ${rank}`,
          class: `bg-[${colorsMap[rank].hex_color}]`
        })
      } else {
        // Default fallback colors
        const defaultColors = [
          { name: 'red', label: 'Red', hex: '#EF4444' },
          { name: 'blue', label: 'Blue', hex: '#3B82F6' },
          { name: 'green', label: 'Green', hex: '#10B981' },
          { name: 'yellow', label: 'Yellow', hex: '#FBBF24' },
          { name: 'purple', label: 'Purple', hex: '#A78BFA' },
          { name: 'orange', label: 'Orange', hex: '#F97316' },
          { name: 'pink', label: 'Pink', hex: '#EC4899' },
          { name: 'brown', label: 'Brown', hex: '#92400E' },
          { name: 'gray', label: 'Gray', hex: '#9CA3AF' },
          { name: 'black', label: 'Black', hex: '#1F2937' },
          { name: 'white', label: 'White', hex: '#FFFFFF' }
        ]
        
        const defaultColor = defaultColors[rank - 1] || { 
          name: `color${rank}`, 
          label: `Color ${rank}`, 
          hex: '#CCCCCC' 
        }
        
        allColors.push({
          rank,
          hex: defaultColor.hex,
          name: defaultColor.name,
          label: defaultColor.label,
          class: rank === 11 ? 'bg-white border-2 border-gray-300' : `bg-[${defaultColor.hex}]`
        })
      }
    }

    res.status(200).json({
      success: true,
      colors: allColors,
      total: allColors.length
    })
  } catch (error) {
    console.error('Ошибка загрузки цветов:', error)
    res.status(500).json({ 
      error: 'Ошибка загрузки цветов',
      details: error.message 
    })
  }
}

