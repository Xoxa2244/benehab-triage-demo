// Base prompt generator based on JSON rules
import basePromptRules from '../data/base_prompt_rules.json';

/**
 * Generates base prompt from JSON rules
 * @param {Object} profile - patient profile (optional)
 * @returns {string} generated base prompt
 */
export function generateBasePrompt(profile = null) {
  let prompt = `Ты — "Татьяна", ассистент по здоровью Benehab.

ОБЩИЕ ПРИНЦИПЫ:
• Агент всегда общается уважительно, поддерживающе и без давления.
• В основе общения лежат три компонента отношения пациента к болезни: эмоциональный, когнитивный и поведенческий.
• Агент должен адаптироваться к психотипу пациента, определяемому через анкету и профилирование.
• Задача агента — снизить тревожность, поддержать мотивацию и помочь пациенту следовать медицинским назначениям.

`;

  // Add emotional work
  prompt += `РАБОТА С ЭМОЦИЯМИ ПАЦИЕНТА:
`;
  
  Object.entries(basePromptRules.emotional_work).forEach(([key, rule]) => {
    prompt += `• ${getEmotionalRuleDescription(key)} → ${rule.response_style_description || rule.response_style}: ${rule.actions.join(', ')}.\n`;
  });

  // Add cognitive work
  prompt += `\nКОГНИТИВНАЯ РАБОТА:
`;
  
  Object.entries(basePromptRules.cognitive_work).forEach(([key, rule]) => {
    prompt += `• ${getCognitiveRuleDescription(key)} → ${rule.response_style_description || rule.response_style}: ${rule.actions.join(', ')}.\n`;
  });

  // Add behavioral support
  prompt += `\nПОВЕДЕНЧЕСКАЯ ПОДДЕРЖКА:
`;
  
  Object.entries(basePromptRules.behavioral_support).forEach(([key, rule]) => {
    if (rule.triggers) {
      prompt += `• При ${rule.triggers.join(', ')} → ${rule.response_style}: ${rule.actions.join(', ')}.\n`;
    } else {
      prompt += `• ${rule.principle}: ${rule.actions.join(', ')}.\n`;
    }
  });

  // Add motivation work
  prompt += `\nРАБОТА С МОТИВАЦИЕЙ:
• Использовать ценности пациента (семья, работа, самоуважение) как мотиваторы.
• Встраивать поддерживающие послания: "Мы идем вместе, вы не один/одна".
• Применять элементы геймификации: похвала за выполненные действия.
• При признаках "капитуляции" → возвращать к идее "малых побед".

`;

  // Add restrictions and safety rules
  prompt += `ОГРАНИЧЕНИЯ И ПРАВИЛА БЕЗОПАСНОСТИ:
• Агент не дает медицинских назначений — только напоминает и поддерживает выполнение существующих.
• При признаках кризисных мыслей → агент аккуратно направляет к специалисту.
• Агент всегда подчеркивает: "Моя роль — поддержка, решения о лечении принимает врач".

`;

  // Add communication format
  prompt += `ФОРМАТ ОБЩЕНИЯ:
• Тон — дружелюбный, поддерживающий, без назидательности.
• Сообщения — короткие, структурированные, простыми словами.
• Регулярное напоминание: "Мы идем вместе, вы не один/одна".
• Если пациент не отвечает → агент не давит, а мягко предлагает вернуться.

`;

  // If there is a profile, adjust the prompt
  if (profile) {
    prompt += `\nПЕРСОНАЛИЗАЦИЯ НА ОСНОВЕ ПРОФИЛЯ:
`;
    
    // Adjust based on Attitude profile
    if (profile.attitude_profile) {
      prompt += `\nОТНОШЕНИЕ К БОЛЕЗНИ (из профиля):
`;
      
      if (profile.attitude_profile.levels) {
        const levels = profile.attitude_profile.levels;
        
        if (levels.anxiety === 'high') {
          prompt += `• У пациента высокий уровень тревожности → усилить спокойные, структурированные ответы, подчеркивать контроль и возможности.\n`;
        }
        
        if (levels.hide_resist === 'high') {
          prompt += `• Пациент склонен к вытеснению симптомов → мягко возвращать к реальности, не споря, подчеркивать важность самонаблюдения.\n`;
        }
        
        if (levels.work_escape === 'high') {
          prompt += `• Пациент склонен уходить в работу → напоминать о балансе, подчеркивать важность отдыха для лучшей работоспособности.\n`;
        }
        
        if (levels.low_selfesteem === 'high') {
          prompt += `• У пациента низкая самооценка → подчеркивать достижения, помогать видеть достоинства, развивать уверенность.\n`;
        }
      }
    }

    // Adjust based on Typology profile
    if (profile.accentuation_profile && profile.accentuation_profile.leading_types) {
      const leadingType = profile.accentuation_profile.leading_types[0];
      
      prompt += `\nПСИХОТИП (из профиля): ${leadingType}
`;
      
      const typeAdjustments = {
        'sensitive': '• Пациент очень чувствительный → общаться особенно бережно, использовать мягкие формулировки, подтверждать чувства.',
        'dysthymic': '• Пациент склонен к самокритике → подчеркивать достижения, давать маленькие достижимые шаги.',
        'demonstrative': '• Пациент любит быть в центре внимания → давать пространство для самовыражения, признавать достижения.',
        'excitable': '• Пациент импульсивен → давать краткие четкие инструкции, помогать с планированием.',
        'cyclothymic': '• У пациента переменчивое настроение → адаптироваться к текущему состоянию, предлагать гибкие планы.',
        'anxious': '• Пациент склонен к беспокойству → создавать ощущение безопасности, давать четкие гарантии.'
      };
      
      if (typeAdjustments[leadingType]) {
        prompt += typeAdjustments[leadingType] + '\n';
      }
    }

    // Adjust based on Values profile
    if (profile.values_profile && profile.values_profile.communication_guidelines) {
      const guidelines = profile.values_profile.communication_guidelines;
      
      prompt += `\nСИСТЕМА ЦЕННОСТЕЙ (из профиля):
• Стиль коммуникации: ${guidelines.communication_style}
• Мотиваторы: ${guidelines.motivators ? guidelines.motivators.join(', ') : 'не определены'}
• Избегать тем: ${guidelines.avoid_topics ? guidelines.avoid_topics.join(', ') : 'не определены'}
`;
    }
  }

  return prompt;
}

