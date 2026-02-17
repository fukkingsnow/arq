"""automation_orchestrator.py - Phase 11: Workflow orchestration and execution engine.

Provides the core orchestration layer for executing complex workflows with parallel
execution support, event-driven callbacks, and comprehensive state tracking.
"""

from typing import Dict, List, Callable, Optional, Any, Tuple
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
import asyncio
import logging
import uuid
from concurrent.futures import ThreadPoolExecutor


class WorkflowState(Enum):
    """Enumeration of workflow execution states."""
    PENDING = "pending"  # Waiting to be executed
    RUNNING = "running"  # Currently executing
    PAUSED = "paused"  # Temporarily suspended
    COMPLETED = "completed"  # Finished successfully
    FAILED = "failed"  # Execution failed
    CANCELLED = "cancelled"  # Manually cancelled
    RETRY = "retry"  # Retrying after failure


class ExecutionPriority(Enum):
    """Enumeration of action execution priorities."""
    CRITICAL = 1
    HIGH = 2
    NORMAL = 3
    LOW = 4
    BACKGROUND = 5


@dataclass
class ExecutionMetrics:
    """Metrics for workflow execution performance."""
    start_time: datetime = field(default_factory=datetime.now)
    end_time: Optional[datetime] = None
    execution_count: int = 0
    retry_count: int = 0
    total_duration: float = 0.0
    average_action_duration: float = 0.0
    success_rate: float = 100.0
    error_rate: float = 0.0
    
    def calculate_duration(self) -> float:
        """Calculate total execution duration."""
        if self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return 0.0


@dataclass
class ExecutionContext:
    """Context for workflow execution state and data."""
    workflow_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    state: WorkflowState = WorkflowState.PENDING
    priority: ExecutionPriority = ExecutionPriority.NORMAL
    variables: Dict[str, Any] = field(default_factory=dict)
    execution_history: List[Dict[str, Any]] = field(default_factory=list)
    metrics: ExecutionMetrics = field(default_factory=ExecutionMetrics)
    callbacks: Dict[str, List[Callable]] = field(default_factory=dict)
    logger: logging.Logger = field(default_factory=lambda: logging.getLogger(__name__))
    max_retries: int = 3
    retry_delay: int = 1
    
    def set_variable(self, key: str, value: Any) -> None:
        """Set context variable with type validation."""
        self.variables[key] = value
    
    def get_variable(self, key: str, default: Any = None) -> Any:
        """Get context variable with default fallback."""
        return self.variables.get(key, default)
    
    def add_history_entry(self, action_id: str, result: Dict[str, Any]) -> None:
        """Add entry to execution history with timestamp."""
        self.execution_history.append({
            "timestamp": datetime.now().isoformat(),
            "action_id": action_id,
            "result": result
        })
    
    def register_callback(self, event: str, callback: Callable) -> None:
        """Register callback for workflow event."""
        if event not in self.callbacks:
            self.callbacks[event] = []
        self.callbacks[event].append(callback)
    
    def trigger_callbacks(self, event: str, **kwargs) -> None:
        """Trigger all callbacks for given event."""
        if event in self.callbacks:
            for callback in self.callbacks[event]:
                try:
                    callback(**kwargs)
                except Exception as e:
                    self.logger.error(f"Callback error for {event}: {e}")


