# Preparation Guide: Admin UI for Benehab Psychosemantics

## 📋 Обзор

Этот документ описывает пошаговую подготовку инфраструктуры для реализации админ-панели психосемантического модуля Benehab. Перед началом реализации необходимо выполнить все шаги из этого руководства.

---

## 1. Инфраструктура и окружение

### 1.1 Существующая инфраструктура
- ✅ **Next.js 13.5.6** (Pages Router)
- ✅ **React 18.2.0**
- ✅ **TailwindCSS 3.4.10**
- ✅ **Node.js >= 18.0.0**
- ✅ **Vercel** (деплой)

### 1.2 Необходимые дополнения

#### 1.2.1 База данных: Supabase
**Что нужно:**
- Создать проект Supabase
- Получить URL проекта и API ключи
- Настроить PostgreSQL базу данных

**Шаги:**
1. Зарегистрироваться на https://supabase.com
2. Создать новый проект (или использовать существующий)
3. Перейти в Settings → API
4. Сохранить:
   - `Project URL` (например: `https://xxxxx.supabase.co`)
   - `anon/public` key
   - `service_role` key (для серверных операций)

**Переменные окружения:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 1.2.2 Установка зависимостей
**Необходимые npm пакеты:**
```bash
npm install @supabase/supabase-js
npm install @supabase/ssr  # Для SSR поддержки (опционально)
npm install react-hot-toast  # Для уведомлений
npm install react-window react-window-infinite-loader  # Для виртуализации таблиц (опционально)
npm install recharts  # Для графиков на debug странице
npm install lodash  # Для утилит (debounce и т.д.)
npm install uuid  # Для генерации UUID
npm install --save-dev @types/uuid  # TypeScript типы (если используется TS)
```

**Обновить package.json:**
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0",
    "react-hot-toast": "^2.4.1",
    "react-window": "^1.8.10",
    "recharts": "^2.10.3",
    "lodash": "^4.17.21",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.6",
    "@types/lodash": "^4.14.202"
  }
}
```

#### 1.2.3 Настройка переменных окружения
**Создать `.env.local` (если еще не создан):**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Существующие переменные
OPENAI_API_KEY=your_openai_key

# Admin Authentication (см. раздел 2)
ADMIN_SECRET_KEY=your_secret_admin_key_here
```

**Важно:**
- `.env.local` уже должен быть в `.gitignore`
- Для Vercel: добавить переменные в Settings → Environment Variables
- Не коммитить ключи в репозиторий

---

## 2. Аутентификация и доступ

### 2.1 Варианты аутентификации

#### Вариант A: Простая аутентификация через секретный ключ (рекомендуется для MVP)
**Реализация:**
- Создать страницу `/admin/login`
- Хранить секретный ключ в `.env.local` как `ADMIN_SECRET_KEY`
- При успешной авторизации сохранять токен в `sessionStorage` или `httpOnly` cookie
- Middleware для защиты всех `/admin/*` маршрутов

**Преимущества:**
- Простота реализации
- Не требует дополнительных сервисов
- Быстро для MVP

**Недостатки:**
- Менее безопасно для продакшена
- Нет управления пользователями

#### Вариант B: Supabase Auth (для продакшена)
**Реализация:**
- Использовать встроенную аутентификацию Supabase
- Создать таблицу `admin_users` для ролей
- Row Level Security (RLS) политики

**Преимущества:**
- Безопасно
- Масштабируемо
- Управление пользователями

**Недостатки:**
- Сложнее в реализации
- Требует настройки RLS

### 2.2 Рекомендация для начала
**Использовать Вариант A** для быстрого старта, затем мигрировать на Вариант B.

### 2.3 Структура файлов для аутентификации
```
lib/
  auth/
    adminAuth.js          # Логика проверки токена
    middleware.js          # Next.js middleware
pages/
  admin/
    login.js              # Страница входа
    _middleware.js        # Защита маршрутов
```

