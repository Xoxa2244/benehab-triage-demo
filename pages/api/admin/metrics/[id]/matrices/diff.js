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

      // Get all diff zone weights for this metric
      const { data: weights, error: weightsError } = await supabaseAdmin
        .from('metric_weights_diff')
        .select('*')
        .eq('metric_id', metricId)

      if (weightsError) throw weightsError

      // Build matrix: N×N where N = concepts.length
      // Only store upper triangle (i < j)
      const matrix = {}
      concepts.forEach((conceptI, i) => {
        concepts.forEach((conceptJ, j) => {
          if (i < j) {
            const key = `${conceptI.id}_${conceptJ.id}`
            const weight = weights.find(w =>
              w.i_concept_id === conceptI.id && w.j_concept_id === conceptJ.id
            )
            matrix[key] = weight ? weight.value : 0
          }
        })
      })

      return res.status(200).json({
        success: true,
        metricId,
        concepts,
        matrix,
        weights: weights || []
      })
    } catch (error) {
      console.error('Error fetching diff zone matrix:', error)
      return res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { updates } = req.body // Array of {i_concept_id, j_concept_id, value}

      if (!Array.isArray(updates)) {
        return res.status(400).json({
          success: false,
          error: 'Updates must be an array'
        })
      }

      // Validate and prepare updates
      const validUpdates = updates
        .filter(u => u.i_concept_id && u.j_concept_id && typeof u.value === 'number')
        .map(u => ({
          metric_id: metricId,
          i_concept_id: u.i_concept_id < u.j_concept_id ? u.i_concept_id : u.j_concept_id,
          j_concept_id: u.i_concept_id < u.j_concept_id ? u.j_concept_id : u.i_concept_id,
          value: Math.max(-1, Math.min(1, u.value)) // Clip to [-1, 1]
        }))

      // Upsert all updates
      const promises = validUpdates.map(update =>
        supabaseAdmin
          .from('metric_weights_diff')
          .upsert(update, {
            onConflict: 'metric_id,i_concept_id,j_concept_id'
          })
      )

      await Promise.all(promises)

      return res.status(200).json({
        success: true,
        updated: validUpdates.length
      })
    } catch (error) {
      console.error('Error updating diff zone matrix:', error)
      return res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

