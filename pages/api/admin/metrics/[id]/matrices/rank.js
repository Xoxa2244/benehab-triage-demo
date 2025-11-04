import { supabaseAdmin } from '../../../../../../lib/supabase/server'

export default async function handler(req, res) {
  const { id: metricId } = req.query

  if (req.method === 'GET') {
    try {
      // Get all concepts
      const { data: concepts, error: conceptsError } = await supabaseAdmin
        .from('concepts')
        .select('id, name')
        .order('name')

      if (conceptsError) throw conceptsError

      // Get M
      const { data: rankConfig, error: rankError } = await supabaseAdmin
        .from('rank_config')
        .select('M')
        .eq('id', 1)
        .single()

      if (rankError) throw rankError
      const M = rankConfig?.M || 5

      // Get all rank weights for this metric
      const { data: weights, error: weightsError } = await supabaseAdmin
        .from('metric_weights_rank')
        .select('*')
        .eq('metric_id', metricId)
        .order('rank')
        .order('concept_id')

      if (weightsError) throw weightsError

      // Build matrix: M×N where M = ranks (1..M), N = concepts
      const matrix = {}
      for (let rank = 1; rank <= M; rank++) {
        concepts.forEach(concept => {
          const key = `${rank}_${concept.id}`
          const weight = weights.find(w =>
            w.rank === rank && w.concept_id === concept.id
          )
          matrix[key] = weight ? weight.value : 0
        })
      }

      return res.status(200).json({
        success: true,
        metricId,
        M,
        concepts,
        matrix,
        weights: weights || []
      })
    } catch (error) {
      console.error('Error fetching rank matrix:', error)
      return res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { updates } = req.body // Array of {rank, concept_id, value}

      if (!Array.isArray(updates)) {
        return res.status(400).json({
          success: false,
          error: 'Updates must be an array'
        })
      }

      // Get M for validation
      const { data: rankConfig } = await supabaseAdmin
        .from('rank_config')
        .select('M')
        .eq('id', 1)
        .single()
      const M = rankConfig?.M || 5

      // Validate and prepare updates
      const validUpdates = updates
        .filter(u => u.rank && u.concept_id && typeof u.value === 'number')
        .filter(u => u.rank >= 1 && u.rank <= M)
        .map(u => ({
          metric_id: metricId,
          rank: u.rank,
          concept_id: u.concept_id,
          value: Math.max(-1, Math.min(1, u.value)) // Clip to [-1, 1]
        }))

      // Upsert all updates
      const promises = validUpdates.map(update =>
        supabaseAdmin
          .from('metric_weights_rank')
          .upsert(update, {
            onConflict: 'metric_id,rank,concept_id'
          })
      )

      await Promise.all(promises)

      return res.status(200).json({
        success: true,
        updated: validUpdates.length
      })
    } catch (error) {
      console.error('Error updating rank matrix:', error)
      return res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

