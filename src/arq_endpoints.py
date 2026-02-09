from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import logging
import json
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/arq", tags=["ARQ Development"])

# --- ПУТЬ К БАЗЕ ДАННЫХ (Persistent Storage) ---
DATA_DIR = "/app/data"
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR, exist_ok=True)

TASKS_DB_PATH = os.path.join(DATA_DIR, "tasks_db.json")

class DevelopmentGoal(BaseModel):
    title: str
    description: str
    priority: str = "high"
    goals: list = []
    max_iterations: int = 5

class DevelopmentResponse(BaseModel):
    status: str
    message: str
    task_id: str
    timestamp: str
    iteration: int = 0

# --- СЕКЦИЯ РАБОТЫ С ДИСКОМ ---

def save_tasks_to_disk(tasks_dict):
    try:
        serializable_tasks = {}
        for tid, data in tasks_dict.items():
            task_copy = data.copy()
            if isinstance(task_copy["goal"], DevelopmentGoal):
                task_copy["goal"] = task_copy["goal"].dict()
            if isinstance(task_copy["start_time"], datetime):
                task_copy["start_time"] = task_copy["start_time"].isoformat()
            serializable_tasks[tid] = task_copy
        
        with open(TASKS_DB_PATH, "w", encoding="utf-8") as f:
            json.dump(serializable_tasks, f, ensure_ascii=False, indent=4)
    except Exception as e:
        logger.error(f"Error saving tasks: {e}")

def load_tasks_from_disk():
    if os.path.exists(TASKS_DB_PATH):
        try:
            with open(TASKS_DB_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                for tid, task in data.items():
                    task["goal"] = DevelopmentGoal(**task["goal"])
                    task["start_time"] = datetime.fromisoformat(task["start_time"])
                return data
        except Exception as e:
            logger.error(f"Error loading tasks: {e}")
    return {}

# Инициализация
development_tasks = load_tasks_from_disk()

def get_next_task_counter():
    if not development_tasks: return 0
    try:
        ids = [int(tid.split('-')[1]) for tid in development_tasks.keys()]
        return max(ids)
    except: return len(development_tasks)

task_counter = get_next_task_counter()

# --- ЭНДПОИНТЫ ---

@router.get("/tasks")
async def get_all_tasks():
    """Новый эндпоинт для твоего фронтенда: отдает всё из памяти"""
    # Преобразуем словарь в список для удобства фронта
    tasks_list = []
    for tid, data in development_tasks.items():
        tasks_list.append({
            "task_id": tid,
            "status": data["status"],
            "iterations": data["iterations"],
            "start_time": data["start_time"].isoformat() if isinstance(data["start_time"], datetime) else data["start_time"],
            "goal": data["goal"].dict() if hasattr(data["goal"], "dict") else data["goal"]
        })
    return {"tasks": tasks_list}

@router.post("/start-development", response_model=DevelopmentResponse)
async def start_development(goal: DevelopmentGoal) -> DevelopmentResponse:
    global task_counter
    task_counter += 1
    task_id = f"task-{task_counter}"
    
    development_tasks[task_id] = {
        "goal": goal,
        "status": "running",
        "start_time": datetime.now(),
        "iterations": 0,
        "results": []
    }
    save_tasks_to_disk(development_tasks)
    
    return DevelopmentResponse(
        status="success",
        message=f"Started: {goal.title}",
        task_id=task_id,
        timestamp=datetime.now().isoformat(),
        iteration=1
    )

@router.get("/health")
async def arq_health():
    # Теперь health тоже отдает список задач, чтобы фронт сразу всё видел
    tasks_list = [t for t in development_tasks.values()] # упрощенно
    return {
        "status": "healthy",
        "active_tasks": len([t for t in development_tasks.values() if t["status"] == "running"]),
        "total_tasks": len(development_tasks),
        "tasks": list(development_tasks.values()) # Для твоего app.js
    }
