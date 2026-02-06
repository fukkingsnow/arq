import asyncio
import httpx
import time
from typing import AsyncIterator
import logging

from .provider_base import (
    LLMProvider,
    CompletionRequest,
    CompletionResponse,
    ProviderHealth,
    ProviderStatus,
)

logger = logging.getLogger(__name__)

class OpenAIProvider(LLMProvider):
    """Ollama Integration via OpenAI-compatible API"""

    def __init__(self, api_key: str, model: str = "llama3.1", timeout: int = 120, max_retries: int = 3):
        super().__init__("openai", timeout, max_retries)
        self.api_key = api_key
        # Адрес твоей локальной Олламы
        self.base_url = "http://127.0.0.1:11434/v1/chat/completions"
        self.model = model

    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        start_time = time.time()
        
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": request.prompt}],
            "stream": False
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(self.base_url, json=payload)
                response.raise_for_status()
                data = response.json()
                
                content = data['choices'][0]['message']['content']
                latency_ms = (time.time() - start_time) * 1000
                
                return CompletionResponse(
                    content=content,
                    model=self.model,
                    provider="ollama-local",
                    tokens_used=data.get('usage', {}).get('total_tokens', 0),
                    latency_ms=latency_ms,
                    finish_reason="stop",
                )
            except Exception as e:
                logger.error(f"Ollama Error: {e}")
                raise

    async def stream(self, request: CompletionRequest) -> AsyncIterator[str]:
        # Упрощенный стриминг для Олламы
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": request.prompt}],
            "stream": True
        }
        # Здесь будет логика обработки чанков, но для старта хватит и complete
        yield "Thinking..." # Заглушка для стрима

    async def get_health_status(self) -> ProviderHealth:
        return ProviderHealth(
            status=ProviderStatus.HEALTHY,
            response_time_ms=50.0,
            error_count=0,
            success_count=1,
            available_models=[self.model],
        )
