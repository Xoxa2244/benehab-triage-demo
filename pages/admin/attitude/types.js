'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function AttitudeTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState({
    id: '',
    name: '',
    description: '',
    communication_challenges: [],
    positive_scenario: [],
    negative_scenario: [],
    extreme_actions: {
      low: '',
      high: ''
    },
    active: true
  });

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const response = await fetch('/api/admin/attitude/types');
      if (response.ok) {
        const data = await response.json();
        setTypes(data.types || []);
      } else {
        // Если API еще не готов, используем демо-данные
        setTypes(getDemoTypes());
      }
    } catch (error) {
      console.error('Ошибка загрузки типов:', error);
      setTypes(getDemoTypes());
    } finally {
      setLoading(false);
    }
  };

  const getDemoTypes = () => [
    {
      id: 'severity',
      name: 'Страдающий',
      description: 'Субъективная оценка тяжести своего заболевания, которая коррелирует с убеждением в неизлечимости и суицидальными мыслями',
      communication_challenges: [
        'Физические страдания',
        'Большой объем жалоб',
        'Плохое самочувствие (подавленность, низкая энергия, раздражительность)'
      ],
      positive_scenario: [
        'Начинать коммуникацию с объяснения того, что будет происходить',
        'Сообщить о готовности выслушать жалобы и назначить все необходимые исследования',
        'Обсудить возможные варианты действий, убедиться что пациент понял и согласен с планом',
        'Побуждать пациента вести дневник симптомов для отслеживания изменений'
      ],
      negative_scenario: [
        'Не обесценивать объем симптомов, даже если они кажутся надуманными и незначительными'
      ],
      extreme_actions: {
        low: 'Низкие значения (0-2): Низкая оценка серьезности заболевания - увеличить частоту взаимодействия на 20%, увеличить количество разъяснительных мероприятий',
        high: 'Высокие значения (10-16): Уверенность в бессмысленности лечения или скрытое желание покончить с собой - направить на консультацию с психотерапевтом'
      },
      active: true
    },
    {
      id: 'secondary_gain',
      name: 'Прагматический',
      description: 'Вторичная выгода заболевания',
      communication_challenges: [
        'Болезнь приносит выгоду пациенту: забота близких, избегание ответственности',
        'Демонстративность симптомов, возможно преувеличение',
        'Средний уровень активности в отношении лечения',
        'Избыточная выгода от болезни может побуждать к избеганию сотрудничества'
      ],
      positive_scenario: [
        'Последовательность и ясность позиции медперсонала',
        'Баланс поддержки и возвращения ответственности пациенту',
        'Побуждать пациента вести дневник симптомов'
      ],
      negative_scenario: [
        'Не давать гипер заботу',
        'Не говорить намеками и двойными посланиями'
      ],
      extreme_actions: {
        low: 'Низкие значения: -',
        high: 'Высокие значения (4-8): Потеря преимущества, которое болезнь предоставляет - направление на консультацию с психотерапевтом'
      },
      active: true
    },
    {
      id: 'hide_resist',
      name: 'Скрывающий',
      description: 'Стремление скрыть свою болезнь и сопротивление болезни',
      communication_challenges: [
        'Слишком низкие значения могут свидетельствовать о недостатке желания бороться с болезнью',
        'Слишком высокие - о чувстве стыда за собственную болезнь',
        'Имеют много страхов, связанных со здоровьем',
        'С трудом идут на диалог, могут пропускать назначенные визиты'
      ],
      positive_scenario: [
        'Валидация проблемы и поддержка',
        'Рассказать об опыте врача в лечении данного заболевания',
        'Рассказать о важности выявления проблем на ранней стадии',
        'Дать время на принятие своей болезни'
      ],
      negative_scenario: [
        'Не давить, когда пациент сопротивляется давать информацию о себе'
      ],
      extreme_actions: {
        low: 'Низкие значения (0-3): Недостаточно упорное стремление к выздоровлению - увеличить частоту взаимодействия на 20%, дать больше поддержки',
        high: 'Высокие значения (8-10): Стремление замаскировать симптомы заболевания - необходимо исследование мотивационной сферы через психотерапию'
      },
      active: true
    },
    {
      id: 'work_escape',
      name: 'Деятельный',
      description: 'Стремление «убежать» в работу или спорт',
      communication_challenges: [
        'Низкий уровень сотрудничества',
        'Неактивен в отношении лечения',
        'Часто испытывает чувство стыда из-за болезни',
        'Работа гораздо важнее здоровья'
      ],
      positive_scenario: [
        'Дозированное приподнесение информации о болезни',
        'Признание важности сохранения соц статуса',
        'Хвалить даже за минимальное выполнение назначений врача',
        'Фокусировка на ценности здоровья как основы сохранения работоспособности'
      ],
      negative_scenario: [
        'Не пытаться доказать пациенту, что он не прав'
      ],
      extreme_actions: {
        low: 'Низкие значения: -',
        high: 'Высокие значения (8-10): Трудоголизм, зависимость от работы - увеличить частоту взаимодействия на 20%, давать больше эмпатии'
      },
      active: true
    },
    {
      id: 'low_selfesteem',
      name: 'Сниженная самооценка',
      description: 'Сниженная самооценка, неудовлетворенность собой, склонность к депрессии',
      communication_challenges: [
        'Склонность к самокритике',
        'Чувство вины',
        'Низкая мотивация',
        'Потребность в психотерапии'
      ],
      positive_scenario: [
        'Использовать базовый сценарий коммуникации',
        'Давать больше поддержки и одобрения',
        'Фокусироваться на маленьких достижениях'
      ],
      negative_scenario: [
        'Избегать критики и сравнений'
      ],
      extreme_actions: {
        low: 'Низкие значения (-2-0): Чрезмерная самоуверенность - увеличить частоту встреч на 20%, чуть больше контроля',
        high: 'Высокие значения (3-6): Дефицит мотивации - увеличить частоту взаимодействия на 20%, дать больше поддержки'
      },
      active: true
    },
    {
      id: 'alt_med',
      name: 'Недоверчивый',
      description: 'Вера в альтернативную медицину и стремление к самолечению',
      communication_challenges: [
        'Низкий уровень сотрудничества',
        'Могут обследоваться, но назначения врача не выполнять',
        'Могут иметь негативный опыт лечения',
        'Очень много информации черпают из интернета'
      ],
      positive_scenario: [
        'Признавать право выбирать способ лечения',
        'Давать дозированную информацию об опыте клиники, врача',
        'Приглашать в совместное составление плана лечения'
      ],
      negative_scenario: [
        'Не критиковать выбор пациента, не называть это эффектом плацебо'
      ],
      extreme_actions: {
        low: 'Низкие значения: -',
        high: 'Высокие значения (6-12): Недоверие к официальной медицине - продолжать работу на выстраивание безопасных отношений'
      },
      active: true
    },
    {
      id: 'addictions',
      name: 'Химические зависимости',
      description: 'Вредные привычки, химические зависимости, аддикции',
      communication_challenges: [
        'Сложности с контролем привычек',
        'Возможное сопротивление лечению',
        'Стыд и чувство вины',
        'Необходимость деликатного подхода'
      ],
      positive_scenario: [
        'Использовать базовый сценарий коммуникации',
        'Поддерживать стремление к здоровому образу жизни',
        'Фокусироваться на позитивных изменениях'
      ],
      negative_scenario: [
        'Избегать осуждения и давления'
      ],
      extreme_actions: {
        low: 'Низкие значения: -',
        high: 'Высокие значения: -'
      },
      active: true
    },
    {
      id: 'ignore',
      name: 'Игнорирующий',
      description: 'Игнорирование болезни и нежелание лечиться',
      communication_challenges: [
        'Не ходят к врачам, пока не станет совсем плохо',
        'Не верят в необходимость лечения',
        'Надеются на самоизлечение',
        'Низкая мотивация к лечению'
      ],
      positive_scenario: [
        'Объяснять важность ранней диагностики',
        'Рассказывать о последствиях игнорирования болезни',
        'Предлагать простые и понятные шаги'
      ],
      negative_scenario: [
        'Не пугать и не давить'
      ],
      extreme_actions: {
        low: 'Низкие значения: -',
        high: 'Высокие значения: -'
      },
      active: true
    },
    {
      id: 'anxiety',
      name: 'Тревожный',
      description: 'Склонность к тревожным расстройствам',
      communication_challenges: [
        'Постоянное беспокойство о здоровье',
        'Частые кошмары о болезни',
        'Трудности с расслаблением',
        'Проблемы с принятием решений'
      ],
      positive_scenario: [
        'Давать четкую и понятную информацию',
        'Предлагать техники релаксации',
        'Создавать ощущение безопасности',
        'Быть предсказуемым и последовательным'
      ],
      negative_scenario: [
        'Избегать неопределенности',
        'Не давать противоречивую информацию'
      ],
      extreme_actions: {
        low: 'Низкие значения: -',
        high: 'Высокие значения: -'
      },
      active: true
    }
  ];

  // Правильные названия типов согласно CSV файлу
  const typeNames = {
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

  const handleEditType = (type) => {
    setEditingType({ ...type });
  };

  const handleSaveType = async (type) => {
    try {
      const response = await fetch(`/api/admin/attitude/types/${type.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(type)
      });

      if (response.ok) {
        setTypes(types.map(t => t.id === type.id ? type : t));
        setEditingType(null);
      }
    } catch (error) {
      console.error('Ошибка сохранения типа:', error);
      // Для демо просто обновляем локально
      setTypes(types.map(t => t.id === type.id ? type : t));
      setEditingType(null);
    }
  };

  const handleDeleteType = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этот тип? Это может повлиять на существующие профили.')) return;

    try {
      const response = await fetch(`/api/admin/attitude/types/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTypes(types.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Ошибка удаления типа:', error);
      // Для демо просто удаляем локально
      setTypes(types.filter(t => t.id !== id));
    }
  };

  const handleAddType = async () => {
    if (!newType.id.trim() || !newType.name.trim()) return;

    const type = {
      ...newType,
      id: newType.id.toLowerCase().replace(/\s+/g, '_')
    };

    try {
      const response = await fetch('/api/admin/attitude/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(type)
      });

      if (response.ok) {
        setTypes([...types, type]);
        setNewType({
          id: '',
          name: '',
          description: '',
          communication_challenges: [],
          positive_scenario: [],
          negative_scenario: [],
          extreme_actions: { low: '', high: '' },
          active: true
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Ошибка добавления типа:', error);
      // Для демо просто добавляем локально
      setTypes([...types, type]);
      setNewType({
        id: '',
        name: '',
        description: '',
        communication_challenges: [],
        positive_scenario: [],
        negative_scenario: [],
        extreme_actions: { low: '', high: '' },
        active: true
      });
      setShowAddForm(false);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Загружаем типы...</p>
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
              <h1 className="text-xl font-semibold text-gray-900">Управление типами - Отношение к болезни</h1>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Добавить тип</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Форма добавления типа */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Добавить новый тип</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID типа (англ., без пробелов)
                  </label>
                  <input
                    type="text"
                    value={newType.id}
                    onChange={(e) => setNewType({ ...newType, id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="например: new_type"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название типа
                  </label>
                  <input
                    type="text"
                    value={newType.name}
                    onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="например: Новый тип"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={newType.description}
                  onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Подробное описание типа..."
                />
              </div>

              {/* Сложности в коммуникации */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сложности в коммуникации
                </label>
                <div className="space-y-2">
                  {newType.communication_challenges.map((challenge, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{challenge}</span>
                      <button
                        onClick={() => removeArrayItem('communication_challenges', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Добавить сложность..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addArrayItem('communication_challenges', e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.target.previousElementSibling;
                        addArrayItem('communication_challenges', input.value);
                        input.value = '';
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Добавить
                    </button>
                  </div>
                </div>
              </div>

              {/* Рекомендуемые действия */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Рекомендуемые действия
                </label>
                <div className="space-y-2">
                  {newType.positive_scenario.map((action, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{action}</span>
                      <button
                        onClick={() => removeArrayItem('positive_scenario', index)}
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addArrayItem('positive_scenario', e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.target.previousElementSibling;
                        addArrayItem('positive_scenario', input.value);
                        input.value = '';
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                  {newType.negative_scenario.map((avoid, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{avoid}</span>
                      <button
                        onClick={() => removeArrayItem('negative_scenario', index)}
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addArrayItem('negative_scenario', e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.target.previousElementSibling;
                        addArrayItem('negative_scenario', input.value);
                        input.value = '';
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Добавить
                    </button>
                  </div>
                </div>
              </div>

              {/* Экстремальные действия */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Действия при низких значениях
                  </label>
                  <textarea
                    value={newType.extreme_actions.low}
                    onChange={(e) => setNewType({
                      ...newType,
                      extreme_actions: { ...newType.extreme_actions, low: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Что делать при низких значениях..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Действия при высоких значениях
                  </label>
                  <textarea
                    value={newType.extreme_actions.high}
                    onChange={(e) => setNewType({
                      ...newType,
                      extreme_actions: { ...newType.extreme_actions, high: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Что делать при высоких значениях..."
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleAddType}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <CheckIcon className="h-5 w-5" />
                  <span>Добавить тип</span>
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

        {/* Список типов */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Типы отношения к болезни ({types.length})
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
                          ID типа
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
                          Название типа
                        </label>
                        <input
                          type="text"
                          value={editingType.name}
                          onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Описание
                      </label>
                      <textarea
                        value={editingType.description}
                        onChange={(e) => setEditingType({ ...editingType, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                      />
                    </div>

                    {/* Сложности в коммуникации */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Сложности в коммуникации
                      </label>
                      <div className="space-y-2">
                        {editingType.communication_challenges.map((challenge, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{challenge}</span>
                            <button
                              onClick={() => removeArrayItem('communication_challenges', index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Добавить сложность..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addArrayItem('communication_challenges', e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = e.target.previousElementSibling;
                              addArrayItem('communication_challenges', input.value);
                              input.value = '';
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Добавить
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Рекомендуемые действия */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Рекомендуемые действия
                      </label>
                      <div className="space-y-2">
                        {editingType.positive_scenario.map((action, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{action}</span>
                            <button
                              onClick={() => removeArrayItem('positive_scenario', index)}
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
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addArrayItem('positive_scenario', e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = e.target.previousElementSibling;
                              addArrayItem('positive_scenario', input.value);
                              input.value = '';
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                        {editingType.negative_scenario.map((avoid, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{avoid}</span>
                            <button
                              onClick={() => removeArrayItem('negative_scenario', index)}
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
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addArrayItem('negative_scenario', e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = e.target.previousElementSibling;
                              addArrayItem('negative_scenario', input.value);
                              input.value = '';
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Добавить
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Экстремальные действия */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Действия при низких значениях
                        </label>
                        <textarea
                          value={editingType.extreme_actions.low}
                          onChange={(e) => setEditingType({
                            ...editingType,
                            extreme_actions: { ...editingType.extreme_actions, low: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={2}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Действия при высоких значениях
                        </label>
                        <textarea
                          value={editingType.extreme_actions.high}
                          onChange={(e) => setEditingType({
                            ...editingType,
                            extreme_actions: { ...editingType.extreme_actions, high: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={2}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleSaveType(editingType)}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
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
                            {typeNames[type.id] || type.id}
                          </span>
                          <h3 className="text-lg font-medium text-gray-900">{type.name}</h3>
                        </div>
                        <p className="text-gray-600 mb-3">{type.description}</p>
                        
                        {/* Сложности в коммуникации */}
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Сложности в коммуникации:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {type.communication_challenges.map((challenge, index) => (
                              <li key={index}>{challenge}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Рекомендуемые действия */}
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-green-700 mb-2">Рекомендуемые действия:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {type.positive_scenario.map((action, index) => (
                              <li key={index}>{action}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Что избегать */}
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-red-700 mb-2">Что избегать:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {type.negative_scenario.map((avoid, index) => (
                              <li key={index}>{avoid}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Экстремальные действия */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-orange-700 mb-2">При низких значениях:</h4>
                            <p className="text-sm text-gray-600">{type.extreme_actions.low}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-orange-700 mb-2">При высоких значениях:</h4>
                            <p className="text-sm text-gray-600">{type.extreme_actions.high}</p>
                          </div>
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
