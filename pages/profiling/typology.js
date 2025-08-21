'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function TypologySurvey() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadItems();
    loadProgress();
  }, []);

  useEffect(() => {
    updateProgress();
  }, [answers, currentQuestion]);

  const loadItems = async () => {
    try {
      const response = await fetch('/api/profiling/typology/items');
      const data = await response.json();
      
      if (data.success) {
        setItems(data.questions || []);
        console.log('✅ Вопросы загружены успешно:', data.questions?.length);
      } else {
        console.error('❌ API вернул ошибку:', data.error);
        setItems([]);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки вопросов:', error);
      setItems([]);
    }
  };

  const loadProgress = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('benehab_typology_answers');
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
      localStorage.setItem('benehab_typology_answers', JSON.stringify(answers));
    }
  };

  const updateProgress = () => {
    const totalQuestions = items.length;
    if (totalQuestions > 0) {
      const progress = ((currentQuestion + 1) / totalQuestions) * 100;
      setProgress(progress);
    }
  };

  const handleOptionSelect = (questionId, optionId, ptype) => {
    const currentAnswers = answers[questionId] || [];
    
    // Если опция уже выбрана, убираем её
    if (currentAnswers.some(ans => ans.optionId === optionId)) {
      const newAnswers = currentAnswers.filter(ans => ans.optionId !== optionId);
      setAnswers(prev => ({
        ...prev,
        [questionId]: newAnswers
      }));
    } else {
      // Если выбрано уже 3 опции, не добавляем
      if (currentAnswers.length >= 3) {
        return;
      }
      
      // Добавляем новую опцию
      const newAnswers = [...currentAnswers, { optionId, ptype }];
      setAnswers(prev => ({
        ...prev,
        [questionId]: newAnswers
      }));
    }
    
    saveProgress();
  };

  const canGoNext = () => {
    const currentAnswers = answers[items[currentQuestion]?.id] || [];
    return currentAnswers.length >= 1;
  };

  const canGoBack = () => {
    return currentQuestion > 0;
  };

  const goToNext = () => {
    if (canGoNext() && currentQuestion < items.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const goToBack = () => {
    if (canGoBack()) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const getSelectedCount = (questionId) => {
    return (answers[questionId] || []).length;
  };

  const isOptionSelected = (questionId, optionId) => {
    return (answers[questionId] || []).some(ans => ans.optionId === optionId);
  };

  const isOptionDisabled = (questionId, optionId) => {
    const selectedCount = getSelectedCount(questionId);
    const isSelected = isOptionSelected(questionId, optionId);
    return selectedCount >= 3 && !isSelected;
  };

  const submitSurvey = async () => {
    if (!canGoNext()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/profiling/typology/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (response.ok) {
        const result = await response.json();
        localStorage.setItem('benehab_typology_profile', JSON.stringify(result.profile));
        
        // Генерируем PIB
        await generatePIB();
        
        // Перенаправляем на главную страницу
        router.push('/');
      } else {
        console.error('Ошибка отправки ответов');
      }
    } catch (error) {
      console.error('Ошибка отправки ответов:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePIB = async () => {
    try {
      const response = await fetch('/api/profiling/pib', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          demographics: JSON.parse(localStorage.getItem('benehab_demographics') || '{}'),
          attitude_profile: JSON.parse(localStorage.getItem('benehab_attitude_profile') || '{}'),
          typology_profile: JSON.parse(localStorage.getItem('benehab_typology_profile') || '{}')
        }),
      });

      if (response.ok) {
        const result = await response.json();
        localStorage.setItem('benehab.pib', JSON.stringify(result.pib));
      }
    } catch (error) {
      console.error('Ошибка генерации PIB:', error);
    }
  };

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

  const currentItem = items[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Заголовок */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Опрос: Стиль общения</h1>
            <Link href="/" className="text-emerald-600 hover:text-emerald-700">
              Вернуться к чату
            </Link>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Прогресс: {Math.round(progress)}%</span>
              <span>Вопрос {currentQuestion + 1} из {items.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <p className="text-gray-700">
            Отметьте от 1 до 3 утверждений, которые относятся к вам. Нет "правильных" или "неправильных" ответов — 
            это просто про ваш стиль общения и восприятия информации.
          </p>
        </div>

        {/* Текущий вопрос */}
        {currentItem && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentItem.question_text}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentItem.options.map((option) => (
                <label 
                  key={option.option_id} 
                  className={`
                    flex items-start cursor-pointer p-4 rounded-lg border-2 transition-all
                    ${isOptionSelected(currentItem.id, option.option_id)
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                    ${isOptionDisabled(currentItem.id, option.option_id)
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isOptionSelected(currentItem.id, option.option_id)}
                    onChange={() => handleOptionSelect(currentItem.id, option.option_id, option.ptype)}
                    disabled={isOptionDisabled(currentItem.id, option.option_id)}
                    className="mt-1 h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="ml-3 text-sm text-gray-700 leading-relaxed">
                    {option.option_text}
                  </span>
                </label>
              ))}
            </div>
            
            <div className="mt-4 text-sm text-gray-500 text-center">
              Выбрано: {getSelectedCount(currentItem.id)} из 3
            </div>
          </div>
        )}

        {/* Навигация */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <button
              onClick={goToBack}
              disabled={!canGoBack()}
              className={`
                px-6 py-2 rounded-xl transition-colors
                ${canGoBack()
                  ? 'border border-gray-300 text-gray-700 hover:border-emerald-400 hover:text-emerald-600'
                  : 'border border-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              ← Назад
            </button>

            {currentQuestion < items.length - 1 ? (
              <button
                onClick={goToNext}
                disabled={!canGoNext()}
                className={`
                  px-6 py-2 rounded-xl transition-colors
                  ${canGoNext()
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                Далее →
              </button>
            ) : (
              <button
                onClick={submitSurvey}
                disabled={!canGoNext() || loading}
                className={`
                  px-6 py-2 rounded-xl transition-colors
                  ${canGoNext() && !loading
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {loading ? 'Завершаем...' : 'Завершить опрос'}
              </button>
            )}
          </div>
        </div>

        {/* Подсказка */}
        <div className="text-center text-sm text-gray-500 mt-4">
          Ваши ответы автоматически сохраняются. После завершения вы сможете общаться с Татьяной в персонализированном режиме.
        </div>
      </div>
    </div>
  );
}