### 2.4 Middleware для защиты маршрутов
**Создать `pages/admin/_middleware.js`:**
```javascript
export function middleware(request) {
  // Проверка наличия токена
  // Редирект на /admin/login если нет токена
}
```

---

## 3. База данных и миграции

### 3.1 Структура базы данных

#### 3.1.1 Создание таблиц в Supabase

**Шаг 1: Подключиться к Supabase Dashboard**
- Перейти в SQL Editor
- Создать новую миграцию

**Шаг 2: Выполнить SQL миграции**

```sql
-- 1. Создание enum для статуса метрики
CREATE TYPE metric_status AS ENUM ('draft', 'published');

-- 2. Таблица concepts
CREATE TABLE concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Таблица rank_config
CREATE TABLE rank_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  M INTEGER NOT NULL CHECK (M >= 2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Инициализация rank_config
INSERT INTO rank_config (id, M) VALUES (1, 5) ON CONFLICT (id) DO NOTHING;

-- 4. Таблица metrics
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  status metric_status NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Таблица metric_weights_same
CREATE TABLE metric_weights_same (
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  i_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  j_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  value REAL NOT NULL DEFAULT 0 CHECK (value >= -1 AND value <= 1),
  CONSTRAINT same_weights_pk PRIMARY KEY (metric_id, i_concept_id, j_concept_id),
  CONSTRAINT same_weights_order CHECK (i_concept_id < j_concept_id)
);

-- 6. Таблица metric_weights_diff
CREATE TABLE metric_weights_diff (
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  i_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  j_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  value REAL NOT NULL DEFAULT 0 CHECK (value >= -1 AND value <= 1),
  CONSTRAINT diff_weights_pk PRIMARY KEY (metric_id, i_concept_id, j_concept_id),
  CONSTRAINT diff_weights_order CHECK (i_concept_id < j_concept_id)
);

-- 7. Таблица metric_weights_rank
CREATE TABLE metric_weights_rank (
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL CHECK (rank >= 1),
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  value REAL NOT NULL DEFAULT 0 CHECK (value >= -1 AND value <= 1),
  CONSTRAINT rank_weights_pk PRIMARY KEY (metric_id, rank, concept_id)
);

-- 8. Таблица admin_settings
CREATE TABLE admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  self_concept_id UUID REFERENCES concepts(id) ON DELETE SET NULL,
  ideal_concept_id UUID REFERENCES concepts(id) ON DELETE SET NULL,
  positive_anchors UUID[] DEFAULT '{}',
  negative_anchors UUID[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Инициализация admin_settings
INSERT INTO admin_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 9. Таблица metric_audit (история изменений)
CREATE TABLE metric_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  actor TEXT,
  change JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Индексы для производительности
CREATE INDEX idx_metric_weights_same_metric ON metric_weights_same(metric_id);
CREATE INDEX idx_metric_weights_diff_metric ON metric_weights_diff(metric_id);
CREATE INDEX idx_metric_weights_rank_metric ON metric_weights_rank(metric_id);
CREATE INDEX idx_metrics_status ON metrics(status);
CREATE INDEX idx_metric_audit_metric ON metric_audit(metric_id);
```

#### 3.1.2 Row Level Security (RLS)
**Включить RLS для всех таблиц:**
```sql
-- Включить RLS
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_weights_same ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_weights_diff ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_weights_rank ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_audit ENABLE ROW LEVEL SECURITY;

-- Политики доступа (для начала - разрешить все для анонимных, потом ограничить)
-- ВАЖНО: Для админки нужно использовать service_role key или настроить политики
CREATE POLICY "Allow all for admin" ON concepts FOR ALL USING (true);
CREATE POLICY "Allow all for admin" ON rank_config FOR ALL USING (true);
CREATE POLICY "Allow all for admin" ON metrics FOR ALL USING (true);
CREATE POLICY "Allow all for admin" ON metric_weights_same FOR ALL USING (true);
CREATE POLICY "Allow all for admin" ON metric_weights_diff FOR ALL USING (true);
CREATE POLICY "Allow all for admin" ON metric_weights_rank FOR ALL USING (true);
CREATE POLICY "Allow all for admin" ON admin_settings FOR ALL USING (true);
CREATE POLICY "Allow all for admin" ON metric_audit FOR ALL USING (true);
```

