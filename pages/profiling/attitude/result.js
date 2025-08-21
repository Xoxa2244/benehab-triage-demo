'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCommunicationInstructions } from '../../../lib/communication-instructions';

export default function AttitudeResult() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('benehab_attitude_profile');
      if (saved) {
        try {
          setProfile(JSON.parse(saved));
        } catch (error) {
          console.error('Ошибка загрузки профиля:', error);
        }
      }
    }
    setLoading(false);
  };

  const getRiskBadges = () => {
    if (!profile || !profile.risk_tags) return [];
    
    const badgeMap = {
      'suicide_risk': { text: 'Кризисная ситуация', color: 'bg-red-100 text-red-800' },
      'depression_risk': { text: 'Риск депрессии', color: 'bg-orange-100 text-orange-800' },
      'secondary_gain_flag': { text: 'Вторичная выгода', color: 'bg-yellow-100 text-yellow-800' },
      'treatment_resistance': { text: 'Сопротивление лечению', color: 'bg-blue-100 text-blue-800' },
      'work_overload': { text: 'Трудоголизм', color: 'bg-purple-100 text-purple-800' },
      'alt_medicine_pref': { text: 'Альтернативная медицина', color: 'bg-green-100 text-green-800' },
      'substance_abuse': { text: 'Зависимости', color: 'bg-red-100 text-red-800' },
      'treatment_avoidance': { text: 'Избегание лечения', color: 'bg-gray-100 text-gray-800' },
      'high_anxiety': { text: 'Высокая тревожность', color: 'bg-pink-100 text-pink-800' }
    };

    return profile.risk_tags.map(tag => badgeMap[tag] || { text: tag, color: 'bg-gray-100 text-gray-800' });
  };

  const getCommunicationTips = () => {
    if (!profile || !profile.comm_flags) return [];
    
    const tipMap = {
      'crisis_intervention': 'Буду особенно бережно и внимательно',
      'gentle_approach': 'Избегаю давления и спешки',
      'address_underlying_issues': 'Фокусируюсь на глубинных причинах',
      'build_trust': 'Строю доверительные отношения',
      'avoid_stigma': 'Избегаю стигматизации',
      'work_life_balance': 'Помогаю найти баланс',
      'positive_reinforcement': 'Подчеркиваю успехи и прогресс',
      'evidence_based_education': 'Объясняю на основе доказательств',
      'addiction_support': 'Поддерживаю в борьбе с зависимостями',
      'treatment_importance': 'Объясняю важность лечения',
      'anxiety_management': 'Помогаю справиться с тревогой'
    };

    return profile.comm_flags.map(flag => tipMap[flag] || flag);
  };

  const getCommunicationInstructions = () => {
    if (!profile) return null;
    
    // Получаем инструкции по коммуникации на основе профиля
    const instructions = getCommunicationInstructions(profile, null);
    
    if (!instructions || !instructions.attitude) return null;
    
    return instructions.attitude;
  };

  const continueToTypology = () => {
    router.push('/profiling/typology');
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
          <p className="text-gray-600 mb-4">Профиль не найден</p>
          <Link href="/profiling/attitude" className="text-emerald-600 hover:text-emerald-700">
            Вернуться к опросу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Заголовок результата */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              Спасибо за ваши ответы!
            </h1>
            <p className="text-lg text-gray-600">
              Мы узнали, что для вас важно в процессе лечения и общения
            </p>
          </div>

          {/* Бережный отчёт */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-blue-800 text-center leading-relaxed">
              Ваши ответы помогли нам понять ваш подход к здоровью. Мы будем общаться с вами максимально комфортно, 
              учитывая ваши особенности и потребности. Помните, что каждый человек уникален, и нет "правильного" 
              или "неправильного" отношения к болезни.
            </p>
          </div>
        </div>

        {/* Ключевые риски */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ключевые особенности</h2>
          <div className="flex flex-wrap gap-2">
            {getRiskBadges().map((badge, index) => (
              <span key={index} className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                {badge.text}
              </span>
            ))}
          </div>
        </div>

        {/* Как я буду общаться */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Как я буду общаться с вами</h2>
          <div className="space-y-3">
            {getCommunicationTips().map((tip, index) => (
              <div key={index} className="flex items-start">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Инструкции по коммуникации на основе профиля */}
        {getCommunicationInstructions() && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Персональные рекомендации по общению
            </h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Профиль: {getCommunicationInstructions().name}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {getCommunicationInstructions().description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Положительный сценарий */}
              <div>
                <h4 className="text-md font-medium text-emerald-700 mb-3">✅ Что делать:</h4>
                <div className="space-y-2">
                  {getCommunicationInstructions().positive_scenario.map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Отрицательный сценарий */}
              <div>
                <h4 className="text-md font-medium text-red-700 mb-3">❌ Чего избегать:</h4>
                <div className="space-y-2">
                  {getCommunicationInstructions().negative_scenario.map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Экстремальные значения */}
            {getCommunicationInstructions().extreme_actions && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-md font-medium text-blue-800 mb-3">⚠️ Особое внимание:</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  {getCommunicationInstructions().extreme_actions.low && (
                    <p><strong>Низкие значения:</strong> {getCommunicationInstructions().extreme_actions.low}</p>
                  )}
                  {getCommunicationInstructions().extreme_actions.high && (
                    <p><strong>Высокие значения:</strong> {getCommunicationInstructions().extreme_actions.high}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Детальные результаты */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Детальные результаты</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(profile.raw).map(([scale, score]) => {
              const level = profile.levels[scale];
              const scaleLabels = {
                severity: 'Оценка тяжести болезни',
                secondary_gain: 'Вторичная выгода',
                hide_resist: 'Сокрытие и сопротивление',
                work_escape: 'Уход в работу/спорт',
                low_selfesteem: 'Самооценка',
                alt_med: 'Альтернативная медицина',
                addictions: 'Зависимости',
                ignore: 'Игнорирование болезни',
                anxiety: 'Тревожность'
              };

              const levelColors = {
                low: 'bg-green-100 text-green-800',
                medium: 'bg-yellow-100 text-yellow-800',
                high: 'bg-red-100 text-red-800'
              };

              return (
                <div key={scale} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">{scaleLabels[scale]}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors[level]}`}>
                      {level === 'low' ? 'Низкий' : level === 'medium' ? 'Средний' : 'Высокий'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-700">{score}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Навигация */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <Link
              href="/profiling/attitude"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:border-emerald-400 hover:text-emerald-600 transition-colors"
            >
              ← К опросу
            </Link>

            <button
              onClick={continueToTypology}
              className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Продолжить → Типологический опрос
            </button>
          </div>
        </div>

        {/* Подсказка */}
        <div className="text-center text-sm text-gray-500 mt-4">
          Ваши результаты сохранены. После завершения всех опросов вы сможете общаться с Татьяной в персонализированном режиме.
        </div>
      </div>
    </div>
  );
}
