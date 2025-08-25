

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TatianaMessage from '../../components/TatianaMessage';

export default function AttitudeResults() {
  const [profile, setProfile] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [showTatianaMessage, setShowTatianaMessage] = useState(false);

  useEffect(() => {
    // Проверяем, что мы в браузере
    if (typeof window === 'undefined') return;
    
    // Загружаем профиль отношения к болезни
    const savedProfile = localStorage.getItem('benehab_attitude_profile');
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

    // Отладочная информация
    console.log('🚨 === ATTITUDE RESULTS DEBUG === 🚨');
    console.log('Profile loaded from localStorage:', profile);
    if (profile) {
      console.log('Profile keys:', Object.keys(profile));
      if (profile.scales) {
        console.log('Scales keys:', Object.keys(profile.scales));
        console.log('Scales values:', profile.scales);
      }
    }
    console.log('🚨 === END ATTITUDE RESULTS DEBUG === 🚨');
  }, []);

  const closeTatianaMessage = () => {
    setShowTatianaMessage(false);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Профиль не найден</h1>
          <p className="text-gray-600 mb-6">Сначала пройдите опрос отношения к болезни</p>
          <Link
            href="/profiling/attitude"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Пройти опрос
          </Link>
        </div>
      </div>
    );
  }

  const getScaleColor = (value) => {
    if (value >= 7) return 'text-red-600';
    if (value >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getScaleLabel = (value) => {
    if (value >= 7) return 'Высокий';
    if (value >= 4) return 'Средний';
    return 'Низкий';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Результаты опроса: Отношение к болезни
          </h1>
          <p className="text-lg text-gray-600">
            Анализ вашего психологического профиля завершен
          </p>
        </div>

        {/* Основные результаты */}
        <div className="bg-white rounded-lg shadow-lg border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Основные показатели</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(profile.scales || {}).map(([scale, value]) => (
              <div key={scale} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {scale.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-lg font-bold ${getScaleColor(value)}`}>
                    {value}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      value >= 7 ? 'bg-red-500' : value >= 4 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(value / 10) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {getScaleLabel(value)} уровень
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Доминирующий тип */}
        {profile.dominant_type && (
          <div className="bg-white rounded-lg shadow-lg border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Доминирующий тип</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                {profile.dominant_type.replace(/_/g, ' ').toUpperCase()}
              </h3>
              <p className="text-blue-800">
                {profile.dominant_type === 'severity' && 'Вы серьезно относитесь к своему здоровью и глубоко переживаете за него.'}
                {profile.dominant_type === 'secondary_gain' && 'Болезнь может приносить определенные выгоды, такие как внимание и забота близких.'}
                {profile.dominant_type === 'hide_resist' && 'Вы склонны скрывать свою болезнь и сопротивляться лечению.'}
                {profile.dominant_type === 'work_escape' && 'Вы стремитесь убежать в работу или спорт, чтобы отвлечься от проблем со здоровьем.'}
                {profile.dominant_type === 'low_selfesteem' && 'У вас снижена самооценка, и вы часто вините себя в болезни.'}
                {profile.dominant_type === 'alt_med' && 'Вы верите в альтернативную медицину и стремитесь к самолечению.'}
                {profile.dominant_type === 'addictions' && 'У вас есть вредные привычки или химические зависимости.'}
                {profile.dominant_type === 'ignore' && 'Вы склонны игнорировать болезнь и не воспринимать серьезно риски.'}
                {profile.dominant_type === 'anxiety' && 'Вы склонны к тревожным расстройствам и беспокойству о здоровье.'}
              </p>
            </div>
          </div>
        )}

        {/* Рекомендации */}
        <div className="bg-white rounded-lg shadow-lg border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Рекомендации</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Стиль общения</h3>
                <p className="text-gray-600">
                  Татьяна будет адаптировать свой стиль общения под ваши индивидуальные особенности, 
                  учитывая результаты этого опроса.
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
                  Продолжите профилирование, пройдя опрос психотипа и ценностей для получения 
                  полной картины вашей личности.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Навигация */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/profiling/typology"
            className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <span className="mr-2">🧠</span>
            Следующий опрос: Психотип
          </Link>
          <Link
            href="/communication-instructions"
            className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
        surveyType="attitude"
        surveyResults={profile}
        isVisible={showTatianaMessage}
        onClose={closeTatianaMessage}
      />
    </div>
  );
}
