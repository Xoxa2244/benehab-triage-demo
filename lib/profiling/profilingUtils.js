// lib/profiling/profilingUtils.js

/**
 * Проверяет, завершены ли все три психологических теста
 * @returns {boolean} true если все тесты пройдены
 */
export function areAllTestsCompleted() {
  if (typeof window === 'undefined') return false;
  
  const attitudeProfile = localStorage.getItem('benehab_attitude_profile');
  const typologyProfile = localStorage.getItem('benehab_typology_profile');
  const valuesProfile = localStorage.getItem('benehab_values_profile');
  
  return !!(attitudeProfile && typologyProfile && valuesProfile);
}

/**
 * Получает результаты всех тестов из localStorage
 * @returns {Object|null} Объект с результатами всех тестов или null
 */
export function getAllTestResults() {
  if (typeof window === 'undefined') return null;
  
  try {
    const attitudeProfile = localStorage.getItem('benehab_attitude_profile');
    const typologyProfile = localStorage.getItem('benehab_typology_profile');
    const valuesProfile = localStorage.getItem('benehab_values_profile');
    
    if (!attitudeProfile || !typologyProfile || !valuesProfile) {
      return null;
    }
    
    return {
      attitude: JSON.parse(attitudeProfile),
      typology: JSON.parse(typologyProfile),
      values: JSON.parse(valuesProfile)
    };
  } catch (error) {
    console.error('Error parsing test results:', error);
    return null;
  }
}

/**
 * Маппинг результатов Attitude теста в теги IssueType
 * @param {Object} attitudeProfile - профиль из теста Attitude
 * @returns {Array<string>} массив тегов IssueType
 */
function mapAttitudeToIssueTags(attitudeProfile) {
  const tags = [];
  
  if (!attitudeProfile || !attitudeProfile.levels) {
    return tags;
  }
  
  const { levels } = attitudeProfile;
  
  // Маппинг шкал Attitude на IssueType из profiling_schemas.py
  const mapping = {
    'severity': 'HEAVY_STATE',           // Восприятие своего состояния как тяжелого
    'secondary_gain': 'SECONDARY_GAIN',  // Вторичная выгода заболевания
    'hide_resist': 'HIDING_ILLNESS',     // Стремление скрыть свою болезнь
    'work_escape': 'ESCAPE_ACTIVITY',    // Стремление «убежать» в работу или спорт
    'low_selfesteem': 'LOW_SELF_ESTEEM', // Сниженная самооценка
    'alt_med': 'ALT_MEDICINE',           // Вера в альтернативную медицину
    'addictions': 'ADDICTIONS',          // Вредные привычки, химические зависимости
    'ignore': 'IGNORING_ILLNESS',        // Игнорирование болезни
    'anxiety': 'ANXIETY'                 // Склонность к тревожным расстройствам
  };
  
  // Добавляем теги для высоких уровней (high)
  Object.entries(levels).forEach(([scale, level]) => {
    if (level === 'high' && mapping[scale]) {
      tags.push(mapping[scale]);
    }
  });
  
  return tags;
}

/**
 * Маппинг результатов Typology теста в теги PatientType
 * @param {Object} typologyProfile - профиль из теста Typology
 * @returns {Array<string>} массив тегов PatientType
 */
