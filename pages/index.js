import { useEffect, useMemo, useRef, useState } from 'react'
import Logo from '@/components/Logo'

const TIME_SLOTS = ["13:00","15:00","17:00"]

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Привет! Я — медицинский ассистент Benehab. Расскажи, что беспокоит. Если станет совсем плохо — нажми SOS.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSlots, setShowSlots] = useState(false)
  const listRef = useRef(null)

  const quickChips = useMemo(() => [
    { label: "Трудно дышать", text: "Мне трудно дышать" },
    { label: "Грипп, 3-й день", text: "У меня грипп, третий день температура 37.3, слабость" },
    { label: "Сыпь 6 дней", text: "У меня уже 6 дней сыпь на ногах, не чешется, не проходит" },
    { label: "Субфебрилитет?", text: "Что такое субфебрильная температура?" },
  ], [])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, showSlots])

  const send = async (text) => {
    if (!text.trim()) return
    const withUser = [...messages, { role: 'user', content: text }]
    setMessages(withUser)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: withUser })
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: data.content }])
      setShowSlots(/Выбери удобное время:/i.test(data.content))
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: 'Упс, что-то пошло не так. Попробуй ещё раз.' }])
    } finally {
      setLoading(false)
    }
  }

  const onChooseTime = (t) => {
    // Для простоты: локально подтверждаем запись (сервер тоже умеет это делать через tool)
    setMessages(m => [...m, { role: 'assistant', content: 'Спасибо, вы записаны.' }])
    setShowSlots(false)
  }

  return (
    <div className="min-h-screen">
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Logo />
          <div>
            <div className="font-semibold">Benehab · Медицинский ассистент</div>
            <div className="text-xs text-gray-500">Triage · Запись к врачу · Базовые вопросы</div>
          </div>
          <div className="ml-auto flex gap-2">
            <button className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 text-sm" onClick={() => send('SOS')}>
              SOS
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 grid gap-3">
        <div className="flex flex-wrap gap-2">
          {quickChips.map(c => (
            <button key={c.label} className="px-3 py-1.5 rounded-full bg-white shadow text-sm hover:bg-slate-50" onClick={() => send(c.text)}>
              {c.label}
            </button>
          ))}
          <button
            className="ml-auto px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 text-sm hover:bg-rose-100"
            onClick={() => {
              setMessages([{ role: 'assistant', content: 'Привет! Я — медицинский ассистент Benehab. Расскажи, что беспокоит. Если станет совсем плохо — нажми SOS.' }])
              setShowSlots(false)
            }}
          >
            Сбросить сессию
          </button>
        </div>

        <div ref={listRef} className="bg-slate-100/60 rounded-2xl p-3 h-[60vh] overflow-y-auto border">
          <div className="space-y-2">
            {messages.map((m, i) => (
              <div key={i} className="w-full flex justify-start">
                <div className={`max-w-[85%] rounded-2xl shadow p-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-50 ml-auto' : 'bg-white'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {showSlots && (
              <div className="w-full flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-white shadow p-3 text-sm">
                  <div className="text-sm text-gray-700 mb-2">Выбери удобное время:</div>
                  <div className="flex gap-2">
                    {TIME_SLOTS.map(t => (
                      <button key={t} className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700" onClick={() => onChooseTime(t)}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-2 flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
            placeholder="Опиши симптомы или задай медицинский вопрос…"
            className="flex-1 px-3 py-2 outline-none"
          />
          <button onClick={() => send(input)} disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50">
            Отправить
          </button>
        </div>

        <div className="text-xs text-gray-500 leading-relaxed">
          <p>⚠️ Демонстрация. Ассистент не ставит диагнозы, не назначает лечение и не интерпретирует анализы. При признаках опасного состояния — вызывайте скорую.</p>
        </div>
      </div>
    </div>
  )
}
