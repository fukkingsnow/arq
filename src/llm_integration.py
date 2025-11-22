#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LLM Integration Module for ARQ AI Assistant

Phase 9: LLM Integration with OpenAI and Ollama support
Provides streaming, context management, and retry logic
"""

import json
import os
import time
import logging
from typing import Optional, List, Dict, Any, Generator
from dataclasses import dataclass, asdict
from enum import Enum
import requests
from datetime import datetime


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class ModelProvider(Enum):
    """Available LLM providers"""
    OPENAI = "openai"
    OLLAMA = "ollama"


class ModelType(Enum):
    """Available model types"""
    GPT4 = "gpt-4"
    GPT35 = "gpt-3.5-turbo"
    OLLAMA_LLAMA2 = "llama2"
    OLLAMA_MISTRAL = "mistral"


@dataclass
class LLMRequest:
    """LLM request structure"""
    prompt: str
    model: str = "gpt-4"
    temperature: float = 0.7
    max_tokens: int = 1000
    streaming: bool = False
    context: List[Dict[str, str]] = None
    
    def __post_init__(self):
        if self.context is None:
            self.context = []


@dataclass
class LLMResponse:
    """LLM response structure"""
    content: str
    model: str
    tokens_used: int
    timestamp: str
    latency_ms: float
    provider: str = "unknown"


class ContextManager:
    """Manages conversation context and token limits"""
    
    def __init__(self, max_tokens: int = 12000):
        self.max_tokens = max_tokens
        self.tokens_per_message = 4
        
    def count_tokens(self, text: str) -> int:
        """Estimate token count (rough approximation)"""
        return len(text.split()) // 4 + 1
    
    def trim_context(self, messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Trim context to fit within token limit"""
        trimmed = []
        total_tokens = 0
        
        for msg in reversed(messages):
            msg_tokens = self.count_tokens(msg.get('content', ''))
            if total_tokens + msg_tokens <= self.max_tokens:
                trimmed.insert(0, msg)
                total_tokens += msg_tokens
            else:
                break
        
        logger.info(f"Context trimmed: {len(messages)} -> {len(trimmed)} messages")
        return trimmed


class OpenAIClient:
    """OpenAI API client wrapper"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not set")
        self.base_url = "https://api.openai.com/v1/chat/completions"
        self.timeout = int(os.getenv('MODEL_TIMEOUT', 30))
        
    def generate(self, request: LLMRequest) -> LLMResponse:
        """Generate response using OpenAI API"""
        try:
            start_time = time.time()
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            messages = request.context + [
                {"role": "user", "content": request.prompt}
            ]
            
            payload = {
                "model": request.model,
                "messages": messages,
                "temperature": request.temperature,
                "max_tokens": request.max_tokens,
                "stream": False
            }
            
            response = requests.post(
                self.base_url,
                headers=headers,
                json=payload,
                timeout=self.timeout
            )
            
            response.raise_for_status()
            data = response.json()
            
            latency_ms = (time.time() - start_time) * 1000
            
            return LLMResponse(
                content=data['choices'][0]['message']['content'],
                model=request.model,
                tokens_used=data.get('usage', {}).get('total_tokens', 0),
                timestamp=datetime.now().isoformat(),
                latency_ms=latency_ms,
                provider=ModelProvider.OPENAI.value
            )
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise
    
    def stream(self, request: LLMRequest) -> Generator[str, None, None]:
        """Stream response from OpenAI API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        messages = request.context + [
            {"role": "user", "content": request.prompt}
        ]
        
        payload = {
            "model": request.model,
            "messages": messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "stream": True
        }
        
        try:
            response = requests.post(
                self.base_url,
                headers=headers,
                json=payload,
                timeout=self.timeout,
                stream=True
            )
            response.raise_for_status()
            
            for line in response.iter_lines():
                if line and line.startswith(b'data: '):
                    data_str = line[6:].decode('utf-8')
                    if data_str == '[DONE]':
                        break
                    try:
                        data = json.loads(data_str)
                        chunk = data['choices'][0]['delta'].get('content', '')
                        if chunk:
                            yield chunk
                    except:
                        continue
        except Exception as e:
            logger.error(f"OpenAI streaming error: {str(e)}")
            raise


