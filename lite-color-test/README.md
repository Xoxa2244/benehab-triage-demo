# Lite Color Test (Standalone)

Отдельное приложение внутри репозитория:
- `backend` — FastAPI API c постоянным JSON-хранилищем.
- `frontend` — Vite + React интерфейс для проектов, метрик, опроса и результатов.

## 1) Запуск backend

```bash
cd lite-color-test/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010
```

## 2) Запуск frontend

```bash
cd lite-color-test/frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend API: `http://localhost:8010/api`

## 3) Backend тесты

```bash
cd lite-color-test/backend
source .venv/bin/activate
pip install -r requirements-dev.txt
pytest -q
```

## 4) Docker Compose (рекомендуемый деплой)

```bash
cd lite-color-test
docker compose up --build -d
```

После запуска:
- UI: `http://localhost:8080`
- API через тот же домен: `http://localhost:8080/api/*`

Полезные команды:

```bash
# Логи
docker compose logs -f

# Остановка и удаление контейнеров
docker compose down

# Остановка + удаление тома с данными
docker compose down -v
```

## Реализовано
- Проекты (изолированные наборы понятий, палитры, метрик).
- Понятия списком + reorder (drag & drop) + статус сохранения.
- Редактируемая палитра + reorder + статус сохранения.
- Метрики + reorder + редактирование матриц через dropdown (`0.0..1.0`, шаг `0.1`).
- Опрос:
  - Этап 1: одно понятие -> один цвет на экране.
  - Этап 2: ранжирование цветов (репозиторий <-> линейка) на одном экране.
- Synthetic users (постоянное хранение).
- Таблица результатов по пользователям и реестр прохождений.

## Хранилище данных

Все данные сохраняются в файл:
`lite-color-test/backend/data/storage.json`

При запуске через Docker Compose данные сохраняются в volume:
`lite-color-test_lite_color_test_data` (монтируется в `/app/data` внутри backend-контейнера).
