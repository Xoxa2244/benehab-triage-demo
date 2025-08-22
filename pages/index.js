// pages/index.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DemographicsCheck from '../components/DemographicsCheck';

export async function getServerSideProps() {
  return {
    props: {}
  };
}

export default function Home() {
  const [demographics, setDemographics] = useState(null);
  const [completedSurveys, setCompletedSurveys] = useState({
    attitude: false,
    typology: false,
    values: false
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

    // Проверяем завершенные опросы
    setCompletedSurveys({
      attitude: !!localStorage.getItem('benehab_attitude_profile'),
      typology: !!localStorage.getItem('benehab_typology_profile'),
      values: !!localStorage.getItem('benehab_values_profile')
    });
  }, []);

  const handleDemographicsComplete = (data) => {
    setDemographics(data);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const messageText = inputMessage.trim();
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Имитируем ответ Татьяны
    setTimeout(() => {
      let response = '';
      
      // Простая логика ответов на основе входящего сообщения
      const lowerMessage = messageText.toLowerCase();
      
      if (lowerMessage.includes('привет') || lowerMessage.includes('здравствуй') || lowerMessage.includes('добрый')) {
        response = `Привет! Я Татьяна, ваш персональный агент. Чем могу помочь?`;
      } else if (lowerMessage.includes('врач') || lowerMessage.includes('доктор') || lowerMessage.includes('записаться')) {
        response = `Конечно! Я помогу вам записаться к врачу. К какому специалисту вы хотели бы попасть? Или у вас есть конкретные симптомы?`;
      } else if (lowerMessage.includes('лекарство') || lowerMessage.includes('препарат') || lowerMessage.includes('таблетка')) {
        response = `Я с удовольствием расскажу вам о препарате! Какой именно препарат вас интересует? Или у вас есть конкретная проблема со здоровьем?`;
      } else if (lowerMessage.includes('симптом') || lowerMessage.includes('болит') || lowerMessage.includes('плохо')) {
        response = `Расскажите мне о ваших симптомах подробнее. Когда они появились? Насколько сильно выражены? Это поможет мне лучше понять вашу ситуацию.`;
      } else if (completedSurveys.attitude && completedSurveys.typology && completedSurveys.values) {
        // Если профиль заполнен, даем персонализированный ответ
        response = `Спасибо за ваше сообщение, ${demographics?.name}! Учитывая ваш профиль, я понимаю вашу ситуацию лучше. Давайте разберем это подробнее. Что именно вас интересует?`;
      } else {
        // Если профиль не заполнен, даем общий ответ
        response = 'Спасибо за ваше сообщение! Я готова помочь вам. Расскажите подробнее, что вас интересует, и я постараюсь дать полезный совет.';
      }

      const tatianaResponse = {
        id: Date.now() + 1,
        type: 'tatiana',
        text: response,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, tatianaResponse]);
      setIsTyping(false);
    }, 1000);
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

          {/* Профилирование */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Профилирование</h2>
            <p className="text-gray-600 mb-4">
              Пройдите опросы, чтобы Татьяна могла лучше понять вас и адаптировать стиль общения
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/profiling/attitude"
                className="group p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
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
                  {completedSurveys.attitude ? (
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
                  {completedSurveys.typology ? (
                    <span className="text-green-600 text-sm">✓ Завершено</span>
                  ) : (
                    <span className="text-gray-400 text-sm">Не начато</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm font-medium">3</span>
                  </div>
                  <span className="text-gray-700">Ценности</span>
                </div>
                <div className="flex items-center space-x-2">
                  {completedSurveys.values ? (
                    <span className="text-green-600 text-sm">✓ Завершено</span>
                  ) : (
                    <span className="text-gray-400 text-sm">Не начато</span>
                  )}
                </div>
              </div>
            </div>

            {/* Кнопка для просмотра инструкций */}
            {completedSurveys.attitude && 
             completedSurveys.typology && 
             completedSurveys.values && (
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

          {/* Чат с Татьяной */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Общение с Татьяной</h2>
            
            {/* История сообщений */}
            <div className="mb-4 max-h-96 overflow-y-auto space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-2xl">💬</span>
                  </div>
                  <p>Начните общение с Татьяной!</p>
                  <p className="text-sm">Напишите сообщение ниже</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              {/* Индикатор печатания */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm">Татьяна печатает...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Поле ввода */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Напишите сообщение..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Отправить
              </button>
            </div>
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
      </div>
    </DemographicsCheck>
  );
}
