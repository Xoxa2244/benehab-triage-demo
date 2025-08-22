'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon,
  TagIcon
} from '@heroicons/react/24/outline';

export default function ValuesConcepts() {
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingConcept, setEditingConcept] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConcept, setNewConcept] = useState({
    concept: '',
    category: '',
    description: '',
    active: true
  });

  const categories = [
    'values', 'activities', 'people', 'events', 'emotions'
  ];

  const categoryNames = {
    values: 'Ценности',
    activities: 'Деятельность',
    people: 'Люди',
    events: 'События',
    emotions: 'Эмоции'
  };

  const categoryColors = {
    values: 'bg-purple-100 text-purple-800',
    activities: 'bg-blue-100 text-blue-800',
    people: 'bg-green-100 text-green-800',
    events: 'bg-orange-100 text-orange-800',
    emotions: 'bg-pink-100 text-pink-800'
  };

  useEffect(() => {
    loadConcepts();
  }, []);

  const loadConcepts = async () => {
    try {
      const response = await fetch('/api/profiling/values/items');
      if (response.ok) {
        const data = await response.json();
        setConcepts(data.items || []);
      } else {
        // Если API еще не готов, используем демо-данные
        setConcepts(getDemoConcepts());
      }
    } catch (error) {
      console.error('Ошибка загрузки понятий:', error);
      setConcepts(getDemoConcepts());
    } finally {
      setLoading(false);
    }
  };

  const getDemoConcepts = () => [
    {
      id: 1,
      concept: 'Здоровье',
      category: 'values',
      description: 'Физическое и психическое благополучие'
    },
    {
      id: 2,
      concept: 'Любовь',
      category: 'values',
      description: 'Чувство глубокой привязанности и заботы'
    },
    {
      id: 3,
      concept: 'Свобода',
      category: 'values',
      description: 'Возможность действовать по своему выбору'
    },
    {
      id: 4,
      concept: 'Безопасность',
      category: 'values',
      description: 'Защищенность от угроз и опасностей'
    },
    {
      id: 5,
      concept: 'Работа',
      category: 'activities',
      description: 'Профессиональная деятельность'
    },
    {
      id: 6,
      concept: 'Учеба',
      category: 'activities',
      description: 'Получение новых знаний и навыков'
    },
    {
      id: 7,
      concept: 'Я сам',
      category: 'people',
      description: 'Личность и индивидуальность'
    },
    {
      id: 8,
      concept: 'Врач',
      category: 'people',
      description: 'Медицинский специалист'
    },
    {
      id: 9,
      concept: 'Прошлое',
      category: 'events',
      description: 'Жизненный опыт и воспоминания'
    },
    {
      id: 10,
      concept: 'Будущее',
      category: 'events',
      description: 'Предстоящие события и планы'
    },
    {
      id: 11,
      concept: 'Счастье',
      category: 'emotions',
      description: 'Состояние радости и удовлетворения'
    },
    {
      id: 12,
      concept: 'Страх',
      category: 'emotions',
      description: 'Чувство опасности и тревоги'
    }
  ];

  const handleEditConcept = (concept) => {
    setEditingConcept({ ...concept });
  };

  const handleSaveConcept = async (concept) => {
    try {
      const response = await fetch(`/api/admin/values/concepts/${concept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(concept)
      });

      if (response.ok) {
        setConcepts(concepts.map(c => c.id === concept.id ? concept : c));
        setEditingConcept(null);
      }
    } catch (error) {
      console.error('Ошибка сохранения понятия:', error);
      // Для демо просто обновляем локально
      setConcepts(concepts.map(c => c.id === concept.id ? concept : c));
      setEditingConcept(null);
    }
  };

  const handleDeleteConcept = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить это понятие? Это может повлиять на существующие профили.')) return;

    try {
      const response = await fetch(`/api/admin/values/concepts/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setConcepts(concepts.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Ошибка удаления понятия:', error);
      // Для демо просто удаляем локально
      setConcepts(concepts.filter(c => c.id !== id));
    }
  };

  const handleToggleActive = async (id) => {
    const concept = concepts.find(c => c.id === id);
    const updatedConcept = { ...concept, active: !concept.active };

    try {
      const response = await fetch(`/api/admin/values/concepts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConcept)
      });

      if (response.ok) {
        setConcepts(concepts.map(c => c.id === id ? updatedConcept : c));
      }
    } catch (error) {
      console.error('Ошибка обновления понятия:', error);
      // Для демо просто обновляем локально
      setConcepts(concepts.map(c => c.id === id ? updatedConcept : c));
    }
  };

  const handleAddConcept = async () => {
    if (!newConcept.concept.trim() || !newConcept.category) return;

    const concept = {
      id: Date.now(), // Временный ID для демо
      ...newConcept
    };

    try {
      const response = await fetch('/api/admin/values/concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(concept)
      });

      if (response.ok) {
        setConcepts([...concepts, concept]);
        setNewConcept({ concept: '', category: '', description: '', active: true });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Ошибка добавления понятия:', error);
      // Для демо просто добавляем локально
      setConcepts([...concepts, concept]);
      setNewConcept({ concept: '', category: '', description: '', active: true });
      setShowAddForm(false);
    }
  };

  const getCategoryName = (categoryId) => {
    return categoryNames[categoryId] || categoryId;
  };

  const getCategoryColor = (categoryId) => {
    return categoryColors[categoryId] || 'bg-gray-100 text-gray-800';
  };

  const filteredConcepts = concepts.filter(concept => 
    concept.active !== false // Показываем все, кроме явно скрытых
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Загружаем понятия...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Управление понятиями - Психосемантика</h1>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Добавить понятие</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {categories.map((category) => {
            const count = concepts.filter(c => c.category === category).length;
            return (
              <div key={category} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <TagIcon className={`h-8 w-8 ${categoryColors[category].replace('bg-', 'text-').replace('-100', '-500')}`} />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">{getCategoryName(category)}</p>
                    <p className="text-2xl font-semibold text-gray-900">{count}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Фильтры */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Фильтры по категориям</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(category)}`}
              >
                {getCategoryName(category)}
              </button>
            ))}
          </div>
        </div>

        {/* Форма добавления понятия */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Добавить новое понятие</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Понятие
                  </label>
                  <input
                    type="text"
                    value={newConcept.concept}
                    onChange={(e) => setNewConcept({ ...newConcept, concept: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="например: Дружба"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Категория
                  </label>
                  <select
                    value={newConcept.category}
                    onChange={(e) => setNewConcept({ ...newConcept, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {getCategoryName(category)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={newConcept.description}
                  onChange={(e) => setNewConcept({ ...newConcept, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                  placeholder="Краткое описание понятия..."
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleAddConcept}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                >
                  <CheckIcon className="h-5 w-5" />
                  <span>Добавить</span>
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 flex items-center space-x-2"
                >
                  <XMarkIcon className="h-5 w-5" />
                  <span>Отмена</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Список понятий */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Понятия ({filteredConcepts.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredConcepts.map((concept) => (
              <div key={concept.id} className="p-6">
                {editingConcept?.id === concept.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Понятие
                        </label>
                        <input
                          type="text"
                          value={editingConcept.concept}
                          onChange={(e) => setEditingConcept({ ...editingConcept, concept: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Категория
                        </label>
                        <select
                          value={editingConcept.category}
                          onChange={(e) => setEditingConcept({ ...editingConcept, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {getCategoryName(category)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Описание
                      </label>
                      <textarea
                        value={editingConcept.description}
                        onChange={(e) => setEditingConcept({ ...editingConcept, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleSaveConcept(editingConcept)}
                        className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                      >
                        <CheckIcon className="h-4 w-4" />
                        <span>Сохранить</span>
                      </button>
                      <button
                        onClick={() => setEditingConcept(null)}
                        className="bg-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-400 flex items-center space-x-2"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        <span>Отмена</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(concept.category)}`}>
                          {getCategoryName(concept.category)}
                        </span>
                        <h3 className="text-lg font-medium text-gray-900">{concept.concept}</h3>
                      </div>
                      <p className="text-gray-600">{concept.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditConcept(concept)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Редактировать"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(concept.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Скрыть/показать"
                      >
                        <EyeSlashIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteConcept(concept.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Удалить"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Информация о категориях */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Описание категорий</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                    {getCategoryName(category)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {category === 'values' && 'Основные жизненные ценности и принципы'}
                  {category === 'activities' && 'Виды деятельности и увлечения'}
                  {category === 'people' && 'Люди и социальные роли'}
                  {category === 'events' && 'Жизненные события и периоды'}
                  {category === 'emotions' && 'Эмоциональные состояния и чувства'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
