import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function DebugPrompts() {
  const [pibData, setPibData] = useState(null);
  const [attitudeProfile, setAttitudeProfile] = useState(null);
  const [typologyProfile, setTypologyProfile] = useState(null);
  const [valuesProfile, setValuesProfile] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      // Загружаем все данные из localStorage
      const pib = localStorage.getItem('benehab.pib');
      const attitude = localStorage.getItem('benehab_attitude_profile');
      const typology = localStorage.getItem('benehab_typology_profile');
      const values = localStorage.getItem('benehab_values_profile');
      const demo = localStorage.getItem('benehab_demographics');

      if (pib) setPibData(JSON.parse(pib));
      if (attitude) setAttitudeProfile(JSON.parse(attitude));
      if (typology) setTypologyProfile(JSON.parse(typology));
      if (values) setValuesProfile(JSON.parse(values));
      if (demo) setDemographics(JSON.parse(demo));
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const generatePrompt = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profiling/pib', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attitude_profile: attitudeProfile,
          accentuation_profile: typologyProfile,
          values_profile: valuesProfile,
          demographics: demographics
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedPrompt(data.prompt || 'Промпт не сгенерирован');
      } else {
        setGeneratedPrompt('Ошибка генерации промпта');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setGeneratedPrompt('Ошибка генерации промпта: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = () => {
    localStorage.clear();
    setPibData(null);
    setAttitudeProfile(null);
    setTypologyProfile(null);
    setValuesProfile(null);
    setDemographics(null);
    setGeneratedPrompt('');
  };

  return (
    <>
      <Head>
        <title>Отладка промптов - Benehab</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🔍 Отладка промптов Benehab
          </h1>

          {/* Кнопки управления */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔄 Обновить данные
            </button>
            <button
              onClick={generatePrompt}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '⏳ Генерирую...' : '🚀 Сгенерировать промпт'}
            </button>
            <button
              onClick={clearAllData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              🗑️ Очистить все данные
            </button>
          </div>

          {/* Статус данных */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${attitudeProfile ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}>
              <h3 className="font-semibold">Attitude Profile</h3>
              <p className={attitudeProfile ? 'text-green-700' : 'text-red-700'}>
                {attitudeProfile ? '✅ Загружен' : '❌ Отсутствует'}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${typologyProfile ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}>
              <h3 className="font-semibold">Typology Profile</h3>
              <p className={typologyProfile ? 'text-green-700' : 'text-red-700'}>
                {typologyProfile ? '✅ Загружен' : '❌ Отсутствует'}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${valuesProfile ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}>
              <h3 className="font-semibold">Values Profile</h3>
              <p className={valuesProfile ? 'text-green-700' : 'text-red-700'}>
                {valuesProfile ? '✅ Загружен' : '❌ Отсутствует'}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${demographics ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}>
              <h3 className="font-semibold">Demographics</h3>
              <p className={demographics ? 'text-green-700' : 'text-red-700'}>
                {demographics ? '✅ Загружены' : '❌ Отсутствуют'}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${pibData ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}>
              <h3 className="font-semibold">PIB</h3>
              <p className={pibData ? 'text-green-700' : 'text-red-700'}>
                {pibData ? '✅ Сформирован' : '❌ Не сформирован'}
              </p>
            </div>
          </div>

          {/* Сгенерированный промпт */}
          {generatedPrompt && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">🎯 Сгенерированный промпт:</h2>
              <div className="bg-white p-4 rounded-lg border border-gray-300">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 overflow-x-auto">
                  {generatedPrompt}
                </pre>
              </div>
            </div>
          )}

          {/* Детали профилей */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attitude Profile */}
            <div className="bg-white p-6 rounded-lg border border-gray-300">
              <h2 className="text-xl font-semibold mb-4">📊 Attitude Profile</h2>
              {attitudeProfile ? (
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(attitudeProfile, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">Данные отсутствуют</p>
              )}
            </div>

            {/* Typology Profile */}
            <div className="bg-white p-6 rounded-lg border border-gray-300">
              <h2 className="text-xl font-semibold mb-4">🧠 Typology Profile</h2>
              {typologyProfile ? (
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(typologyProfile, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">Данные отсутствуют</p>
              )}
            </div>

            {/* Values Profile */}
            <div className="bg-white p-6 rounded-lg border border-gray-300">
              <h2 className="text-xl font-semibold mb-4">🎨 Values Profile</h2>
              {valuesProfile ? (
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(valuesProfile, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">Данные отсутствуют</p>
              )}
            </div>

            {/* Demographics */}
            <div className="bg-white p-6 rounded-lg border border-gray-300">
              <h2 className="text-xl font-semibold mb-4">👤 Demographics</h2>
              {demographics ? (
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(demographics, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">Данные отсутствуют</p>
              )}
            </div>
          </div>

          {/* PIB Data */}
          {pibData && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">📋 PIB Data</h2>
              <div className="bg-white p-6 rounded-lg border border-gray-300">
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(pibData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Инструкции */}
          <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-300">
            <h2 className="text-xl font-semibold mb-3 text-blue-900">📖 Инструкции по использованию:</h2>
            <ul className="text-blue-800 space-y-2">
              <li>• Пройдите опросы на главной странице</li>
              <li>• Нажмите "Обновить данные" для загрузки результатов</li>
              <li>• Нажмите "Сгенерировать промпт" для создания промпта ИИ</li>
              <li>• Используйте "Очистить все данные" для сброса</li>
              <li>• Эта страница доступна по адресу: <code className="bg-blue-200 px-2 py-1 rounded">/debug-prompts</code></li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