**Примечание:** Для админки можно временно использовать `service_role` key, который обходит RLS. В продакшене нужно настроить правильные политики.

### 3.2 Функции для поддержания консистентности

#### 3.2.1 Функция для добавления нового понятия
```sql
CREATE OR REPLACE FUNCTION add_concept_to_all_metrics()
RETURNS TRIGGER AS $$
DECLARE
  metric_record RECORD;
  rank_value INTEGER;
  M_value INTEGER;
BEGIN
  -- Получить M из rank_config
  SELECT M INTO M_value FROM rank_config WHERE id = 1;
  
  -- Для каждой метрики
  FOR metric_record IN SELECT id FROM metrics LOOP
    -- Добавить строки в metric_weights_rank (по всем рангам)
    FOR rank_value IN 1..M_value LOOP
      INSERT INTO metric_weights_rank (metric_id, rank, concept_id, value)
      VALUES (metric_record.id, rank_value, NEW.id, 0)
      ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Добавить пары с новым понятием в same и diff
    -- Для всех существующих понятий
    INSERT INTO metric_weights_same (metric_id, i_concept_id, j_concept_id, value)
    SELECT metric_record.id, LEAST(c.id, NEW.id), GREATEST(c.id, NEW.id), 0
    FROM concepts c
    WHERE c.id != NEW.id AND c.id < NEW.id
    ON CONFLICT DO NOTHING;
    
    INSERT INTO metric_weights_same (metric_id, i_concept_id, j_concept_id, value)
    SELECT metric_record.id, LEAST(c.id, NEW.id), GREATEST(c.id, NEW.id), 0
    FROM concepts c
    WHERE c.id != NEW.id AND c.id > NEW.id
    ON CONFLICT DO NOTHING;
    
    -- Аналогично для diff
    INSERT INTO metric_weights_diff (metric_id, i_concept_id, j_concept_id, value)
    SELECT metric_record.id, LEAST(c.id, NEW.id), GREATEST(c.id, NEW.id), 0
    FROM concepts c
    WHERE c.id != NEW.id AND c.id < NEW.id
    ON CONFLICT DO NOTHING;
    
    INSERT INTO metric_weights_diff (metric_id, i_concept_id, j_concept_id, value)
    SELECT metric_record.id, LEAST(c.id, NEW.id), GREATEST(c.id, NEW.id), 0
    FROM concepts c
    WHERE c.id != NEW.id AND c.id > NEW.id
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_concept_added
AFTER INSERT ON concepts
FOR EACH ROW
EXECUTE FUNCTION add_concept_to_all_metrics();
```

#### 3.2.2 Функция для изменения M
```sql
CREATE OR REPLACE FUNCTION update_rank_config()
RETURNS TRIGGER AS $$
DECLARE
  old_M INTEGER;
  new_M INTEGER;
  metric_record RECORD;
  concept_record RECORD;
BEGIN
  old_M := OLD.M;
  new_M := NEW.M;
  
  IF new_M > old_M THEN
    -- Увеличили M: добавить строки для новых рангов
    FOR metric_record IN SELECT id FROM metrics LOOP
      FOR concept_record IN SELECT id FROM concepts LOOP
        FOR rank_value IN (old_M + 1)..new_M LOOP
          INSERT INTO metric_weights_rank (metric_id, rank, concept_id, value)
          VALUES (metric_record.id, rank_value, concept_record.id, 0)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  ELSIF new_M < old_M THEN
    -- Уменьшили M: удалить строки с rank > new_M
    DELETE FROM metric_weights_rank
    WHERE rank > new_M;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_rank_config_updated
AFTER UPDATE ON rank_config
FOR EACH ROW
WHEN (OLD.M IS DISTINCT FROM NEW.M)
EXECUTE FUNCTION update_rank_config();
```

