// pages/index.js
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import OnboardingCard from '../components/OnboardingCard';
import ProfilingProgress from '../components/ProfilingProgress';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Привет! Я — Татьяна, твой ассистент по здоровью. Расскажи, что беспокоит. Если станет совсем плохо — нажми SOS.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Весь доступ к localStorage — только на клиенте и внутри эффектов
  const [demoDone, setDemoDone] = useState(false);
  const [needProfiling, setNeedProfiling] = useState(false);
  const [pib, setPib] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const demo = !!localStorage.getItem('benehab_demographics');
    const haveA = !!localStorage.getItem('benehab_attitude_profile');
    const haveT = !!localStorage.getItem('benehab_typology_profile');
    const haveV = !!localStorage.getItem('benehab_values_profile');
    const pibData = localStorage.getItem('benehab.pib');
    
    console.log('🔍 Debug localStorage:', { demo, haveA, haveT, haveV, needProfiling: !(haveA && haveT && haveV) });
    
    setDemoDone(demo);
    setNeedProfiling(!(haveA && haveT && haveV));
    
    if (pibData) {
      try {
        setPib(JSON.parse(pibData));
      } catch (error) {
        console.error('Ошибка парсинга PIB:', error);
      }
    }
  }, []);

  // Дополнительный useEffect для отслеживания изменений в localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkProfiles = () => {
      const haveA = !!localStorage.getItem('benehab_attitude_profile');
      const haveT = !!localStorage.getItem('benehab_typology_profile');
      const haveV = !!localStorage.getItem('benehab_values_profile');
      const newNeedProfiling = !(haveA && haveT && haveV);
      
      console.log('🔄 Проверка профилей:', { haveA, haveT, haveV, newNeedProfiling, current: needProfiling });
      
      if (newNeedProfiling !== needProfiling) {
        setNeedProfiling(newNeedProfiling);
        console.log('✅ needProfiling обновлен:', newNeedProfiling);
      }
    };

    // Проверяем каждые 2 секунды
    const interval = setInterval(checkProfiles, 2000);
    
    return () => clearInterval(interval);
  }, [needProfiling]);

  const listRef = useRef(null);
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const getPIB = async () => {
    if (pib) return pib;
    
    if (typeof window === 'undefined') return null;
    const A = JSON.parse(localStorage.getItem('benehab_attitude_profile') || 'null');
    const B = JSON.parse(localStorage.getItem('benehab_typology_profile') || 'null');
    if (!A && !B) return null;
    
    try {
      const r = await fetch('/api/profiling/pib', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attitude_profile: A, typology_profile: B }),
      });
      const d = await r.json();
      if (d.pib) {
        localStorage.setItem('benehab.pib', JSON.stringify(d.pib));
        setPib(d.pib);
        return d.pib;
      }
    } catch (error) {
      console.error('Ошибка получения PIB:', error);
    }
    return null;
  };

  const send = async (text) => {
    if (!text.trim()) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const currentPib = await getPIB();
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, meta: { pib: currentPib } }),
      });
      const d = await r.json();
      setMessages((m) => [...m, { role: 'assistant', content: d.content || 'Готово.' }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Что-то пошло не так. Попробуй ещё раз.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = async (intent) => {
    let message = '';
    
    switch (intent) {
      case 'anxious':
        message = 'Я очень переживаю о своем здоровье. Мне нужна поддержка и понимание.';
        break;
      case 'drug_info':
        message = 'Расскажи, пожалуйста, про препарат. Мне нужна информация о показаниях, противопоказаниях и возможных побочных эффектах.';
        break;
      case 'where_to_go':
        message = 'Куда мне обратиться за помощью? Мне нужен совет по выбору специалиста или клиники.';
        break;
      case 'book':
        message = 'Хочу записаться к врачу. Помоги мне с этим, пожалуйста.';
        break;
      case 'reminder':
        message = 'Напомни мне через 2 часа принять лекарство.';
        break;
      default:
        message = 'Мне нужна помощь.';
    }
    
    await send(message);
  };

  const resetSession = () => {
    // Сбрасываем все данные сессии
    if (typeof window !== 'undefined') {
      localStorage.removeItem('benehab_demographics');
      localStorage.removeItem('benehab_attitude_profile');
      localStorage.removeItem('benehab_typology_profile');
      localStorage.removeItem('benehab_values_profile');
      localStorage.removeItem('benehab.pib');
      localStorage.removeItem('benehab_attitude_answers');
      localStorage.removeItem('benehab_typology_answers');
      localStorage.removeItem('benehab_values_colors');
      localStorage.removeItem('benehab_values_color_rankings');
    }
    
    // Сбрасываем состояние
    setDemoDone(false);
    setNeedProfiling(false);
    setPib(null);
    setMessages([
      {
        role: 'assistant',
        content:
          'Привет! Я — Татьяна, твой ассистент по здоровью. Расскажи, что беспокоит. Если станет совсем плохо — нажми SOS.',
      },
    ]);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-4 space-y-3">
        {/* Заголовок с кнопкой сброса */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Benehab - Татьяна</h1>
          {demoDone && (
            <button
              onClick={resetSession}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm"
              title="Сбросить сессию и начать заново"
            >
              🔄 Сбросить сессию
            </button>
          )}
        </div>

        {!demoDone && <OnboardingCard onDone={(demo) => {
          setDemoDone(true);
          // Принудительно обновляем needProfiling после завершения демо
          setTimeout(() => {
            const haveA = !!localStorage.getItem('benehab_attitude_profile');
            const haveT = !!localStorage.getItem('benehab_typology_profile');
            setNeedProfiling(!(haveA && haveT));
            console.log('🔄 Обновление needProfiling:', { haveA, haveT, needProfiling: !(haveA && haveT) });
          }, 100);
        }} />}

        {/* Отладочная информация */}
        {demoDone && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs text-gray-600">
            <div className="font-medium mb-1">🔍 Отладка:</div>
            <div>demoDone: {demoDone.toString()}</div>
            <div>needProfiling: {needProfiling.toString()}</div>
            <div>Есть attitude: {!!localStorage.getItem('benehab_attitude_profile') ? '✅' : '❌'}</div>
            <div>Есть typology: {!!localStorage.getItem('benehab_typology_profile') ? '✅' : '❌'}</div>
            <div>Есть values: {!!localStorage.getItem('benehab_values_profile') ? '✅' : '❌'}</div>
            <div className="mt-2">
              <button
                onClick={() => {
                  const haveA = !!localStorage.getItem('benehab_attitude_profile');
                  const haveT = !!localStorage.getItem('benehab_typology_profile');
                  const haveV = !!localStorage.getItem('benehab_values_profile');
                  setNeedProfiling(!(haveA && haveT && haveV));
                  console.log('🔄 Принудительное обновление needProfiling:', { haveA, haveT, haveV, needProfiling: !(haveA && haveT && haveV) });
                }}
                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
              >
                🔄 Обновить состояние
              </button>
            </div>
          </div>
        )}

        {demoDone && needProfiling && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm">
            <div className="font-medium mb-3">
              Можно я задам несколько коротких вопросов? Это займёт 5–10 минут и поможет мне говорить с тобой максимально
              комфортно.
            </div>
            <ProfilingProgress />
          </div>
        )}

        {/* Чипы-интенты */}
        {demoDone && !needProfiling && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-sm text-gray-600 mb-3">Быстрые действия:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleChipClick('anxious')}
                className="px-3 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors text-sm"
              >
                😰 Очень переживаю
              </button>
              <button
                onClick={() => handleChipClick('drug_info')}
                className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-sm"
              >
                💊 Рассказать про препарат
              </button>
              <button
                onClick={() => handleChipClick('where_to_go')}
                className="px-3 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors text-sm"
              >
                🏥 Куда обратиться
              </button>
              <button
                onClick={() => handleChipClick('book')}
                className="px-3 py-2 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors text-sm"
              >
                📅 Записать к врачу
              </button>
              <button
                onClick={() => handleChipClick('reminder')}
                className="px-3 py-2 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors text-sm"
              >
                ⏰ Напомнить через 2 часа
              </button>
              <Link
                href="/communication-instructions"
                className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors text-sm"
              >
                📋 Инструкции по общению
              </Link>
            </div>
          </div>
        )}

        {/* Профиль пользователя */}
        {pib && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm">
            <div className="font-medium mb-2 text-blue-900">Ваш профиль:</div>
            <div className="text-blue-800">
              <div>Тон: <span className="font-medium">{pib.communication_plan?.tone || 'calm_supportive'}</span></div>
              <div>Длительность сессии: <span className="font-medium">{pib.communication_plan?.session_length || 'medium'}</span></div>
              {pib.communication_plan?.avoid?.length > 0 && (
                <div>Избегаем: <span className="font-medium">{pib.communication_plan.avoid.join(', ')}</span></div>
              )}
            </div>
          </div>
        )}

        <div className="bg-slate-100/60 rounded-2xl p-3 h-[60vh] overflow-y-auto border" ref={listRef}>
          <div className="space-y-2">
            {messages.map((m, i) => (
              <div key={i} className="w-full flex justify-start">
                <div
                  className={`max-w-[85%] rounded-2xl shadow p-3 text-sm leading-relaxed ${
                    m.role === 'user' ? 'bg-blue-50 ml-auto' : 'bg-white'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-2 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Опиши симптомы или задай медицинский вопрос…"
            className="flex-1 px-3 py-2 outline-none"
          />
          <button onClick={() => send(input)} disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-xl disabled:opacity-50">
            Отправить
          </button>
        </div>

        <div className="text-xs text-gray-500">
          Демо: ассистент даёт фактическую справку по препаратам без дозировок и не назначает лечение. При опасных симптомах — вызывайте
          скорую.
        </div>
      </div>
    </div>
  );
}
