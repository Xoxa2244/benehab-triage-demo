
import OpenAI from "openai";
import { derivePlan } from "../../lib/derivePlan";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages = [], pib = null } = req.body || {};
  const plan = derivePlan(pib || {});

  // System style (concise, empathetic)
  const system = [
    { role: "system", content:
`Ты — медицинский ассистент Benehab. Работай как triage.
— Не ставь диагнозы и не назначай лечение/дозировки.
— Используй простые слова, короткие абзацы.
— Стиль: ${plan.tone || 'calm_supportive'}.
— Делать: ${plan.do.slice(0,6).join('; ') || 'эмпатия; уточнения; мини‑план; follow‑up'}.
— Избегать: ${plan.avoid.slice(0,6).join('; ') || 'давления; сложных терминов; запугивания'}.
— Если спрашивают о препарате: дай фактическую справку (показания, кому нельзя, частые побочки, предосторожности). Без дозировок. В конце дисклеймер.`},
  ];

  // Guardrail: appointment offer only after consent
  system.push({
    role: "system",
    content:
`Запись к врачу: сперва спроси «Нужно ли вас записать?». Только после явного согласия предлагай слоты (13:00, 15:00, 17:00). После выбора ответь «Спасибо, вы записаны».`
  });

  const final = [...system, ...messages];

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: final,
      temperature: 0.3,
    });
    const text = response.choices[0]?.message?.content || "";
    res.status(200).json({ reply: text, plan });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
