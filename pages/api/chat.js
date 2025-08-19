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

function pibHint(pib) {
  if (!pib) return '';
  const a = pib.attitude_profile || {};
  const b = pib.accentuation_profile || {};
  const plan = pib.communication_plan || {};
  const tags = [
    ...(a.risk_tags || []),
    ...(a.comm_flags || []),
    ...(plan.style_tags || []),
  ].join(', ');
  const doList = (plan.do || []).join('; ');
  const avoid = (plan.avoid || []).join('; ');
  return `\n[Профиль] Стиль: ${plan.tone || 'calm_supportive'}. Теги: ${tags || '—'}. Делай: ${doList || '—'}. Избегай: ${avoid || '—'}.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { messages = [], meta = {} } = req.body || {};
    const system = BASE + pibHint(meta.pib);
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
