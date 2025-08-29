import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  initializePushNotifications, 
  getPushNotificationStatus, 
  sendTestNotification,
  unsubscribeFromPushNotifications 
} from '../lib/push-notifications';

// Типы назначений
const ASSIGNMENT_TYPES = [
  { value: 'назначение', label: 'Назначение', icon: '🏥' },
  { value: 'прием препарата', label: 'Прием препарата', icon: '💊' },
  { value: 'использование носимого устройства', label: 'Носимое устройство', icon: '⌚' }
];

// Варианты уведомлений
const NOTIFICATION_OPTIONS = [
  { value: 'OFF', label: 'Нет' },
  { value: 'PT0M', label: 'В момент' },
  { value: 'PT1M', label: 'За 1 минуту' },
  { value: 'PT3M', label: 'За 3 минуты' }
];

// Пост-уведомления
const POST_NOTIFICATION_OPTIONS = [
  { value: 'OFF', label: 'Выкл' },
  { value: 'PT1M', label: 'Каждую 1 минуту после' },
  { value: 'PT3M', label: 'Каждые 3 минуты после' }
];

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    type: 'прием препарата',
    title: '',
    description: '',
    scheduledAt: '',
    notif1: 'PT3M',
    notif2: 'PT1M',
    postInterval: 'PT3M'
  });
  const [showForm, setShowForm] = useState(false);
  const [occurrences, setOccurrences] = useState([]);
  const [pushStatus, setPushStatus] = useState(null);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    loadAssignments();
    loadOccurrences();
    loadPushStatus();
  }, []);

  const loadAssignments = () => {
    try {
      const saved = localStorage.getItem('benehab_assignments');
      if (saved) {
        setAssignments(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Ошибка загрузки назначений:', error);
    }
  };

  const loadOccurrences = () => {
    try {
      const saved = localStorage.getItem('benehab_occurrences');
      if (saved) {
        setOccurrences(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
    }
  };

  const loadPushStatus = () => {
    const status = getPushNotificationStatus();
    setPushStatus(status);
  };

  const saveAssignments = (newAssignments) => {
    try {
      localStorage.setItem('benehab_assignments', JSON.stringify(newAssignments));
      setAssignments(newAssignments);
    } catch (error) {
      console.error('Ошибка сохранения назначений:', error);
    }
  };

  const saveOccurrences = (newOccurrences) => {
    try {
      localStorage.setItem('benehab_occurrences', JSON.stringify(newOccurrences));
      setOccurrences(newOccurrences);
    } catch (error) {
      console.error('Ошибка сохранения событий:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.scheduledAt) {
      alert('Заполните обязательные поля: Название и Дата/Время');
      return;
    }

    const newAssignment = {
      id: editingId || `assignment_${Date.now()}`,
      type: formData.type,
      title: formData.title.trim(),
      description: formData.description.trim(),
      scheduledAt: formData.scheduledAt,
      notif1: formData.notif1,
      notif2: formData.notif2,
      postInterval: formData.postInterval,
      createdAt: editingId ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let newAssignments;
    if (editingId) {
      newAssignments = assignments.map(a => a.id === editingId ? newAssignment : a);
    } else {
      newAssignments = [...assignments, newAssignment];
    }

    saveAssignments(newAssignments);
    
    // Создаем occurrence для нового назначения
    if (!editingId) {
      createOccurrence(newAssignment);
    }

    resetForm();
  };

  const createOccurrence = (assignment) => {
    const occurrence = {
      id: `occurrence_${Date.now()}`,
      assignmentId: assignment.id,
      scheduledAt: assignment.scheduledAt,
      notif1At: calculateNotificationTime(assignment.scheduledAt, assignment.notif1),
      notif2At: calculateNotificationTime(assignment.scheduledAt, assignment.notif2),
      postInterval: assignment.postInterval,
      nextPostAt: assignment.postInterval !== 'OFF' ? 
        new Date(new Date(assignment.scheduledAt).getTime() + 1 * 60 * 1000).toISOString() : null,
      mutedUntilNext: false,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newOccurrences = [...occurrences, occurrence];
    saveOccurrences(newOccurrences);
  };

  const calculateNotificationTime = (scheduledAt, offset) => {
    if (offset === 'OFF') return null;
    
    const scheduled = new Date(scheduledAt);
    const minutes = parseInt(offset.replace('PT', '').replace('M', ''));
    return new Date(scheduled.getTime() - minutes * 60 * 1000).toISOString();
  };

  const resetForm = () => {
    setFormData({
      type: 'прием препарата',
      title: '',
      description: '',
      scheduledAt: '',
      notif1: 'PT3M',
      notif2: 'PT1M',
      postInterval: 'PT3M'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const editAssignment = (assignment) => {
    setFormData({
      type: assignment.type,
      title: assignment.title,
      description: assignment.description || '',
      scheduledAt: assignment.scheduledAt,
      notif1: assignment.notif1,
      notif2: assignment.notif2,
      postInterval: assignment.postInterval
    });
    setEditingId(assignment.id);
    setShowForm(true);
  };

  const deleteAssignment = (id) => {
    if (confirm('Удалить это назначение?')) {
      const newAssignments = assignments.filter(a => a.id !== id);
      saveAssignments(newAssignments);
      
      // Удаляем связанные occurrences
      const newOccurrences = occurrences.filter(o => o.assignmentId !== id);
      saveOccurrences(newOccurrences);
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DONE': return '✅';
      case 'NOT_DONE': return '❌';
      case 'PENDING': return '⏳';
      default: return '—';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'DONE': return 'Выполнено';
      case 'NOT_DONE': return 'Не выполнено';
      case 'PENDING': return 'Ожидает';
      default: return 'Нет ответа';
    }
  };

  const getTypeIcon = (type) => {
    const typeObj = ASSIGNMENT_TYPES.find(t => t.value === type);
    return typeObj ? typeObj.icon : '📋';
  };

  const handleInitializePush = async () => {
    setPushLoading(true);
    try {
      const result = await initializePushNotifications();
      if (result.success) {
        alert('✅ ' + result.message);
        loadPushStatus();
      } else {
        alert('❌ ' + result.error);
      }
    } catch (error) {
      alert('❌ Ошибка: ' + error.message);
    } finally {
      setPushLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      const result = await sendTestNotification();
      if (result.success) {
        alert('✅ ' + result.message);
      } else {
        alert('❌ ' + result.error);
      }
    } catch (error) {
      alert('❌ Ошибка: ' + error.message);
    }
  };

  const handleUnsubscribe = async () => {
    if (confirm('Отписаться от push-уведомлений?')) {
      try {
        const result = await unsubscribeFromPushNotifications();
        if (result.success) {
          alert('✅ ' + result.message);
          loadPushStatus();
        } else {
          alert('❌ ' + result.error);
        }
      } catch (error) {
        alert('❌ Ошибка: ' + error.message);
      }
    }
  };

  const checkNotifications = async () => {
    try {
      const result = await getPushNotificationStatus();
      alert('✅ Текущий статус уведомлений:\n' +
            `Поддержка: ${result.supported ? '✅' : '❌'}\n` +
            `Разрешение: ${result.permission}\n` +
            `Подписка: ${result.subscribed ? '✅' : '❌'}`);
    } catch (error) {
      alert('❌ Ошибка при проверке уведомлений: ' + error.message);
    }
  };

  return (
    <>
      <Head>
        <title>Назначения - Benehab</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Заголовок */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="mr-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Б</span>
                  </div>
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">Назначения</h1>
              </div>
              
              <Link 
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ← На главную
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Push-уведомления */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">🔔 Push-уведомления</h2>
            
            {pushStatus && (
              <div className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${pushStatus.supported ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Поддержка: {pushStatus.supported ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${
                      pushStatus.permission === 'granted' ? 'bg-green-500' : 
                      pushStatus.permission === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></span>
                    <span>Разрешение: {pushStatus.permission}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${pushStatus.subscribed ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    <span>Подписка: {pushStatus.subscribed ? '✅' : '❌'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {!pushStatus?.subscribed ? (
                <button
                  onClick={handleInitializePush}
                  disabled={pushLoading || !pushStatus?.supported}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {pushLoading ? '⏳ Настройка...' : '🔔 Включить уведомления'}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleTestNotification}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    🧪 Тестовое уведомление
                  </button>
                  <button
                    onClick={checkNotifications}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    🔍 Проверить уведомления
                  </button>
                  <button
                    onClick={handleUnsubscribe}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    🔕 Отключить уведомления
                  </button>
                </>
              )}
            </div>

            {pushStatus?.permission === 'denied' && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Разрешение на уведомления отклонено. Включите их в настройках браузера.
                </p>
              </div>
            )}
          </div>

          {/* Кнопка добавления */}
          <div className="mb-6">
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              ➕ Добавить назначение
            </button>
          </div>

          {/* Форма добавления/редактирования */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">
                {editingId ? 'Редактировать назначение' : 'Новое назначение'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Тип */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Тип *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {ASSIGNMENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Название */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Название *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Например: Ибупрофен 200 мг"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Описание */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Дополнительная информация о назначении..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Дата/Время */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата и время *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Уведомления */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Уведомление 1
                    </label>
                    <select
                      value={formData.notif1}
                      onChange={(e) => setFormData({...formData, notif1: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {NOTIFICATION_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Уведомление 2
                    </label>
                    <select
                      value={formData.notif2}
                      onChange={(e) => setFormData({...formData, notif2: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {NOTIFICATION_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Пост-уведомления
                    </label>
                    <select
                      value={formData.postInterval}
                      onChange={(e) => setFormData({...formData, postInterval: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {POST_NOTIFICATION_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Кнопки */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingId ? 'Сохранить' : 'Добавить'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Отмена
                  </button>
                  
                  {!editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        handleSubmit({ preventDefault: () => {} });
                        setFormData({
                          type: 'прием препарата',
                          title: '',
                          description: '',
                          scheduledAt: '',
                          notif1: 'PT3M',
                          notif2: 'PT1M',
                          postInterval: 'PT3M'
                        });
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Добавить ещё
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Список назначений */}
          {assignments.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Ваши назначения</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Тип</th>
                      <th className="text-left py-3 px-4">Название</th>
                      <th className="text-left py-3 px-4">Время</th>
                      <th className="text-left py-3 px-4">Увед.1</th>
                      <th className="text-left py-3 px-4">Увед.2</th>
                      <th className="text-left py-3 px-4">Пост</th>
                      <th className="text-left py-3 px-4">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => (
                      <tr 
                        key={assignment.id} 
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => editAssignment(assignment)}
                      >
                        <td className="py-3 px-4">
                          <span className="text-xl mr-2">{getTypeIcon(assignment.type)}</span>
                          {ASSIGNMENT_TYPES.find(t => t.value === assignment.type)?.label}
                        </td>
                        <td className="py-3 px-4 font-medium">{assignment.title}</td>
                        <td className="py-3 px-4">{formatDateTime(assignment.scheduledAt)}</td>
                        <td className="py-3 px-4">
                          {NOTIFICATION_OPTIONS.find(o => o.value === assignment.notif1)?.label}
                        </td>
                        <td className="py-3 px-4">
                          {NOTIFICATION_OPTIONS.find(o => o.value === assignment.notif2)?.label}
                        </td>
                        <td className="py-3 px-4">
                          {POST_NOTIFICATION_OPTIONS.find(o => o.value === assignment.postInterval)?.label}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                editAssignment(assignment);
                              }}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAssignment(assignment.id);
                              }}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Статистика выполнения */}
          {occurrences.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Статистика выполнения</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Назначение</th>
                      <th className="text-left py-3 px-4">Время (план)</th>
                      <th className="text-left py-3 px-4">Статус</th>
                      <th className="text-left py-3 px-4">Последнее уведомление</th>
                    </tr>
                  </thead>
                  <tbody>
                    {occurrences.map((occurrence) => {
                      const assignment = assignments.find(a => a.id === occurrence.assignmentId);
                      return (
                        <tr key={occurrence.id} className="border-b border-gray-100">
                          <td className="py-3 px-4">
                            {assignment ? (
                              <div>
                                <div className="font-medium">{assignment.title}</div>
                                <div className="text-sm text-gray-500">{assignment.type}</div>
                              </div>
                            ) : 'Неизвестно'
                            }
                          </td>
                          <td className="py-3 px-4">{formatDateTime(occurrence.scheduledAt)}</td>
                          <td className="py-3 px-4">
                            <span className="text-lg mr-2">{getStatusIcon(occurrence.status)}</span>
                            {getStatusLabel(occurrence.status)}
                          </td>
                          <td className="py-3 px-4">
                            {occurrence.lastNotifiedAt ? 
                              formatDateTime(occurrence.lastNotifiedAt) : 
                              'Не уведомляли'
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Пустое состояние */}
          {assignments.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет назначений</h3>
              <p className="text-gray-600 mb-4">
                Создайте первое назначение, чтобы начать получать напоминания
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Создать назначение
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
