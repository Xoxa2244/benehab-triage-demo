/**
 * Calculate metric score based on survey results
 * 
 * @param {Object} surveyResult - Survey result with zones, ranks, and concept mappings
 * @param {Object} matrices - Object with same, diff, and rank matrices
 * @param {Array} concepts - Array of concept objects with id and name
 * @returns {Object} - Score breakdown and total
 */
export function calculateMetricScore(surveyResult, matrices, concepts) {
  const { zones, rankOf, conceptZone } = surveyResult
  const { same, diff, rank } = matrices

  // Build zone mapping
  const zoneMap = {}
  if (zones) {
    zones.forEach(zone => {
      zoneMap[zone.zone_id] = zone
    })
  }

  // Build concept to zone mapping
  const conceptToZone = conceptZone || {}

  // Build zone to rank mapping
  const zoneToRank = rankOf || {}
  
  // If rankOf is not provided, infer from palette order
  if (!rankOf && surveyResult.palette) {
    surveyResult.palette.forEach((zone, index) => {
      zoneToRank[zone.zone_id] = index + 1
    })
  }

  let sameSum = 0
  let diffSum = 0
  let rankSum = 0

  const pairs = []
  const rankContributions = []

  // Calculate pairs
  for (let i = 0; i < concepts.length; i++) {
    for (let j = i + 1; j < concepts.length; j++) {
      const conceptI = concepts[i]
      const conceptJ = concepts[j]

      const zoneI = conceptToZone[conceptI.id] || conceptToZone[conceptI.name]
      const zoneJ = conceptToZone[conceptJ.id] || conceptToZone[conceptJ.name]

      if (!zoneI || !zoneJ) continue

      const isSameZone = zoneI === zoneJ
      const key = conceptI.id < conceptJ.id 
        ? `${conceptI.id}_${conceptJ.id}`
        : `${conceptJ.id}_${conceptI.id}`

      const weight = isSameZone 
        ? (same[key] || 0)
        : (diff[key] || 0)

      const contribution = weight

      pairs.push({
        conceptI: conceptI.name,
        conceptJ: conceptJ.name,
        zoneI,
        zoneJ,
        isSameZone,
        weight,
        contribution
      })

      if (isSameZone) {
        sameSum += contribution
      } else {
        diffSum += contribution
      }
    }
  }

  // Calculate rank contributions
  concepts.forEach(concept => {
    const zoneId = conceptToZone[concept.id] || conceptToZone[concept.name]
    if (!zoneId) return

    const rank = zoneToRank[zoneId]
    if (!rank) return

    const key = `${rank}_${concept.id}`
    const weight = rank[key] || 0

    rankContributions.push({
      concept: concept.name,
      zone: zoneId,
      rank,
      weight,
      contribution: weight
    })

    rankSum += weight
  })

  const totalScore = sameSum + diffSum + rankSum

  return {
    sameSum,
    diffSum,
    rankSum,
    totalScore,
    pairs,
    rankContributions,
    breakdown: {
      sameZonePairs: sameSum,
      differentZonePairs: diffSum,
      rankConcept: rankSum,
      total: totalScore
    }
  }
}

/**
 * Calculate Affinity for all concepts
 * 
 * @param {Object} surveyResult - Survey result
 * @param {Object} settings - Affinity settings (self, ideal, anchors)
 * @param {Object} rankMatrix - Rank × Concept matrix
 * @param {Array} concepts - Array of concept objects
 * @returns {Object} - Affinity scores and breakdown
 */
export function calculateAffinity(surveyResult, settings, rankMatrix, concepts) {
  const { conceptZone } = surveyResult
  const { self_concept_id, ideal_concept_id, positive_anchors = [], negative_anchors = [] } = settings

  // Build concept to zone mapping
  const conceptToZone = conceptZone || {}

  // Get zone IDs for anchors
  const selfZone = self_concept_id ? (conceptToZone[self_concept_id] || conceptToZone[concepts.find(c => c.id === self_concept_id)?.name]) : null
  const idealZone = ideal_concept_id ? (conceptToZone[ideal_concept_id] || conceptToZone[concepts.find(c => c.id === ideal_concept_id)?.name]) : null

  // Build zone to rank mapping
  const zoneToRank = surveyResult.rankOf || {}
  if (!surveyResult.rankOf && surveyResult.palette) {
    surveyResult.palette.forEach((zone, index) => {
      zoneToRank[zone.zone_id] = index + 1
    })
  }

  // Get positive/negative anchor zones
  const positiveZones = positive_anchors
    .map(id => conceptToZone[id] || conceptToZone[concepts.find(c => c.id === id)?.name])
    .filter(Boolean)
  
  const negativeZones = negative_anchors
    .map(id => conceptToZone[id] || conceptToZone[concepts.find(c => c.id === id)?.name])
    .filter(Boolean)

  const affinities = []

  concepts.forEach(concept => {
    const zoneId = conceptToZone[concept.id] || conceptToZone[concept.name]
    if (!zoneId) {
      affinities.push({
        concept: concept.name,
        conceptId: concept.id,
        affinity: 0,
        breakdown: {
          self: 0,
          ideal: 0,
          rank: 0,
          positive: 0,
          negative: 0
        },
        warnings: ['Concept zone not found']
      })
      return
    }

    const rank = zoneToRank[zoneId]
    const rankKey = rank ? `${rank}_${concept.id}` : null
    const rankValue = rankKey ? (rankMatrix[rankKey] || 0) : 0

    // Calculate affinity components
    const selfComponent = selfZone && zoneId === selfZone ? 1 : 0
    const idealComponent = idealZone && zoneId === idealZone ? 1 : 0
    const positiveComponent = positiveZones.includes(zoneId) ? positiveZones.filter(z => z === zoneId).length : 0
    const negativeComponent = negativeZones.includes(zoneId) ? negativeZones.filter(z => z === zoneId).length : 0

    // Simplified affinity calculation
    // In production, these coefficients could be configurable
    const affinity = 
      selfComponent * 1.0 +      // a_self = 1.0
      idealComponent * 1.0 +     // a_ideal = 1.0
      rankValue +                 // V_rank,concept
      positiveComponent * 0.5 -  // U+ = 0.5 per anchor
      negativeComponent * 0.5    // U- = 0.5 per anchor

    affinities.push({
      concept: concept.name,
      conceptId: concept.id,
      zone: zoneId,
      rank: rank || null,
      affinity,
      breakdown: {
        self: selfComponent,
        ideal: idealComponent,
        rank: rankValue,
        positive: positiveComponent * 0.5,
        negative: -negativeComponent * 0.5
      },
      warnings: []
    })
  })

  // Sort by affinity
  const sorted = [...affinities].sort((a, b) => b.affinity - a.affinity)
  const top = sorted.slice(0, 5)
  const bottom = sorted.slice(-5).reverse()

  return {
    affinities,
    top,
    bottom,
    summary: {
      total: affinities.length,
      topAffinity: sorted[0]?.affinity || 0,
      bottomAffinity: sorted[sorted.length - 1]?.affinity || 0
    }
  }
}

/**
 * Validate survey result format
 */
export function validateSurveyResult(result) {
  const warnings = []

  if (!result.conceptZone && !result.palette) {
    warnings.push('Missing conceptZone or palette mapping')
  }

  if (!result.rankOf && !result.palette) {
    warnings.push('Missing rankOf or palette for ranking')
  }

  return {
    valid: warnings.length === 0,
    warnings
  }
}

