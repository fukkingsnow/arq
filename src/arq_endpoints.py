from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import logging
import json
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/arq", tags=["ARQ Development"])

# --- ПУТЬ К БАЗЕ ДАННЫХ (для Docker-Volume) ---
# Мы будем хранить данные в /app/data, которую пробросим на диск сервера
DATA_DIR = "/app/data"
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR, exist_ok=True)

TASKS_DB_PATH = os.path.join(DATA_DIR, "tasks_db.json")

class DevelopmentGoal(BaseModel):
    """Development goal model"""
    title: str
    description: str
    priority: str = "high"
    goals: list = []
    max_iterations: int = 5

class DevelopmentResponse(BaseModel):
    """Response for development endpoints"""
    status: str
    message: str
    task_id: str
    timestamp: str
    iteration: int = 0

# --- СЕКЦИЯ РАБОТЫ С ДИСКОМ ---

def save_tasks_to_disk(tasks_dict):
    """Сохраняет задачи в JSON файл"""
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
        logger.error(f"Error saving tasks to disk: {e}")

def load_tasks_from_disk():
    """Загружает задачи из JSON файла при старте"""
    if os.path.exists(TASKS_DB_PATH):
        try:
            with open(TASKS_DB_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                for tid, task in data.items():
                    task["goal"] = DevelopmentGoal(**task["goal"])
                    task["start_time"] = datetime.fromisoformat(task["start_time"])
                logger.info(f"Loaded {len(data)} tasks from disk")
                return data
        except Exception as e:
            logger.error(f"Error loading tasks from disk: {e}")
    return {}

# Инициализация хранилища
development_tasks = load_tasks_from_disk()

def get_next_task_counter():
    if not development_tasks:
        return 0
    try:
        ids = [int(tid.split('-')[1]) for tid in development_tasks.keys()]
        return max(ids)
    except:
        return len(development_tasks)

task_counter = get_next_task_counter()

# --- ЭНДПОИНТЫ ---

@router.post("/start-development", response_model=DevelopmentResponse)
async def start_development(goal: DevelopmentGoal) -> DevelopmentResponse:
    global task_counter
    task_counter += 1
    task_id = f"task-{task_counter}"
    
    logger.info(f"Starting ARQ development task: {task_id}")
    
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
        message=f"ARQ development cycle started for: {goal.title}",
        task_id=task_id,
        timestamp=datetime.now().isoformat(),
        iteration=1
    )

@router.get("/status/{task_id}")
async def get_development_status(task_id: str):
    if task_id not in development_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = development_tasks[task_id]
    return {
        "task_id": task_id,
        "status": task["status"],
        "iterations": task["iterations"],
        "elapsed_time": (datetime.now() - task["start_time"]).total_seconds(),
        "results": task["results"]
    }

@router.post("/execute")
async def execute_development_task(task_id: str):
    if task_id not in development_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = development_tasks[task_id]
    task["iterations"] += 1
    
    logger.info(f"Executing iteration {task['iterations']} for task {task_id}")
    
    result = {
        "iteration": task["iterations"],
        "status": "completed",
        "timestamp": datetime.now().isoformat(),
        "output": f"Development iteration {task['iterations']} completed"
    }
    
    task["results"].append(result)
    
    if task["iterations"] >= task["goal"].max_iterations:
        task["status"] = "completed"
    
    save_tasks_to_disk(development_tasks)
    
    return result

@router.get("/health", response_model=dict)
async def arq_health():
    return {
        "status": "healthy",
        "service": "ARQ-Development",
        "active_tasks": len([t for t in development_tasks.values() if t["status"] == "running"]),
        "total_tasks": len(development_tasks),
        "timestamp": datetime.now().isoformat()
    }
