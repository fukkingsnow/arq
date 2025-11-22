"""workflow_manager.py - Phase 11: Workflow and task management system.

Provides task scheduling, workflow orchestration, dependency resolution, and
workflow state management for complex multi-step automation processes.
"""

from typing import Dict, List, Optional, Any, Callable, Set
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
import logging
import uuid
from collections import defaultdict, deque


class TaskStatus(Enum):
    """Status of a task in workflow."""
    PENDING = "pending"
    READY = "ready"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    BLOCKED = "blocked"


class WorkflowStrategy(Enum):
    """Workflow execution strategy."""
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    ADAPTIVE = "adaptive"
    BATCH = "batch"


@dataclass
class Task:
    """Represents a single task in a workflow."""
    task_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    action: Callable = None
    status: TaskStatus = TaskStatus.PENDING
    priority: int = 5  # 1-10, lower is higher priority
    dependencies: Set[str] = field(default_factory=set)
    retry_count: int = 0
    max_retries: int = 3
    timeout: int = 60  # seconds
    result: Optional[Any] = None
    error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def get_duration(self) -> float:
        """Get task execution duration in seconds."""
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return 0.0
    
    def is_ready_to_run(self) -> bool:
        """Check if task is ready to execute."""
        return self.status == TaskStatus.READY
    
    def can_retry(self) -> bool:
        """Check if task can be retried."""
        return self.retry_count < self.max_retries


@dataclass
class Workflow:
    """Container for workflow tasks and execution logic."""
    workflow_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    tasks: Dict[str, Task] = field(default_factory=dict)
    strategy: WorkflowStrategy = WorkflowStrategy.SEQUENTIAL
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def add_task(self, task: Task) -> None:
        """Add task to workflow."""
        self.tasks[task.task_id] = task
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """Get task by ID."""
        return self.tasks.get(task_id)
    
    def remove_task(self, task_id: str) -> bool:
        """Remove task from workflow."""
        if task_id in self.tasks:
            del self.tasks[task_id]
            return True
        return False
    
    def get_duration(self) -> float:
        """Get total workflow execution time."""
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return 0.0


class TaskScheduler:
    """Schedules and manages task execution order."""
    
    def __init__(self, logger: Optional[logging.Logger] = None):
        """Initialize task scheduler.
        
        Args:
            logger: Logger instance for debug output
        """
        self.logger = logger or logging.getLogger(__name__)
        self.ready_queue: deque = deque()
        self.task_status: Dict[str, TaskStatus] = {}
        self.execution_order: List[str] = []
    
    def schedule(self, workflow: Workflow) -> List[str]:
        """Schedule workflow tasks for execution.
        
        Returns:
            List of task IDs in execution order
        """
        self.execution_order = []
        self.task_status = {task_id: task.status for task_id, task in workflow.tasks.items()}
        
        # Priority-based scheduling
        sorted_tasks = sorted(workflow.tasks.values(), key=lambda t: t.priority)
        
        for task in sorted_tasks:
            if task.status == TaskStatus.PENDING:
                task.status = TaskStatus.READY
                self.ready_queue.append(task.task_id)
                self.execution_order.append(task.task_id)
        
        self.logger.debug(f"Scheduled {len(self.execution_order)} tasks")
        return self.execution_order
    
    def get_next_task(self) -> Optional[str]:
        """Get next ready task for execution."""
        if self.ready_queue:
            return self.ready_queue.popleft()
        return None
    
    def mark_complete(self, task_id: str) -> None:
        """Mark task as completed."""
        self.task_status[task_id] = TaskStatus.COMPLETED
        self.logger.debug(f"Task {task_id} marked complete")
    
    def mark_failed(self, task_id: str) -> None:
        """Mark task as failed."""
        self.task_status[task_id] = TaskStatus.FAILED
        self.logger.debug(f"Task {task_id} marked failed")


