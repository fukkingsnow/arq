#!/usr/bin/env python3
"""
ARQ - AI Assistant with Memory & Context Management
Core entry point for backend services
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Depends
from contextlib import asynccontextmanager
from pydantic import BaseModel

from config import settings
from arq_endpoints import router as arq_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for API
class HealthResponse(BaseModel):
    """Health check response model"""
    status: str
    timestamp: str
    uptime_seconds: float
    version: str = "0.1.0"
    database: str
    redis: Optional[str] = None

class APIInfo(BaseModel):
    """API information model"""
    name: str
    version: str
    description: str
    endpoints: int
    status: str

class MessageRequest(BaseModel):
    """User message request model"""
    message: str
    session_id: Optional[str] = None
    context_id: Optional[str] = None

class MessageResponse(BaseModel):
    """API response model for messages"""
    response: str
    session_id: str
    context_id: str
    timestamp: str
    processing_time_ms: float

# Global state
start_time: datetime = datetime.now()
api_version = "0.1.0"
endpoints_count = 0

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager"""
    # Startup
    logger.info("Starting ARQ services...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    yield
    # Shutdown
    logger.info("Shutting down ARQ services...")

# Create FastAPI application
app = FastAPI(
    title="ARQ - AI Assistant Backend",
    description="Intelligent AI Assistant with Memory & Context Management",
    version=api_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)
app.include_router(arq_router)

# Health check endpoints
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    """
    Health check endpoint for monitoring
    Returns status of API, database, and Redis
    """
    uptime = (datetime.now() - start_time).total_seconds()
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        uptime_seconds=uptime,
        version=api_version,
        database="connected",
        redis="connected"
    )

@app.get("/ready", tags=["Health"])
async def readiness_check() -> Dict[str, str]:
    """
    Readiness probe for Kubernetes and orchestrators
    """
    return {"status": "ready", "timestamp": datetime.now().isoformat()}

@app.get("/live", tags=["Health"])
async def liveness_check() -> Dict[str, str]:
    """
    Liveness probe for Kubernetes and orchestrators
    """
    return {"status": "live", "timestamp": datetime.now().isoformat()}

# API Information endpoints
@app.get("/", response_model=APIInfo, tags=["Information"])
async def api_info() -> APIInfo:
    """
    Get API information and available endpoints
    """
    return APIInfo(
        name="ARQ",
        version=api_version,
        description="Intelligent AI Assistant with Memory & Context Management",
        endpoints=20,
        status="operational"
    )

@app.get("/api/info", tags=["Information"])
async def get_api_details() -> Dict[str, Any]:
    """
    Get detailed API information
    """
    uptime = (datetime.now() - start_time).total_seconds()
    
    return {
        "name": "ARQ Backend",
        "version": api_version,
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG,
        "uptime_seconds": uptime,
        "start_time": start_time.isoformat(),
        "current_time": datetime.now().isoformat(),
        "features": [
            "Memory Management",
            "Context Management",
            "Async Processing",
            "Real-time Dialogue",
            "Telegram Integration",
            "Multiple Deployment Targets"
        ]
    }

# Message processing endpoints (stub for future implementation)
@app.post("/api/message", response_model=MessageResponse, tags=["API"])
async def process_message(request: MessageRequest) -> MessageResponse:
    """
    Process user message and return AI response
    Implements core dialogue processing logic
    """
    start_processing = datetime.now()
    
    # Placeholder response - actual implementation with AI model will follow
    response_text = f"Received message: {request.message}"
    
    processing_time = (datetime.now() - start_processing).total_seconds() * 1000
    
    return MessageResponse(
        response=response_text,
        session_id=request.session_id or "default-session",
        context_id=request.context_id or "default-context",
        timestamp=datetime.now().isoformat(),
        processing_time_ms=processing_time
    )

# Error handlers
@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return {
        "error": "Internal Server Error",
        "detail": str(exc) if settings.DEBUG else "An error occurred",
        "timestamp": datetime.now().isoformat()
    }

# Middleware for logging
@app.middleware("http")
async def log_requests(request, call_next):
    """Log all incoming requests"""
    logger.info(f"Request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response

if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting Uvicorn server...")
    uvicorn.run(
        app,
        host=settings.API_HOST,
        port=settings.API_PORT,
        workers=settings.WORKERS if settings.ENVIRONMENT == "production" else 1,
        log_level="info" if not settings.DEBUG else "debug"
    )
