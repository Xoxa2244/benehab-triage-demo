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
    { id: 'values', name: 'Ценности', color: 'bg-green-100 text-green-800' },
    { id: 'activities', name: 'Деятельность', color: 'bg-blue-100 text-blue-800' },
    { id: 'people', name: 'Люди', color: 'bg-purple-100 text-purple-800' },
    { id: 'events', name: 'События', color: 'bg-orange-100 text-orange-800' },
    { id: 'emotions', name: 'Эмоции', color: 'bg-pink-100 text-pink-800' }
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');

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
      description: 'Физическое и психическое благополучие',
      active: true
    },
    {
      id: 2,
      concept: 'Любовь',
      category: 'values',
      description: 'Чувство глубокой привязанности и заботы',
      active: true
    },
    {
      id: 3,
      concept: 'Свобода',
      category: 'values',
      description: 'Возможность действовать по своему выбору',
      active: true
    },
    {
      id: 4,
      concept: 'Безопасность',
      category: 'values',
      description: 'Защищенность от угроз и опасностей',
      active: true
    },
    {
      id: 5,
      concept: 'Богатство',
      category: 'values',
      description: 'Материальное благополучие и достаток',
      active: true
    },
    {
      id: 6,
      concept: 'Знания',
      category: 'values',
      description: 'Образованность и интеллектуальное развитие',
      active: true
    },
    {
      id: 7,
      concept: 'Творчество',
      category: 'values',
      description: 'Создание нового и самовыражение',
      active: true
    },
    {
      id: 8,
      concept: 'Семья',
      category: 'values',
      description: 'Близкие люди и домашний очаг',
      active: true
    },
    {
      id: 9,
      concept: 'Дружба',
      category: 'values',
      description: 'Взаимная поддержка и понимание',
      active: true
    },
    {
      id: 10,
      concept: 'Успех',
      category: 'values',
      description: 'Достижение поставленных целей',
      active: true
    },
    {
      id: 11,
      concept: 'Работа',
      category: 'activities',
      description: 'Профессиональная деятельность',
      active: true
    },
    {
      id: 12,
      concept: 'Учеба',
      category: 'activities',
      description: 'Получение новых знаний и навыков',
      active: true
    },
    {
      id: 13,
      concept: 'Спорт',
      category: 'activities',
      description: 'Физическая активность и тренировки',
      active: true
    },
    {
      id: 14,
      concept: 'Бизнес',
      category: 'activities',
      description: 'Предпринимательская деятельность',
      active: true
    },
    {
      id: 15,
      concept: 'Религия',
      category: 'activities',
      description: 'Духовные практики и вера',
      active: true
    },
    {
      id: 16,
      concept: 'Искусство',
      category: 'activities',
      description: 'Творческие занятия и культурная деятельность',
      active: true
    },
    {
      id: 17,
      concept: 'Путешествия',
      category: 'activities',
      description: 'Поездки и новые впечатления',
      active: true
    },
    {
      id: 18,
      concept: 'Отдых',
      category: 'activities',
      description: 'Восстановление сил и расслабление',
      active: true
    },
    {
      id: 19,
      concept: 'Я сам',
      category: 'people',
      description: 'Личность и индивидуальность',
      active: true
    },
    {
      id: 20,
      concept: 'Врач',
      category: 'people',
      description: 'Медицинский специалист',
      active: true
    },
    {
      id: 21,
      concept: 'Медработники',
      category: 'people',
      description: 'Персонал медицинского учреждения',
      active: true
    },
    {
      id: 22,
      concept: 'Коллеги',
      category: 'people',
      description: 'Люди на работе',
      active: true
    },
    {
      id: 23,
      concept: 'Соседи',
      category: 'people',
      description: 'Люди, живущие рядом',
      active: true
    },
    {
      id: 24,
      concept: 'Прошлое',
      category: 'events',
      description: 'Жизненный опыт и воспоминания',
      active: true
    },
    {
      id: 25,
      concept: 'Настоящее',
      category: 'events',
      description: 'Текущий момент жизни',
      active: true
    },
    {
      id: 26,
      concept: 'Будущее',
      category: 'events',
      description: 'Предстоящие события и планы',
      active: true
    },
    {
      id: 27,
      concept: 'Болезнь',
      category: 'events',
      description: 'Заболевание и лечение',
      active: true
    },
    {
      id: 28,
      concept: 'Лечение',
      category: 'events',
      description: 'Медицинские процедуры и терапия',
      active: true
    },
    {
      id: 29,
      concept: 'Перемены',
      category: 'events',
      description: 'Изменения в жизни',
      active: true
    },
    {
      id: 30,
      concept: 'Счастье',
      category: 'emotions',
      description: 'Состояние радости и удовлетворения',
      active: true
    },
    {
      id: 31,
      concept: 'Радость',
      category: 'emotions',
      description: 'Положительные эмоции',
      active: true
    },
    {
      id: 32,
      concept: 'Страх',
      category: 'emotions',
      description: 'Чувство опасности и тревоги',
      active: true
    },
    {
      id: 33,
      concept: 'Тревога',
      category: 'emotions',
      description: 'Беспокойство и волнение',
      active: true
    },
    {
      id: 34,
      concept: 'Усталость',
      category: 'emotions',
      description: 'Физическое и психическое истощение',
      active: true
    },
    {
      id: 35,
      concept: 'Страдание',
      category: 'emotions',
      description: 'Боль и душевные муки',
      active: true
    },
    {
      id: 36,
      concept: 'Надежда',
      category: 'emotions',
      description: 'Вера в лучшее будущее',
      active: true
    },
    {
      id: 37,
      concept: 'Гордость',
      category: 'emotions',
      description: 'Чувство собственного достоинства',
      active: true
    },
    {
      id: 38,
      concept: 'Стыд',
      category: 'emotions',
      description: 'Чувство вины и неловкости',
      active: true
    },
    {
      id: 39,
      concept: 'Гнев',
      category: 'emotions',
      description: 'Раздражение и злость',
      active: true
    },
    {
      id: 40,
      concept: 'Спокойствие',
      category: 'emotions',
      description: 'Внутреннее равновесие',
      active: true
    },
    {
      id: 41,
      concept: 'Вдохновение',
      category: 'emotions',
      description: 'Творческий подъем и энтузиазм',
      active: true
    },
    {
      id: 42,
      concept: 'Одиночество',
      category: 'emotions',
      description: 'Чувство изоляции',
      active: true
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

  const getFilteredConcepts = () => {
    if (selectedCategory === 'all') {
      return concepts;
    }
    return concepts.filter(c => c.category === selectedCategory);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : 'bg-gray-100 text-gray-800';
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
            const count = concepts.filter(c => c.category === category.id).length;
            return (
              <div key={category.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <TagIcon className={`h-8 w-8 ${category.color.replace('bg-', 'text-').replace('-100', '-500')}`} />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">{category.name}</p>
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
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${selectedCategory === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Все категории
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${selectedCategory === category.id ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                {category.name}
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
                      <option key={category.id} value={category.id}>
                        {category.name}
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
              Понятия ({getFilteredConcepts().length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {getFilteredConcepts().map((concept) => (
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
                            <option key={category.id} value={category.id}>
                              {category.name}
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
              <div key={category.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category.id)}`}>
                    {category.name}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {category.name === 'Ценности' && 'Основные жизненные ценности и принципы'}
                  {category.name === 'Деятельность' && 'Виды деятельности и увлечения'}
                  {category.name === 'Люди' && 'Люди и социальные роли'}
                  {category.name === 'События' && 'Жизненные события и периоды'}
                  {category.name === 'Эмоции' && 'Эмоциональные состояния и чувства'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
