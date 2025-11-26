import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from .entities import ColorTestResultDocument, MetricDocument, UserDocument
from .routers import color_test_router
import beanie


# Database connection settings
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "color_test_db")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for database connection"""
    # Startup
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client[DATABASE_NAME]

    # Initialize Beanie with the document models
    await beanie.init_beanie(
        database=database,
        document_models=[ColorTestResultDocument, MetricDocument, UserDocument]
    )

    print(f"Connected to MongoDB: {MONGODB_URL}")
    print(f"Database: {DATABASE_NAME}")

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
        "src.color_test.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