class OllamaClient:
    """Ollama API client wrapper"""
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv('OLLAMA_URL', 'http://localhost:11434')
        self.model = os.getenv('OLLAMA_MODEL', 'llama2')
        self.timeout = int(os.getenv('MODEL_TIMEOUT', 30))
        
    def generate(self, request: LLMRequest) -> LLMResponse:
        """Generate response using Ollama API"""
        try:
            start_time = time.time()
            
            context_text = ""
            for msg in request.context:
                context_text += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"
            
            full_prompt = context_text + f"user: {request.prompt}\n assistant:"
            
            payload = {
                "model": self.model,
                "prompt": full_prompt,
                "temperature": request.temperature,
                "stream": False
            }
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=self.timeout
            )
            
            response.raise_for_status()
            data = response.json()
            
            latency_ms = (time.time() - start_time) * 1000
            
            return LLMResponse(
                content=data.get('response', ''),
                model=request.model,
                tokens_used=data.get('tokens', 0),
                timestamp=datetime.now().isoformat(),
                latency_ms=latency_ms,
                provider=ModelProvider.OLLAMA.value
            )
        except Exception as e:
            logger.error(f"Ollama API error: {str(e)}")
            raise
    
    def stream(self, request: LLMRequest) -> Generator[str, None, None]:
        """Stream response from Ollama API"""
        context_text = ""
        for msg in request.context:
            context_text += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"
        
        full_prompt = context_text + f"user: {request.prompt}\n assistant:"
        
        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "temperature": request.temperature,
            "stream": True
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=self.timeout,
                stream=True
            )
            response.raise_for_status()
            
            for line in response.iter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        chunk = data.get('response', '')
                        if chunk:
                            yield chunk
                    except:
                        continue
        except Exception as e:
            logger.error(f"Ollama streaming error: {str(e)}")
            raise


class LLMIntegration:
    """Main LLM Integration class"""
    
    def __init__(self):
        self.openai_client = OpenAIClient()
        self.ollama_client = OllamaClient()
        self.context_manager = ContextManager()
        self.max_retries = int(os.getenv('RETRY_MAX_ATTEMPTS', 3))
        self.backoff_factor = float(os.getenv('RETRY_BACKOFF_FACTOR', 2.0))
        
    def _retry_with_backoff(self, func, *args, **kwargs):
        """Retry function with exponential backoff"""
        for attempt in range(self.max_retries):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise
                wait_time = self.backoff_factor ** attempt
                logger.warning(f"Retry attempt {attempt + 1} after {wait_time}s: {str(e)}")
                time.sleep(wait_time)
    
    def generate_response(self, prompt: str, model: str = "gpt-4", 
                         streaming: bool = False, context: List[Dict] = None) -> LLMResponse:
        """Generate LLM response"""
        context = context or []
        
        # Trim context to fit within limits
        context = self.context_manager.trim_context(context)
        
        request = LLMRequest(
            prompt=prompt,
            model=model,
            streaming=streaming,
            context=context
        )
        
        try:
            if 'gpt' in model:
                response = self._retry_with_backoff(
                    self.openai_client.generate, request
                )
            else:
                response = self._retry_with_backoff(
                    self.ollama_client.generate, request
                )
            return response
        except Exception as e:
            logger.error(f"Failed to generate response: {str(e)}")
            raise
    
    def stream_response(self, prompt: str, model: str = "gpt-4", 
                       context: List[Dict] = None) -> Generator[str, None, None]:
        """Stream LLM response"""
        context = context or []
        context = self.context_manager.trim_context(context)
        
        request = LLMRequest(
            prompt=prompt,
            model=model,
            streaming=True,
            context=context
        )
        
        try:
            if 'gpt' in model:
                yield from self._retry_with_backoff(
                    self.openai_client.stream, request
                )
            else:
                yield from self._retry_with_backoff(
                    self.ollama_client.stream, request
                )
        except Exception as e:
            logger.error(f"Failed to stream response: {str(e)}")
            raise


def create_llm_integration() -> LLMIntegration:
    """Factory function to create LLM integration instance"""
    return LLMIntegration()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    llm = create_llm_integration()
    
    response = llm.generate_response(
        "Hello, what is your name?",
        model="gpt-3.5-turbo"
    )
    
    print(f"Response: {response.content}")
    print(f"Tokens: {response.tokens_used}")
    print(f"Latency: {response.latency_ms:.2f}ms")
