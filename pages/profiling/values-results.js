'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ValuesResults() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('benehab_values_profile');
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
          <p className="text-gray-600 mb-6">Пожалуйста, пройдите ценностный опрос</p>
          <Link href="/profiling/values" className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">
            Пройти опрос
          </Link>
        </div>
      </div>
    );
  }

  const { value_indices, communication_guidelines, color_associations } = profile;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Заголовок */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Ваша ценностная модель</h1>
            <Link href="/" className="text-emerald-600 hover:text-emerald-700">
              Вернуться к чату
            </Link>
          </div>
          
          <p className="text-gray-700">
            На основе ваших цветовых ассоциаций и ранжирования понятий мы составили индивидуальную модель ценностей.
          </p>
        </div>

        {/* Индексы ценностей */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Индексы ценностей</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(value_indices || {}).map(([key, value]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2 capitalize">
                  {key.replace(/_/g, ' ')}
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        value > 70 ? 'bg-green-500' : 
                        value > 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{value}%</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {value > 70 ? 'Высокий уровень' : 
                   value > 40 ? 'Средний уровень' : 'Низкий уровень'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Рекомендации по коммуникации */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Рекомендации для общения</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Стиль коммуникации */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Стиль коммуникации</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="font-medium">
                    {communication_guidelines?.communication_style === 'optimistic' && 'Оптимистичный и ободряющий'}
                    {communication_guidelines?.communication_style === 'supportive' && 'Поддерживающий и спокойный'}
                    {communication_guidelines?.communication_style === 'balanced' && 'Сбалансированный и нейтральный'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {communication_guidelines?.communication_style === 'optimistic' && 
                   'Татьяна будет использовать позитивный тон и подчеркивать возможности для улучшения'}
                  {communication_guidelines?.communication_style === 'supportive' && 
                   'Татьяна будет оказывать эмоциональную поддержку и подтверждать ваши чувства'}
                  {communication_guidelines?.communication_style === 'balanced' && 
                   'Татьяна будет давать сбалансированную информацию без излишнего оптимизма или пессимизма'}
                </p>
              </div>
            </div>

            {/* Мотиваторы */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Что вас мотивирует</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {communication_guidelines?.motivators?.map((motivator, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-700 capitalize">{motivator}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Темы для избегания */}
          {communication_guidelines?.avoid_topics && communication_guidelines.avoid_topics.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">Темы, которые могут вызвать дискомфорт</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {communication_guidelines.avoid_topics.map((topic, index) => (
                    <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      {topic}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-red-700 mt-3">
                  Татьяна будет избегать этих тем в общении с вами
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Цветовые ассоциации */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Анализ цветовых ассоциаций</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Доминирующий цвет */}
            <div className="text-center">
              <h3 className="font-medium text-gray-900 mb-3">Доминирующий цвет</h3>
              <div className="w-20 h-20 rounded-full mx-auto mb-3" 
                   style={{ backgroundColor: color_associations?.dominant_color || '#ccc' }}></div>
              <p className="text-sm text-gray-600">
                {color_associations?.dominant_color === 'red' && 'Энергия, страсть, активность'}
                {color_associations?.dominant_color === 'blue' && 'Спокойствие, доверие, стабильность'}
                {color_associations?.dominant_color === 'green' && 'Гармония, рост, безопасность'}
                {color_associations?.dominant_color === 'yellow' && 'Оптимизм, радость, интеллект'}
                {color_associations?.dominant_color === 'purple' && 'Творчество, мудрость, духовность'}
                {color_associations?.dominant_color === 'orange' && 'Энтузиазм, авантюризм, теплота'}
                {color_associations?.dominant_color === 'pink' && 'Любовь, нежность, романтика'}
                {color_associations?.dominant_color === 'brown' && 'Надежность, практичность, земля'}
                {color_associations?.dominant_color === 'gray' && 'Нейтральность, баланс, мудрость'}
                {color_associations?.dominant_color === 'black' && 'Сила, элегантность, тайна'}
                {color_associations?.dominant_color === 'white' && 'Чистота, простота, ясность'}
              </p>
            </div>

            {/* Позитивные цвета */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Позитивные ассоциации</h3>
              <div className="space-y-2">
                {Object.entries(color_associations?.positive_colors || {}).map(([concept, color]) => (
                  <div key={concept} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                    <span className="text-sm text-gray-700">{concept}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Негативные цвета */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Тревожные ассоциации</h3>
              <div className="space-y-2">
                {Object.entries(color_associations?.negative_colors || {}).map(([concept, color]) => (
                  <div key={concept} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                    <span className="text-sm text-gray-700">{concept}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex justify-center gap-4">
          <Link href="/profiling/values" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:border-emerald-400 hover:text-emerald-600 transition-colors">
            Пройти опрос заново
          </Link>
          <Link href="/communication-instructions" className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
            📋 Инструкции по общению
          </Link>
          <Link href="/" className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
            Начать общение с Татьяной
          </Link>
        </div>

        {/* Подсказка */}
        <div className="text-center text-sm text-gray-500 mt-6">
          Теперь Татьяна будет общаться с вами в соответствии с вашей ценностной моделью
        </div>
      </div>
    </div>
  );
}
