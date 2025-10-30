// lib/profiling/chatInitializer.js

import { getAllTestResults, mapTestResultsToTags, saveChatId } from './profilingUtils';

/**
 * Инициализирует чат на FastAPI бэкенде с тегами из результатов тестов
 * @param {string} diagnosis - диагноз пациента
 * @param {string} prescriptions - назначения врача
 * @returns {Promise<Object>} данные созданного чата
 */
export async function initializeChatWithProfiling(diagnosis, prescriptions) {
  try {
    // Получаем результаты всех тестов из localStorage
    const testResults = getAllTestResults();
    
    if (!testResults) {
      throw new Error('Не все тесты пройдены. Необходимо завершить все три теста.');
    }

    // Маппинг результатов тестов в теги
    const patientTags = mapTestResultsToTags(testResults);

    if (patientTags.length === 0) {
      throw new Error('Не удалось сгенерировать теги из результатов тестов');
    }

    console.log('🏷️ Сгенерированные теги для пациента:', patientTags);

    // Получаем URL бэкенда из переменных окружения
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    // Вызываем FastAPI endpoint для создания чата
    const response = await fetch(`${backendUrl}/api/chats/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        diagnosis,
        prescriptions,
        patient_tags: patientTags
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Ошибка при создании чата на бэкенде');
    }

    const chatData = await response.json();

    console.log('✅ Чат успешно создан:', chatData.chat_id);

    // Сохраняем ID чата в localStorage
    saveChatId(chatData.chat_id);

    return chatData;

  } catch (error) {
    console.error('❌ Ошибка при инициализации чата:', error);
    throw error;
  }
}

/**
 * Отправляет сообщение в чат через FastAPI бэкенд
 * @param {string} chatId - ID чата
 * @param {string} message - сообщение от пациента
 * @returns {Promise<Object>} ответ медсестры
 */
export async function sendMessageToChat(chatId, message) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    const response = await fetch(`${backendUrl}/api/chats/${chatId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Ошибка при отправке сообщения');
    }

    const responseData = await response.json();
    return responseData;

  } catch (error) {
    console.error('❌ Ошибка при отправке сообщения:', error);
    throw error;
  }
}

/**
 * Получает данные чата с FastAPI бэкенда
 * @param {string} chatId - ID чата
 * @returns {Promise<Object>} данные чата
 */
export async function getChatData(chatId) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    const response = await fetch(`${backendUrl}/api/chats/${chatId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Ошибка при получении данных чата');
    }

    const chatData = await response.json();
    return chatData;

  } catch (error) {
    console.error('❌ Ошибка при получении данных чата:', error);
    throw error;
  }
}