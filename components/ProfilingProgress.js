'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProfilingProgress() {
  const [progress, setProgress] = useState({
    attitude: false,
    typology: false,
    values: false
  });

  useEffect(() => {
    updateProgress();
  }, []);

  const updateProgress = () => {
    if (typeof window !== 'undefined') {
      const attitude = !!localStorage.getItem('benehab_attitude_profile');
      const typology = !!localStorage.getItem('benehab_typology_profile');
      const values = !!localStorage.getItem('benehab_values_profile');
      
      setProgress({ attitude, typology, values });
    }
  };

  const totalProgress = Object.values(progress).filter(Boolean).length;
  const totalSurveys = 3;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Прогресс профилирования
        </h2>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Прогресс: {totalProgress} из {totalSurveys}</span>
          <span>{Math.round((totalProgress / totalSurveys) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(totalProgress / totalSurveys) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Отношение к болезни */}
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${progress.attitude ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm font-medium text-gray-900">Отношение к болезни</span>
          </div>
          <div className="flex items-center gap-2">
            {progress.attitude ? (
              <span className="text-emerald-600 text-sm">✅ Завершено</span>
            ) : (
              <Link href="/profiling/attitude" className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors">
                Пройти
              </Link>
            )}
          </div>
        </div>

        {/* Тип личности */}
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${progress.typology ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm font-medium text-gray-900">Тип личности</span>
          </div>
          <div className="flex items-center gap-2">
            {progress.typology ? (
              <span className="text-blue-600 text-sm">✅ Завершено</span>
            ) : (
              <Link href="/profiling/typology" className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors">
                Пройти
              </Link>
            )}
          </div>
        </div>

        {/* Ценностная модель */}
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${progress.values ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm font-medium text-gray-900">Ценностная модель</span>
          </div>
          <div className="flex items-center gap-2">
            {progress.values ? (
              <span className="text-purple-600 text-sm">✅ Завершено</span>
            ) : (
              <Link href="/profiling/values" className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 transition-colors">
                Пройти
              </Link>
            )}
          </div>
        </div>
      </div>

      {totalProgress === totalSurveys && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-sm text-emerald-800 text-center mb-3">
            🎉 Все опросы завершены! Теперь Татьяна будет общаться с вами в полностью персонализированном режиме.
          </p>
          <div className="text-center">
            <Link 
              href="/communication-instructions" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
            >
              📋 Посмотреть инструкции по общению
            </Link>
          </div>
        </div>
      )}

      {totalProgress > 0 && totalProgress < totalSurveys && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 text-center">
            Продолжайте проходить опросы для полной персонализации общения с Татьяной.
          </p>
        </div>
      )}
    </div>
  );
}
