import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function BasePrompt() {
  const [basePrompt, setBasePrompt] = useState('');
  const [savedPrompt, setSavedPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    // Загружаем сохраненный базовый промпт
    const saved = localStorage.getItem('benehab_base_prompt');
    if (saved) {
      setBasePrompt(saved);
      setSavedPrompt(saved);
    } else {
      // Устанавливаем базовый промпт по умолчанию
      const defaultPrompt = `Ты — "Татьяна", ассистент по здоровью Benehab.
Говори тёпло и просто. Уважай выбор человека. 
Не ставь диагнозы, не назначай лекарства.
Triage: если есть опасные симптомы — немедленно советуй вызвать скорую/обратиться в неотложку и не продолжай обычную беседу пока пользователь не подтвердит безопасность.
Лёгкие типичные симптомы — поддержка, отдых/жидкость/самонаблюдение.
Средние, требующие наблюдения — предложить записаться к врачу, но слоты давай только если человек согласился.
Препараты: допускается фактическая справка (показания, противопоказания, предосторожности, частые побочные эффекты) — БЕЗ дозировок и без назначения. Если просят дозу — напомни, что дозировки определяет врач.
Слоты для записи: 13:00, 15:00, 17:00 — только после явного согласия. После выбора скажи: "Спасибо, вы записаны".`;
      
      setBasePrompt(defaultPrompt);
      setSavedPrompt(defaultPrompt);
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('');

    try {
      // Сохраняем в localStorage
      localStorage.setItem('benehab_base_prompt', basePrompt);
      setSavedPrompt(basePrompt);
      setSaveStatus('✅ Базовый промпт успешно сохранен!');
      
      // Очищаем статус через 3 секунды
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setSaveStatus('❌ Ошибка сохранения промпта');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setBasePrompt(savedPrompt);
    setSaveStatus('🔄 Промпт восстановлен к последнему сохраненному состоянию');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleResetToDefault = () => {
    const defaultPrompt = `Ты — "Татьяна", ассистент по здоровью Benehab.
Говори тёпло и просто. Уважай выбор человека. 
Не ставь диагнозы, не назначай лекарства.
Triage: если есть опасные симптомы — немедленно советуй вызвать скорую/обратиться в неотложку и не продолжай обычную беседу пока пользователь не подтвердит безопасность.
Лёгкие типичные симптомы — поддержка, отдых/жидкость/самонаблюдение.
Средние, требующие наблюдения — предложить записаться к врачу, но слоты давай только если человек согласился.
Препараты: допускается фактическая справка (показания, противопоказания, предосторожности, частые побочные эффекты) — БЕЗ дозировок и без назначения. Если просят дозу — напомни, что дозировки определяет врач.
Слоты для записи: 13:00, 15:00, 17:00 — только после явного согласия. После выбора скажи: "Спасибо, вы записаны".`;
    
    setBasePrompt(defaultPrompt);
    setSaveStatus('🔄 Промпт восстановлен к значению по умолчанию');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <>
      <Head>
        <title>Базовый промпт - Benehab</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Заголовок и навигация */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ⚙️ Базовый промпт Татьяны
              </h1>
              <p className="text-gray-600 mt-2">
                Этот промпт применяется всегда, но корректируется результатами опросов
              </p>
            </div>
            <Link 
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ← На главную
            </Link>
          </div>

          {/* Статус сохранения */}
          {saveStatus && (
            <div className={`mb-6 p-4 rounded-lg ${
              saveStatus.includes('✅') ? 'bg-green-100 border-green-300' : 
              saveStatus.includes('❌') ? 'bg-red-100 border-red-300' : 
              'bg-blue-100 border-blue-300'
            } border`}>
              <p className={saveStatus.includes('✅') ? 'text-green-700' : 
                           saveStatus.includes('❌') ? 'text-red-700' : 'text-blue-700'}>
                {saveStatus}
              </p>
            </div>
          )}

          {/* Редактор промпта */}
          <div className="bg-white p-6 rounded-lg border border-gray-300 mb-6">
            <h2 className="text-xl font-semibold mb-4">📝 Редактирование базового промпта</h2>
            
            <div className="mb-4">
              <label htmlFor="basePrompt" className="block text-sm font-medium text-gray-700 mb-2">
                Базовый промпт для ИИ-ассистента "Татьяна":
              </label>
              <textarea
                id="basePrompt"
                value={basePrompt}
                onChange={(e) => setBasePrompt(e.target.value)}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Введите базовый промпт для Татьяны..."
              />
            </div>

            {/* Кнопки управления */}
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isSaving ? '⏳ Сохраняю...' : '💾 Сохранить'}
              </button>
              
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                🔄 Восстановить
              </button>
              
              <button
                onClick={handleResetToDefault}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                🏠 По умолчанию
              </button>
            </div>
          </div>

          {/* Информация */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-300">
            <h2 className="text-xl font-semibold mb-3 text-blue-900">📖 Как это работает:</h2>
            <ul className="text-blue-800 space-y-2">
              <li>• <strong>Базовый промпт</strong> - это основа для всех ответов Татьяны</li>
              <li>• <strong>Опросный промпт</strong> - корректирует базовый на основе вашего профилирования</li>
              <li>• <strong>Итоговый промпт</strong> = Базовый + Опросный (с приоритетом опросного)</li>
              <li>• Изменения сохраняются автоматически в браузере</li>
              <li>• Для применения изменений перезапустите чат</li>
            </ul>
          </div>

          {/* Ссылки */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              href="/debug-prompts"
              className="p-6 bg-white rounded-lg border border-gray-300 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🔍 Отладка промптов</h3>
              <p className="text-gray-600">Просмотр сгенерированных промптов и диагностика</p>
            </Link>
            
            <Link 
              href="/"
              className="p-6 bg-white rounded-lg border border-gray-300 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">💬 Чат с Татьяной</h3>
              <p className="text-gray-600">Протестировать персонализированные ответы</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
