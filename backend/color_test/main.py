from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

import beanie
from backend.config import settings
from backend.color_test.entities import (
    ColorTestResultDocument,
    MetricDocument,
    UserDocument,
    ConceptDocument,
)
from backend.routes.color_test_router import router as color_test_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for database connection"""
    # Startup
    client = AsyncIOMotorClient(settings.mongodb_url)
    database = client[settings.database_name]

    # Initialize Beanie with the document models
    await beanie.init_beanie(
        database=database,
        document_models=[
            ColorTestResultDocument,
            MetricDocument,
            UserDocument,
            ConceptDocument,
        ],
    )

    print(f"Connected to MongoDB: {settings.mongodb_url}")
    print(f"Database: {settings.database_name}")

    yield

    # Shutdown
    client.close()
    print("Disconnected from MongoDB")


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""

    # Create FastAPI app with lifespan
    app = FastAPI(
        title="Color Test API",
        description="API for color psychology testing system",
        version="1.0.0",
        lifespan=lifespan
    )

    # CORS middleware configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure this properly in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(color_test_router)

    return app


# Create the app instance
app = create_app()


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Color Test API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.color_test.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level="info",
    )
