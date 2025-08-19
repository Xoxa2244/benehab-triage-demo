import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// === Prompts (unchanged parts summarized; key additions kept) ===
const SYSTEM_PROMPT = `Ты — медицинский ассистент Benehab (triage).
...`

const DEVELOPER_PROMPT = `Всегда отвечай на русском, дружелюбно.
... Слоты предлагай ТОЛЬКО после явного согласия пользователя на запись.`

const INTENT_HINT = {
  anxious: `Пользователь тревожится...`,
  drug_info: `Можно давать фактические сведения из пациентских инструкций (без доз). Сначала спроси название и форму.`,
  where_to_go: `Собери Город (обязательно) и район/округ (по возможности) + профиль (терапевт/дерматолог/ЛОР). Затем вызови find_clinic_web.`,
  book: `Сначала спроси «Хочешь, помогу записаться?». Только после согласия — предлагай слоты.`,
}

const TOOLS = [
  { type:'function', function:{ name:'find_clinic_web', description:'Найти клиники по городу/району и профилю через OpenStreetMap (Nominatim+Overpass).', parameters:{
    type:'object',
    properties:{
      city:{type:'string', description:'Город, например: Москва'},
      district:{type:'string', description:'Район/округ в городе, например: Текстильщики'},
      specialty:{type:'string', enum:['терапевт','дерматолог','ЛОР']},
      limit:{type:'number'}
    },
    required:['city','specialty']
  } } },
]

// Emergency regex
const EMERGENCY_RE = /(сильн(ая|о) боль в груди|давящая боль|боль за грудиной|трудно дышать|одышк|кровь|теряю сознание|судорог|онемен|невнятная речь|сильная головная боль|от[её]к (горла|языка)|не дышит|\bSOS\b)/i