function mapTypologyToPatientTags(typologyProfile) {
  const tags = [];
  
  if (!typologyProfile || !typologyProfile.leading_types) {
    return tags;
  }
  
  const { leading_types } = typologyProfile;
  
  // Маппинг типов личности на PatientType из profiling_schemas.py
  const mapping = {
    'sensitive': 'SENSITIVE',       // Сензитивный
    'dysthymic': 'DISTIMIC',       // Дистимический
    'demonstrative': 'DEMONSTRATIVE', // Демонстративный
    'excitable': 'EXCITABLE',       // Возбудимый
    'cyclothymic': 'CYCLOTHYMIC',   // Циклотимический
    'stuck': 'RUMINATIVE',          // Застревающий
    'pedantic': 'PEDANTIC',         // Педантичный
    'anxious': 'CLOSED',            // Замкнутый (anxious -> CLOSED)
    'hyperthymic': 'HYPERTIMIC',    // Гипертимный
    'unaccentuated': 'CLOSED'       // Неакцентуированный -> по умолчанию CLOSED
  };
  
  // Добавляем теги для ведущих типов
  leading_types.forEach(type => {
    if (mapping[type]) {
      tags.push(mapping[type]);
    }
  });
  
  // Если нет ведущих типов, добавляем CLOSED как дефолт
  if (tags.length === 0) {
    tags.push('CLOSED');
  }
  
  return tags;
}

/**
 * Маппинг результатов Values теста в дополнительные теги
 * @param {Object} valuesProfile - профиль из теста Values
 * @returns {Array<string>} массив дополнительных тегов
 */
function mapValuesToAdditionalTags(valuesProfile) {
  const tags = [];
  
  if (!valuesProfile || !valuesProfile.value_indices) {
    return tags;
  }
  
  const { value_indices } = valuesProfile;
  
  // Анализируем индексы и добавляем соответствующие теги
  // Низкая удовлетворенность жизнью может указывать на тревожность
  if (value_indices.life_satisfaction && value_indices.life_satisfaction < 40) {
    tags.push('ANXIETY');
  }
  
  // Низкое отношение к лечению может указывать на игнорирование болезни
  if (value_indices.treatment_attitude && value_indices.treatment_attitude < 40) {
    tags.push('IGNORING_ILLNESS');
  }
  
  // Высокое отношение к смерти может указывать на тяжелое состояние
  if (value_indices.death_attitude && value_indices.death_attitude > 60) {
    tags.push('HEAVY_STATE');
  }
  
  return tags;
}

/**
 * Преобразует результаты всех тестов в теги для бэкенда
 * @param {Object} testResults - результаты всех тестов
 * @returns {Array<string>} массив уникальных тегов для patient_tags
 */
export function mapTestResultsToTags(testResults) {
  if (!testResults) {
    return [];
  }
  
  const allTags = [];
  
  // Маппинг Attitude -> IssueType теги
  if (testResults.attitude) {
    const issueTags = mapAttitudeToIssueTags(testResults.attitude);
    allTags.push(...issueTags);
  }
  
  // Маппинг Typology -> PatientType теги
  if (testResults.typology) {
    const patientTags = mapTypologyToPatientTags(testResults.typology);
    allTags.push(...patientTags);
  }
  
  // Маппинг Values -> дополнительные теги
  if (testResults.values) {
    const additionalTags = mapValuesToAdditionalTags(testResults.values);
    allTags.push(...additionalTags);
  }
  
  // Удаляем дубликаты и возвращаем
  return [...new Set(allTags)];
}

/**
 * Проверяет, был ли уже создан чат для текущего пользователя
 * @returns {boolean} true если чат уже создан
 */
export function isChatCreated() {
  if (typeof window === 'undefined') return false;
  
  const chatId = localStorage.getItem('benehab_chat_id');
  return !!chatId;
}

/**
 * Сохраняет ID созданного чата
 * @param {string} chatId - ID чата
 */
export function saveChatId(chatId) {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('benehab_chat_id', chatId);
}

/**
 * Получает ID чата из localStorage
 * @returns {string|null} ID чата или null
 */
export function getChatId() {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('benehab_chat_id');
}

/**
 * Очищает все данные профилирования и чата
 */
export function clearAllProfilingData() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('benehab_attitude_profile');
  localStorage.removeItem('benehab_typology_profile');
  localStorage.removeItem('benehab_values_profile');
  localStorage.removeItem('benehab_chat_id');
  localStorage.removeItem('benehab_demographics');
}