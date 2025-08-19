import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ========================= PROMPTS =========================
const SYSTEM_PROMPT = `Ты — медицинский ассистент Benehab (triage). Работаешь в рамках предмедицинского фильтра.
— Принимаешь только медицинские темы. Off‑topic мягко отклоняешь; на 3‑й раз — завершаешь сессию.
— При признаках экстренности немедленно: «Срочно обратись за медицинской помощью/112». Обычный диалог не продолжаешь, пока пользователь не подтвердит безопасность.
— Лёгкие типичные симптомы → Reassurance: нормализуй, поддержи, без диагнозов и лекарств, общий план самопомощи.
— Средние/затяжные симптомы → Watch & Refer: опиши возможную группу состояний (без диагноза), объясни зачем очный визит и предложи запись после согласия.
— Можно давать ФАКТИЧЕСКИЕ сведения о лекарствах/витаминах/БАДах из пациентских инструкций: показания, кому нельзя/с осторожностью, частые побочки, важные предосторожности. Никогда не указывай дозы и не назначай лечение. Всегда добавляй дисклеймер.
— Не интерпретируешь анализы. Не выдаёшь схем лечения.

СТИЛЬ ОБЩЕНИЯ (из принципов):
эмпатия → отражение чувства → короткое зеркалирование фактов → 1–2 уточняющих вопроса → мини‑план → маркеры ухудшения → мягкий follow‑up («Отпишись через 2–3 часа… Могу напомнить»).
Фокус на запросе, простые слова, 2–3 предложения в абзаце. Возвращай ответственность: «ты решаешь — я навигатор». Уважай границы, спрашивай согласие на чувствительные темы.`

const DEVELOPER_PROMPT = `Русский язык, спокойный и тёплый тон.
Скелет ответа (кроме Emergency):
1) Эмпатия + отражение эмоции. 2) Зеркалирование фактов (1–2 предложения).
3) 1–2 уточняющих вопроса (длительность, t°, боль 0–10, дыхание, сыпь/цвет, кашель, хронические).
4) Мини‑план (отдых, вода, проветрить, наблюдать) — без лекарств/доз.
5) Красные флаги. 6) Follow‑up.
Если пользователь просит «Записать»: сперва спроси согласие — «Хочешь, я помогу записаться?» — и только после явного согласия предлагай слоты 13:00/15:00/17:00.
Drug info: запроси название и форму. Дай краткое, структурированное резюме инструкции ДЛЯ ПАЦИЕНТА (без доз). Дисклеймер обязателен.
Where to go: уточни город + профиль (терапевт/дерматолог/ЛОР), затем используй tool find_clinic_web и выведи 2–3 результата (название, адрес, телефон если есть).
Clarifying tool: если данных мало — ask_clarifying с 2–3 вопросами.
Простота: не более 3 абзацев по 2–3 предложения.`

// ========================= INTENTS =========================
const INTENT_HINT = {
  anxious: `Пользователь тревожится. Начни с поддержки, спроси: что именно пугает? есть ли сейчас боль/одышка/температура? Дай маленький шаг + follow‑up.`,
  drug_info: `Пользователь просит информацию о препарате/витамине/БАДе. Сначала уточни название и форму. Затем кратко: показания; кому нельзя/с осторожностью; важные предосторожности; частые побочки. Без доз и без назначения. Обязательный дисклеймер.`,
  where_to_go: `Пользователь спрашивает куда обратиться. Уточни город и профиль (терапевт/дерматолог/ЛОР). Когда оба получены — вызови find_clinic_web, отдай 2–3 клиники (название, адрес, телефон если доступен).`,
  book: `Пользователь хочет записаться. Уточни симптомы/длительность/t°/одышку/боль. Спроси согласие на запись. После согласия — профиль врача и слоты 13:00/15:00/17:00.`,
}

// ========================= TOOLS =========================
const TOOLS = [
  { type: 'function', function: { name: 'mark_emergency', description: 'Зафиксировать экстренную ситуацию.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'book_appointment', description: 'Запись к врачу (демо).', parameters: {
      type: 'object',
      properties: { doctor_name: { type: 'string' }, specialty: { type: 'string', enum: ['терапевт','дерматолог','ЛОР'] }, time: { type: 'string', enum: ['13:00','15:00','17:00'] } },
      required: ['doctor_name','specialty','time']
  } } },
  { type: 'function', function: { name: 'end_session', description: 'Завершить сессию.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'ask_clarifying', description: 'Уточняющие вопросы (1–3).', parameters: {
      type: 'object',
      properties: { questions: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 } },
      required: ['questions']
  } } },
  { type: 'function', function: { name: 'find_clinic_web', description: 'Найти клиники через публичный API (Overpass/OSM).', parameters: {
      type: 'object',
      properties: { city: { type: 'string' }, specialty: { type: 'string', enum: ['терапевт','дерматолог','ЛОР'] } },
      required: ['city','specialty']
  } } },
]