// ---- helpers for OSM/Nominatim ----
async function geocodeCityDistrict(city, district='') {
  const q = district ? `${city}, ${district}` : city
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(q)}`
  const r = await fetch(url, { headers:{'User-Agent':'benehab-demo/1.0'} })
  if (!r.ok) return null
  const arr = await r.json()
  if (!arr?.length) return null
  const it = arr[0]
  // center + bounding box
  const bbox = it.boundingbox?.map(Number) || null
  return { lat: Number(it.lat), lon: Number(it.lon), bbox }
}

// Build Overpass query around point with radius and specialty mapping
function mapSpecialty(spec) {
  if (spec === 'дерматолог') return '(dermatology|dermatolog)'
  if (spec === 'ЛОР') return '(otolaryngology|otolaryngolog|ent|ЛОР)'
  return '(general|family_medicine|therapy|therapist|врач общей практики|терапевт)'
}

function buildOverpassQuery(lat, lon, radius, specRegex) {
  // We search for nodes/ways/relations with healthcare/amenity tags and name matches
  const around = `around:${radius},${lat},${lon}`
  const query = `
  [out:json][timeout:25];
  (
    node["healthcare"~"clinic|hospital|doctor"](${around});
    way["healthcare"~"clinic|hospital|doctor"](${around});
    node["amenity"~"clinic|hospital|doctors"](${around});
    way["amenity"~"clinic|hospital|doctors"](${around});
  )->base;

  (
    node.base["healthcare:speciality"~"${specRegex}"];
    way.base["healthcare:speciality"~"${specRegex}"];
    node.base["name"~"${specRegex}", i];
    way.base["name"~"${specRegex}", i];
  );
  out center tags ${'{::id}'};
  `
  return query
}

function formatAddress(tags) {
  const parts = []
  if (tags['addr:full']) parts.push(tags['addr:full'])
  else {
    const s = [tags['addr:city'], tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(', ')
    if (s) parts.push(s)
  }
  if (!parts.length && tags['addr:place']) parts.push(tags['addr:place'])
  return parts.join(', ')
}

function pickPhone(tags) {
  return tags['contact:phone'] || tags['phone'] || tags['contact:telephone'] || ''
}

async function overpassSearch(lat, lon, spec, limit=5) {
  const specRegex = mapSpecialty(spec)
  const radii = [1500, 3000, 6000] // расширяем при нехватке
  for (const radius of radii) {
    const query = buildOverpassQuery(lat, lon, radius, specRegex)
    const url = 'https://overpass-api.de/api/interpreter'
    const r = await fetch(url, {
      method:'POST',
      headers:{ 'Content-Type':'application/x-www-form-urlencoded', 'User-Agent':'benehab-demo/1.0' },
      body: `data=${encodeURIComponent(query)}`
    })
    if (!r.ok) continue
    const data = await r.json()
    let elements = Array.isArray(data.elements) ? data.elements : []
    // map to simplified objects
    let items = elements.map(el => {
      const tags = el.tags || {}
      return {
        name: tags.name || tags['official_name'] || tags.operator || 'Медицинское учреждение',
        address: formatAddress(tags) || (tags['addr:street'] ? `${tags['addr:street']} ${tags['addr:housenumber']||''}`.trim() : ''),
        phone: pickPhone(tags),
        lat: el.lat || el.center?.lat || null,
        lon: el.lon || el.center?.lon || null,
        score: (pickPhone(tags)?1:0) + (formatAddress(tags)?1:0)
      }
    })
    // unique by name+address
    const seen = new Set()
    items = items.filter(it => {
      const key = `${it.name}|${it.address}`
      if (seen.has(key)) return false
      seen.add(key); return true
    })
    // sort: with contacts first
    items.sort((a,b)=> b.score - a.score)
    if (items.length) return items.slice(0, limit)
  }
  return []
}

async function tool_find_clinic_web(args) {
  const city = (args.city||'').trim()
  const dist = (args.district||'').trim()
  const spec = (args.specialty||'терапевт').trim()
  const limit = Math.min(Math.max(Number(args.limit)||3, 1), 6)
  if (!city) return { ok:false, error:'city_required' }
  const geo = await geocodeCityDistrict(city, dist)
  if (!geo) return { ok:false, error:'geocode_failed' }
  const results = await overpassSearch(geo.lat, geo.lon, spec, limit)
  return { ok:true, city, district:dist, specialty:spec, results }
}

// ---- Handler ----
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' })
  try {
    const { messages = [], meta = {} } = await req.body || {}
    const last = messages[messages.length-1]?.content || ''

    if (EMERGENCY_RE.test(last)) {
      return res.status(200).json({ state:'EMERGENCY', content:'Симптомы могут быть опасны. Срочно обратись за медпомощью или вызови скорую. Напиши, когда будешь в безопасности.' })
    }

    const chat = [
      { role:'system', content: SYSTEM_PROMPT },
      { role:'system', content: DEVELOPER_PROMPT },
      ...(meta.intent && INTENT_HINT[meta.intent] ? [{ role:'system', content:`ИНТЕНТ: ${INTENT_HINT[meta.intent]}` }] : []),
      ...messages,
    ]

    const first = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chat,
      tools: TOOLS,
      temperature: 0.8,
      frequency_penalty: 0.2
    })

    const msg = first.choices?.[0]?.message
    if (msg?.tool_calls?.length) {
      const toolMsgs = []
      for (const tc of msg.tool_calls) {
        const name = tc.function.name
        let args = {}
        try { args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {} } catch {}
        if (name === 'find_clinic_web') {
          const data = await tool_find_clinic_web(args)
          toolMsgs.push({ role:'tool', tool_call_id: tc.id, content: JSON.stringify(data) })
        } else {
          toolMsgs.push({ role:'tool', tool_call_id: tc.id, content: JSON.stringify({ ok:true, ...args }) })
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

    return res.status(200).json({ content: msg?.content || 'Готово.' })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error:'Server error', detail:String(e) })
  }
}
