
import fs from 'fs';
import path from 'path';

/**
 * Load JSON helper
 */
function loadJSON(rel) {
  try {
    const p = path.join(process.cwd(), rel);
    const txt = fs.readFileSync(p, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    return null;
  }
}

// Fallback tiny rules (in case files missing)
const FALLBACK = {
  typology: {},
  attitude: {}
};

/**
 * PIB -> communication plan, augmented by CSV-derived rules.
 * @param {Object} pib  ({attitude_profile, accentuation_profile})
 */
export function derivePlan(pib) {
  const typRules = loadJSON('data/typology_rules.json') || FALLBACK.typology;
  const attRules = loadJSON('data/attitude_rules.json') || FALLBACK.attitude;

  const plan = {
    tone: 'calm_supportive',
    do: [],
    avoid: [],
    flags: [],
  };

  // From attitude risks
  if (pib?.attitude_profile?.risk_tags) {
    pib.attitude_profile.risk_tags.forEach(tag => {
      const r = attRules[tag];
      if (r) {
        plan.do.push(...(r.do || []));
        plan.avoid.push(...(r.avoid || []));
        if (r.extreme) plan.flags.push('watch_extreme_' + tag);
      }
    });
  }

  // From accentuations
  if (pib?.accentuation_profile?.dominant_types) {
    pib.accentuation_profile.dominant_types.forEach(t => {
      const r = typRules[t];
      if (r) {
        plan.do.push(...(r.do || []));
        plan.avoid.push(...(r.avoid || []));
        if (r.tone_hint) plan.tone = r.tone_hint;
      }
    });
  }

  // Deduplicate
  const uniq = arr => Array.from(new Set(arr.map(s => s.trim()))).filter(Boolean);
  plan.do = uniq(plan.do);
  plan.avoid = uniq(plan.avoid);
  plan.flags = uniq(plan.flags);

  return plan;
}
