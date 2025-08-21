'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function TypologyResults() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('benehab_typology_profile');
      if (savedProfile) {
        try {
          setProfile(JSON.parse(savedProfile));
        } catch (error) {
          console.error('Ошибка загрузки профиля:', error);
        }
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Загружаем результаты...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Профиль не найден</h1>
          <p className="text-gray-600 mb-6">Пожалуйста, пройдите типологический опрос</p>
          <Link href="/profiling/typology" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
            Пройти опрос
          </Link>
        </div>
      </div>
    );
  }

  const { leading_types = [], interpretation = {} } = profile;

  const typeNames = {
    sensitive: 'Сенситивный',
    dysthymic: 'Дистимический',
    demonstrative: 'Демонстративный',
    excitable: 'Возбудимый',
    cyclothymic: 'Циклотимический',
    stuck: 'Застревающий',
    pedantic: 'Педантичный',
    anxious: 'Тревожный',
    hyperthymic: 'Гипертимный'
  };

  const typeDescriptions = {
    sensitive: 'Ранимость, высокая чувствительность, склонность к соматическим жалобам и усталости.',
    dysthymic: 'Склонность к пониженному фону настроения, самокритике, чувству вины.',
    demonstrative: 'Потребность в признании, стремление производить впечатление.',
    excitable: 'Импульсивность, вспышки раздражения, тяга к немедленным действиям.',
    cyclothymic: 'Чередование подъёмов и спадов, вариативность активности и настроения.',
    stuck: 'Упорство, длительное переживание обид, принципиальность.',
    pedantic: 'Осторожность, ориентация на порядок, склонность сомневаться.',
    anxious: 'Стремление к уединению, ограничение контактов, внутреннее напряжение.',
    hyperthymic: 'Повышенный фон настроения, активность, тяга к новизне и контактам.'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Заголовок */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Ваш тип личности</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              Вернуться к чату
            </Link>
          </div>
          
          <p className="text-gray-700">
            На основе ваших ответов мы определили ведущие черты вашей личности для персонализации общения.
          </p>
        </div>

        {/* Ведущие типы */}
        {leading_types && leading_types.length > 0 && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Ведущие черты личности</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {leading_types.map((type, index) => (
                <div key={index} className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-blue-900">{typeNames[type] || type}</h3>
                      <p className="text-sm text-blue-700">Доминирующая черта</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{typeDescriptions[type] || 'Описание типа'}</p>
                  
                  {interpretation[type] && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Тон общения:</h4>
                        <p className="text-sm text-gray-700">{interpretation[type].tone}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Что делать:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {interpretation[type].do?.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Чего избегать:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {interpretation[type].avoid?.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Мотиваторы:</h4>
                        <div className="flex flex-wrap gap-2">
                          {interpretation[type].motivators?.map((motivator, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {motivator}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {interpretation[type].red_flags && (
                        <div>
                          <h4 className="font-medium text-red-700 mb-1">Красные флаги:</h4>
                          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                            {interpretation[type].red_flags.map((flag, idx) => (
                              <li key={idx}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Общие рекомендации */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Как Татьяна будет общаться с вами</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Стиль общения</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  Татьяна будет учитывать ваши ведущие черты личности и адаптировать стиль общения 
                  для максимального комфорта и эффективности взаимодействия.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Персонализация</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  Все рекомендации и советы будут даваться с учетом особенностей вашей личности, 
                  чтобы они были максимально полезными и легко воспринимались.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex justify-center gap-4">
          <Link href="/profiling/typology" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-colors">
            Пройти опрос заново
          </Link>
          <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            Продолжить профилирование
          </Link>
        </div>

        {/* Подсказка */}
        <div className="text-center text-sm text-gray-500 mt-6">
          Теперь Татьяна будет учитывать особенности вашей личности в общении
        </div>
      </div>
    </div>
  );
}
