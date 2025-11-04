import { supabaseAdmin } from '../../../../lib/supabase/server'

export default async function handler(req, res) {
  if (req.method === 'GET') {
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
          allColors.push(colorsMap[rank])
        } else {
          allColors.push({
            rank,
            hex_color: '#CCCCCC',
            label: `Color ${rank}`
          })
        }
      }

      return res.status(200).json({
        success: true,
        colors: allColors,
        M
      })
    } catch (error) {
      console.error('Error fetching rank colors:', error)
      return res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { updates } = req.body // Array of {rank, hex_color, label}

      if (!Array.isArray(updates)) {
        return res.status(400).json({
          success: false,
          error: 'Updates must be an array'
        })
      }

      // Validate and prepare updates
      const validUpdates = updates
        .filter(u => u.rank && u.hex_color)
        .map(u => ({
          rank: parseInt(u.rank),
          hex_color: u.hex_color.trim(),
          label: u.label?.trim() || null,
          updated_at: new Date().toISOString()
        }))

      // Upsert all updates
      const promises = validUpdates.map(update =>
        supabaseAdmin
          .from('rank_colors')
          .upsert(update, {
            onConflict: 'rank'
          })
      )

      await Promise.all(promises)

      return res.status(200).json({
        success: true,
        updated: validUpdates.length
      })
    } catch (error) {
      console.error('Error updating rank colors:', error)
      return res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

