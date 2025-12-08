# PHASE 9 - LLM Integration

## Описание

Этап 1 масштабирования ARQ AI Assistant с интеграцией языковой модели. Добавляем поддержку LLM через OpenAI API и локальный Ollama сервер.

## Целевые показатели

- Интеграция OpenAI API (gpt-4, gpt-3.5-turbo)
- Поддержка локального Ollama (llama2, mistral)
- Streaming responses для реального времени
- Context window management (12k tokens)
- API Endpoints для LLM запросов
- Retry logic с exponential backoff
- Rate limiting и quotas
- Полное покрытие тестами (30+ test cases)

## Архитектура

```
┌─────────────┐
│  ARQ User   │
└──────┬──────┘
       │
    (HTTP)
       │
┌──────▼──────────────────────┐
│   Flask Application          │
│  (Port 8001 - Variant B+)    │
└──────┬───────────────────────┘
       │
    (Module)
       │
┌──────▼──────────────────────┐
│  /src/llm_integration.py     │
│  - LLM Router                │
│  - OpenAI Client             │
│  - Ollama Client             │
│  - Context Manager           │
│  - Streaming Handler         │
└──────┬──────────────────────┘
       │
    ┌──┴──┐
    │     │
┌───▼──┐ ┌▼────────┐
│OpenAI│ │Ollama   │
│ API  │ │Server   │
└──────┘ └─────────┘
```

## Структура модуля llm_integration.py

```python
class LLMIntegration:
    def __init__(self, config):
        self.openai_client = OpenAI(api_key=config['openai_key'])
        self.ollama_client = OllamaClient(config['ollama_url'])
        self.context_manager = ContextManager()
        self.streaming_handler = StreamingHandler()
    
    def generate_response(self, prompt, model=None, streaming=False):
        # Основной метод генерации
        pass
    
    def stream_response(self, prompt, model=None):
        # Streaming ответ в реальном времени
        pass
    
    def manage_context(self, messages, max_tokens=12000):
        # Управление контекстным окном
        pass
    
    def handle_retry(self, func, max_retries=3):
        # Retry с exponential backoff
        pass
```

## API Endpoints

### POST /api/v1/llm/generate

Основной endpoint для генерации LLM ответа.

**Request:**
```json
{
  "prompt": "string",
  "model": "gpt-4 | gpt-3.5-turbo | ollama",
  "temperature": 0.7,
  "max_tokens": 1000,
  "streaming": false,
  "context": [
    {"role": "user", "content": "message"},
    {"role": "assistant", "content": "response"}
  ]
}
```

**Response:**
```json
{
  "content": "generated response",
  "model": "gpt-4",
  "tokens_used": 150,
  "timestamp": "2025-12-01T12:00:00Z",
  "latency_ms": 345
}
```

### POST /api/v1/llm/stream

Streaming endpoint для получения ответа в реальном времени.

**Response (Server-Sent Events):**
```
data: {"chunk": "Hello"}
data: {"chunk": " World"}
data: {"chunk": "!"}
data: {"done": true}
```

### POST /api/v1/llm/context

Управление контекстом разговора.

**Request:**
```json
{
  "messages": [...],
  "max_tokens": 12000
}
```

**Response:**
```json
{
  "optimized_context": [...],
  "tokens_used": 8000,
  "removed_messages": 2
}
```

## Зависимости

```
openai==1.3.0
requests==2.31.0
pydantic==2.0.0
python-dotenv==1.0.0
llama-index==0.9.0
aiohttp==3.9.0
```

## Переменные окружения

```
OPENAI_API_KEY=sk-...your-key...
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2
DEFAULT_MODEL=gpt-4
MODEL_TIMEOUT=30
RETRY_MAX_ATTEMPTS=3
RETRY_BACKOFF_FACTOR=2
MAX_CONTEXT_TOKENS=12000
STREAMING_CHUNK_SIZE=50
```

## Поэтапная реализация

### Неделя 1: Base Implementation
- [x] Создать модуль llm_integration.py
- [x] Интегрировать OpenAI API
- [x] Интегрировать Ollama API
- [x] Реализовать генерацию ответов
- [x] Создать простые тесты (5 тестов)

