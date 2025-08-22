

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function TypologyTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState({
    id: '',
    name: '',
    short_desc: '',
    tone: '',
    do: [],
    avoid: [],
    motivators: [],
    red_flags: [],
    active: true
  });

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const response = await fetch('/api/admin/typology/types');
      if (response.ok) {
        const data = await response.json();
        setTypes(data.types || []);
      } else {
        // Если API еще не готов, используем демо-данные
        setTypes(getDemoTypes());
      }
    } catch (error) {
      console.error('Ошибка загрузки психотипов:', error);
      setTypes(getDemoTypes());
    } finally {
      setLoading(false);
    }
  };

  const getDemoTypes = () => [
    {
      id: 'sensitive',
      name: 'Сенситивный',
      short_desc: 'Ранимость, высокая чувствительность, склонность к соматическим жалобам и усталости.',
      tone: 'мягкий, бережный, подтверждающий чувства',
      do: [
        'начинать с признания ощущений и тревог',
        'давать пошаговые, простые инструкции',
        'предлагать поддерживающие практики (сон, вода, дыхание)'
      ],
      avoid: [
        'жёстких формулировок и давления',
        'обесценивания жалоб'
      ],
      motivators: ['забота', 'безопасность', 'поддержка'],
      red_flags: ['накатывающая усталость', 'усиление соматовегетативных жалоб'],
      active: true
    },
    {
      id: 'dysthymic',
      name: 'Дистимический',
      short_desc: 'Склонность к пониженному фону настроения, самокритике, чувству вины.',
      tone: 'поддерживающий, структурирующий',
      do: [
        'давать маленькие достижимые шаги',
        'подчеркивать прогресс и усилия',
        'предлагать регулярность и рутину'
      ],
      avoid: [
        'высокие ожидания сразу',
        'иронию и сравнения'
      ],
      motivators: ['стабильность', 'прогнозируемость', 'одобрение'],
      red_flags: ['усиление безнадёжности', 'суицидальные мысли'],
      active: true
    },
    {
      id: 'demonstrative',
      name: 'Демонстративный',
      short_desc: 'Потребность в признании, стремление производить впечатление.',
      tone: 'партнёрский, признающий вклад',
      do: [
        'давать пространство для "отчитаться" об успехах',
        'предлагать социально видимые цели ("держать план")',
        'использовать формулировки признания'
      ],
      avoid: [
        'игнор обратной связи',
        'сведение к "выдумке"'
      ],
      motivators: ['социальное одобрение', 'роль лидера', 'видимый результат'],
      red_flags: ['накопление невыполненных обещаний'],
      active: true
    },
    {
      id: 'excitable',
      name: 'Возбудимый',
      short_desc: 'Импульсивность, вспышки раздражения, тяга к немедленным действиям.',
      tone: 'чёткий, без лишних деталей',
      do: [
        'давать краткие инструкции',
        'фиксировать ближайшие шаги с сроком',
        'встраивать разрядку/движение'
      ],
      avoid: [
        'много текста и теории',
        'долгие ожидания ответа'
      ],
      motivators: ['динамика', 'контроль через действие'],
      red_flags: ['рост агрессии', 'срыв на близких'],
      active: true
    },
    {
      id: 'cyclothymic',
      name: 'Циклотимический',
      short_desc: 'Чередование подъёмов и спадов, вариативность активности и настроения.',
      tone: 'ровный, нормализующий перепады',
      do: [
        'план "на хорошее" и "на спад"',
        'напоминания и авто‑шаги на период спада',
        'встроить гибкость в режим'
      ],
      avoid: [
        'жёсткое расписание без вариантов',
        'оценочные суждения'
      ],
      motivators: ['гибкость', 'осознанность ритмов'],
      red_flags: ['затяжной спад', 'длительная апатия'],
      active: true
    },
    {
      id: 'stuck',
      name: 'Застревающий',
      short_desc: 'Упорство, длительное переживание обид, принципиальность.',
      tone: 'уважительный, фактологичный',
      do: [
        'признавать усилия и сопротивление',
        'переводить в конструктивные рамки ("что под контролем")',
        'чёткие критерии результатов'
      ],
      avoid: [
        'обесценивание устойчивости',
        'резкую смену планов'
      ],
      motivators: ['справедливость', 'завершение', 'консистентность'],
      red_flags: ['обострение конфликтов', 'чрезмерная ригидность'],
      active: true
    },
    {
      id: 'pedantic',
      name: 'Педантичный',
      short_desc: 'Осторожность, ориентация на порядок, склонность сомневаться.',
      tone: 'информативный, структурированный',
      do: [
        'давать детальную информацию',
        'предлагать планы с резервом времени',
        'подтверждать понимание каждого шага'
      ],
      avoid: [
        'неопределённость',
        'резкие изменения'
      ],
      motivators: ['точность', 'порядок', 'предсказуемость'],
      red_flags: ['нарастающая тревога', 'паралич принятия решений'],
      active: true
    },
    {
      id: 'anxious',
      name: 'Тревожный',
      short_desc: 'Склонность к беспокойству, мнительность, избегание рисков.',
      tone: 'успокаивающий, предсказуемый',
      do: [
        'создавать ощущение безопасности',
        'давать чёткие гарантии',
        'предлагать техники релаксации'
      ],
      avoid: [
        'неопределённость',
        'внезапные изменения'
      ],
      motivators: ['безопасность', 'стабильность', 'поддержка'],
      red_flags: ['нарастающая тревога', 'панические атаки'],
      active: true
    },
    {
      id: 'hyperthymic',
      name: 'Гипертимический',
      short_desc: 'Повышенное настроение, активность, оптимизм, стремление к новому.',
      tone: 'энергичный, поддерживающий энтузиазм',
      do: [
        'поддерживать инициативу',
        'направлять энергию в конструктивное русло',
        'помогать с планированием и завершением'
      ],
      avoid: [
        'гасить энтузиазм',
        'жёсткие ограничения'
      ],
      motivators: ['новизна', 'приключения', 'признание'],
      red_flags: ['чрезмерная активность', 'импульсивные решения'],
      active: true
    }
  ];

  const handleEditType = (type) => {
    setEditingType({ ...type });
  };

  const handleSaveType = async (type) => {
    try {
      const response = await fetch(`/api/admin/typology/types/${type.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(type)
      });

      if (response.ok) {
        setTypes(types.map(t => t.id === type.id ? type : t));
        setEditingType(null);
      }
    } catch (error) {
      console.error('Ошибка сохранения психотипа:', error);
      // Для демо просто обновляем локально
      setTypes(types.map(t => t.id === type.id ? type : t));
      setEditingType(null);
    }
  };

  const handleDeleteType = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этот психотип? Это может повлиять на существующие профили.')) return;

    try {
      const response = await fetch(`/api/admin/typology/types/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTypes(types.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Ошибка удаления психотипа:', error);
      // Для демо просто удаляем локально
      setTypes(types.filter(t => t.id !== id));
    }
  };

  const addArrayItem = (field, value) => {
    if (!value.trim()) return;
    
    if (editingType) {
      setEditingType({
        ...editingType,
        [field]: [...(editingType[field] || []), value.trim()]
      });
    } else {
      setNewType({
        ...newType,
        [field]: [...(newType[field] || []), value.trim()]
      });
    }
  };

  const removeArrayItem = (field, index) => {
    if (editingType) {
      setEditingType({
        ...editingType,
        [field]: editingType[field].filter((_, i) => i !== index)
      });
    } else {
      setNewType({
        ...newType,
        [field]: newType[field].filter((_, i) => i !== index)
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Загружаем психотипы...</p>
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
              <h1 className="text-xl font-semibold text-gray-900">Управление психотипами</h1>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Добавить психотип</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Список психотипов */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Психотипы ({types.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {types.map((type) => (
              <div key={type.id} className="p-6">
                {editingType?.id === type.id ? (
                  <div className="space-y-4">
                    {/* Форма редактирования */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ID психотипа
                        </label>
                        <input
                          type="text"
                          value={editingType.id}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Название
                        </label>
                        <input
                          type="text"
                          value={editingType.name}
                          onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Краткое описание
                      </label>
                      <textarea
                        value={editingType.short_desc}
                        onChange={(e) => setEditingType({ ...editingType, short_desc: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Тон коммуникации
                      </label>
                      <input
                        type="text"
                        value={editingType.tone}
                        onChange={(e) => setEditingType({ ...editingType, tone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    {/* Рекомендуемые действия */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Рекомендуемые действия
                      </label>
                      <div className="space-y-2">
                        {editingType.do.map((action, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{action}</span>
                            <button
                              onClick={() => removeArrayItem('do', index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Добавить действие..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addArrayItem('do', e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = e.target.previousElementSibling;
                              addArrayItem('do', input.value);
                              input.value = '';
                            }}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Добавить
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Что избегать */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Что избегать
                      </label>
                      <div className="space-y-2">
                        {editingType.avoid.map((avoid, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{avoid}</span>
                            <button
                              onClick={() => removeArrayItem('avoid', index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Добавить избегаемое действие..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addArrayItem('avoid', e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = e.target.previousElementSibling;
                              addArrayItem('avoid', input.value);
                              input.value = '';
                            }}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Добавить
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Мотиваторы */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Мотиваторы
                      </label>
                      <div className="space-y-2">
                        {editingType.motivators.map((motivator, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{motivator}</span>
                            <button
                              onClick={() => removeArrayItem('motivators', index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Добавить мотиватор..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addArrayItem('motivators', e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = e.target.previousElementSibling;
                              addArrayItem('motivators', input.value);
                              input.value = '';
                            }}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Добавить
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Красные флаги */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Красные флаги
                      </label>
                      <div className="space-y-2">
                        {editingType.red_flags.map((flag, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{flag}</span>
                            <button
                              onClick={() => removeArrayItem('red_flags', index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Добавить красный флаг..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addArrayItem('red_flags', e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = e.target.previousElementSibling;
                              addArrayItem('red_flags', input.value);
                              input.value = '';
                            }}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Добавить
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleSaveType(editingType)}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                      >
                        <CheckIcon className="h-4 w-4" />
                        <span>Сохранить</span>
                      </button>
                      <button
                        onClick={() => setEditingType(null)}
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
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {type.id}
                          </span>
                          <h3 className="text-lg font-medium text-gray-900">{type.name}</h3>
                        </div>
                        <p className="text-gray-600 mb-3">{type.short_desc}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Тон коммуникации:</h4>
                            <p className="text-sm text-gray-600">{type.tone}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Мотиваторы:</h4>
                            <div className="flex flex-wrap gap-1">
                              {type.motivators.map((motivator, index) => (
                                <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                  {motivator}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Рекомендуемые действия */}
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-green-700 mb-2">Рекомендуемые действия:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {type.do.map((action, index) => (
                              <li key={index}>{action}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Что избегать */}
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-red-700 mb-2">Что избегать:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {type.avoid.map((avoid, index) => (
                              <li key={index}>{avoid}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Красные флаги */}
                        <div>
                          <h4 className="text-sm font-medium text-orange-700 mb-2">Красные флаги:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {type.red_flags.map((flag, index) => (
                              <li key={index}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEditType(type)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Редактировать"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteType(type.id)}
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
