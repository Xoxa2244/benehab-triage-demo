import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `Ты — медицинский ассистент Benehab (triage).
Допускаешь только медицинские темы. Off‑topic мягко отклоняешь; на 3‑й раз — завершаешь сессию.
При признаках экстренности сразу выдаёшь emergency‑ответ: «Срочно обратись за медицинской помощью/112». Обычный диалог не продолжаешь, пока пользователь не подтвердит безопасность.
При лёгких типичных симптомах — Reassurance: нормализуй, поддержи, без диагнозов и лекарств, советуй отдых и самонаблюдение.
При средних/затяжных симптомах — Watch & Refer: опиши возможную группу состояний (без диагноза), предложи профиль врача и три слота (13:00, 15:00, 17:00). После выбора — «Спасибо, вы записаны».
Не интерпретируешь анализы и не назначаешь лечение. При манипуляциях следуешь правилам. Пиши кратко, спокойно, эмпатично.`

const DEVELOPER_PROMPT = `Всегда отвечай на русском, дружелюбно.
Если есть экстренность — используй инструмент mark_emergency.
Watch & Refer: выбери профиль врача по ключевым словам (кожа → дерматолог; горло/кашель → ЛОР; общее → терапевт).
Имена: д‑р Михаил Рубцов (терапевт), д‑р Анна Ковальчук (дерматолог), д‑р Дмитрий Орлов (ЛОР).
После предложения записи обязательно скажи: «Выбери удобное время: 13:00, 15:00 или 17:00».`

const EMERGENCY_RE = /(сильн(ая|о) боль в груди|давящая боль|боль за грудиной|трудно дышать|одышк|кровь|теряю сознание|судорог|онемен|невнятная речь|сильная головная боль|от[её]к (горла|языка)|не дышит|\\bSOS\\b)/i

const TOOLS = [
  { type: 'function', function: { name: 'mark_emergency', description: 'Зафиксировать экстренную ситуацию.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'book_appointment', description: 'Запись к врачу.', parameters: { type: 'object', properties: {
        doctor_name: { type: 'string' },
        specialty: { type: 'string', enum: ['терапевт','дерматолог','ЛОР'] },
        time: { type: 'string', enum: ['13:00','15:00','17:00'] }
      }, required: ['doctor_name','specialty','time'] } } },
  { type: 'function', function: { name: 'end_session', description: 'Завершить сессию.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'ask_clarifying', description: 'Уточняющие вопросы (1–3).', parameters: { type: 'object', properties: { questions: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 } }, required: ['questions'] } } },
]

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { messages = [] } = req.body || {}
    const last = messages[messages.length - 1]?.content || ''

    // Pre-filter emergency (быстрый ответ)
    if (EMERGENCY_RE.test(last)) {
      return res.status(200).json({
        state: 'EMERGENCY',
        content: 'Симптомы, которые ты описал, могут быть опасны. Пожалуйста, срочно обратись за медицинской помощью или вызови скорую. Если тебе совсем плохо — скажи “SOS”, и я вызову помощь.'
      })
    }

    const chat = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: DEVELOPER_PROMPT },
      ...messages
    ]

    const first = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chat,
      tools: TOOLS,
      temperature: 0.7
    })

    const msg = first.choices?.[0]?.message
    if (msg?.tool_calls?.length) {
      const toolMsgs = msg.tool_calls.map(tc => ({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify({ ok: true, ...(tc.function.arguments ? JSON.parse(tc.function.arguments) : {}) })
      }))

      const second = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [...chat, msg, ...toolMsgs],
        temperature: 0.7
      })

      return res.status(200).json({ content: second.choices?.[0]?.message?.content || 'Готово.' })
    }

    return res.status(200).json({ content: msg?.content || 'Готово.' })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error', detail: String(e) })
  }
}
