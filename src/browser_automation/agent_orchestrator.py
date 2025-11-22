"""Agent Orchestrator for Phase 12 - Multi-Agent Coordination Engine

Provides agent pool management, task distribution, execution coordination,
load balancing, and resource negotiation for multi-agent systems.
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Callable
import threading
import time
from datetime import datetime
from collections import deque


class LoadBalancingStrategy(Enum):
    """Load balancing strategies for task distribution."""
    ROUND_ROBIN = "round_robin"
    LEAST_LOADED = "least_loaded"
    PRIORITY_BASED = "priority_based"
    WEIGHTED = "weighted"


class TaskAssignmentPolicy(Enum):
    """Task assignment policies for agents."""
    GREEDY = "greedy"
    FAIR = "fair"
    PRIORITY = "priority"
    CAPABILITY_MATCH = "capability_match"


@dataclass
class TaskAssignment:
    """Task assignment information."""
    task_id: str
    agent_id: str
    assigned_time: datetime
    priority: int
    estimated_duration: float
    required_capabilities: List[str] = field(default_factory=list)
    status: str = "pending"


@dataclass
class PoolMetrics:
    """Agent pool performance metrics."""
    total_agents: int
    active_agents: int
    idle_agents: int
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    avg_task_duration: float
    pool_efficiency: float


class AgentPool:
    """Manages pool of agents with lifecycle management."""
    
    def __init__(self, pool_name: str, max_agents: int = 100):
        self.pool_name = pool_name
        self.max_agents = max_agents
        self.agents: Dict[str, Dict[str, Any]] = {}
        self.pool_lock = threading.Lock()
    
    def register_agent(self, agent_id: str, capabilities: List[str]) -> bool:
        """Register agent in pool."""
        with self.pool_lock:
            if len(self.agents) >= self.max_agents:
                return False
            
            self.agents[agent_id] = {
                "id": agent_id,
                "capabilities": capabilities,
                "status": "idle",
                "current_task": None,
                "tasks_completed": 0,
                "registered_time": datetime.now()
            }
            return True
    
    def unregister_agent(self, agent_id: str) -> bool:
        """Unregister agent from pool."""
        with self.pool_lock:
            if agent_id in self.agents:
                del self.agents[agent_id]
                return True
            return False
    
    def get_pool_size(self) -> int:
        """Get current pool size."""
        with self.pool_lock:
            return len(self.agents)
    
    def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get agent information."""
        with self.pool_lock:
            return self.agents.get(agent_id)


class TaskDistributor:
    """Distributes tasks to agents based on strategy."""
    
    def __init__(self, strategy: LoadBalancingStrategy = LoadBalancingStrategy.LEAST_LOADED):
        self.strategy = strategy
        self.round_robin_index = 0
        self.distributor_lock = threading.Lock()
    
    def distribute_task(self, task: Dict[str, Any], agents: Dict[str, Dict[str, Any]]) -> Optional[str]:
        """Select agent for task based on strategy."""
        if not agents:
            return None
        
        with self.distributor_lock:
            if self.strategy == LoadBalancingStrategy.ROUND_ROBIN:
                return self._round_robin(agents)
            elif self.strategy == LoadBalancingStrategy.LEAST_LOADED:
                return self._least_loaded(agents)
            elif self.strategy == LoadBalancingStrategy.PRIORITY_BASED:
                return self._priority_based(task, agents)
            elif self.strategy == LoadBalancingStrategy.WEIGHTED:
                return self._weighted(agents)
        
        return None
    
    def _round_robin(self, agents: Dict[str, Dict[str, Any]]) -> Optional[str]:
        agent_ids = list(agents.keys())
        selected = agent_ids[self.round_robin_index % len(agent_ids)]
        self.round_robin_index += 1
        return selected
    
    def _least_loaded(self, agents: Dict[str, Dict[str, Any]]) -> Optional[str]:
        idle_agents = [a for a in agents.values() if a["status"] == "idle"]
        if not idle_agents:
            return None
        return min(idle_agents, key=lambda a: a["tasks_completed"])["id"]
    
    def _priority_based(self, task: Dict[str, Any], agents: Dict[str, Dict[str, Any]]) -> Optional[str]:
        idle_agents = [a for a in agents.values() if a["status"] == "idle"]
        if not idle_agents:
            return None
        return idle_agents[0]["id"]
    
    def _weighted(self, agents: Dict[str, Dict[str, Any]]) -> Optional[str]:
        idle_agents = [a for a in agents.values() if a["status"] == "idle"]
        if not idle_agents:
            return None
        weights = [1.0 / (1.0 + a["tasks_completed"]) for a in idle_agents]
        import random
        total = sum(weights)
        r = random.uniform(0, total)
        current = 0
        for agent, weight in zip(idle_agents, weights):
            current += weight
            if r <= current:
                return agent["id"]
        return idle_agents[0]["id"]


