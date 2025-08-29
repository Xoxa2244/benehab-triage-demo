// Service Worker для Benehab - Push-уведомления

const CACHE_NAME = 'benehab-v1';
const NOTIFICATION_TITLE = 'Напоминание от Benehab';

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker установлен');
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker активирован');
  event.waitUntil(self.clients.claim());
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  console.log('Получено push-уведомление:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Данные уведомления:', data);
      
      const options = {
        body: data.body || 'Не забудьте о назначении',
        tag: data.tag || 'benehab-reminder',
        data: data,
        actions: [
          {
            action: 'done',
            title: 'Выполнил(а)'
          },
          {
            action: 'not_done',
            title: 'Не получилось'
          },
          {
            action: 'mute_current',
            title: 'Отключить это напоминание'
          }
        ],
        requireInteraction: true,
        silent: false
      };

      event.waitUntil(
        self.registration.showNotification(NOTIFICATION_TITLE, options)
      );
    } catch (error) {
      console.error('Ошибка обработки push-уведомления:', error);
      
      // Fallback уведомление
      const options = {
        body: 'Не забудьте о назначении',
        tag: 'benehab-reminder-fallback',
        requireInteraction: true
      };

      event.waitUntil(
        self.registration.showNotification(NOTIFICATION_TITLE, options)
      );
    }
  }
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  console.log('Клик по уведомлению:', event);
  
  event.notification.close();
  
  const data = event.notification.data;
  const action = event.action;
  
  if (action === 'done') {
    // Пользователь отметил как выполненное
    handleAction('done', data);
    openMainPage();
  } else if (action === 'not_done') {
    // Пользователь отметил как не выполненное
    handleAction('not_done', data);
    openMainPage();
  } else if (action === 'mute_current') {
    // Пользователь отключил текущее напоминание
    handleAction('mute_current', data);
    // Не открываем главную страницу для mute
  } else {
    // Клик по самому уведомлению - открываем главную
    openMainPage();
  }
});

// Обработка действий пользователя
async function handleAction(action, data) {
  try {
    console.log(`Обработка действия: ${action}`, data);
    
    if (!data || !data.occurrenceId) {
      console.error('Отсутствует occurrenceId в данных уведомления');
      return;
    }

    let endpoint;
    switch (action) {
      case 'done':
        endpoint = `/api/occurrences/${data.occurrenceId}/markDone`;
        break;
      case 'not_done':
        endpoint = `/api/occurrences/${data.occurrenceId}/markNotDone`;
        break;
      case 'mute_current':
        endpoint = `/api/occurrences/${data.occurrenceId}/muteCurrent`;
        break;
      default:
        console.error('Неизвестное действие:', action);
        return;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        timestamp: new Date().toISOString(),
        ...data
      })
    });

    if (response.ok) {
      console.log(`Действие ${action} успешно обработано`);
      
      // Отправляем сообщение в главное окно для обновления UI
      const clients = await self.clients.matchAll();
      const responseData = await response.json();
      
      clients.forEach(client => {
        client.postMessage({
          type: 'OCCURRENCE_ACTION',
          action,
          occurrenceId: data.occurrenceId,
          data: responseData
        });
      });
    } else {
      console.error(`Ошибка обработки действия ${action}:`, response.status);
    }
  } catch (error) {
    console.error(`Ошибка обработки действия ${action}:`, error);
  }
}

// Открытие главной страницы
function openMainPage() {
  const mainUrl = 'https://benehab-triage-demo.vercel.app/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Ищем уже открытое окно
      for (let client of clients) {
        if (client.url.includes('benehab-triage-demo') && 'focus' in client) {
          client.focus();
          return;
        }
      }
      
      // Если окно не найдено, открываем новое
      if (self.clients.openWindow) {
        return self.clients.openWindow(mainUrl);
      }
    })
  );
}

// Обработка сообщений от главной страницы
self.addEventListener('message', (event) => {
  console.log('Service Worker получил сообщение:', event.data);
  
  if (event.data.type === 'REGISTER_PUSH') {
    // Регистрация push-подписки
    handlePushRegistration(event.data);
  }
});

// Обработка регистрации push-подписки
async function handlePushRegistration(data) {
  try {
    console.log('Регистрация push-подписки:', data);
    
    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data.subscription)
    });

    if (response.ok) {
      console.log('Push-подписка успешно зарегистрирована');
      
      // Отправляем подтверждение в главное окно
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'PUSH_REGISTRATION_SUCCESS',
          subscription: data.subscription
        });
      });
    } else {
      console.error('Ошибка регистрации push-подписки:', response.status);
      
      // Отправляем ошибку в главное окно
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'PUSH_REGISTRATION_ERROR',
          error: 'Ошибка регистрации подписки'
        });
      });
    }
  } catch (error) {
    console.error('Ошибка регистрации push-подписки:', error);
    
    // Отправляем ошибку в главное окно
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'PUSH_REGISTRATION_ERROR',
        error: error.message
      });
    });
  }
}

// Обработка ошибок
self.addEventListener('error', (event) => {
  console.error('Service Worker ошибка:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker необработанное отклонение:', event.reason);
});
