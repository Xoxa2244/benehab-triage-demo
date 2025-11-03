# Используем официальный Python образ
FROM python:3.12-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем poetry
RUN pip install poetry

# Копируем файлы зависимостей в корень
COPY pyproject.toml poetry.lock* ./

# Настраиваем poetry для установки зависимостей в системное окружение
RUN poetry config virtualenvs.create false

# Устанавливаем зависимости
RUN poetry install --no-interaction --no-ansi --no-root

# Создаем структуру директорий и копируем код
# Копируем все содержимое backend в подкаталог backend
COPY __init__.py ./backend/__init__.py
COPY config.py ./backend/config.py
COPY documents/ ./backend/documents/
COPY routes/ ./backend/routes/
COPY schemas/ ./backend/schemas/
COPY services/ ./backend/services/
COPY utils/ ./backend/utils/

# Копируем main.py в корень для запуска
COPY main.py ./main.py

# Открываем порт
EXPOSE 8000

# Команда запуска
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]