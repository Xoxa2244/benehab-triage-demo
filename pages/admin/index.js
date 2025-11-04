

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ClipboardDocumentListIcon, 
  UserGroupIcon, 
  SwatchIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  DocumentTextIcon,
  TableCellsIcon,
  CalculatorIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('attitude');

  // Sync tab with URL query parameter
  useEffect(() => {
    if (router.query.tab && ['attitude', 'typology', 'values'].includes(router.query.tab)) {
      setActiveTab(router.query.tab);
    }
  }, [router.query.tab]);

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    router.push(`/admin?tab=${tabId}`, undefined, { shallow: true });
  };

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
      icon: SwatchIcon,
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
                onClick={() => handleTabChange(tab.id)}
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
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <UserGroupIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Вопросы</h3>
                  <p className="text-sm text-gray-600 text-center">Управление вопросами и вариантами ответов для определения психотипа</p>
                </Link>
                
                <Link
                  href="/admin/typology/types"
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <DocumentTextIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Психотипы</h3>
                  <p className="text-sm text-gray-600 text-center">Управление описаниями психотипов и инструкциями по коммуникации</p>
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
                <p className="text-gray-600">Управление понятиями, метриками, весовыми матрицами и настройками Affinity</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Link 
                  href="/admin/concepts"
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <SwatchIcon className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Concepts</h3>
                  <p className="text-sm text-gray-600 text-center">Управление понятиями (concepts) и их описаниями</p>
                </Link>
                
                <Link 
                  href="/admin/ranks"
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <TableCellsIcon className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Ranks (M)</h3>
                  <p className="text-sm text-gray-600 text-center">Настройка длины ранга M для матриц Rank × Concept</p>
                </Link>
                
                <Link 
                  href="/admin/metrics"
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <CalculatorIcon className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Metrics</h3>
                  <p className="text-sm text-gray-600 text-center">Управление метриками и их весовыми матрицами</p>
                </Link>

                <Link 
                  href="/admin/settings"
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <Cog6ToothIcon className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Settings</h3>
                  <p className="text-sm text-gray-600 text-center">Настройка Affinity: Self/Ideal concepts и anchors</p>
                </Link>

                <Link 
                  href="/admin/debug"
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <BeakerIcon className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Debug</h3>
                  <p className="text-sm text-gray-600 text-center">Тестирование вычислений Score и Affinity</p>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Статистика */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Общая статистика</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Типы отношения к болезни */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800 mb-2">Типы отношения к болезни</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Активных типов:</span>
                  <span className="text-sm font-medium text-green-900">9</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Вопросов:</span>
                  <span className="text-sm font-medium text-green-900">41</span>
                </div>
              </div>
            </div>

            {/* Психотипы */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Психотипы</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Активных психотипов:</span>
                  <span className="text-sm font-medium text-blue-900">9</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Вопросов:</span>
                  <span className="text-sm font-medium text-blue-900">7</span>
                </div>
              </div>
            </div>

            {/* Психосемантика */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-purple-800 mb-2">Психосемантика</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-purple-700">Количество понятий:</span>
                  <span className="text-sm font-medium text-purple-900">15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-purple-700">Количество категорий:</span>
                  <span className="text-sm font-medium text-purple-900">4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
