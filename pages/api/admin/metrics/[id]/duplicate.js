import { supabaseAdmin } from '../../../../../lib/supabase/server'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { id } = req.query

  try {
    // Get original metric
    const { data: originalMetric, error: fetchError } = await supabaseAdmin
      .from('metrics')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Create new draft metric with same text, increment version
    const { data: newMetric, error: createError } = await supabaseAdmin
      .from('metrics')
      .insert([{
        text: originalMetric.text,
        status: 'draft',
        version: originalMetric.version + 1
      }])
      .select()
      .single()

    if (createError) throw createError

    // Copy all matrices from original metric
    // Get all concepts and M
    const { data: concepts } = await supabaseAdmin.from('concepts').select('id')
    const { data: rankConfig } = await supabaseAdmin.from('rank_config').select('M').eq('id', 1).single()
    const M = rankConfig?.M || 5

    if (concepts && concepts.length > 0) {
      // Copy same zone weights
      const { data: sameWeights } = await supabaseAdmin
        .from('metric_weights_same')
        .select('*')
        .eq('metric_id', id)

      if (sameWeights && sameWeights.length > 0) {
        const newSameWeights = sameWeights.map(w => ({
          metric_id: newMetric.id,
          i_concept_id: w.i_concept_id,
          j_concept_id: w.j_concept_id,
          value: w.value
        }))
        await supabaseAdmin.from('metric_weights_same').insert(newSameWeights)
      }

      // Copy diff zone weights
      const { data: diffWeights } = await supabaseAdmin
        .from('metric_weights_diff')
        .select('*')
        .eq('metric_id', id)

      if (diffWeights && diffWeights.length > 0) {
        const newDiffWeights = diffWeights.map(w => ({
          metric_id: newMetric.id,
          i_concept_id: w.i_concept_id,
          j_concept_id: w.j_concept_id,
          value: w.value
        }))
        await supabaseAdmin.from('metric_weights_diff').insert(newDiffWeights)
      }

      // Copy rank weights
      const { data: rankWeights } = await supabaseAdmin
        .from('metric_weights_rank')
        .select('*')
        .eq('metric_id', id)

      if (rankWeights && rankWeights.length > 0) {
        const newRankWeights = rankWeights.map(w => ({
          metric_id: newMetric.id,
          rank: w.rank,
          concept_id: w.concept_id,
          value: w.value
        }))
        await supabaseAdmin.from('metric_weights_rank').insert(newRankWeights)
      }
    }

    return res.status(201).json({ success: true, metric: newMetric })
  } catch (error) {
    console.error('Error duplicating metric:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}

