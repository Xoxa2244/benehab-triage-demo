import { supabaseAdmin } from '../../../../lib/supabase/server'
import { calculateMetricScore, calculateAffinity, validateSurveyResult } from '../../../../lib/psychosemantics/calculations'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { surveyResult, metricId } = req.body

    if (!surveyResult) {
      return res.status(400).json({ 
        success: false, 
        error: 'Survey result is required' 
      })
    }

    if (!metricId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Metric ID is required' 
      })
    }

    // Validate survey result
    const validation = validateSurveyResult(surveyResult)
    const warnings = [...validation.warnings]

    // Get metric (must be published)
    const { data: metric, error: metricError } = await supabaseAdmin
      .from('metrics')
      .select('*')
      .eq('id', metricId)
      .single()

    if (metricError) throw metricError

    if (metric.status !== 'published') {
      warnings.push('Warning: Using draft metric. Published metrics are recommended for production.')
    }

    // Get concepts
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

    // Get matrices
    const { data: sameWeights } = await supabaseAdmin
      .from('metric_weights_same')
      .select('*')
      .eq('metric_id', metricId)

    const { data: diffWeights } = await supabaseAdmin
      .from('metric_weights_diff')
      .select('*')
      .eq('metric_id', metricId)

    const { data: rankWeights } = await supabaseAdmin
      .from('metric_weights_rank')
      .select('*')
      .eq('metric_id', metricId)

    // Build matrices
    const sameMatrix = {}
    const diffMatrix = {}
    const rankMatrix = {}

    sameWeights?.forEach(w => {
      const key = `${w.i_concept_id}_${w.j_concept_id}`
      sameMatrix[key] = w.value
    })

    diffWeights?.forEach(w => {
      const key = `${w.i_concept_id}_${w.j_concept_id}`
      diffMatrix[key] = w.value
    })

    rankWeights?.forEach(w => {
      const key = `${w.rank}_${w.concept_id}`
      rankMatrix[key] = w.value
    })

    // Calculate score
    const scoreResult = calculateMetricScore(surveyResult, {
      same: sameMatrix,
      diff: diffMatrix,
      rank: rankMatrix
    }, concepts)

    // Get settings for affinity
    const { data: settings } = await supabaseAdmin
      .from('admin_settings')
      .select('*')
      .eq('id', 1)
      .single()

    // Calculate affinity
    const affinityResult = calculateAffinity(
      surveyResult,
      settings || {},
      rankMatrix,
      concepts
    )

    // Check for unknown concepts/zones
    const knownConceptIds = new Set(concepts.map(c => c.id))
    const knownConceptNames = new Set(concepts.map(c => c.name))
    
    const conceptZoneKeys = Object.keys(surveyResult.conceptZone || {})
    conceptZoneKeys.forEach(key => {
      if (!knownConceptIds.has(key) && !knownConceptNames.has(key)) {
        warnings.push(`Unknown concept in conceptZone: ${key}`)
      }
    })

    // Check for unknown zones
    const zones = surveyResult.zones || []
    const zoneIds = new Set(zones.map(z => z.zone_id))
    if (surveyResult.palette) {
      surveyResult.palette.forEach(zone => {
        zoneIds.add(zone.zone_id)
      })
    }

    Object.values(surveyResult.conceptZone || {}).forEach(zoneId => {
      if (!zoneIds.has(zoneId)) {
        warnings.push(`Unknown zone_id: ${zoneId}`)
      }
    })

    return res.status(200).json({
      success: true,
      metric: {
        id: metric.id,
        text: metric.text,
        version: metric.version,
        status: metric.status
      },
      score: scoreResult,
      affinity: affinityResult,
      warnings,
      concepts: concepts.map(c => ({ id: c.id, name: c.name })),
      M
    })
  } catch (error) {
    console.error('Error computing debug results:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