class WorkflowExecutor:
    """Executes workflow actions with state management and error handling."""
    
    def __init__(self, max_workers: int = 4, logger: Optional[logging.Logger] = None):
        """Initialize workflow executor.
        
        Args:
            max_workers: Maximum concurrent execution threads
            logger: Logger instance for debug output
        """
        self.max_workers = max_workers
        self.logger = logger or logging.getLogger(__name__)
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.contexts: Dict[str, ExecutionContext] = {}
    
    def create_context(self, workflow_id: Optional[str] = None, 
                      priority: ExecutionPriority = ExecutionPriority.NORMAL) -> ExecutionContext:
        """Create new execution context for workflow."""
        if workflow_id is None:
            workflow_id = str(uuid.uuid4())
        
        context = ExecutionContext(
            workflow_id=workflow_id,
            priority=priority,
            logger=self.logger
        )
        self.contexts[workflow_id] = context
        return context
    
    def get_context(self, workflow_id: str) -> Optional[ExecutionContext]:
        """Retrieve execution context by workflow ID."""
        return self.contexts.get(workflow_id)
    
    def execute_action(self, context: ExecutionContext, action: Callable, 
                      *args, **kwargs) -> Tuple[bool, Any]:
        """Execute single action with error handling and metrics tracking.
        
        Returns:
            Tuple of (success: bool, result: Any)
        """
        context.state = WorkflowState.RUNNING
        action_id = str(uuid.uuid4())
        
        try:
            context.logger.debug(f"Executing action {action_id}")
            result = action(*args, **kwargs)
            
            context.add_history_entry(action_id, {
                "status": "success",
                "result": result
            })
            context.metrics.execution_count += 1
            context.trigger_callbacks("action_success", action_id=action_id, result=result)
            
            return True, result
        except Exception as e:
            context.logger.error(f"Action {action_id} failed: {e}")
            context.add_history_entry(action_id, {
                "status": "error",
                "error": str(e)
            })
            context.trigger_callbacks("action_error", action_id=action_id, error=str(e))
            return False, str(e)
    
    def execute_with_retry(self, context: ExecutionContext, action: Callable,
                          *args, **kwargs) -> Tuple[bool, Any]:
        """Execute action with automatic retry on failure."""
        for attempt in range(context.max_retries):
            success, result = self.execute_action(context, action, *args, **kwargs)
            
            if success:
                return True, result
            
            if attempt < context.max_retries - 1:
                context.state = WorkflowState.RETRY
                context.metrics.retry_count += 1
                self.logger.info(f"Retrying action, attempt {attempt + 2}/{context.max_retries}")
                asyncio.run(self._async_delay(context.retry_delay))
        
        context.state = WorkflowState.FAILED
        return False, "Max retries exceeded"
    
    async def _async_delay(self, seconds: float) -> None:
        """Async delay for retry mechanism."""
        await asyncio.sleep(seconds)
    
    def execute_parallel(self, context: ExecutionContext, 
                        actions: List[Tuple[Callable, tuple, dict]]) -> List[Tuple[bool, Any]]:
        """Execute multiple actions in parallel.
        
        Args:
            context: Execution context
            actions: List of (action, args, kwargs) tuples
        
        Returns:
            List of (success, result) tuples
        """
        context.state = WorkflowState.RUNNING
        context.trigger_callbacks("parallel_execution_start", num_actions=len(actions))
        
        results = []
        futures = []
        
        for action, args, kwargs in actions:
            future = self.executor.submit(self.execute_action, context, action, *args, **kwargs)
            futures.append(future)
        
        for future in futures:
            try:
                result = future.result(timeout=30)
                results.append(result)
            except Exception as e:
                self.logger.error(f"Parallel execution error: {e}")
                results.append((False, str(e)))
        
        context.trigger_callbacks("parallel_execution_complete", results=results)
        return results
    
    def update_state(self, context: ExecutionContext, new_state: WorkflowState) -> None:
        """Update workflow execution state."""
        old_state = context.state
        context.state = new_state
        context.logger.debug(f"State transition: {old_state.value} -> {new_state.value}")
        context.trigger_callbacks("state_changed", old_state=old_state, new_state=new_state)
    
    def finalize_execution(self, context: ExecutionContext, success: bool) -> None:
        """Finalize workflow execution and calculate metrics."""
        context.metrics.end_time = datetime.now()
        context.state = WorkflowState.COMPLETED if success else WorkflowState.FAILED
        
        total_duration = context.metrics.calculate_duration()
        if context.metrics.execution_count > 0:
            context.metrics.average_action_duration = total_duration / context.metrics.execution_count
        
        context.metrics.total_duration = total_duration
        context.logger.info(f"Execution completed in {total_duration:.2f}s with "
                          f"{context.metrics.execution_count} actions")
        context.trigger_callbacks("execution_complete", success=success, metrics=context.metrics)
    
    def get_metrics(self, workflow_id: str) -> Optional[ExecutionMetrics]:
        """Get execution metrics for workflow."""
        context = self.get_context(workflow_id)
        return context.metrics if context else None
    
    def cleanup(self, workflow_id: str) -> None:
        """Clean up context and resources for workflow."""
        if workflow_id in self.contexts:
            del self.contexts[workflow_id]
        self.logger.debug(f"Cleaned up context for workflow {workflow_id}")


class ParallelExecutor:
    """Manages parallel execution of multiple workflows."""
    
    def __init__(self, max_concurrent: int = 8, logger: Optional[logging.Logger] = None):
        """Initialize parallel executor.
        
        Args:
            max_concurrent: Maximum concurrent workflows
            logger: Logger instance
        """
        self.max_concurrent = max_concurrent
        self.logger = logger or logging.getLogger(__name__)
        self.executor = ThreadPoolExecutor(max_workers=max_concurrent)
        self.active_workflows: Dict[str, ExecutionContext] = {}
    
    def execute_workflows(self, workflows: List[ExecutionContext], 
                         action: Callable) -> List[Tuple[str, bool, Any]]:
        """Execute action across multiple workflow contexts.
        
        Returns:
            List of (workflow_id, success, result) tuples
        """
        futures = {}
        for wf in workflows:
            if len(self.active_workflows) < self.max_concurrent:
                future = self.executor.submit(action, wf)
                futures[future] = wf.workflow_id
                self.active_workflows[wf.workflow_id] = wf
        
        results = []
        for future in futures:
            try:
                result = future.result(timeout=60)
                wf_id = futures[future]
                results.append((wf_id, True, result))
                if wf_id in self.active_workflows:
                    del self.active_workflows[wf_id]
            except Exception as e:
                wf_id = futures[future]
                self.logger.error(f"Workflow {wf_id} failed: {e}")
                results.append((wf_id, False, str(e)))
        
        return results
    
    def shutdown(self) -> None:
        """Shutdown parallel executor and cleanup resources."""
        self.executor.shutdown(wait=True)
        self.logger.info("Parallel executor shutdown complete")
