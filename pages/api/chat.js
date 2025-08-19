import OpenAI from 'openai'

// === OpenAI client ===
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// === SYSTEM / DEVELOPER prompts (включают принципы коммуникации) ===
const SYSTEM_PROMPT = `Ты — медицинский ассистент Benehab (triage).
Допускаешь только медицинские темы. Off‑topic мягко отклоняешь; на 3‑й раз — завершаешь сессию.
При признаках экстренности сразу выдаёшь emergency‑ответ: «Срочно обратись за медицинской помощью/112». Обычный диалог не продолжаешь, пока пользователь не подтвердит безопасность.
При лёгких типичных симптомах — Reassurance: нормализуй, поддержи, без диагнозов и лекарств, советуй отдых и самонаблюдение.
При средних/затяжных симптомах — Watch & Refer: опиши возможную группу состояний (без диагноза), предложи профиль врача и три слота (13:00, 15:00, 17:00). После выбора — «Спасибо, вы записаны».
Не интерпретируешь анализы и не назначаешь лечение. Пиши коротко, спокойно, эмпатично.
СТИЛЬ ОБЩЕНИЯ: эмпатия → зеркалирование → 1–2 уточняющих вопроса → мини‑план → маркеры ухудшения → мягкий follow‑up. Формулировки простые (бытовые слова), абзацы по 2–3 предложения. Поддерживай ответственность пациента: ты — навигатор.
ЭТИКА И ГРАНИЦЫ: уважай чувства и решения. На чувствительные вопросы — с согласия. Если пользователь уводит в оффтоп — мягко возвращай фокус.
`

const DEVELOPER_PROMPT = `Всегда отвечай на русском, дружелюбно.
Скелет ответа (кроме Emergency):
1) Эмпатия + отражение эмоции (без преувеличений).
2) Зеркалирование фактов (1–2 предложения).
3) 1–2 уточняющих вопроса (выбирай из: длительность, t°, боль (0–10), дыхание, сыпь/цвет, кашель, хронические).
4) Мини‑план (общие меры: отдых/вода/проветрить/наблюдение). Без лекарств и дозировок.
5) Красные флаги (когда обращаться срочно).
6) Follow‑up: «Отпишись через 2–3 часа… Могу напомнить».
Не делать: диагнозов, схем лечения, интерпретации анализов; не приписывать эмоции, не давить. Простота: максимум 3 абзаца по 2–3 предложения.
Фразы‑заготовки: «Понимаю, это может вызывать тревогу», «Спасибо, что описал(а) — это помогает», «Ты лучше всех знаешь своё состояние — я помогу сориентироваться».
Clarifying tool: если данных мало — вызови ask_clarifying (2–3 вопроса).
Watch & Refer: поясни ценность очного визита, затем предложи слоты 13:00/15:00/17:00.
`

// === INTENT hints для быстрых чипов ===
const INTENT_HINT = {
  anxious: `Пользователь тревожится. Начни с эмпатии и поддержки, спроси: что именно вызывает переживание? есть ли сейчас боль/одышка/температура? Дай маленький шаг и мягкий follow‑up.`,
  drug_info: `Пользователь просит рассказать про препарат. Сначала спроси название и форму выпуска. Затем дай краткое резюме инструкции для пациента: показания, противопоказания/кому нельзя, предосторожности (вождение, алкоголь, беременность), частые побочные эффекты. Без доз и без назначения. Заверши дисклеймером: это не назначение; читайте инструкцию и уточняйте у врача.`,
  where_to_go: `Пользователь спрашивает куда обратиться. Уточни город/локацию и требуемого специалиста (терапевт, дерматолог, ЛОР). Когда оба уточнены — вызови инструмент find_clinic и выведи 2–3 клиники (название, адрес, телефон).`,
  book: `Пользователь хочет записаться к врачу. Уточни симптомы (что, сколько дней, t°, одышка/сильная боль). Затем предложи профиль врача и слоты 13:00/15:00/17:00.`,
}

// === Инструменты (function calling) ===
const TOOLS = [
  {
    type: 'function',
    function: { name: 'mark_emergency', description: 'Зафиксировать экстренную ситуацию.', parameters: { type: 'object', properties: {} } }
  },
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Запись к врачу (демо).',
      parameters: {
        type: 'object',
        properties: {
          doctor_name: { type: 'string' },
          specialty: { type: 'string', enum: ['терапевт','дерматолог','ЛОР'] },
          time: { type: 'string', enum: ['13:00','15:00','17:00'] }
        },
        required: ['doctor_name','specialty','time']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'end_session',
      description: 'Завершить сессию.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'ask_clarifying',
      description: 'Уточняющие вопросы (1–3).',
      parameters: {
        type: 'object',
        properties: { questions: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 } },
        required: ['questions']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'find_clinic',
      description: 'Найти 2–3 клиники по городу и профилю (демо-имитация, без реального поиска).',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string' },
          specialty: { type: 'string', enum: ['терапевт','дерматолог','ЛОР'] }
        },
        required: ['city','specialty']
      }
    }
  },
]

