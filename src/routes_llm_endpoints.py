#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LLM API Endpoints for ARQ AI Assistant
Phase 9: LLM Integration endpoints for FastAPI
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import logging
from src.llm_integration import create_llm_integration, LLMResponse

logger = logging.getLogger(__name__)

# Create router for LLM endpoints
llm_router = APIRouter(prefix="/api/v1/llm", tags=["LLM"])

# Initialize LLM integration (will be created in main.py)
llm_integration = None


class LLMGenerateRequest(BaseModel):
    """Request model for LLM generation endpoint"""
    prompt: str = Field(..., description="User prompt for LLM")
    model: str = Field(default="gpt-4", description="Model to use (gpt-4, gpt-3.5-turbo, llama2)")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="Temperature for response generation")
    max_tokens: int = Field(default=1000, ge=1, le=4000, description="Maximum tokens in response")
    context: Optional[List[Dict]] = Field(default=None, description="Conversation context")


class LLMContextRequest(BaseModel):
    """Request model for context management endpoint"""
    messages: List[Dict] = Field(..., description="Messages to manage")
    max_tokens: int = Field(default=12000, description="Maximum tokens for context")


class LLMResponse(BaseModel):
    """Response model for LLM endpoints"""
    content: str = Field(..., description="Generated response")
    model: str = Field(..., description="Model used")
    tokens_used: int = Field(..., description="Number of tokens used")
    latency_ms: float = Field(..., description="Response latency in milliseconds")
    provider: str = Field(..., description="LLM provider (openai, ollama)")


class ContextResponse(BaseModel):
    """Response model for context management endpoint"""
    optimized_context: List[Dict] = Field(..., description="Optimized context messages")
    tokens_used: int = Field(..., description="Tokens used by context")
    removed_messages: int = Field(..., description="Number of messages removed")


class HealthResponse(BaseModel):
    """Response model for health check endpoint"""
    status: str = Field(..., description="Health status")
    openai_available: bool = Field(..., description="OpenAI API availability")
    ollama_available: bool = Field(..., description="Ollama server availability")
    uptime_seconds: float = Field(..., description="Service uptime in seconds")


@llm_router.post("/generate", response_model=LLMResponse, tags=["Generation"])
async def llm_generate(request: LLMGenerateRequest):
    """
    Generate response using LLM
    
    **Parameters:**
    - **prompt**: The user prompt to send to LLM
    - **model**: LLM model to use (default: gpt-4)
    - **temperature**: Temperature for response generation (0.0-2.0)
    - **max_tokens**: Maximum tokens in response
    - **context**: Previous messages for context
    
    **Returns:**
    - Generated response with metadata
    """
    try:
        if llm_integration is None:
            raise HTTPException(status_code=503, detail="LLM service not initialized")
        
        # Generate response using LLM
        response = llm_integration.generate_response(
            prompt=request.prompt,
            model=request.model,
            streaming=False,
            context=request.context or []
        )
        
        logger.info(f"LLM generated response - Model: {response.model}, Tokens: {response.tokens_used}")
        
        return LLMResponse(
            content=response.content,
            model=response.model,
            tokens_used=response.tokens_used,
            latency_ms=response.latency_ms,
            provider=response.provider
        )
    except Exception as e:
        logger.error(f"LLM generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")


@llm_router.post("/stream", tags=["Streaming"])
async def llm_stream(request: LLMGenerateRequest):
    """
    Stream response from LLM using Server-Sent Events
    
    **Parameters:**
    - **prompt**: The user prompt
    - **model**: LLM model to use
    - **temperature**: Temperature for generation
    - **max_tokens**: Maximum tokens
    - **context**: Previous messages
    
    **Returns:**
    - Server-Sent Events stream with response chunks
    """
    try:
        if llm_integration is None:
            raise HTTPException(status_code=503, detail="LLM service not initialized")
        
        async def stream_generator():
            try:
                # Generate streaming response
                for chunk in llm_integration.stream_response(
                    prompt=request.prompt,
                    model=request.model,
                    context=request.context or []
                ):
                    yield f"data: {chunk}\n\n"
                yield "data: [DONE]\n\n"
                logger.info(f"Stream completed for model: {request.model}")
            except Exception as e:
                logger.error(f"Streaming error: {str(e)}")
                yield f"data: ERROR: {str(e)}\n\n"
        
        return stream_generator()
    except Exception as e:
        logger.error(f"Stream setup error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Stream error: {str(e)}")


@llm_router.post("/context", response_model=ContextResponse, tags=["Context"])
async def manage_context(request: LLMContextRequest):
    """
    Manage and optimize conversation context
    
    **Parameters:**
    - **messages**: List of message objects with role and content
    - **max_tokens**: Maximum tokens allowed for context
    
    **Returns:**
    - Optimized context with trimmed messages
    """
    try:
        if llm_integration is None:
            raise HTTPException(status_code=503, detail="LLM service not initialized")
        
        original_count = len(request.messages)
        
        # Trim context using ContextManager
        optimized_context = llm_integration.context_manager.trim_context(request.messages)
        removed_count = original_count - len(optimized_context)
        
        # Calculate tokens used
        tokens_used = sum(
            llm_integration.context_manager.count_tokens(msg.get('content', ''))
            for msg in optimized_context
        )
        
        logger.info(f"Context managed - Original: {original_count}, Optimized: {len(optimized_context)}, Tokens: {tokens_used}")
        
        return ContextResponse(
            optimized_context=optimized_context,
            tokens_used=tokens_used,
            removed_messages=removed_count
        )
    except Exception as e:
        logger.error(f"Context management error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Context error: {str(e)}")


@llm_router.get("/health", response_model=HealthResponse, tags=["Health"])
async def llm_health():
    """
    Check health status of LLM services
    
    **Returns:**
    - Health status of LLM service and both providers
    """
    try:
        openai_available = False
        ollama_available = False
        
        if llm_integration is not None:
            try:
                # Check OpenAI availability
                openai_available = llm_integration.openai_client.api_key is not None
            except:
                openai_available = False
            
            try:
                # Check Ollama availability (simplified check)
                ollama_available = llm_integration.ollama_client.base_url is not None
            except:
                ollama_available = False
        
        status = "healthy" if (openai_available or ollama_available) else "degraded"
        
        logger.info(f"Health check - OpenAI: {openai_available}, Ollama: {ollama_available}")
        
        return HealthResponse(
            status=status,
            openai_available=openai_available,
            ollama_available=ollama_available,
            uptime_seconds=0.0  # Will be calculated in main.py
        )
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Health check error: {str(e)}")


def initialize_llm_router(app_llm_integration):
    """
    Initialize LLM router with LLM integration instance
    
    **Parameters:**
    - **app_llm_integration**: LLMIntegration instance from main application
    """
    global llm_integration
    llm_integration = app_llm_integration
    logger.info("LLM router initialized with LLMIntegration instance")


# Export the router for use in main.py
__all__ = ['llm_router', 'initialize_llm_router', 'LLMGenerateRequest', 'LLMContextRequest']
