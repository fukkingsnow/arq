#!/usr/bin/env python3
"""
ARQ - AI Assistant with Memory & Context Management
Core entry point for backend services
"""

import asyncio
import logging
from fastapi import FastAPI
from contextlib import asynccontextmanager

from config import settings
from database import init_db, Database
from api import router as api_router
from memory import MemoryManager
from telegram_bot import setup_telegram_bot

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global instances
db: Database = None
memory_manager: MemoryManager = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting ARQ services...")
    global db, memory_manager
    
    db = Database(settings.DATABASE_URL)
    await db.connect()
    await init_db(db)
    
    memory_manager = MemoryManager(db)
    await memory_manager.initialize()
    
    # Setup Telegram bot if enabled
    if settings.TELEGRAM_TOKEN:
        await setup_telegram_bot(settings.TELEGRAM_TOKEN, db, memory_manager)
    
    logger.info("ARQ services started successfully")
    yield
    
    # Shutdown
    logger.info("Shutting down ARQ services...")
    if memory_manager:
        await memory_manager.cleanup()
    if db:
        await db.disconnect()
    logger.info("ARQ services shut down")

app = FastAPI(
    title="ARQ - AI Assistant API",
    description="Real-time AI Assistant with Memory & Context Management",
    version="1.0.0",
    lifespan=lifespan
)

# Include routers
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "arq-core"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