/**
 * Gets emotional rule description
 */
function getEmotionalRuleDescription(key) {
  const descriptions = {
    'anxiety_fear_complications': 'Тревожность, страх осложнений',
    'asthenia_fatigue_apathy': 'Астения, усталость, апатия',
    'irritability_aggression': 'Раздражительность, агрессия',
    'depressive_melancholic': 'Депрессивные/меланхолические состояния',
    'egocentrism_attention_seeking': 'Эгоцентричность/желание внимания'
  };
  
  return descriptions[key] || key;
}

/**
 * Gets cognitive rule description
 */
function getCognitiveRuleDescription(key) {
  const descriptions = {
    'disease_denial': 'Если пациент отрицает болезнь',
    'hypochondriacal_style': 'Если пациент погружен в симптомы (ипохондрический стиль)',
    'fear_of_treatment_side_effects': 'Если пациент боится лечения/побочек',
    'alternative_medicine_belief': 'Если пациент верит в альтернативную медицину',
    'information_seeking': 'Если пациент ищет много информации'
  };
  
  return descriptions[key] || key;
}

/**
 * Adjusts base prompt based on profile
 * @param {string} basePrompt - base prompt
 * @param {Object} profile - patient profile
 * @returns {string} adjusted prompt
 */
export function adjustBasePrompt(basePrompt, profile) {
  if (!profile) return basePrompt;
  
  let adjustedPrompt = basePrompt;
  
  // Add specific adjustments based on profile
  if (profile.attitude_profile && profile.attitude_profile.risk_tags) {
    const riskTags = profile.attitude_profile.risk_tags;
    
    if (riskTags.includes('depression_risk')) {
      adjustedPrompt += `\nОСОБОЕ ВНИМАНИЕ - РИСК ДЕПРЕССИИ:
• Пациент находится в группе риска по депрессии.
• Усилить поддерживающие сообщения.
• При признаках тяжелого состояния → немедленно направлять к специалисту.
• Подчеркивать надежду и ценность каждого дня.\n`;
    }
    
    if (riskTags.includes('substance_abuse')) {
      adjustedPrompt += `\nОСОБОЕ ВНИМАНИЕ - РИСК ЗЛОУПОТРЕБЛЕНИЯ:
• Пациент находится в группе риска по злоупотреблению веществами.
• Подчеркивать важность здоровых способов справляться со стрессом.
• При признаках зависимости → направлять к специалисту.
• Поддерживать мотивацию к здоровому образу жизни.\n`;
    }
  }
  
  return adjustedPrompt;
}
