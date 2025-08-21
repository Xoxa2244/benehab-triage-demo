// lib/pib.js

/**
 * Формирует Patient Instruction Bundle на основе профилей
 * @param {Object} attitude_profile - профиль отношения к болезни
 * @param {Object} accentuation_profile - типологический профиль
 * @param {Object} values_profile - ценностный профиль
 * @param {Object} demographics - демографические данные
 * @param {Object} patient_meta - метаданные пациента
 * @returns {Object} PIB с communication_plan
 */
export function generatePIB(attitude_profile, accentuation_profile, values_profile, demographics = {}, patient_meta = {}) {
  const pib = {
    patient_meta,
    demographics,
    attitude_profile,
    accentuation_profile,
    values_profile,
    communication_plan: {}
  };

  // Базовый communication_plan
  const plan = {
    tone: 'calm_supportive',
    session_length: 'medium',
    followup_hint: 'ask_in_2h',
    educational_focus: [],
    avoid: [],
    seek: []
  };

  // Модификаторы на основе attitude_profile
  if (attitude_profile) {
    const { risk_tags = [], comm_flags = [] } = attitude_profile;
    
    // Обработка risk_tags
    if (risk_tags.includes('alt_medicine_pref')) {
      plan.educational_focus.push('evidence_explain', 'safety_monitor');
      plan.avoid.push('dismissive_attitude');
    }
    
    if (risk_tags.includes('work_overload')) {
      plan.seek.push('work_life_balance', 'stress_management');
    }
    
    if (risk_tags.includes('depression_risk_check')) {
      plan.seek.push('mood_monitoring', 'support_network');
      plan.avoid.push('pressure', 'isolation');
    }
    
    if (risk_tags.includes('trust_issues')) {
      plan.seek.push('build_trust', 'transparency');
      plan.avoid.push('authoritarian_tone');
    }
    
    if (risk_tags.includes('medical_avoidance')) {
      plan.seek.push('gentle_approach', 'gradual_engagement');
      plan.avoid.push('pressure', 'rushed_decisions');
    }
    
    if (risk_tags.includes('family_conflict')) {
      plan.seek.push('family_mediation', 'individual_support');
    }
    
    if (risk_tags.includes('progression_fear')) {
      plan.seek.push('reassurance', 'monitoring_plan');
      plan.avoid.push('alarmist_language');
    }

    // Обработка comm_flags
    if (comm_flags.includes('normalize_fears')) {
      plan.seek.push('normalize_experience', 'validate_concerns');
    }
    
    if (comm_flags.includes('explain_benefits')) {
      plan.educational_focus.push('benefit_explanation', 'risk_benefit_balance');
    }
    
    if (comm_flags.includes('avoid_pressure')) {
      plan.avoid.push('pressure', 'rushed_decisions');
    }
    
    if (comm_flags.includes('provide_details')) {
      plan.educational_focus.push('detailed_explanations', 'comprehensive_info');
    }
    
    if (comm_flags.includes('build_trust')) {
      plan.seek.push('trust_building', 'consistent_approach');
    }
    
    if (comm_flags.includes('family_involvement')) {
      plan.seek.push('family_engagement', 'support_coordination');
    }
  }

  // Модификаторы на основе accentuation_profile
  if (accentuation_profile) {
    const { tone_mods = {} } = accentuation_profile;
    
    // Применяем tone_mods
    if (tone_mods.tone) {
      plan.tone = tone_mods.tone;
    }
    
    if (tone_mods.session_length) {
      plan.session_length = tone_mods.session_length;
    }
    
    if (tone_mods.avoid) {
      plan.avoid.push(...tone_mods.avoid);
    }
    
    if (tone_mods.seek) {
      plan.seek.push(...tone_mods.seek);
    }
  }

  // Специальные правила объединения
  if (attitude_profile && accentuation_profile) {
    const attitude = attitude_profile;
    const accentuation = accentuation_profile;
    
    // Если sensitive или dysthymic доминируют
    if (accentuation.dominant && 
        (accentuation.dominant.includes('sensitive') || 
         accentuation.dominant.includes('dysthymic'))) {
      plan.tone = 'calm_supportive';
      plan.session_length = 'short';
      if (!plan.avoid.includes('rush')) plan.avoid.push('rush');
      if (!plan.avoid.includes('pressure')) plan.avoid.push('pressure');
    }
    
    // Если pedantic доминирует
    if (accentuation.dominant && accentuation.dominant.includes('pedantic')) {
      if (!plan.seek.includes('full_info')) plan.seek.push('full_info');
      if (!plan.seek.push('structure')) plan.seek.push('structure');
    }
    
    // Если есть alt_medicine_pref из attitude
    if (attitude.risk_tags && attitude.risk_tags.includes('alt_medicine_pref')) {
      if (!plan.educational_focus.includes('evidence_explain')) {
        plan.educational_focus.push('evidence_explain');
      }
      if (!plan.educational_focus.includes('safety_monitor')) {
        plan.educational_focus.push('safety_monitor');
      }
    }
    
    // Если есть ignore_risk из attitude
    if (attitude.risk_tags && attitude.risk_tags.includes('ignore_risk')) {
      plan.seek.push('warning_signs', 'safety_checks');
    }
  }

  // Модификаторы на основе values_profile
  if (values_profile) {
    const { communication_guidelines = {}, value_indices = {} } = values_profile;
    
    // Применяем рекомендации по коммуникации
    if (communication_guidelines.communication_style) {
      switch (communication_guidelines.communication_style) {
        case 'optimistic':
          plan.tone = 'positive_encouraging';
          plan.seek.push('positive_reinforcement', 'hope_building');
          break;
        case 'supportive':
          plan.tone = 'calm_supportive';
          plan.seek.push('emotional_support', 'validation');
          break;
        case 'balanced':
          plan.tone = 'neutral_balanced';
          plan.seek.push('balanced_perspective', 'realistic_approach');
          break;
      }
    }
    
    // Добавляем мотиваторы
    if (communication_guidelines.motivators && communication_guidelines.motivators.length > 0) {
      plan.seek.push(...communication_guidelines.motivators.map(m => `motivate_${m}`));
    }
    
    // Добавляем темы для избегания
    if (communication_guidelines.avoid_topics && communication_guidelines.avoid_topics.length > 0) {
      plan.avoid.push(...communication_guidelines.avoid_topics.map(t => `avoid_${t}`));
    }
    
    // Применяем индексы ценностей
    if (value_indices.life_satisfaction < 30) {
      plan.seek.push('emotional_support', 'hope_building');
      plan.avoid.push('pessimistic_language');
    }
    
    if (value_indices.future_orientation < 30) {
      plan.seek.push('future_planning', 'goal_setting');
      plan.avoid.push('short_term_focus');
    }
    
    if (value_indices.treatment_attitude < 30) {
      plan.seek.push('trust_building', 'gentle_approach');
      plan.avoid.push('pressure', 'authoritarian_tone');
    }
    
    if (value_indices.family_importance > 70) {
      plan.seek.push('family_involvement', 'family_support');
    }
    
    if (value_indices.health_priority > 70) {
      plan.seek.push('health_education', 'preventive_care');
    }
    
    if (value_indices.social_orientation < 30) {
      plan.seek.push('individual_approach', 'privacy_respect');
      plan.avoid.push('group_pressure', 'social_expectations');
    }
  }

  // Убираем дубликаты
  plan.avoid = [...new Set(plan.avoid)];
  plan.seek = [...new Set(plan.seek)];
  plan.educational_focus = [...new Set(plan.educational_focus)];

  pib.communication_plan = plan;
  
  return pib;
}

/**
 * Загружает PIB из localStorage
 * @returns {Object|null} PIB или null если не найден
 */
export function loadPIBFromStorage() {
  if (typeof window === 'undefined') return null;
  
  try {
    const pib = localStorage.getItem('benehab.pib');
    return pib ? JSON.parse(pib) : null;
  } catch (error) {
    console.error('Ошибка загрузки PIB из localStorage:', error);
    return null;
  }
}

/**
 * Сохраняет PIB в localStorage
 * @param {Object} pib - PIB для сохранения
 */
export function savePIBToStorage(pib) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('benehab.pib', JSON.stringify(pib));
  } catch (error) {
    console.error('Ошибка сохранения PIB в localStorage:', error);
  }
}
