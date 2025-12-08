# Phase 9 - Main.py Update Guide

## Step-by-Step Integration of LLM Module into main.py

### Overview

This guide provides instructions for integrating the LLM module into the main FastAPI application. The LLM module should be initialized at startup and the LLM router should be registered with the application.

### Changes Required in main.py

#### 1. Add Imports

Add these imports after the existing imports (around line 16):

```python
# Phase 9 - LLM Integration
from src.llm_integration import create_llm_integration
from src.routes_llm_endpoints import llm_router, initialize_llm_router
```

#### 2. Create FastAPI App Instance

Find the line where FastAPI app is created. It should already exist, but make sure it's:

```python
app = FastAPI(
    title="ARQ - AI Assistant Backend",
    description="Intelligent AI Assistant with Memory & Context Management",
    version="9.0.0"
)
```

#### 3. Add Startup Event for LLM Initialization

Add this code after the app is created (before any route registration):

```python
# ==========================================
# Phase 9: LLM Integration Startup
# ==========================================

llm_integration_instance = None
start_time = None


@app.on_event("startup")
async def startup_event():
    """Initialize LLM module and routers on application startup"""
    global llm_integration_instance, start_time
    try:
        start_time = datetime.now()
        
        logger.info("[PHASE 9] Initializing LLM Integration Module...")
        
        # Create LLM integration instance
        llm_integration_instance = create_llm_integration()
        logger.info("[PHASE 9] LLM Integration instance created successfully")
        
        # Initialize LLM router with LLM integration
        initialize_llm_router(llm_integration_instance)
        logger.info("[PHASE 9] LLM router initialized")
        
        logger.info("[PHASE 9] All LLM modules initialized successfully")
    except Exception as e:
        logger.error(f"[PHASE 9] LLM Initialization Error: {str(e)}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    logger.info("[PHASE 9] LLM Integration shutting down...")
```

#### 4. Register LLM Router

Add this after the other routers are registered (find existing router includes):

```python
# Register LLM endpoints (Phase 9)
app.include_router(llm_router, tags=["LLM Integration"])
```

#### 5. Update Health Check Endpoint

Update the existing health check endpoint to include LLM status:

```python
@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint with Phase 9 LLM integration status"""
    global llm_integration_instance
    
    uptime = (datetime.now() - start_time).total_seconds() if start_time else 0
    
    llm_status = "healthy"
    if llm_integration_instance is None:
        llm_status = "not_initialized"
    
    return HealthCheckResponse(
        status="healthy" if llm_status == "healthy" else "degraded",
        version="9.0.0",
        database="connected",
        redis="connected",
        llm_service=llm_status,
        uptime_seconds=uptime
    )
```

### Code Location Reference

In main.py, the file structure should be:

1. **Lines 1-20:** Imports (ADD LLM imports here)
2. **Lines 20-30:** FastAPI app creation
3. **Lines 30-50:** Startup/Shutdown events (ADD startup event here)
4. **Lines 50-100:** Route registrations (ADD router inclusion here)
5. **Lines 100+:** Existing endpoints

### Testing the Integration

After applying these changes, test with:

```bash
# Test startup
curl http://localhost:8000/health

# Test LLM endpoint
curl -X POST http://localhost:8000/api/v1/llm/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "model": "gpt-4"}'

# Test context endpoint
curl -X POST http://localhost:8000/api/v1/llm/context \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hi"}], "max_tokens": 12000}'

# Test LLM health
curl http://localhost:8000/api/v1/llm/health
```

### Deployment Checklist

- [ ] Add LLM imports to main.py
- [ ] Add startup event for LLM initialization
- [ ] Register LLM router
- [ ] Update health check endpoint with LLM status
- [ ] Test all endpoints locally
- [ ] Verify health checks pass
- [ ] Check memory usage (target: 11-17 MB)
- [ ] Verify error handling
- [ ] Document any custom configurations
- [ ] Commit changes to GitHub

### Configuration via Environment Variables

Make sure these environment variables are set:

```bash
OPENAI_API_KEY=sk-...your-key...
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2
DEFAULT_MODEL=gpt-4
MODEL_TIMEOUT=30
RETRY_MAX_ATTEMPTS=3
RETRY_BACKOFF_FACTOR=2
MAX_CONTEXT_TOKENS=12000
```

### Troubleshooting

**Issue:** LLM module not found
- **Solution:** Ensure `llm_integration.py` is in `/src` directory
- **Check:** `python -c "from src.llm_integration import create_llm_integration"`

**Issue:** OpenAI API key not found
- **Solution:** Set `OPENAI_API_KEY` environment variable
- **Check:** `echo $OPENAI_API_KEY`

**Issue:** Ollama connection refused
- **Solution:** Ensure Ollama server is running
- **Check:** `curl http://localhost:11434/api/tags`

**Issue:** LLM router not available
- **Solution:** Check that `initialize_llm_router()` was called with correct instance
- **Check:** Logs should show "LLM router initialized"

### Phase 9 Integration Status

✅ Completed:
- LLM integration module created
- Test suite developed (30+ tests)
- API endpoints defined
- Routes module created

⏳ Next:
- ✓ Main.py integration (THIS GUIDE)
- [ ] Staging deployment
- [ ] Production canary migration
- [ ] 24/7 monitoring

### Support

For questions or issues:
1. Check logs: `tail -f app.log`
2. Test health: `curl http://localhost:8000/health`
3. Verify config: `env | grep OPENAI`
4. Review documentation in PHASE_9_LLM_INTEGRATION.md
