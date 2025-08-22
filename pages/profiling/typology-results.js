'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TatianaMessage from '../../components/TatianaMessage';

export default function TypologyResults() {
  const [profile, setProfile] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [showTatianaMessage, setShowTatianaMessage] = useState(false);

  useEffect(() => {
    // Проверяем, что мы в браузере
    if (typeof window === 'undefined') return;
    
    // Загружаем профиль психотипа
    const savedProfile = localStorage.getItem('benehab_typology_profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error('Ошибка загрузки профиля:', e);
      }
    }

    // Загружаем демографические данные
    const savedDemographics = localStorage.getItem('benehab_demographics');
    if (savedDemographics) {
      try {
        setDemographics(JSON.parse(savedDemographics));
      } catch (e) {
        console.error('Ошибка загрузки демографических данных:', e);
      }
    }

    // Показываем сообщение от Татьяны через небольшую задержку
    setTimeout(() => {
      setShowTatianaMessage(true);
    }, 1000);
  }, []);

  const closeTatianaMessage = () => {
    setShowTatianaMessage(false);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🧠</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Профиль не найден</h1>
          <p className="text-gray-600 mb-6">Сначала пройдите опрос психотипа</p>
          <Link
            href="/profiling/typology"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Пройти опрос
          </Link>
        </div>
      </div>
    );
  }

  const getTypeName = (type) => {
    const typeNames = {
      sensitive: 'Сенситивный',
      dysthymic: 'Дистимический',
      demonstrative: 'Демонстративный',
      excitable: 'Возбудимый',
      cyclothymic: 'Циклотимический',
      stuck: 'Застревающий',
      pedantic: 'Педантичный',
      anxious: 'Тревожный',
      hyperthymic: 'Гипертимический'
    };
    return typeNames[type] || type;
  };

  const getTypeDescription = (type) => {
    const descriptions = {
      sensitive: 'Ранимость, высокая чувствительность, склонность к соматическим жалобам и усталости.',
      dysthymic: 'Склонность к самокритике, чувство вины, низкая мотивация.',
      demonstrative: 'Любовь к вниманию, стремление производить впечатление.',
      excitable: 'Импульсивность, быстрые действия, эмоциональные вспышки.',
      cyclothymic: 'Переменчивость настроения и активности.',
      stuck: 'Упорство, принципиальность, длительность переживаний.',
      pedantic: 'Осторожность, любовь к порядку, детальность.',
      anxious: 'Склонность к беспокойству, мнительность.',
      hyperthymic: 'Энергичность, оптимизм, активность.'
    };
    return descriptions[type] || 'Описание типа не найдено.';
  };

  const getTypeColor = (type) => {
    const colors = {
      sensitive: 'bg-pink-100 text-pink-800 border-pink-200',
      dysthymic: 'bg-blue-100 text-blue-800 border-blue-200',
      demonstrative: 'bg-purple-100 text-purple-800 border-purple-200',
      excitable: 'bg-red-100 text-red-800 border-red-200',
      cyclothymic: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      stuck: 'bg-orange-100 text-orange-800 border-orange-200',
      pedantic: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      anxious: 'bg-gray-100 text-gray-800 border-gray-200',
      hyperthymic: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Результаты опроса: Психотип
          </h1>
          <p className="text-lg text-gray-600">
            Анализ вашего психологического типа завершен
          </p>
        </div>

        {/* Доминирующий тип */}
        {profile.dominant_type && (
          <div className="bg-white rounded-lg shadow-lg border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ваш доминирующий психотип</h2>
            <div className={`border rounded-lg p-6 ${getTypeColor(profile.dominant_type)}`}>
              <h3 className="text-2xl font-bold mb-3">
                {getTypeName(profile.dominant_type)}
              </h3>
              <p className="text-lg leading-relaxed">
                {getTypeDescription(profile.dominant_type)}
              </p>
            </div>
          </div>
        )}

        {/* Все типы с их значениями */}
        {profile.types && (
          <div className="bg-white rounded-lg shadow-lg border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Все психотипы</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(profile.types).map(([type, value]) => (
                <div key={type} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {getTypeName(type)}
                    </span>
                    <span className={`text-lg font-bold ${
                      value > 0.6 ? 'text-green-600' : value > 0.3 ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {Math.round(value * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        value > 0.6 ? 'bg-green-500' : value > 0.3 ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${value * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {value > 0.6 ? 'Высокий' : value > 0.3 ? 'Средний' : 'Низкий'} уровень
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Рекомендации по общению */}
        <div className="bg-white rounded-lg shadow-lg border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Рекомендации по общению</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Адаптация стиля</h3>
                <p className="text-gray-600">
                  Татьяна будет учитывать особенности вашего психотипа и адаптировать стиль общения 
                  для максимального комфорта и эффективности.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-600 text-sm">💡</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Следующие шаги</h3>
                <p className="text-gray-600">
                  Продолжите профилирование, пройдя опрос ценностей для получения полной картины 
                  вашей личности и системы ценностей.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Навигация */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/profiling/values"
            className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <span className="mr-2">💎</span>
            Следующий опрос: Ценности
          </Link>
          <Link
            href="/communication-instructions"
            className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <span className="mr-2">📋</span>
            Инструкции по общению
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span className="mr-2">🏠</span>
            На главную
          </Link>
        </div>
      </div>

      {/* Сообщение от Татьяны */}
      <TatianaMessage
        demographics={demographics}
        surveyType="typology"
        surveyResults={profile}
        isVisible={showTatianaMessage}
        onClose={closeTatianaMessage}
      />
    </div>
  );
}
