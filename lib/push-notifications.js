// Утилита для работы с push-уведомлениями

// VAPID ключи (в демо-режиме используем заглушки)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa1HI0Z-NZcvtVq2kfKjEFKvdkJDIBFUCQoTfGa7u2XBAKN-WWd1W01sfFjId0';

// Конвертация VAPID ключа в Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Проверка поддержки push-уведомлений
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Проверка разрешения на уведомления
export function getNotificationPermission() {
  if (!('Notification' in window)) {
    return 'not-supported';
  }
  return Notification.permission;
}

// Запрос разрешения на уведомления
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('Уведомления не поддерживаются в этом браузере');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// Регистрация Service Worker
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker не поддерживается в этом браузере');
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker зарегистрирован:', registration);
    return registration;
  } catch (error) {
    console.error('Ошибка регистрации Service Worker:', error);
    throw error;
  }
}

// Создание push-подписки
export async function createPushSubscription(registration) {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('Push-подписка создана:', subscription);
    return subscription;
  } catch (error) {
    console.error('Ошибка создания push-подписки:', error);
    throw error;
  }
}

// Регистрация push-подписки на сервере
export async function registerPushSubscription(subscription) {
  try {
    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
        auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Подписка зарегистрирована на сервере:', result);
    return result;
  } catch (error) {
    console.error('Ошибка регистрации подписки на сервере:', error);
    throw error;
  }
}

// Полная инициализация push-уведомлений
export async function initializePushNotifications() {
  try {
    // Проверяем поддержку
    if (!isPushSupported()) {
      throw new Error('Push-уведомления не поддерживаются в этом браузере');
    }

    // Проверяем разрешение
    let permission = getNotificationPermission();
    if (permission === 'default') {
      permission = await requestNotificationPermission();
    }

    if (permission !== 'granted') {
      throw new Error('Разрешение на уведомления не получено');
    }

    // Регистрируем Service Worker
    const registration = await registerServiceWorker();

    // Создаем push-подписку
    const subscription = await createPushSubscription(registration);

    // Регистрируем на сервере
    await registerPushSubscription(subscription);

    // Сохраняем подписку в localStorage
    localStorage.setItem('benehab_push_subscription', JSON.stringify({
      endpoint: subscription.endpoint,
      p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
      auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
    }));

    return {
      success: true,
      subscription,
      message: 'Push-уведомления успешно настроены'
    };
  } catch (error) {
    console.error('Ошибка инициализации push-уведомлений:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Отправка тестового уведомления
export async function sendTestNotification() {
  try {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker не зарегистрирован');
    }

    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification('Тестовое уведомление', {
      body: 'Это тестовое уведомление от Benehab',
      tag: 'test-notification',
      requireInteraction: true
    });

    return { success: true, message: 'Тестовое уведомление отправлено' };
  } catch (error) {
    console.error('Ошибка отправки тестового уведомления:', error);
    return { success: false, error: error.message };
  }
}

// Проверка статуса push-уведомлений
export function getPushNotificationStatus() {
  const subscription = localStorage.getItem('benehab_push_subscription');
  const permission = getNotificationPermission();
  
  return {
    supported: isPushSupported(),
    permission,
    subscribed: !!subscription,
    subscription: subscription ? JSON.parse(subscription) : null
  };
}

// Отписка от push-уведомлений
export async function unsubscribeFromPushNotifications() {
  try {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker не зарегистрирован');
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('Отписаны от push-уведомлений');
    }

    // Удаляем из localStorage
    localStorage.removeItem('benehab_push_subscription');

    return { success: true, message: 'Отписаны от push-уведомлений' };
  } catch (error) {
    console.error('Ошибка отписки от push-уведомлений:', error);
    return { success: false, error: error.message };
  }
}
