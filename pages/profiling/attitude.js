

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AttitudeSurvey() {
  const router = useRouter();
  const [currentBatch, setCurrentBatch] = useState(0);
  const [answers, setAnswers] = useState(Array(41).fill(null));
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(0);

  const BATCH_SIZE = 8;

  useEffect(() => {
    loadItems();
    loadProgress();
  }, []);

  useEffect(() => {
    updateProgress();
  }, [answers]);

  const loadItems = async () => {
    try {
      const response = await fetch('/api/profiling/attitude/items');
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Ошибка загрузки вопросов:', error);
    }
  };

  const loadProgress = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('benehab_attitude_answers');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAnswers(parsed);
        } catch (error) {
          console.error('Ошибка загрузки прогресса:', error);
        }
      }
    }
  };

  const saveProgress = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('benehab_attitude_answers', JSON.stringify(answers));
    }
  };

  const updateProgress = () => {
    const answered = answers.filter(a => a !== null).length;
    setProgress((answered / 41) * 100);
  };

  const handleAnswer = (questionIndex, value) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = value;
    setAnswers(newAnswers);
    saveProgress();
  };

  const nextBatch = () => {
    if (currentBatch < Math.ceil(41 / BATCH_SIZE) - 1) {
      setCurrentBatch(currentBatch + 1);
    }
  };

  const prevBatch = () => {
    if (currentBatch > 0) {
      setCurrentBatch(currentBatch - 1);
    }
  };

  const canSubmit = answers.filter(a => a !== null).length === 41;

  const submitSurvey = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      const response = await fetch('/api/profiling/attitude/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Отладочная информация
        console.log('🚨 === ATTITUDE SURVEY DEBUG === 🚨');
        console.log('API Response:', result);
        console.log('Profile structure:', Object.keys(result.profile || {}));
        if (result.profile && result.profile.scales) {
          console.log('Scales found:', Object.keys(result.profile.scales));
          console.log('Scales values:', result.profile.scales);
        }
        console.log('🚨 === END ATTITUDE DEBUG === 🚨');
        
        // Сохраняем профиль
        if (typeof window !== 'undefined') {
          localStorage.setItem('benehab_attitude_profile', JSON.stringify(result.profile));
          console.log('✅ Профиль сохранен в localStorage');
        }

        // Переходим к странице результата
        router.push('/profiling/attitude-results');
      } else {
        throw new Error('Ошибка отправки');
      }
    } catch (error) {
      console.error('Ошибка отправки опроса:', error);
      alert('Произошла ошибка. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const startIndex = currentBatch * BATCH_SIZE;
  const endIndex = Math.min(startIndex + BATCH_SIZE, 41);
  const currentItems = items.slice(startIndex, endIndex);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p>Загружаем вопросы...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Заголовок */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Опрос: Отношение к здоровью</h1>
            <Link href="/" className="text-emerald-600 hover:text-emerald-700">
              Вернуться к чату
            </Link>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Прогресс: {Math.round(progress)}%</span>
              <span>{answers.filter(a => a !== null).length} из 41</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <p className="text-gray-700">
            Прочитайте каждое утверждение и выберите, насколько оно относится к вам:
            <br />
            <strong>0</strong> — совсем не относится, <strong>1</strong> — частично относится, <strong>2</strong> — полностью относится
          </p>
        </div>

        {/* Вопросы */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="space-y-6">
            {currentItems.map((item, index) => {
              const questionIndex = startIndex + index;
              const questionNumber = questionIndex + 1;
              
              return (
                <div key={questionIndex} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <p className="text-gray-900 mb-3">
                    <span className="font-medium text-emerald-600">{questionNumber}.</span> {item.text}
                  </p>
                  
                  <div className="flex gap-4">
                    {[0, 1, 2].map(value => (
                      <label key={value} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          value={value}
                          checked={answers[questionIndex] === value}
                          onChange={() => handleAnswer(questionIndex, value)}
                          className="sr-only"
                        />
                        <div className={`
                          w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium
                          ${answers[questionIndex] === value 
                            ? 'border-emerald-600 bg-emerald-600 text-white' 
                            : 'border-gray-300 text-gray-400 hover:border-emerald-400'
                          }
                        `}>
                          {value}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {value === 0 ? 'Не относится' : value === 1 ? 'Частично' : 'Полностью'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Навигация */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <button
              onClick={prevBatch}
              disabled={currentBatch === 0}
              className={`
                px-6 py-2 rounded-xl border transition-colors
                ${currentBatch === 0 
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'border-gray-300 text-gray-700 hover:border-emerald-400 hover:text-emerald-600'
                }
              `}
            >
              ← Назад
            </button>

            <div className="text-sm text-gray-500">
              Страница {currentBatch + 1} из {Math.ceil(41 / BATCH_SIZE)}
            </div>

            {currentBatch < Math.ceil(41 / BATCH_SIZE) - 1 ? (
              <button
                onClick={nextBatch}
                className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Далее →
              </button>
            ) : (
              <button
                onClick={submitSurvey}
                disabled={!canSubmit || loading}
                className={`
                  px-6 py-2 rounded-xl transition-colors
                  ${canSubmit && !loading
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {loading ? 'Отправляем...' : 'Завершить опрос'}
              </button>
            )}
          </div>
        </div>

        {/* Подсказка */}
        <div className="text-center text-sm text-gray-500 mt-4">
          Ваши ответы автоматически сохраняются. Вы можете вернуться к этому опросу позже.
        </div>
      </div>
    </div>
  );
}
