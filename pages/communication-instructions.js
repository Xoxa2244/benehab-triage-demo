

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCommunicationInstructions } from '../lib/communication-instructions';

export default function CommunicationInstructions() {
  const router = useRouter();
  const [instructions, setInstructions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState({});

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = () => {
    if (typeof window !== 'undefined') {
      const attitudeProfile = localStorage.getItem('benehab_attitude_profile');
      const typologyProfile = localStorage.getItem('benehab_typology_profile');
      const valuesProfile = localStorage.getItem('benehab_values_profile');
      const pib = localStorage.getItem('benehab.pib');

      const profilesData = {};
      
      if (attitudeProfile) {
        try {
          profilesData.attitude = JSON.parse(attitudeProfile);
        } catch (error) {
          console.error('Ошибка парсинга attitude профиля:', error);
        }
      }
      
      if (typologyProfile) {
        try {
          profilesData.typology = JSON.parse(typologyProfile);
        } catch (error) {
          console.error('Ошибка парсинга typology профиля:', error);
        }
      }
      
      if (valuesProfile) {
        try {
          profilesData.values = JSON.parse(valuesProfile);
        } catch (error) {
          console.error('Ошибка парсинга values профиля:', error);
        }
      }
      
      if (pib) {
        try {
          profilesData.pib = JSON.parse(pib);
        } catch (error) {
          console.error('Ошибка парсинга PIB:', error);
        }
      }

      setProfiles(profilesData);
      
      // Генерируем инструкции
      if (profilesData.attitude || profilesData.typology) {
        const commInstructions = getCommunicationInstructions(
          profilesData.attitude, 
          profilesData.typology
        );
        setInstructions(commInstructions);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p>Загружаем инструкции...</p>
        </div>
      </div>
    );
  }

  if (!instructions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Инструкции не найдены</h1>
          <p className="text-gray-600 mb-6">Пожалуйста, пройдите все опросы для получения персонализированных инструкций</p>
          <Link href="/" className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">
            Вернуться к чату
          </Link>
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
            <h1 className="text-2xl font-semibold text-gray-900">Инструкции по общению с пациентом</h1>
            <Link href="/" className="text-emerald-600 hover:text-emerald-700">
              Вернуться к чату
            </Link>
          </div>
          
          <p className="text-gray-700">
            Персонализированные рекомендации по коммуникации на основе психологического профилирования пациента
          </p>
        </div>

        {/* Общие принципы коммуникации */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Общие принципы коммуникации</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Тон и подход */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Тон и подход</h3>
              <div className="bg-emerald-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="font-medium">Тон: {instructions.general.tone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium">Подход: {instructions.general.approach}</span>
                </div>
              </div>
            </div>

            {/* Ключевые принципы */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Ключевые принципы</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  {instructions.general.key_points.slice(0, 3).map((point, index) => (
                    <div key={index} className="flex items-start gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <span>{point}</span>
                    </div>
                  ))}
                  {instructions.general.key_points.length > 3 && (
                    <div className="text-xs text-blue-600 mt-2">
                      И еще {instructions.general.key_points.length - 3} принципов...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Профиль отношения к болезни */}
        {instructions.attitude && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Профиль отношения к болезни</h2>
            
            <div className="space-y-6">
              {/* Основная информация */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-medium text-yellow-900 mb-2">{instructions.attitude.name}</h3>
                <p className="text-sm text-yellow-800 mb-3">{instructions.attitude.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Сложности в коммуникации */}
                  <div>
                    <h4 className="font-medium text-yellow-900 text-sm mb-2">Сложности в коммуникации:</h4>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {instructions.attitude.communication_challenges.map((challenge, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-yellow-600">•</span>
                          <span>{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Положительный сценарий */}
                  <div>
                    <h4 className="font-medium text-yellow-900 text-sm mb-2">Рекомендуемые действия:</h4>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {instructions.attitude.positive_scenario.slice(0, 3).map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>{action}</span>
                        </li>
                      ))}
                      {instructions.attitude.positive_scenario.length > 3 && (
                        <li className="text-xs text-yellow-600 mt-1">
                          И еще {instructions.attitude.positive_scenario.length - 3} действий...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Что избегать */}
              {instructions.attitude.negative_scenario && instructions.attitude.negative_scenario.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 text-sm mb-2">Чего избегать:</h4>
                  <ul className="text-xs text-red-700 space-y-1">
                    {instructions.attitude.negative_scenario.map((avoid, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-600">✗</span>
                        <span>{avoid}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Экстремальные действия */}
              {instructions.attitude.extreme_actions && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-900 text-sm mb-2">Особые случаи:</h4>
                  <div className="text-xs text-orange-700 space-y-2">
                    {instructions.attitude.extreme_actions.low && (
                      <div>
                        <span className="font-medium">Низкие значения:</span> {instructions.attitude.extreme_actions.low}
                      </div>
                    )}
                    {instructions.attitude.extreme_actions.high && (
                      <div>
                        <span className="font-medium">Высокие значения:</span> {instructions.attitude.extreme_actions.high}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Типологический профиль */}
        {instructions.typology && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Типологический профиль</h2>
            
            <div className="space-y-6">
              {/* Основная информация */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-medium text-purple-900 mb-2">{instructions.typology.name}</h3>
                <p className="text-sm text-purple-800 mb-3">{instructions.typology.description}</p>
                
                <div className="bg-white rounded-lg p-3 mb-3">
                  <p className="text-sm text-purple-700 italic">"{instructions.typology.promise}"</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-purple-900 text-sm mb-2">Тип голоса:</h4>
                    <p className="text-xs text-purple-700">{instructions.typology.voice_type}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-purple-900 text-sm mb-2">Частота взаимодействия:</h4>
                    <p className="text-xs text-purple-700">{instructions.typology.interaction_frequency}</p>
                  </div>
                </div>
              </div>

              {/* Рекомендуемые действия */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 text-sm mb-2">Рекомендуемые действия:</h4>
                <ul className="text-xs text-green-700 space-y-1">
                  {instructions.typology.positive_communication.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Что избегать */}
              {instructions.typology.negative_communication && instructions.typology.negative_communication.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 text-sm mb-2">Чего избегать:</h4>
                  <ul className="text-xs text-red-700 space-y-1">
                    {instructions.typology.negative_communication.map((avoid, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-600">✗</span>
                        <span>{avoid}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ценностный профиль */}
        {profiles.values && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Ценностный профиль</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Индексы ценностей */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Индексы ценностей</h3>
                <div className="space-y-3">
                  {Object.entries(profiles.values.value_indices || {}).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-lg font-bold text-gray-900">{value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            value > 70 ? 'bg-green-500' : 
                            value > 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Рекомендации по коммуникации */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Рекомендации для общения</h3>
                <div className="space-y-3">
                  {profiles.values.communication_guidelines?.communication_style && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <h4 className="font-medium text-blue-900 text-sm mb-1">Стиль коммуникации:</h4>
                      <p className="text-xs text-blue-700">
                        {profiles.values.communication_guidelines.communication_style === 'optimistic' && 'Оптимистичный и ободряющий'}
                        {profiles.values.communication_guidelines.communication_style === 'supportive' && 'Поддерживающий и спокойный'}
                        {profiles.values.communication_guidelines.communication_style === 'balanced' && 'Сбалансированный и нейтральный'}
                      </p>
                    </div>
                  )}

                  {profiles.values.communication_guidelines?.motivators && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <h4 className="font-medium text-green-900 text-sm mb-1">Мотиваторы:</h4>
                      <div className="flex flex-wrap gap-1">
                        {profiles.values.communication_guidelines.motivators.map((motivator, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            {motivator}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profiles.values.communication_guidelines?.avoid_topics && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <h4 className="font-medium text-red-900 text-sm mb-1">Избегать тем:</h4>
                      <div className="flex flex-wrap gap-1">
                        {profiles.values.communication_guidelines.avoid_topics.map((topic, index) => (
                          <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PIB профиль */}
        {profiles.pib && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">План коммуникации (PIB)</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Тон коммуникации */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="font-medium text-indigo-900 mb-2">Тон коммуникации</h3>
                <p className="text-sm text-indigo-700">
                  {profiles.pib.communication_plan?.tone === 'calm_supportive' && 'Спокойный и поддерживающий'}
                  {profiles.pib.communication_plan?.tone === 'energetic_motivational' && 'Энергичный и мотивирующий'}
                  {profiles.pib.communication_plan?.tone === 'professional_detailed' && 'Профессиональный и детальный'}
                  {profiles.pib.communication_plan?.tone === 'gentle_empathetic' && 'Нежный и эмпатичный'}
                  {!profiles.pib.communication_plan?.tone && 'Стандартный'}
                </p>
              </div>

              {/* Длительность сессии */}
              <div className="bg-teal-50 rounded-lg p-4">
                <h3 className="font-medium text-teal-900 mb-2">Длительность сессии</h3>
                <p className="text-sm text-teal-700">
                  {profiles.pib.communication_plan?.session_length === 'short' && 'Короткая (5-10 мин)'}
                  {profiles.pib.communication_plan?.session_length === 'medium' && 'Средняя (15-20 мин)'}
                  {profiles.pib.communication_plan?.session_length === 'long' && 'Длительная (25-30 мин)'}
                  {!profiles.pib.communication_plan?.session_length && 'Стандартная'}
                </p>
              </div>

              {/* Что избегать */}
              <div className="bg-amber-50 rounded-lg p-4">
                <h3 className="font-medium text-amber-900 mb-2">Избегать</h3>
                {profiles.pib.communication_plan?.avoid && profiles.pib.communication_plan.avoid.length > 0 ? (
                  <div className="space-y-1">
                    {profiles.pib.communication_plan.avoid.map((item, index) => (
                      <div key={index} className="text-sm text-amber-700 flex items-center gap-2">
                        <span className="text-amber-600">✗</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-amber-700">Особых ограничений нет</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex justify-center gap-4">
          <Link href="/" className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
            Начать общение с Татьяной
          </Link>
          <Link href="/profiling/values" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:border-emerald-400 hover:text-emerald-600 transition-colors">
            Пройти опросы заново
          </Link>
        </div>

        {/* Подсказка */}
        <div className="text-center text-sm text-gray-500 mt-6">
          Эти инструкции помогут Татьяне общаться с вами максимально комфортно и эффективно
        </div>
      </div>
    </div>
  );
}