### 3.3 Миграции для существующих данных

Если есть существующие понятия из CSV файлов, нужно создать миграцию для их импорта:

```sql
-- Пример: импорт понятий из существующих данных
-- (нужно будет адаптировать под реальные данные)
INSERT INTO concepts (name) VALUES
  ('Life'),
  ('Love'),
  ('Health'),
  ('Family')
ON CONFLICT (name) DO NOTHING;
```

### 3.4 Тестовые данные (seed)

```sql
-- Создать тестовые метрики
INSERT INTO metrics (text, status, version) VALUES
  ('Test Metric 1', 'draft', 1),
  ('Test Metric 2', 'published', 1)
ON CONFLICT DO NOTHING;
```

---

## 4. Структура проекта

### 4.1 Новые директории и файлы

```
lib/
  supabase/
    client.js              # Supabase клиент (для браузера)
    server.js              # Supabase клиент (для сервера)
    migrations/            # SQL миграции (для версионирования)
  psychosemantics/
    concepts.js            # API для работы с понятиями
    metrics.js             # API для работы с метриками
    matrices.js            # API для работы с матрицами
    calculations.js        # Логика расчётов Score и Affinity
    debug.js               # Логика для debug страницы
  auth/
    adminAuth.js          # Аутентификация админа
    middleware.js          # Middleware для защиты

pages/
  admin/
    login.js              # Страница входа
    concepts.js           # Управление понятиями
    ranks.js              # Управление M
    metrics/
      index.js            # Список метрик
      [metricId].js       # Редактор метрики
    settings.js           # Настройки (якоря Affinity)
    debug.js              # Debug страница
    _middleware.js        # Защита маршрутов

pages/api/
  admin/
    concepts/
      index.js            # GET/POST /api/admin/concepts
      [id].js             # DELETE /api/admin/concepts/[id]
    ranks/
      index.js            # GET/PUT /api/admin/ranks
    metrics/
      index.js            # GET/POST /api/admin/metrics
      [id].js             # DELETE /api/admin/metrics/[id]
      [id]/duplicate.js   # POST /api/admin/metrics/[id]/duplicate
      [id]/publish.js     # POST /api/admin/metrics/[id]/publish
      [id]/matrices/
        same.js           # GET/PUT /api/admin/metrics/[id]/matrices/same
        diff.js           # GET/PUT /api/admin/metrics/[id]/matrices/diff
        rank.js           # GET/PUT /api/admin/metrics/[id]/matrices/rank
    settings/
      index.js            # GET/PUT /api/admin/settings
    debug/
      compute.js          # POST /api/admin/debug/compute
```

### 4.2 Компоненты

```
components/
  admin/
    ConceptTable.js       # Таблица понятий
    MetricTable.js        # Таблица метрик
    MatrixEditor.js       # Редактор матриц (N×N)
    RankConceptMatrix.js  # Редактор матрицы M×N
    SummaryPanel.js       # Панель с суммами
    DebugPairsView.js     # Визуализация пар
    DebugScoresView.js    # Разложение Score
    DebugAffinityView.js  # График Affinity
    DebugWarnings.js      # Предупреждения
    AutoSaveIndicator.js  # Индикатор автосохранения
```

---

## 5. API Endpoints

### 5.1 Список всех необходимых endpoints

**Concepts:**
- `GET /api/admin/concepts` - список всех понятий
- `POST /api/admin/concepts` - создать понятие
- `DELETE /api/admin/concepts/[id]` - удалить понятие

**Ranks:**
- `GET /api/admin/ranks` - получить текущее M
- `PUT /api/admin/ranks` - изменить M

**Metrics:**
- `GET /api/admin/metrics` - список метрик
- `POST /api/admin/metrics` - создать метрику
- `DELETE /api/admin/metrics/[id]` - удалить метрику
- `POST /api/admin/metrics/[id]/duplicate` - дублировать в draft
- `POST /api/admin/metrics/[id]/publish` - опубликовать
- `POST /api/admin/metrics/[id]/unpublish` - снять с публикации

