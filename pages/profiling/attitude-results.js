'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AttitudeResults() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('benehab_attitude_profile');
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
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
          <p className="text-gray-600 mb-6">Пожалуйста, пройдите опрос отношения к болезни</p>
          <Link href="/profiling/attitude" className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">
            Пройти опрос
          </Link>
        </div>
      </div>
    );
  }

  const { risk_tags = [], comm_flags = [], interpretation = {} } = profile;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Заголовок */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Ваше отношение к болезни</h1>
            <Link href="/" className="text-emerald-600 hover:text-emerald-700">
              Вернуться к чату
            </Link>
          </div>
          
          <p className="text-gray-700">
            На основе ваших ответов мы определили особенности вашего отношения к здоровью и лечению.
          </p>
        </div>

        {/* Интерпретация */}
        {interpretation && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Интерпретация результатов</h2>
            
            <div className="prose max-w-none">
              {interpretation.summary && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Общая характеристика</h3>
                  <p className="text-gray-700">{interpretation.summary}</p>
                </div>
              )}
              
              {interpretation.recommendations && interpretation.recommendations.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Рекомендации</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {interpretation.recommendations.map((rec, index) => (
                      <li key={index} className="text-gray-700">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Теги риска */}
        {risk_tags && risk_tags.length > 0 && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Области внимания</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {risk_tags.map((tag, index) => (
                <div key={index} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <h3 className="font-medium text-orange-900 mb-2">
                    {tag === 'alt_medicine_pref' && 'Предпочтение альтернативной медицины'}
                    {tag === 'work_overload' && 'Перегрузка на работе'}
                    {tag === 'depression_risk_check' && 'Риск депрессии'}
                    {tag === 'trust_issues' && 'Проблемы с доверием'}
                    {tag === 'medical_avoidance' && 'Избегание медицинской помощи'}
                    {tag === 'family_conflict' && 'Семейные конфликты'}
                    {tag === 'progression_fear' && 'Страх прогрессирования болезни'}
                    {tag}
                  </h3>
                  <p className="text-sm text-orange-800">
                    {tag === 'alt_medicine_pref' && 'Важно объяснять доказательную базу и безопасность традиционных методов'}
                    {tag === 'work_overload' && 'Рекомендуется баланс работы и отдыха, управление стрессом'}
                    {tag === 'depression_risk_check' && 'Необходим мониторинг настроения и поддержка близких'}
                    {tag === 'trust_issues' && 'Построение доверительных отношений с медицинским персоналом'}
                    {tag === 'medical_avoidance' && 'Мягкий подход к вовлечению в медицинский процесс'}
                    {tag === 'family_conflict' && 'Медиация семейных отношений и индивидуальная поддержка'}
                    {tag === 'progression_fear' && 'Объяснение планов лечения и мониторинга'}
                    'Требует особого внимания в общении'
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Флаги коммуникации */}
        {comm_flags && comm_flags.length > 0 && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Особенности коммуникации</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comm_flags.map((flag, index) => (
                <div key={index} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h3 className="font-medium text-blue-900 mb-2">
                    {flag === 'normalize_fears' && 'Нормализация страхов'}
                    {flag === 'explain_benefits' && 'Объяснение преимуществ'}
                    {flag === 'avoid_pressure' && 'Избегание давления'}
                    {flag === 'provide_details' && 'Предоставление деталей'}
                    {flag === 'build_trust' && 'Построение доверия'}
                    {flag === 'family_involvement' && 'Вовлечение семьи'}
                    {flag}
                  </h3>
                  <p className="text-sm text-blue-800">
                    {flag === 'normalize_fears' && 'Ваши переживания нормальны и понятны'}
                    {flag === 'explain_benefits' && 'Будем объяснять пользу от рекомендуемых действий'}
                    {flag === 'avoid_pressure' && 'Не будем оказывать давление на принятие решений'}
                    {flag === 'provide_details' && 'Будем давать подробную информацию по запросу'}
                    {flag === 'build_trust' && 'Будем строить доверительные отношения постепенно'}
                    {flag === 'family_involvement' && 'При необходимости привлечем семью к поддержке'}
                    'Учитывается в общении'
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex justify-center gap-4">
          <Link href="/profiling/attitude" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:border-emerald-400 hover:text-emerald-600 transition-colors">
            Пройти опрос заново
          </Link>
          <Link href="/communication-instructions" className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
            📋 Инструкции по общению
          </Link>
          <Link href="/" className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
            Продолжить профилирование
          </Link>
        </div>

        {/* Подсказка */}
        <div className="text-center text-sm text-gray-500 mt-6">
          Теперь Татьяна будет учитывать особенности вашего отношения к здоровью в общении
        </div>
      </div>
    </div>
  );
}
