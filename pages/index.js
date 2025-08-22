// pages/index.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DemographicsCheck from '../components/DemographicsCheck';
import TatianaMessage from '../components/TatianaMessage';

export async function getServerSideProps() {
  return {
    props: {}
  };
}

export default function Home() {
  const [demographics, setDemographics] = useState(null);
  const [showTatianaMessage, setShowTatianaMessage] = useState(false);
  const [tatianaMessageData, setTatianaMessageData] = useState({});

  useEffect(() => {
    // Проверяем, что мы в браузере
    if (typeof window === 'undefined') return;
    
    // Загружаем демографические данные при загрузке страницы
    const savedData = localStorage.getItem('benehab_demographics');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setDemographics(parsed);
      } catch (e) {
        console.error('Ошибка загрузки демографических данных:', e);
      }
    }
  }, []);

  const handleDemographicsComplete = (data) => {
    setDemographics(data);
    // Показываем приветственное сообщение от Татьяны
    showWelcomeMessage(data);
  };

  const showWelcomeMessage = (data) => {
    setTatianaMessageData({
      demographics: data,
      surveyType: 'welcome',
      surveyResults: null
    });
    setShowTatianaMessage(true);
  };

  const showSurveyMessage = (surveyType, results) => {
    setTatianaMessageData({
      demographics: demographics,
      surveyType: surveyType,
      surveyResults: results
    });
    setShowTatianaMessage(true);
  };

  const closeTatianaMessage = () => {
    setShowTatianaMessage(false);
  };

  return (
    <DemographicsCheck onDemographicsComplete={handleDemographicsComplete}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Заголовок */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">Б</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Benehab - Персональный помощник</h1>
              </div>
              
              {/* Информация о пользователе */}
              {demographics && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{demographics.name}</p>
                    <p className="text-xs text-gray-500">
                      {demographics.age} лет, {demographics.gender === 'male' ? 'М' : 'Ж'}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {demographics.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Приветствие */}
          {demographics && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {demographics.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Добро пожаловать, {demographics.name}! 👋
                  </h2>
                  <p className="text-gray-600">
                    Я Татьяна, ваш персональный агент. Давайте вместе пройдем профилирование, 
                    чтобы я могла лучше понять вас и адаптировать стиль общения под ваши индивидуальные особенности.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Быстрые действия */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Быстрые действия</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/profiling/attitude"
                className="group p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
                onClick={() => showSurveyMessage('attitude', null)}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                  <span className="text-blue-600 text-xl">🏥</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Отношение к болезни</h3>
                <p className="text-sm text-gray-600">Первый опрос</p>
              </Link>

              <Link
                href="/profiling/typology"
                className="group p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center"
                onClick={() => showSurveyMessage('typology', null)}
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
                  <span className="text-green-600 text-xl">🧠</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Психотип</h3>
                <p className="text-sm text-gray-600">Второй опрос</p>
              </Link>

              <Link
                href="/profiling/values"
                className="group p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-center"
                onClick={() => showSurveyMessage('values', null)}
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                  <span className="text-purple-600 text-xl">💎</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Ценности</h3>
                <p className="text-sm text-gray-600">Третий опрос</p>
              </Link>

              <Link
                href="/communication-instructions"
                className="group p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors text-center"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors">
                  <span className="text-orange-600 text-xl">📋</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Инструкции</h3>
                <p className="text-sm text-gray-600">По общению</p>
              </Link>
            </div>
          </div>

          {/* Прогресс профилирования */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Прогресс профилирования</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">1</span>
                  </div>
                  <span className="text-gray-700">Отношение к болезни</span>
                </div>
                <div className="flex items-center space-x-2">
                  {localStorage.getItem('benehab_attitude_profile') ? (
                    <span className="text-green-600 text-sm">✓ Завершено</span>
                  ) : (
                    <span className="text-gray-400 text-sm">Не начато</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm font-medium">2</span>
                  </div>
                  <span className="text-gray-700">Психотип</span>
                </div>
                <div className="flex items-center space-x-2">
                  {localStorage.getItem('benehab_typology_profile') ? (
                    <span className="text-green-600 text-sm">✓ Завершено</span>
                  ) : (
                    <span className="text-gray-400 text-sm">Не начато</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm font-medium">3</span>
                  </div>
                  <span className="text-gray-700">Ценности</span>
                </div>
                <div className="flex items-center space-x-2">
                  {localStorage.getItem('benehab_values_profile') ? (
                    <span className="text-green-600 text-sm">✓ Завершено</span>
                  ) : (
                    <span className="text-gray-400 text-sm">Не начато</span>
                  )}
                </div>
              </div>
            </div>

            {/* Кнопка для просмотра инструкций */}
            {localStorage.getItem('benehab_attitude_profile') && 
             localStorage.getItem('benehab_typology_profile') && 
             localStorage.getItem('benehab_values_profile') && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Link
                  href="/communication-instructions"
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  <span className="mr-2">📋</span>
                  Посмотреть инструкции по общению
                </Link>
              </div>
            )}
          </div>

          {/* Админ панель */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Администрирование</h2>
            <Link
              href="/admin"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span className="mr-2">⚙️</span>
              Админ панель
            </Link>
          </div>
        </div>

        {/* Сообщение от Татьяны */}
        <TatianaMessage
          demographics={tatianaMessageData.demographics}
          surveyType={tatianaMessageData.surveyType}
          surveyResults={tatianaMessageData.surveyResults}
          isVisible={showTatianaMessage}
          onClose={closeTatianaMessage}
        />
      </div>
    </DemographicsCheck>
  );
}
