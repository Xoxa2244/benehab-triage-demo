'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function TypologySurvey() {
  const router = useRouter();
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState({});
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    console.log('🚀 Компонент TypologySurvey загружен');
    console.log('📊 Начальное состояние items:', items);
    loadItems();
    loadProgress();
  }, []);

  useEffect(() => {
    updateProgress();
  }, [answers]);

  const loadItems = async () => {
    try {
      console.log('🔄 Загружаем вопросы типологии...');
      const response = await fetch('/api/profiling/typology/items');
      const data = await response.json();
      console.log('📊 Полученные данные:', data);
      
      if (data.success) {
        setItems(data);
        // Инициализируем массив ответов на основе количества вопросов
        const totalQuestions = data.total || 0;
        setAnswers(Array(totalQuestions).fill(0));
        console.log('✅ Вопросы загружены успешно, инициализировано ответов:', totalQuestions);
      } else {
        console.error('❌ API вернул ошибку:', data.error);
        setItems({});
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
          // Проверяем, что сохраненные ответы соответствуют текущему количеству вопросов
          if (items.total && parsed.length === items.total) {
            setAnswers(parsed);
          }
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
    const totalQuestions = items.total || 0;
    const answered = answers.filter(a => a !== 0).length;
    setProgress(totalQuestions > 0 ? (answered / totalQuestions) * 100 : 0);
  };

  const handleAnswer = (questionIndex, value) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = value;
    setAnswers(newAnswers);
    saveProgress();
  };

  const canSubmit = answers.filter(a => a !== 0).length > 0;

  const getColumnLabel = (columnNumber) => {
    const labels = {
      1: 'Сензитивный',
      2: 'Дистимический', 
      3: 'Демонстративный',
      4: 'Возбудимый',
      5: 'Тревожный',
      6: 'Педантичный',
      7: 'Экзальтированный',
      8: 'Эмотивный',
      9: 'Застревающий'
    };
    return labels[columnNumber] || `Колонка ${columnNumber}`;
  };

  const submitSurvey = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      const response = await fetch('/api/profiling/typology/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Сохраняем профиль
        if (typeof window !== 'undefined') {
          localStorage.setItem('benehab_typology_profile', JSON.stringify(result.profile));
        }

        // Генерируем PIB
        await generatePIB();
        
        // Переходим к чату
        router.push('/');
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

  const generatePIB = async () => {
    try {
      const attitudeProfile = localStorage.getItem('benehab_attitude_profile');
      const typologyProfile = localStorage.getItem('benehab_typology_profile');
      const demographics = localStorage.getItem('benehab_demographics');

      if (attitudeProfile && typologyProfile) {
        const response = await fetch('/api/profiling/pib', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attitude_profile: JSON.parse(attitudeProfile),
            typology_profile: JSON.parse(typologyProfile),
            patient_meta: demographics ? JSON.parse(demographics) : {}
          })
        });

        if (response.ok) {
          const result = await response.json();
          localStorage.setItem('benehab.pib', JSON.stringify(result.pib));
        }
      }
    } catch (error) {
      console.error('Ошибка генерации PIB:', error);
    }
  };



  if (!items.total || items.total === 0) {
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
      <div className="max-w-6xl mx-auto p-4">
        {/* Заголовок */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Опрос: Стиль общения</h1>
            <Link href="/" className="text-emerald-600 hover:text-emerald-700">
              Вернуться к чату
            </Link>
          </div>
          
          {/* Временная отладка в заголовке */}
          <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4 text-sm">
            <div className="font-bold text-red-800">🚨 ОТЛАДКА:</div>
            <div>items: {JSON.stringify(items)}</div>
            <div>items.columns: {items.columns ? `✅ ${items.columns.length} колонок` : '❌ НЕТ'}</div>
            <div>items.total: {items.total || 'НЕТ'}</div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Прогресс: {Math.round(progress)}%</span>
              <span>{answers.filter(a => a !== 0).length} из {items.total || 0}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <p className="text-gray-700">
            Отметьте утверждения, которые относятся к вам. Нет "правильных" или "неправильных" ответов — 
            это просто про ваш стиль общения и восприятия информации.
          </p>
        </div>

        {/* Отладочная информация */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 text-xs text-gray-600">
          <div className="font-medium mb-2">🔍 Отладка типологического опроса:</div>
          <div>items.total: {items.total || 'НЕТ'}</div>
          <div>items.columns: {items.columns ? `✅ ${items.columns.length} колонок` : '❌ НЕТ'}</div>
          <div>Количество колонок: {items.columns?.length || 0}</div>
          <div>Общее количество вопросов: {items.total || 0}</div>
          <pre className="mt-2 text-xs overflow-auto max-h-32">
            {JSON.stringify(items, null, 2)}
          </pre>
        </div>

        {/* Вопросы по столбцам */}
        {items.columns && items.columns.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {items.columns.map((column) => (
              <div key={column.column} className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {getColumnLabel(column.column)} ({column.count} вопросов)
                </h3>
                
                <div className="space-y-3">
                  {column.questions.map((item) => {
                    const questionIndex = item.id - 1; // id начинается с 1
                    
                    return (
                      <label key={item.id} className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          checked={answers[questionIndex] === 1}
                          onChange={(e) => handleAnswer(questionIndex, e.target.checked ? 1 : 0)}
                          className="mt-1 h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="ml-3 text-sm text-gray-700 leading-relaxed">
                          {item.question_text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
            <div className="text-yellow-800 mb-2">⚠️ Вопросы не загружены</div>
            <div className="text-sm text-yellow-700">
              {!items.total ? 'Данные не получены' : 'Структура данных некорректна'}
            </div>
            <button 
              onClick={loadItems} 
              className="mt-3 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
            >
              🔄 Попробовать снова
            </button>
          </div>
        )}

        {/* Навигация */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <Link
              href="/profiling/attitude"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:border-emerald-400 hover:text-emerald-600 transition-colors"
            >
              ← К предыдущему опросу
            </Link>

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
              {loading ? 'Завершаем...' : 'Завершить все опросы'}
            </button>
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