// === Простой emergency pre-filter ===
const EMERGENCY_RE = /(сильн(ая|о) боль в груди|давящая боль|боль за грудиной|трудно дышать|одышк|кровь|теряю сознание|судорог|онемен|невнятная речь|сильная головная боль|от[её]к (горла|языка)|не дышит|\bSOS\b)/i

// === Демо-данные клиник ===
const DEMO_CLINICS = {
  'Москва': {
    'терапевт': [
      { name: 'Городская поликлиника №1', address: 'ул. Пушкина, 10', phone: '+7 495 000‑00‑01' },
      { name: 'Клиника «Здоровье»', address: 'пр-т Мира, 25', phone: '+7 495 000‑00‑02' },
    ],
    'дерматолог': [
      { name: 'Дерматологический центр №3', address: 'ул. Садовая, 7', phone: '+7 495 000‑03‑03' },
      { name: 'Кожвендиспансер', address: 'ул. Новая, 12', phone: '+7 495 000‑03‑04' },
    ],
    'ЛОР': [
      { name: 'ЛОР‑клиника «Ухо‑Горло‑Нос»', address: 'ул. Лесная, 3', phone: '+7 495 000‑04‑05' },
      { name: 'Поликлиника №12, ЛОР‑каб.', address: 'пр-т Ленина, 15', phone: '+7 495 000‑04‑06' },
    ],
  },
  'Санкт-Петербург': {
    'терапевт': [
      { name: 'Поликлиника №8', address: 'Невский пр., 100', phone: '+7 812 000‑00‑08' },
      { name: 'Клиника «НеваМед»', address: 'Литейный пр., 20', phone: '+7 812 000‑00‑09' },
    ],
    'дерматолог': [
      { name: 'Дермацентр', address: 'В.О., 7‑я линия, 9', phone: '+7 812 000‑03‑03' },
    ],
    'ЛОР': [
      { name: 'ЛОР‑центр', address: 'Малый пр. П.С., 5', phone: '+7 812 000‑04‑04' },
    ],
  },
}

// === Handler ===
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { messages = [], meta = {} } = req.body || {}
    const last = messages[messages.length - 1]?.content || ''

    // Guardrails: если пользователь явно просит дозировки/таблетки — напомним ограничение
    const wantsDose = /(дозир|дозу|сколько (пить|принимать)|таблетк)/i.test(last)

    // Pre-filter emergency: быстрый ответ без запроса к модели
    if (EMERGENCY_RE.test(last)) {
      return res.status(200).json({
        state: 'EMERGENCY',
        content: 'Симптомы, которые ты описал, могут быть опасны. Пожалуйста, срочно обратись за медицинской помощью или вызови скорую. Если тебе совсем плохо — скажи «SOS», и я вызову помощь.'
      })
    }

    // Сбор сообщений в чат с учётом интента (хинта)
    const chat = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: DEVELOPER_PROMPT },
      ...(meta.intent && INTENT_HINT[meta.intent] ? [{ role: 'system', content: `ИНТЕНТ: ${INTENT_HINT[meta.intent]}` }] : []),
      ...(wantsDose ? [{ role: 'system', content: 'Запрет: не предлагать дозировки и схемы. Если спрашивают о дозах — отвечать, что ассистент не назначает лечение и не указывает дозы.' }] : []),
      ...messages
    ]

    // Первый запрос к модели
    const first = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chat,
      tools: TOOLS,
      temperature: 0.8,
      frequency_penalty: 0.2
    })

    const msg = first.choices?.[0]?.message

    // Обработка tool_calls (один шаг исполнения инструментов, затем второй ответ модели)
    if (msg?.tool_calls?.length) {
      const toolMsgs = []

      for (const tc of msg.tool_calls) {
        const name = tc.function.name
        let payload = {}
        try { payload = tc.function.arguments ? JSON.parse(tc.function.arguments) : {} } catch {}

        if (name === 'mark_emergency') {
          toolMsgs.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ ok: true }) })
          continue
        }

        if (name === 'book_appointment') {
          // демо: просто подтверждаем
          toolMsgs.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ ok: true, ...payload }) })
          continue
        }

        if (name === 'end_session') {
          toolMsgs.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ ok: true }) })
          continue
        }

        if (name === 'ask_clarifying') {
          toolMsgs.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ ok: true }) })
          continue
        }

        if (name === 'find_clinic') {
          const city = (payload.city || '').trim()
          const spec = (payload.specialty || '').trim()
          const list = (DEMO_CLINICS[city] && DEMO_CLINICS[city][spec]) || [
            { name: 'Городская поликлиника №1', address: 'Центр города', phone: '+7 000 000‑00‑01' },
            { name: 'Клиника «Семейная»', address: 'ул. Центральная, 5', phone: '+7 000 000‑00‑02' },
          ]
          toolMsgs.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ ok: true, city, specialty: spec, results: list }) })
          continue
        }
      }

      const second = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [...chat, msg, ...toolMsgs],
        temperature: 0.8,
        frequency_penalty: 0.2
      })

      return res.status(200).json({ content: second.choices?.[0]?.message?.content || 'Готово.' })
    }

    // Иначе — сразу возвращаем первый ответ
    return res.status(200).json({ content: msg?.content || 'Готово.' })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error', detail: String(e) })
  }
}
