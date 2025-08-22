'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ClipboardDocumentListIcon, 
  UserGroupIcon, 
  PaletteIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('attitude');

  const tabs = [
    {
      id: 'attitude',
      name: 'Отношение к болезни',
      icon: ClipboardDocumentListIcon,
      description: 'Управление вопросами и типами отношения к болезни',
      color: 'blue'
    },
    {
      id: 'typology',
      name: 'Психотипы',
      icon: UserGroupIcon,
      description: 'Управление вопросами и психотипами личности',
      color: 'green'
    },
    {
      id: 'values',
      name: 'Психосемантика',
      icon: PaletteIcon,
      description: 'Управление понятиями и ценностными ассоциациями',
      color: 'purple'
    }
  ];

  const getTabColor = (color) => {
    const colors = {
      blue: 'bg-blue-500 hover:bg-blue-600',
      green: 'bg-green-500 hover:bg-green-600',
      purple: 'bg-purple-500 hover:bg-purple-600'
    };
    return colors[color] || 'bg-gray-500 hover:bg-gray-600';
  };

  const getTabBorderColor = (color) => {
    const colors = {
      blue: 'border-blue-500',
      green: 'border-green-500',
      purple: 'border-purple-500'
    };
    return colors[color] || 'border-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Cog6ToothIcon className="h-8 w-8 text-gray-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Админ панель</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                ← Вернуться к приложению
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Навигация по вкладкам */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? `text-white ${getTabColor(tab.color)}`
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Контент вкладок */}
        <div className="bg-white rounded-lg shadow-sm border">
          {activeTab === 'attitude' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Управление опросом "Отношение к болезни"</h2>
                <p className="text-gray-600">Настройте вопросы, типы и инструкции для коммуникации</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Link 
                  href="/admin/attitude/questions"
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <ClipboardDocumentListIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Вопросы</h3>
                  <p className="text-sm text-gray-600 text-center">Управление вопросами опроса, их формулировками и весами</p>
                </Link>
                
                <Link 
                  href="/admin/attitude/types"
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <UserGroupIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Типы</h3>
                  <p className="text-sm text-gray-600 text-center">Настройка типов отношения к болезни и их характеристик</p>
                </Link>
                
                <Link 
                  href="/admin/attitude/instructions"
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <DocumentTextIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Инструкции</h3>
                  <p className="text-sm text-gray-600 text-center">Рекомендации по коммуникации для каждого типа</p>
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'typology' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Управление опросом "Психотипы"</h2>
                <p className="text-gray-600">Настройте вопросы, психотипы и инструкции для коммуникации</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Link 
                  href="/admin/typology/questions"
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
                >
                  <ClipboardDocumentListIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Вопросы</h3>
                  <p className="text-sm text-gray-600 text-center">Управление вопросами опроса, их формулировками и весами</p>
                </Link>
                
                <Link 
                  href="/admin/typology/types"
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
                >
                  <UserGroupIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Психотипы</h3>
                  <p className="text-sm text-gray-600 text-center">Настройка психотипов личности и их характеристик</p>
                </Link>
                
                <Link 
                  href="/admin/typology/instructions"
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
                >
                  <DocumentTextIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Инструкции</h3>
                  <p className="text-sm text-gray-600 text-center">Рекомендации по коммуникации для каждого психотипа</p>
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'values' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Управление опросом "Психосемантика"</h2>
                <p className="text-gray-600">Управление понятиями, их категориями и описаниями</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Link 
                  href="/admin/values/concepts"
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <PaletteIcon className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Понятия</h3>
                  <p className="text-sm text-gray-600 text-center">Управление понятиями, их названиями и описаниями</p>
                </Link>
                
                <Link 
                  href="/admin/values/categories"
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <ChartBarIcon className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Категории</h3>
                  <p className="text-sm text-gray-600 text-center">Группировка понятий по категориям</p>
                </Link>
                
                <Link 
                  href="/admin/values/analysis"
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <Cog6ToothIcon className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Анализ</h3>
                  <p className="text-sm text-gray-600 text-center">Настройка логики анализа цветовых ассоциаций</p>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Статистика */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardDocumentListIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Всего вопросов</p>
                <p className="text-2xl font-semibold text-gray-900">127</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Типов личности</p>
                <p className="text-2xl font-semibold text-gray-900">12</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PaletteIcon className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Понятий</p>
                <p className="text-2xl font-semibold text-gray-900">65</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
