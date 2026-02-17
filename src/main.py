#!/usr/bin/env python3
import asyncio
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel

# Импорты твоих настроек (убедись, что файлы config.py и arq_endpoints.py на месте)
try:
    from config import settings
    from arq_endpoints import router as arq_router
except ImportError:
    # Заглушка, если конфиги не подгрузились
    class Settings:
        DEBUG = True
        ENVIRONMENT = "development"
    settings = Settings()
    arq_router = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Модели ответов
class HealthResponse(BaseModel):
    status: str
    timestamp: str
    uptime_seconds: float
    version: str = "0.1.0"

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ARQ AI Engine on port 8001...")
    yield
    logger.info("Shutting down ARQ AI Engine...")

app = FastAPI(
    title="ARQ - AI Engine",
    version="0.1.0",
    lifespan=lifespan
)

# Разрешаем запросы (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

if arq_router:
    app.include_router(arq_router)

start_time = datetime.now()

@app.get("/health", response_model=HealthResponse)
async def health_check():
    uptime = (datetime.now() - start_time).total_seconds()
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        uptime_seconds=uptime
    )

if __name__ == "__main__":
    import uvicorn
    # ЖЕСТКО ЗАДАЕМ ПОРТ 8001
    uvicorn.run(app, host="0.0.0.0", port=8001)
