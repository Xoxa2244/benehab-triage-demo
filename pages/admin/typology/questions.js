

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

export default function TypologyQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    options: [],
    ptype: '',
    active: true
  });

  const ptypes = [
    'sensitive', 'dysthymic', 'demonstrative', 'excitable', 'cyclothymic',
    'stuck', 'pedantic', 'anxious', 'hyperthymic'
  ];

  const ptypeNames = {
    sensitive: 'Сенситивный',
    dysthymic: 'Дистимический',
    demonstrative: 'Демонстративный',
    excitable: 'Возбудимый',
    cyclothymic: 'Циклотимический',
    stuck: 'Застревающий',
    pedantic: 'Педантичный',
    anxious: 'Тревожный',
    hyperthymic: 'Гипертимический'
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const response = await fetch('/api/admin/typology/questions');
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
      text: 'Вы отличаетесь',
      options: [
        { id: 1, text: 'Повышенной чувствительностью', ptype: 'sensitive' },
        { id: 2, text: 'Склонностью к пониженному настроению', ptype: 'dysthymic' },
        { id: 3, text: 'Переменчивостью настроения', ptype: 'cyclothymic' },
        { id: 4, text: 'Большой силой чувств и влечений', ptype: 'excitable' },
        { id: 5, text: 'Периодическими подъемами и спадами настроения', ptype: 'cyclothymic' },
        { id: 6, text: 'Длительностью переживаний', ptype: 'stuck' },
        { id: 7, text: 'Сдержанностью чувств', ptype: 'pedantic' },
        { id: 8, text: 'Скрытностью своих подлинных переживаний', ptype: 'anxious' },
        { id: 9, text: 'Приподнятым настроением', ptype: 'hyperthymic' }
      ],
      active: true
    },
    {
      id: 2,
      text: 'Вы часто',
      options: [
        { id: 1, text: 'Бываете озабочены своим здоровьем', ptype: 'sensitive' },
        { id: 2, text: 'Критикуете себя', ptype: 'dysthymic' },
        { id: 3, text: 'Демонстрируете свои чувства', ptype: 'demonstrative' },
        { id: 4, text: 'Не сдерживаете себя', ptype: 'excitable' },
        { id: 5, text: 'Бываете то энергичным, то вялым', ptype: 'cyclothymic' },
        { id: 6, text: 'Бываете упрямыми', ptype: 'stuck' },
        { id: 7, text: 'Сомневаетесь при выборе решения', ptype: 'pedantic' },
        { id: 8, text: 'Ограничиваете свои контакты с окружающими', ptype: 'anxious' },
        { id: 9, text: 'Легко увлекаетесь новым', ptype: 'hyperthymic' }
      ],
      active: true
    },
    {
      id: 3,
      text: 'Вы стремитесь',
      options: [
        { id: 1, text: 'К отдыху', ptype: 'sensitive' },
        { id: 2, text: 'Соответствовать требованиям окружающих', ptype: 'dysthymic' },
        { id: 3, text: 'Вызвать интерес к себе', ptype: 'demonstrative' },
        { id: 4, text: 'К немедленному достижению желаемого', ptype: 'excitable' },
        { id: 5, text: 'Действовать под влиянием текущего настроения', ptype: 'cyclothymic' },
        { id: 6, text: 'К постоянству и превосходству', ptype: 'stuck' },
        { id: 7, text: 'К безопасности', ptype: 'pedantic' },
        { id: 8, text: 'Держаться в некотором уединении', ptype: 'anxious' },
        { id: 9, text: 'К переменам', ptype: 'hyperthymic' }
      ],
      active: true
    },
    {
      id: 4,
      text: 'Вам бывает трудно в ситуациях',
      options: [
        { id: 1, text: 'Высоких нагрузок', ptype: 'sensitive' },
        { id: 2, text: 'Неудач или критики', ptype: 'dysthymic' },
        { id: 3, text: 'Когда Вас не замечают', ptype: 'demonstrative' },
        { id: 4, text: 'Препятствий или вынужденного ожидания', ptype: 'excitable' },
        { id: 5, text: 'Необходимости регулярно поддерживать высокий уровень активности', ptype: 'cyclothymic' },
        { id: 6, text: 'Непостоянства или неуважения со стороны других', ptype: 'stuck' },
        { id: 7, text: 'Угрозы, возможных ошибок, недостатка информации или времени', ptype: 'pedantic' },
        { id: 8, text: 'Большого количества контактов', ptype: 'anxious' },
        { id: 9, text: 'Большого количества запретов', ptype: 'hyperthymic' }
      ],
      active: true
    },
    {
      id: 5,
      text: 'Вы способны',
      options: [
        { id: 1, text: '«Уходить в болезнь»', ptype: 'sensitive' },
        { id: 2, text: 'Жертвовать своими интересами', ptype: 'dysthymic' },
        { id: 3, text: 'Производить впечатление', ptype: 'demonstrative' },
        { id: 4, text: 'Действовать быстро, не раздумывая', ptype: 'excitable' },
        { id: 5, text: 'Временами действовать интенсивно, временами испытывать апатию', ptype: 'cyclothymic' },
        { id: 6, text: 'Преодолевать большое количество препятствий', ptype: 'stuck' },
        { id: 7, text: 'Предварительно все обдумывать', ptype: 'pedantic' },
        { id: 8, text: 'К воображению и фантазии', ptype: 'anxious' },
        { id: 9, text: 'Активно действовать', ptype: 'hyperthymic' }
      ],
      active: true
    },
    {
      id: 6,
      text: 'Часто Вы чувствуете',
      options: [
        { id: 1, text: 'Усталость, слабость или боль', ptype: 'sensitive' },
        { id: 2, text: 'Печаль или вину', ptype: 'dysthymic' },
        { id: 3, text: 'Стремление себя показать', ptype: 'demonstrative' },
        { id: 4, text: 'Гнев или возмущение', ptype: 'excitable' },
        { id: 5, text: 'То жизнерадостность, то подавленность', ptype: 'cyclothymic' },
        { id: 6, text: 'Недоверие к другим', ptype: 'stuck' },
        { id: 7, text: 'Тревогу и неуверенность', ptype: 'pedantic' },
        { id: 8, text: 'Одиночество', ptype: 'anxious' },
        { id: 9, text: 'Радость', ptype: 'hyperthymic' }
      ],
      active: true
    },
    {
      id: 7,
      text: 'Вы умеете',
      options: [
        { id: 1, text: 'Тонко чувствовать состояние своего организма', ptype: 'sensitive' },
        { id: 2, text: 'Принимать ответственность на себя', ptype: 'dysthymic' },
        { id: 3, text: 'Нравиться окружающим', ptype: 'demonstrative' },
        { id: 4, text: 'Атаковать противника', ptype: 'excitable' },
        { id: 5, text: 'Игнорировать жесткие ограничения и требования', ptype: 'cyclothymic' },
        { id: 6, text: 'Предъявлять требования к другим людям', ptype: 'stuck' },
        { id: 7, text: 'Соблюдать порядок и точность', ptype: 'pedantic' },
        { id: 8, text: 'Сосредоточиться на своих мыслях', ptype: 'anxious' },
        { id: 9, text: 'Поддерживать широкий круг контактов', ptype: 'hyperthymic' }
      ],
      active: true
    }
  ];

  const handleEditQuestion = (question) => {
    setEditingQuestion({ ...question });
  };

  const handleSaveQuestion = async (question) => {
    try {
      const response = await fetch(`/api/admin/typology/questions/${question.id}`, {
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
      const response = await fetch(`/api/admin/typology/questions/${id}`, {
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
      const response = await fetch(`/api/admin/typology/questions/${id}`, {
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

  const getPtypeName = (ptypeId) => {
    return ptypeNames[ptypeId] || ptypeId;
  };

  const getPtypeColor = (ptypeId) => {
    const colors = {
      sensitive: 'bg-pink-100 text-pink-800',
      dysthymic: 'bg-blue-100 text-blue-800',
      demonstrative: 'bg-purple-100 text-purple-800',
      excitable: 'bg-red-100 text-red-800',
      cyclothymic: 'bg-yellow-100 text-yellow-800',
      stuck: 'bg-orange-100 text-orange-800',
      pedantic: 'bg-green-100 text-green-800',
      anxious: 'bg-indigo-100 text-indigo-800',
      hyperthymic: 'bg-teal-100 text-teal-800'
    };
    return colors[ptypeId] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
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
              <h1 className="text-xl font-semibold text-gray-900">Управление вопросами - Психотипы</h1>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">Фильтры по психотипам</h2>
          <div className="flex flex-wrap gap-2">
            {ptypes.map((ptype) => (
              <button
                key={ptype}
                className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                {getPtypeName(ptype)}
              </button>
            ))}
          </div>
        </div>

        {/* Список вопросов */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Вопросы ({questions.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {questions.map((question) => (
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleSaveQuestion(editingQuestion)}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
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
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">{question.text}</h3>
                        
                        {/* Варианты ответов */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {question.options.map((option) => (
                            <div key={option.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPtypeColor(option.ptype)}`}>
                                {getPtypeName(option.ptype)}
                              </span>
                              <span className="text-sm text-gray-700">{option.text}</span>
                            </div>
                          ))}
                        </div>
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