class ExecutionCoordinator:
    """Coordinates execution of tasks across agents."""
    
    def __init__(self, agent_pool: AgentPool, distributor: TaskDistributor):
        self.agent_pool = agent_pool
        self.distributor = distributor
        self.assignments: Dict[str, TaskAssignment] = {}
        self.coordinator_lock = threading.Lock()
    
    def coordinate_execution(self, task_id: str, task_data: Dict[str, Any]) -> Optional[str]:
        """Coordinate task execution across pool."""
        with self.coordinator_lock:
            agent_id = self.distributor.distribute_task(task_data, self.agent_pool.agents)
            
            if not agent_id:
                return None
            
            assignment = TaskAssignment(
                task_id=task_id,
                agent_id=agent_id,
                assigned_time=datetime.now(),
                priority=task_data.get("priority", 0),
                estimated_duration=task_data.get("estimated_duration", 0),
                required_capabilities=task_data.get("capabilities", [])
            )
            
            self.assignments[task_id] = assignment
            agent = self.agent_pool.get_agent(agent_id)
            if agent:
                agent["status"] = "busy"
                agent["current_task"] = task_id
            
            return agent_id
    
    def complete_task(self, task_id: str) -> bool:
        """Mark task as completed."""
        with self.coordinator_lock:
            if task_id not in self.assignments:
                return False
            
            assignment = self.assignments[task_id]
            agent = self.agent_pool.get_agent(assignment.agent_id)
            
            if agent:
                agent["status"] = "idle"
                agent["current_task"] = None
                agent["tasks_completed"] += 1
            
            assignment.status = "completed"
            return True


class LoadBalancer:
    """Provides load balancing capabilities."""
    
    def __init__(self, agent_pool: AgentPool):
        self.agent_pool = agent_pool
        self.balancer_lock = threading.Lock()
    
    def get_metrics(self) -> PoolMetrics:
        """Get pool metrics."""
        with self.balancer_lock:
            agents = self.agent_pool.agents.values()
            total = len(agents)
            active = sum(1 for a in agents if a["status"] == "busy")
            idle = total - active
            
            completed = sum(a.get("tasks_completed", 0) for a in agents)
            total_tasks = completed  # Simplified for now
            
            avg_duration = 0.0
            if completed > 0:
                avg_duration = 1.0  # Placeholder
            
            efficiency = (active / total) if total > 0 else 0.0
            
            return PoolMetrics(
                total_agents=total,
                active_agents=active,
                idle_agents=idle,
                total_tasks=total_tasks,
                completed_tasks=completed,
                failed_tasks=0,
                avg_task_duration=avg_duration,
                pool_efficiency=efficiency
            )
    
    def rebalance(self) -> bool:
        """Rebalance load across pool."""
        metrics = self.get_metrics()
        
        # Trigger rebalance if efficiency too low
        if metrics.pool_efficiency < 0.3:
            return True
        
        return False


class ResourceNegotiator:
    """Negotiates resource allocation for agents."""
    
    def __init__(self):
        self.resources: Dict[str, Dict[str, Any]] = {}
        self.negotiator_lock = threading.Lock()
    
    def request_resources(self, agent_id: str, required: Dict[str, Any]) -> bool:
        """Request resources for agent."""
        with self.negotiator_lock:
            # Simplified resource allocation
            self.resources[agent_id] = required
            return True
    
    def release_resources(self, agent_id: str) -> bool:
        """Release agent resources."""
        with self.negotiator_lock:
            if agent_id in self.resources:
                del self.resources[agent_id]
                return True
            return False
    
    def get_resource_status(self) -> Dict[str, Any]:
        """Get resource allocation status."""
        with self.negotiator_lock:
            return {
                "agents_with_resources": len(self.resources),
                "total_allocations": sum(len(v) for v in self.resources.values())
            }
