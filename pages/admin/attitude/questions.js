

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
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function AttitudeQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    scale: 'severity',
    weight: 1,
    active: true
  });

  const scales = [
    { id: 'severity', name: 'Страдающий', description: 'Оценка тяжести заболевания' },
    { id: 'secondary_gain', name: 'Прагматический', description: 'Вторичная выгода от болезни' },
    { id: 'hide_resist', name: 'Скрывающий', description: 'Стремление скрыть болезнь' },
    { id: 'work_escape', name: 'Деятельный', description: 'Уход в работу/спорт' },
    { id: 'low_selfesteem', name: 'Сниженная самооценка', description: 'Неуверенность в себе' },
    { id: 'alt_med', name: 'Недоверчивый', description: 'Вера в альтернативную медицину' },
    { id: 'addictions', name: 'Химические зависимости', description: 'Вредные привычки' },
    { id: 'ignore', name: 'Игнорирующий', description: 'Игнорирование болезни' },
    { id: 'anxiety', name: 'Тревожный', description: 'Склонность к тревожным расстройствам' }
  ];

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const response = await fetch('/api/admin/attitude/questions');
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      } else {
        // Если API еще не готов, используем демо-данные
        setQuestions(getDemoQuestions());
      }
    } catch (error) {
      console.error('Ошибка загрузки вопросов:', error);
      setQuestions(getDemoQuestions());
    } finally {
      setLoading(false);
    }
  };

  const getDemoQuestions = () => [
    {
      id: 1,
      text: 'У меня тяжёлое заболевание',
      scale: 'severity',
      weight: 1,
      active: true
    },
    {
      id: 2,
      text: 'Часто чувствую слабость',
      scale: 'severity',
      weight: 1,
      active: true
    },
    {
      id: 3,
      text: 'Болезнь помогает избегать обязанностей',
      scale: 'secondary_gain',
      weight: 1,
      active: true
    },
    {
      id: 4,
      text: 'Стараюсь не показывать, что я болею',
      scale: 'hide_resist',
      weight: 1,
      active: true
    },
    {
      id: 5,
      text: 'Я должен упорно трудиться',
      scale: 'work_escape',
      weight: 1,
      active: true
    },
    {
      id: 6,
      text: 'Моё будущее кажется печальным',
      scale: 'low_selfesteem',
      weight: 1,
      active: true
    },
    {
      id: 7,
      text: 'Я верю в Бога',
      scale: 'low_selfesteem',
      weight: -1,
      active: true
    },
    {
      id: 8,
      text: 'Верю в эффективность гомеопатии/остеопатии',
      scale: 'alt_med',
      weight: 1,
      active: true
    },
    {
      id: 9,
      text: 'Я воздерживаюсь от алкоголя',
      scale: 'addictions',
      weight: -1,
      active: true
    },
    {
      id: 10,
      text: 'Я не курю',
      scale: 'addictions',
      weight: -1,
      active: true
    },
    {
      id: 11,
      text: 'Надеюсь, что организм сам справится',
      scale: 'ignore',
      weight: 1,
      active: true
    },
    {
      id: 12,
      text: 'Почти всегда тревожусь',
      scale: 'anxiety',
      weight: 1,
      active: true
    },
    {
      id: 13,
      text: 'Болезнь ограничивает мою жизнь',
      scale: 'severity',
      weight: 1,
      active: true
    },
    {
      id: 14,
      text: 'Мне легче получить поддержку, когда я болею',
      scale: 'secondary_gain',
      weight: 1,
      active: true
    },
    {
      id: 15,
      text: 'Скрываю симптомы от близких',
      scale: 'hide_resist',
      weight: 1,
      active: true
    },
    {
      id: 16,
      text: 'Работа помогает мне забыть о болезни',
      scale: 'work_escape',
      weight: 1,
      active: true
    },
    {
      id: 17,
      text: 'Я часто виню себя в болезни',
      scale: 'low_selfesteem',
      weight: 1,
      active: true
    },
    {
      id: 18,
      text: 'Молитва помогает мне справиться',
      scale: 'low_selfesteem',
      weight: -1,
      active: true
    },
    {
      id: 19,
      text: 'Предпочитаю народные средства',
      scale: 'alt_med',
      weight: 1,
      active: true
    },
    {
      id: 20,
      text: 'Я полностью отказался от вредных привычек',
      scale: 'addictions',
      weight: -1,
      active: true
    },
    {
      id: 21,
      text: 'Не хожу к врачам, пока не станет совсем плохо',
      scale: 'ignore',
      weight: 1,
      active: true
    },
    {
      id: 22,
      text: 'Постоянно беспокоюсь о своём здоровье',
      scale: 'anxiety',
      weight: 1,
      active: true
    },
    {
      id: 23,
      text: 'Болезнь делает меня беспомощным',
      scale: 'severity',
      weight: 1,
      active: true
    },
    {
      id: 24,
      text: 'Благодаря болезни я могу отдыхать',
      scale: 'secondary_gain',
      weight: 1,
      active: true
    },
    {
      id: 25,
      text: 'Не рассказываю о диагнозе знакомым',
      scale: 'hide_resist',
      weight: 1,
      active: true
    },
    {
      id: 26,
      text: 'Спорт отвлекает меня от проблем со здоровьем',
      scale: 'work_escape',
      weight: 1,
      active: true
    },
    {
      id: 27,
      text: 'Я не заслуживаю выздоровления',
      scale: 'low_selfesteem',
      weight: 1,
      active: true
    },
    {
      id: 28,
      text: 'Вера даёт мне силы',
      scale: 'low_selfesteem',
      weight: -1,
      active: true
    },
    {
      id: 29,
      text: 'Доверяю только натуральным препаратам',
      scale: 'alt_med',
      weight: 1,
      active: true
    },
    {
      id: 30,
      text: 'Я веду здоровый образ жизни',
      scale: 'addictions',
      weight: -1,
      active: true
    },
    {
      id: 31,
      text: 'Лечение не нужно, всё пройдёт само',
      scale: 'ignore',
      weight: 1,
      active: true
    },
    {
      id: 32,
      text: 'Часто просыпаюсь от кошмаров о болезни',
      scale: 'anxiety',
      weight: 1,
      active: true
    },
    {
      id: 33,
      text: 'Болезнь разрушает мои планы',
      scale: 'severity',
      weight: 1,
      active: true
    },
    {
      id: 34,
      text: 'Близкие больше внимания уделяют мне',
      scale: 'secondary_gain',
      weight: 1,
      active: true
    },
    {
      id: 35,
      text: 'Стыжусь своей болезни',
      scale: 'hide_resist',
      weight: 1,
      active: true
    },
    {
      id: 36,
      text: 'Карьера важнее здоровья',
      scale: 'work_escape',
      weight: 1,
      active: true
    },
    {
      id: 37,
      text: 'Я сам виноват в своих проблемах',
      scale: 'low_selfesteem',
      weight: 1,
      active: true
    },
    {
      id: 38,
      text: 'Духовность помогает мне выздороветь',
      scale: 'low_selfesteem',
      weight: -1,
      active: true
    },
    {
      id: 39,
      text: 'Официальная медицина неэффективна',
      scale: 'alt_med',
      weight: 1,
      active: true
    },
    {
      id: 40,
      text: 'Я контролирую все свои привычки',
      scale: 'addictions',
      weight: -1,
      active: true
    },
    {
      id: 41,
      text: 'Не стоит тратить время на лечение',
      scale: 'ignore',
      weight: 1,
      active: true
    }
  ];

  // Правильные названия типов согласно CSV файлу
  const scaleNames = {
    severity: 'Восприятие своего состояния как тяжелого',
    secondary_gain: 'Вторичная выгода заболевания',
    hide_resist: 'Стремление скрыть свою болезнь',
    work_escape: 'Стремление «убежать» в работу или спорт',
    low_selfesteem: 'Сниженная самооценка, неудовлетворенность собой',
    alt_med: 'Вера в альтернативную медицину и стремление к самолечению',
    addictions: 'Вредные привычки, химические зависимости, аддикции',
    ignore: 'Игнорирование болезни',
    anxiety: 'Склонность к тревожным расстройствам'
  };

  const [selectedScale, setSelectedScale] = useState('all');

  const handleEditQuestion = (question) => {
    setEditingQuestion({ ...question });
  };

  const handleSaveQuestion = async (question) => {
    try {
      const response = await fetch(`/api/admin/attitude/questions/${question.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(question)
      });

      if (response.ok) {
        setQuestions(questions.map(q => q.id === question.id ? question : q));
        setEditingQuestion(null);
      }
    } catch (error) {
      console.error('Ошибка сохранения вопроса:', error);
      // Для демо просто обновляем локально
      setQuestions(questions.map(q => q.id === question.id ? question : q));
      setEditingQuestion(null);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этот вопрос?')) return;

    try {
      const response = await fetch(`/api/admin/attitude/questions/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setQuestions(questions.filter(q => q.id !== id));
      }
    } catch (error) {
      console.error('Ошибка удаления вопроса:', error);
      // Для демо просто удаляем локально
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const handleToggleActive = async (id) => {
    const question = questions.find(q => q.id === id);
    const updatedQuestion = { ...question, active: !question.active };

    try {
      const response = await fetch(`/api/admin/attitude/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedQuestion)
      });

      if (response.ok) {
        setQuestions(questions.map(q => q.id === id ? updatedQuestion : q));
      }
    } catch (error) {
      console.error('Ошибка обновления вопроса:', error);
      // Для демо просто обновляем локально
      setQuestions(questions.map(q => q.id === id ? updatedQuestion : q));
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.text.trim()) return;

    const question = {
      id: Date.now(), // Временный ID для демо
      ...newQuestion
    };

    try {
      const response = await fetch('/api/admin/attitude/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(question)
      });

      if (response.ok) {
        setQuestions([...questions, question]);
        setNewQuestion({ text: '', scale: 'severity', weight: 1, active: true });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Ошибка добавления вопроса:', error);
      // Для демо просто добавляем локально
      setQuestions([...questions, question]);
      setNewQuestion({ text: '', scale: 'severity', weight: 1, active: true });
      setShowAddForm(false);
    }
  };

  const getFilteredQuestions = () => {
    if (selectedScale === 'all') {
      return questions;
    }
    return questions.filter(q => q.scale === selectedScale);
  };

  const getScaleName = (scale) => {
    return scaleNames[scale] || scale;
  };

  const getWeightColor = (weight) => {
    if (weight > 0) return 'text-green-600';
    if (weight < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getWeightLabel = (weight) => {
    if (weight > 0) return 'Положительный';
    if (weight < 0) return 'Отрицательный';
    return 'Нейтральный';
  };

  const getScaleColor = (scaleId) => {
    const colors = {
      severity: 'bg-red-100 text-red-800',
      secondary_gain: 'bg-yellow-100 text-yellow-800',
      hide_resist: 'bg-blue-100 text-blue-800',
      work_escape: 'bg-green-100 text-green-800',
      low_selfesteem: 'bg-purple-100 text-purple-800',
      alt_med: 'bg-orange-100 text-orange-800',
      addictions: 'bg-pink-100 text-pink-800',
      ignore: 'bg-gray-100 text-gray-800',
      anxiety: 'bg-indigo-100 text-indigo-800'
    };
    return colors[scaleId] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Загружаем вопросы...</p>
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
              <h1 className="text-xl font-semibold text-gray-900">Управление вопросами - Отношение к болезни</h1>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Добавить вопрос</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Фильтры */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Фильтры</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedScale('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${selectedScale === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Все
            </button>
            {scales.map((scale) => (
              <button
                key={scale.id}
                onClick={() => setSelectedScale(scale.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${selectedScale === scale.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {scale.name}
              </button>
            ))}
          </div>
        </div>

        {/* Форма добавления вопроса */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Добавить новый вопрос</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Текст вопроса
                </label>
                <textarea
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Введите текст вопроса..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Шкала
                  </label>
                  <select
                    value={newQuestion.scale}
                    onChange={(e) => setNewQuestion({ ...newQuestion, scale: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {scales.map((scale) => (
                      <option key={scale.id} value={scale.id}>
                        {scale.name} - {scale.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Вес (влияние на расчет)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={newQuestion.weight}
                    onChange={(e) => setNewQuestion({ ...newQuestion, weight: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleAddQuestion}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
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

        {/* Список вопросов */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Вопросы ({getFilteredQuestions().length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {getFilteredQuestions().map((question) => (
              <div key={question.id} className="p-6">
                {editingQuestion?.id === question.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Текст вопроса
                      </label>
                      <textarea
                        value={editingQuestion.text}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Шкала
                        </label>
                        <select
                          value={editingQuestion.scale}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, scale: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {scales.map((scale) => (
                            <option key={scale.id} value={scale.id}>
                              {scale.name} - {scale.description}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Вес
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={editingQuestion.weight}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, weight: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleSaveQuestion(editingQuestion)}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                      >
                        <CheckIcon className="h-4 w-4" />
                        <span>Сохранить</span>
                      </button>
                      <button
                        onClick={() => setEditingQuestion(null)}
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
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getScaleName(question.scale)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Вес: <span className={`${getWeightColor(question.weight)} font-semibold`}>{question.weight}</span> ({getWeightLabel(question.weight)})
                        </span>
                        {question.active ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Активен
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Скрыт
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900">{question.text}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Редактировать"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(question.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title={question.active ? "Скрыть" : "Показать"}
                      >
                        {question.active ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
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
      </div>
    </div>
  );
}
