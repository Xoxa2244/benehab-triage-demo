// pages/api/chat.js
import OpenAI from 'openai';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BASE = `Ты — "Татьяна", ассистент по здоровью Benehab.
Говори тёпло и просто. Уважай выбор человека. 
Не ставь диагнозы, не назначай лекарства.
Triage: если есть опасные симптомы — немедленно советуй вызвать скорую/обратиться в неотложку и не продолжай обычную беседу пока пользователь не подтвердит безопасность.
Лёгкие типичные симптомы — поддержка, отдых/жидкость/самонаблюдение.
Средние, требующие наблюдения — предложить записаться к врачу, но слоты давай только если человек согласился.
Препараты: допускается фактическая справка (показания, противопоказания, предосторожности, частые побочные эффекты) — БЕЗ дозировок и без назначения. Если просят дозу — напомни, что дозировки определяет врач.
Слоты для записи: 13:00, 15:00, 17:00 — только после явного согласия. После выбора скажи: "Спасибо, вы записаны".`;

function buildPersonalizedPrompt(pib) {
  if (!pib || !pib.communication_plan) return '';
  
  const plan = pib.communication_plan;
  let prompt = '\n\n[ПЕРСОНАЛИЗАЦИЯ] ';
  
  // Тон общения
  if (plan.tone) {
    const toneMap = {
      'calm_supportive': 'Говори спокойно и поддерживающе',
      'engaging_supportive': 'Будь вовлеченным и поддерживающим',
      'stable_calm': 'Сохраняй стабильный спокойный тон',
      'reassuring_calm': 'Успокаивай и поддерживай спокойствие',
      'detailed_precise': 'Давай подробную и точную информацию',
      'inspiring_supportive': 'Вдохновляй и поддерживай'
    };
    prompt += `${toneMap[plan.tone] || plan.tone}. `;
  }
  
  // Длительность сессии
  if (plan.session_length === 'short') {
    prompt += 'Держи ответы короткими и по существу. ';
  } else if (plan.session_length === 'longer') {
    prompt += 'Можешь давать более подробные объяснения. ';
  }
  
  // Что избегать
  if (plan.avoid && plan.avoid.length > 0) {
    const avoidMap = {
      'pressure': 'избегай давления и спешки',
      'rush': 'не торопись',
      'uncertainty': 'давай четкие ответы',
      'overwhelming_info': 'не перегружай информацией',
      'harsh_criticism': 'избегай резких формулировок',
      'sudden_changes': 'не меняй резко тему',
      'complex_decisions': 'упрощай сложные решения',
      'vagueness': 'будь конкретным',
      'incomplete_info': 'давай полную информацию',
      'rushed_explanations': 'не торопись с объяснениями',
      'pessimism': 'избегай пессимизма',
      'boring_presentation': 'делай ответы интересными',
      'cold_approach': 'будь теплым и эмпатичным',
      'lack_of_empathy': 'проявляй эмпатию'
    };
    
    const avoids = plan.avoid.map(item => avoidMap[item] || item);
    prompt += `Избегай: ${avoids.join(', ')}. `;
  }
  
  // К чему стремиться
  if (plan.seek && plan.seek.length > 0) {
    const seekMap = {
      'recognize_fatigue': 'признавай усталость пользователя',
      'slow_pacing': 'замедляй темп при необходимости',
      'gentle_approach': 'используй мягкий подход',
      'patience': 'проявляй терпение',
      'small_steps': 'разбивай на маленькие шаги',
      'encouragement': 'поддерживай и поощряй',
      'recognition': 'признавай усилия пользователя',
      'interactive_approach': 'делай ответы интерактивными',
      'positive_feedback': 'давай позитивную обратную связь',
      'consistency': 'будь последовательным',
      'simple_choices': 'предлагай простые варианты',
      'structure': 'структурируй информацию',
      'clarity': 'будь ясным',
      'reassurance': 'успокаивай',
      'step_by_step': 'объясняй пошагово',
      'full_info': 'давай полную информацию',
      'emotional_connection': 'устанавливай эмоциональную связь',
      'understanding': 'проявляй понимание',
      'support': 'оказывай поддержку',
      'calm_environment': 'создавай спокойную атмосферу',
      'accuracy': 'будь точным'
    };
    
    const seeks = plan.seek.map(item => seekMap[item] || item);
    prompt += `Стремись к: ${seeks.join(', ')}. `;
  }
  
  // Образовательный фокус
  if (plan.educational_focus && plan.educational_focus.length > 0) {
    const focusMap = {
      'evidence_explain': 'объясняй на основе доказательств',
      'safety_monitor': 'обращай внимание на безопасность',
      'benefit_explanation': 'объясняй пользу',
      'risk_benefit_balance': 'балансируй риски и пользу',
      'detailed_explanations': 'давай подробные объяснения',
      'comprehensive_info': 'предоставляй полную информацию',
      'prevention': 'фокусируйся на профилактике'
    };
    
    const focuses = plan.educational_focus.map(item => focusMap[item] || item);
    prompt += `Образовательный фокус: ${focuses.join(', ')}. `;
  }
  
  // Риск-теги
  if (pib.attitude_profile?.risk_tags && pib.attitude_profile.risk_tags.length > 0) {
    prompt += `Особое внимание: ${pib.attitude_profile.risk_tags.join(', ')}. `;
  }
  
  return prompt;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { messages = [], meta = {} } = req.body || {};
    
    // Строим персонализированный промпт
    const personalization = buildPersonalizedPrompt(meta.pib);
    const system = BASE + personalization;
    
    const r = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [{ role: 'system', content: system }, ...messages],
    });
    res.status(200).json({ content: r.choices?.[0]?.message?.content || 'Готово.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
}
