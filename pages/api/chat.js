// pages/api/chat.js
import OpenAI from 'openai';
import { getCommunicationInstructions, generatePersonalizedPrompt } from '../../lib/communication-instructions';

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
  if (!pib) return '';
  
  // Получаем инструкции по коммуникации на основе профилей
  const attitudeProfile = pib.attitude_profile;
  const typologyProfile = pib.typology_profile;
  
  if (!attitudeProfile && !typologyProfile) return '';
  
  const instructions = getCommunicationInstructions(attitudeProfile, typologyProfile);
  
  // Генерируем персонализированный промпт
  return generatePersonalizedPrompt(instructions);
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
