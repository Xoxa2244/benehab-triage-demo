from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from backend.documents.ChatDocument import ChatDocument
from backend.routes.chat_router import router as chat_router, init_services
from backend.services import InstructionService, ChatService
from backend.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Управление жизненным циклом приложения.
    Инициализирует подключение к MongoDB при старте и закрывает при остановке.
    """
    # Startup: Инициализация MongoDB
    print(f"🔌 Подключение к MongoDB: {settings.mongodb_url}")
    
    client = AsyncIOMotorClient(settings.mongodb_url)
    database = client[settings.database_name]
    
    # Инициализация Beanie с документами
    await init_beanie(
        database=database,
        document_models=[ChatDocument]
    )
    
    print(f"✅ MongoDB подключена к базе данных: {settings.database_name}")
    
    # Инициализация сервисов
    instruction_service = InstructionService()
    chat_service = ChatService(instruction_service)
    
    # Передаем сервисы в роутер
    init_services(instruction_service, chat_service)
    
    print("✅ Сервисы инициализированы")
    
    yield
    
    # Shutdown: Закрытие подключения
    print("🔌 Закрытие подключения к MongoDB")
    client.close()


# Создание FastAPI приложения
app = FastAPI(
    title="Benehab Chat API",
    description="API для управления чатами с пациентами",
    version="1.0.0",
    lifespan=lifespan
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(chat_router)


@app.get("/", tags=["root"])
async def root():
    """
    Корневой endpoint для проверки работоспособности API.
    """
    return {
        "message": "Benehab Chat API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health", tags=["health"])
async def health_check():
    """
    Endpoint для проверки здоровья приложения.
    """
    return {
        "status": "healthy",
        "database": "connected"
    }


if __name__ == "__main__":
    import uvicorn
    
    # Запуск сервера
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level="info"
    )