const EMERGENCY_RE = /(сильн(ая|о) боль в груди|давящая боль|боль за грудиной|трудно дышать|одышк|кровь|теряю сознание|судорог|онемен|невнятная речь|сильная головная боль|от[её]к (горла|языка)|не дышит|\\bSOS\\b)/i

// Map specialties to OSM healthcare:speciality filters
const SPEC_TO_OSM = {
  'дерматолог': 'dermatology',
  'ЛОР': 'otolaryngology|ent',
  'терапевт': 'general|family_medicine|therapy'
}

async function overpassClinics(city, spec) {
  const escCity = city.replace(/"/g, '\\"')
  const filter = SPEC_TO_OSM[spec] || 'clinic|hospital'
  const query = `[out:json][timeout:25];
  area["name"="${escCity}"]->.a;
  (
    node["healthcare:speciality"~"${filter}"](area.a);
    way["healthcare:speciality"~"${filter}"](area.a);
    node["amenity"~"clinic|hospital"]["name"](area.a);
    way["amenity"~"clinic|hospital"]["name"](area.a);
  );
  out tags center;`
  const resp = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data: query })
  })
  if (!resp.ok) throw new Error('Overpass error ' + resp.status)
  const data = await resp.json()
  const items = (data.elements || [])
    .map(e => e.tags || {})
    .filter(t => t.name)
    .slice(0, 5)
    .map(t => ({
      name: t.name,
      address: [t['addr:city'], t['addr:street'], t['addr:housenumber']].filter(Boolean).join(', ') || t['addr:full'] || 'адрес не указан',
      phone: t['contact:phone'] || t['phone'] || null
    }))
  return items
}

// ========================= Handler =========================
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { messages = [], meta = {} } = req.body || {}
    const last = messages[messages.length - 1]?.content || ''

    // If explicit dosing request, add guardrail (но не отказываемся от фактов)
    const asksDose = /(доз(?:а|ировк)|сколько (пить|принимать)|таблетк.*сколько)/i.test(last)

    if (EMERGENCY_RE.test(last)) {
      return res.status(200).json({
        state: 'EMERGENCY',
        content: 'Симптомы могут быть опасны. Пожалуйста, срочно обратитесь за медицинской помощью или вызовите скорую. Если совсем плохо — скажите «SOS».'
      })
    }

    const chat = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: DEVELOPER_PROMPT },
      ...(meta.intent && INTENT_HINT[meta.intent] ? [{ role: 'system', content: `ИНТЕНТ: ${INTENT_HINT[meta.intent]}` }] : []),
      ...(asksDose ? [{ role: 'system', content: 'Не указывать дозировки и схемы; вместо этого объяснить, что дозы назначает врач. Фактические сведения о препарате (показания/противопоказания/побочки) — разрешены.' }] : []),
      ...messages
    ]

    const first = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chat,
      tools: TOOLS,
      temperature: 0.85,
      frequency_penalty: 0.2
    })

    const msg = first.choices?.[0]?.message

    if (msg?.tool_calls?.length) {
      const toolMsgs = []
      for (const tc of msg.tool_calls) {
        const name = tc.function.name
        let args = {}
        try { args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {} } catch {}

        if (name === 'mark_emergency') {
          toolMsgs.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ ok: true }) })
          continue
        }
        if (name === 'book_appointment') {
          toolMsgs.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ ok: true, ...args }) })
          continue
        }
        if (name === 'end_session' || name === 'ask_clarifying') {
          toolMsgs.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ ok: true }) })
          continue
        }
        if (name === 'find_clinic_web') {
          try {
            const { city = '', specialty = '' } = args
            const results = await overpassClinics(city, specialty)
            toolMsgs.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ ok: true, city, specialty, results }) })
          } catch (err) {
            toolMsgs.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ ok: false, error: String(err) }) })
          }
          continue
        }
      }

      const second = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [...chat, msg, ...toolMsgs],
        temperature: 0.85,
        frequency_penalty: 0.2
      })
      return res.status(200).json({ content: second.choices?.[0]?.message?.content || 'Готово.' })
    }

    return res.status(200).json({ content: msg?.content || 'Готово.' })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error', detail: String(e) })
  }
}
