import { useState, useEffect } from 'react';
import Link from 'next/link';
import TatianaMessage from '../../components/TatianaMessage';

export default function ValuesResults() {
  const [profile, setProfile] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [showTatianaMessage, setShowTatianaMessage] = useState(false);

  useEffect(() => {
    // Проверяем, что мы в браузере
    if (typeof window === 'undefined') return;
    
    // Загружаем профиль ценностей
    const savedProfile = localStorage.getItem('benehab_values_profile');
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
          <div className="text-6xl mb-4">💎</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Профиль не найден</h1>
          <p className="text-gray-600 mb-6">Сначала пройдите опрос ценностей</p>
          <Link
            href="/profiling/values"
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Пройти опрос
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Результаты опроса: Система ценностей
          </h1>
          <p className="text-lg text-gray-600">
            Анализ вашей психосемантики завершен
          </p>
        </div>

        {/* Основные индексы */}
        <div className="bg-white rounded-lg shadow-lg border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ключевые показатели</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.indices && Object.entries(profile.indices).map(([index, value]) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {index.replace(/_/g, ' ')}
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {Math.round(value * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${Math.abs(value) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Рекомендации */}
        <div className="bg-white rounded-lg shadow-lg border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Рекомендации</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Персонализация общения</h3>
                <p className="text-gray-600">
                  Татьяна теперь понимает вашу систему ценностей и будет адаптировать стиль общения 
                  с учетом ваших предпочтений и особенностей восприятия.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-600 text-sm">💡</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Завершение профилирования</h3>
                <p className="text-gray-600">
                  Поздравляем! Вы завершили полное психологическое профилирование. 
                  Теперь у Татьяны есть полная картина вашей личности.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Навигация */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/communication-instructions"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
          >
            <span className="mr-2">📋</span>
            Посмотреть инструкции по общению
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
        surveyType="values"
        surveyResults={profile}
        isVisible={showTatianaMessage}
        onClose={closeTatianaMessage}
      />
    </div>
  );
}

export async function getServerSideProps() {
  return {
    props: {}
  };
}
