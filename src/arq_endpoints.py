import httpx
import asyncio
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime
import json
import os

router = APIRouter(prefix="/api/v1/arq", tags=["ARQ AI Engine"])

# Настройки
DATA_DIR = "/app/data"
TASKS_DB_PATH = os.path.join(DATA_DIR, "tasks_db.json")
OLLAMA_URL = "http://host.docker.internal:11434/api/generate" # Для связи из Docker с хостом

class DevelopmentGoal(BaseModel):
    title: str
    description: str = ""
    max_iterations: int = 5

# Вспомогательные функции для БД (упрощено для краткости)
def load_db():
    if os.path.exists(TASKS_DB_PATH):
        with open(TASKS_DB_PATH, "r") as f: return json.load(f)
    return {}

def save_db(data):
    with open(TASKS_DB_PATH, "w") as f: json.dump(data, f, indent=4)

# --- ГЛАВНАЯ МАГИЯ: ФОНОВЫЙ AI-ПРОЦЕСС ---
async def run_ai_task(task_id: str, prompt: str):
    db = load_db()
    if task_id not in db: return

    try:
        # 1. Обновляем статус: ИИ начал думать
        db[task_id]["status"] = "running"
        save_db(db)

        # 2. Запрос к Ollama
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(OLLAMA_URL, json={
                "model": "llama3.1:latest",
                "prompt": f"Context: You are ARQ AI. Task: {prompt}. Give a concise technical plan.",
                "stream": False
            })
            
            if response.status_code == 200:
                result = response.json().get("response", "No response from AI")
                db = load_db()
                db[task_id]["status"] = "completed"
                db[task_id]["iterations"] = db[task_id]["goal"]["max_iterations"]
                db[task_id]["results"] = [result]
            else:
                db[task_id]["status"] = "failed"
                
        save_db(db)
    except Exception as e:
        db = load_db()
        db[task_id]["status"] = f"error: {str(e)}"
        save_db(db)

# --- ЭНДПОИНТЫ ---

@router.post("/start-development")
async def start_dev(goal: DevelopmentGoal, background_tasks: BackgroundTasks):
    db = load_db()
    task_id = f"task-{len(db) + 1}"
    
    new_task = {
        "task_id": task_id,
        "goal": goal.dict(),
        "status": "pending",
        "iterations": 0,
        "start_time": datetime.now().isoformat(),
        "results": []
    }
    
    db[task_id] = new_task
    save_db(db)
    
    # Запускаем ИИ в фоне, чтобы не вешать фронтенд
    background_tasks.add_task(run_ai_task, task_id, goal.title)
    
    return {"status": "accepted", "task_id": task_id}

@router.get("/health")
async def health():
    db = load_db()
    return {
        "status": "healthy",
        "active_tasks": len([t for t in db.values() if t["status"] == "running"]),
        "tasks": list(db.values())
    }