### Неделя 2: Advanced Features
- [x] Реализовать streaming responses
- [x] Добавить context management
- [x] Реализовать retry logic
- [x] Добавить rate limiting
- [x] Создать расширенные тесты (25+ тестов)

## Развёртывание

### Этап 1: Код развёртывания

1. Закоммитить модуль в GitHub
2. Создать /src/llm_integration.py
3. Обновить requirements.txt
4. Запустить локальное тестирование

### Этап 2: Staging Deployment

1. Запустить Variant B+ на порту 8001 с LLM модулем
2. Провести 10 минут тестирования
3. Проверить все health checks
4. Мониторить memory usage (целевой диапазон: 11-17 MB)

### Этап 3: Production Migration

1. Canary deployment (10% traffic) - 15 минут
2. Halfway deployment (50% traffic) - 15 минут
3. Full deployment (100% traffic) - 15+ минут
4. Monitoring и verification

### Этап 4: Rollback Strategy

Если возникнут ошибки:
1. Откатить на Variant A (Port 8000)
2. Провести анализ ошибок
3. Исправить и переделать deployment

## Тестирование

### Unit Tests (15 тестов)

```python
def test_llm_generate_openai():
    """Test OpenAI API integration"""

def test_llm_generate_ollama():
    """Test Ollama API integration"""

def test_streaming_response():
    """Test streaming response handler"""

def test_context_management():
    """Test context window management"""

def test_retry_logic():
    """Test retry with exponential backoff"""
# ... и ещё 10 тестов
```

### Integration Tests (10 тестов)

```python
def test_end_to_end_openai():
    """Full flow with OpenAI"""

def test_end_to_end_ollama():
    """Full flow with Ollama"""

def test_api_endpoint_generate():
    """Test /api/v1/llm/generate endpoint"""

def test_api_endpoint_stream():
    """Test /api/v1/llm/stream endpoint"""

def test_error_handling():
    """Test error handling and recovery"""
# ... и ещё 5 тестов
```

### Performance Tests (5 тестов)

```python
def test_response_time_openai():
    """Verify response time < 500ms"""

def test_memory_usage():
    """Verify memory stays in 11-17 MB range"""

def test_concurrent_requests():
    """Test 10 concurrent requests"""

def test_rate_limiting():
    """Test rate limiting enforcement"""

def test_long_context():
    """Test with large context window"""
```

## Мониторинг и метрики

### Основные метрики

- Response time (p50, p95, p99)
- Model availability (OpenAI vs Ollama)
- Token usage (cost tracking)
- Error rate
- Memory usage per request
- Context window efficiency

### Logging

```
[LLM] [2025-12-01 12:00:00] Model: gpt-4, Tokens: 150, Time: 345ms
[LLM] [2025-12-01 12:00:01] Streaming request started
[LLM] [2025-12-01 12:00:02] Retry attempt 1 for model OpenAI
```

## Security

- API keys в переменных окружения (никогда не в коде)
- Rate limiting (100 req/min на IP)
- Input validation и sanitization
- Output filtering от harmful content
- Token budget monitoring

## Следующие этапы

После успешного завершения Phase 9:

**Phase 10 - Browser Automation** (2-3 недели)
- Selenium + Playwright интеграция
- Script execution capability
- Screenshot/recording

**Phase 11 - System Control** (2-3 недели)
- PyAutoGUI для mouse/keyboard
- psutil для system monitoring
- File system operations

**Phase 12 - Multi-Agent Orchestration** (2-4 недели)
- Task planning и scheduling
- Agent coordination
- Resource optimization

## Контрольный лист завершения

- [ ] Модуль llm_integration.py создан и протестирован
- [ ] OpenAI API интегрирован
- [ ] Ollama API интегрирован
- [ ] Streaming responses работают
- [ ] Context management функционирует
- [ ] Все 30+ тестов проходят
- [ ] Документация завершена
- [ ] Staging deployment успешен
- [ ] Production migration выполнена
- [ ] Мониторинг показывает нормальные метрики
- [ ] Variant A как fallback работает
- [ ] Zero-downtime гарантирован

## Статус

**Начало:** TBD
**Планируемое завершение:** 2 недели
**Текущий статус:** Готов к запуску