class DependencyResolver:
    """Resolves and manages task dependencies."""
    
    def __init__(self, logger: Optional[logging.Logger] = None):
        """Initialize dependency resolver.
        
        Args:
            logger: Logger instance
        """
        self.logger = logger or logging.getLogger(__name__)
        self.dependency_graph: Dict[str, Set[str]] = defaultdict(set)
        self.reverse_graph: Dict[str, Set[str]] = defaultdict(set)
    
    def build_graph(self, workflow: Workflow) -> bool:
        """Build dependency graph from workflow tasks.
        
        Returns:
            True if graph is valid (no cycles), False otherwise
        """
        self.dependency_graph.clear()
        self.reverse_graph.clear()
        
        # Build graphs from task dependencies
        for task_id, task in workflow.tasks.items():
            for dep_id in task.dependencies:
                self.dependency_graph[task_id].add(dep_id)
                self.reverse_graph[dep_id].add(task_id)
        
        # Check for cycles
        if self._has_cycle(workflow):
            self.logger.error("Circular dependency detected")
            return False
        
        self.logger.debug("Dependency graph built successfully")
        return True
    
    def _has_cycle(self, workflow: Workflow) -> bool:
        """Detect cycles in dependency graph using DFS."""
        visited = set()
        rec_stack = set()
        
        def dfs(node: str) -> bool:
            visited.add(node)
            rec_stack.add(node)
            
            for neighbor in self.dependency_graph.get(node, set()):
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            
            rec_stack.remove(node)
            return False
        
        for task_id in workflow.tasks:
            if task_id not in visited:
                if dfs(task_id):
                    return True
        
        return False
    
    def get_dependencies(self, task_id: str) -> Set[str]:
        """Get all dependencies for a task."""
        return self.dependency_graph.get(task_id, set())
    
    def get_dependents(self, task_id: str) -> Set[str]:
        """Get all tasks that depend on given task."""
        return self.reverse_graph.get(task_id, set())
    
    def get_critical_path(self, workflow: Workflow) -> List[str]:
        """Calculate critical path through workflow.
        
        Returns:
            List of task IDs forming the critical path
        """
        # Simple implementation: longest path through DAG
        path_lengths = {}
        
        def calculate_length(task_id: str) -> int:
            if task_id in path_lengths:
                return path_lengths[task_id]
            
            max_dep_length = 0
            for dep_id in self.dependency_graph.get(task_id, set()):
                max_dep_length = max(max_dep_length, calculate_length(dep_id))
            
            path_lengths[task_id] = max_dep_length + 1
            return path_lengths[task_id]
        
        # Calculate lengths for all tasks
        for task_id in workflow.tasks:
            calculate_length(task_id)
        
        # Build critical path
        critical_path = []
        current_length = max(path_lengths.values()) if path_lengths else 0
        
        for task_id, length in sorted(path_lengths.items(), key=lambda x: x[1], reverse=True):
            if length == current_length:
                critical_path.append(task_id)
                current_length -= 1
        
        return critical_path


class WorkflowManager:
    """Central manager for workflow execution and coordination."""
    
    def __init__(self, logger: Optional[logging.Logger] = None):
        """Initialize workflow manager.
        
        Args:
            logger: Logger instance
        """
        self.logger = logger or logging.getLogger(__name__)
        self.workflows: Dict[str, Workflow] = {}
        self.scheduler = TaskScheduler(logger)
        self.resolver = DependencyResolver(logger)
    
    def create_workflow(self, name: str, strategy: WorkflowStrategy = WorkflowStrategy.SEQUENTIAL) -> Workflow:
        """Create new workflow."""
        workflow = Workflow(name=name, strategy=strategy)
        self.workflows[workflow.workflow_id] = workflow
        self.logger.debug(f"Created workflow {workflow.workflow_id}: {name}")
        return workflow
    
    def get_workflow(self, workflow_id: str) -> Optional[Workflow]:
        """Get workflow by ID."""
        return self.workflows.get(workflow_id)
    
    def validate_workflow(self, workflow: Workflow) -> bool:
        """Validate workflow structure and dependencies.
        
        Returns:
            True if workflow is valid
        """
        if not workflow.tasks:
            self.logger.error("Workflow has no tasks")
            return False
        
        if not self.resolver.build_graph(workflow):
            return False
        
        # Verify all dependencies exist
        for task_id, task in workflow.tasks.items():
            for dep_id in task.dependencies:
                if dep_id not in workflow.tasks:
                    self.logger.error(f"Task {task_id} depends on non-existent task {dep_id}")
                    return False
        
        self.logger.debug(f"Workflow {workflow.workflow_id} validation passed")
        return True
    
    def get_execution_plan(self, workflow: Workflow) -> Optional[List[str]]:
        """Get execution plan for workflow.
        
        Returns:
            List of task IDs in execution order, or None if invalid
        """
        if not self.validate_workflow(workflow):
            return None
        
        plan = self.scheduler.schedule(workflow)
        self.logger.debug(f"Generated execution plan: {plan}")
        return plan
    
    def get_workflow_stats(self, workflow: Workflow) -> Dict[str, Any]:
        """Get workflow execution statistics."""
        total_tasks = len(workflow.tasks)
        completed_tasks = sum(1 for t in workflow.tasks.values() if t.status == TaskStatus.COMPLETED)
        failed_tasks = sum(1 for t in workflow.tasks.values() if t.status == TaskStatus.FAILED)
        
        return {
            "workflow_id": workflow.workflow_id,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "failed_tasks": failed_tasks,
            "pending_tasks": total_tasks - completed_tasks - failed_tasks,
            "completion_percentage": (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
            "duration": workflow.get_duration()
        }