**Matrices:**
- `GET /api/admin/metrics/[id]/matrices/same` - получить матрицу same
- `PUT /api/admin/metrics/[id]/matrices/same` - обновить матрицу same
- `GET /api/admin/metrics/[id]/matrices/diff` - получить матрицу diff
- `PUT /api/admin/metrics/[id]/matrices/diff` - обновить матрицу diff
- `GET /api/admin/metrics/[id]/matrices/rank` - получить матрицу rank
- `PUT /api/admin/metrics/[id]/matrices/rank` - обновить матрицу rank

**Settings:**
- `GET /api/admin/settings` - получить настройки
- `PUT /api/admin/settings` - обновить настройки

**Debug:**
- `POST /api/admin/debug/compute` - вычислить Score и Affinity

---

## 6. Дополнительные настройки

### 6.1 TypeScript (опционально)
Если планируется использовать TypeScript:
```bash
npm install --save-dev typescript @types/react @types/node
```

### 6.2 Linting и форматирование
```bash
npm install --save-dev eslint prettier eslint-config-next
```

### 6.3 Тестирование (опционально)
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

---

## 7. Чеклист перед началом реализации

### 7.1 Инфраструктура
- [ ] Создан проект Supabase
- [ ] Получены URL и API ключи
- [ ] Добавлены переменные окружения в `.env.local`
- [ ] Установлены все необходимые npm пакеты

### 7.2 База данных
- [ ] Выполнены SQL миграции для создания таблиц
- [ ] Созданы триггеры для поддержания консистентности
- [ ] Настроены индексы
- [ ] Настроены RLS политики (или временно отключены для админки)
- [ ] Импортированы тестовые данные (если есть)

### 7.3 Аутентификация
- [ ] Реализована страница `/admin/login`
- [ ] Создан middleware для защиты маршрутов
- [ ] Протестирован доступ к защищенным страницам

### 7.4 Структура проекта
- [ ] Созданы все необходимые директории
- [ ] Создан Supabase клиент (`lib/supabase/client.js` и `server.js`)
- [ ] Создана базовая структура API endpoints

### 7.5 Тестирование подключения
- [ ] Проверено подключение к Supabase из кода
- [ ] Протестирован простой запрос (например, `SELECT * FROM concepts`)

---

## 8. Следующие шаги после подготовки

После завершения всех шагов из этого гайда:

1. ✅ Создать базовую структуру страниц
2. ✅ Реализовать CRUD для concepts
3. ✅ Реализовать управление M (ranks)
4. ✅ Реализовать CRUD для metrics
5. ✅ Реализовать редактор матриц
6. ✅ Реализовать debug страницу
7. ✅ Реализовать settings страницу
8. ✅ Добавить автосохранение и валидации
9. ✅ Добавить экспорт/импорт метрик
10. ✅ Тестирование и оптимизация

---

## 9. Важные замечания

### 9.1 Безопасность
- **Никогда не коммитить** `.env.local` в репозиторий
- Использовать `service_role` key только на сервере
- В продакшене настроить правильные RLS политики
- Валидировать все входные данные на сервере

### 9.2 Производительность
- Использовать виртуализацию для больших таблиц (N > 50)
- Batch-обновления для матриц
- Кэширование на уровне API при необходимости

### 9.3 Версионирование
- Published метрики должны быть immutable
- При изменении M/словаря понятий показывать предупреждения
- Ведение истории изменений в `metric_audit`

---

## 10. Поддержка и вопросы

Если возникнут вопросы при подготовке:
1. Проверить документацию Supabase: https://supabase.com/docs
2. Проверить документацию Next.js: https://nextjs.org/docs
3. Проверить логи Supabase Dashboard → Logs

---

**Готово к реализации?** ✅

После утверждения этого гайда можно начинать реализацию согласно спецификации.

