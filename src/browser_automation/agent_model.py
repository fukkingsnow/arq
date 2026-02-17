"""agent_model.py - Phase 12: Agent foundation and lifecycle management.

Provides base agent model, lifecycle management, capability discovery,
and agent registry for multi-agent orchestration system.
"""

from typing import Dict, List, Optional, Any, Set, Callable
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
import logging
import uuid
from abc import ABC, abstractmethod


class AgentState(Enum):
    """Agent execution state."""
    IDLE = "idle"
    INITIALIZING = "initializing"
    READY = "ready"
    WORKING = "working"
    RECOVERING = "recovering"
    SHUTDOWN = "shutdown"
    FAILED = "failed"


class AgentRole(Enum):
    """Agent role in system."""
    WORKER = "worker"
    COORDINATOR = "coordinator"
    MONITOR = "monitor"
    GATEWAY = "gateway"


class CapabilityType(Enum):
    """Type of agent capability."""
    BROWSER_CONTROL = "browser_control"
    LLM_PROCESSING = "llm_processing"
    STATE_MANAGEMENT = "state_management"
    ORCHESTRATION = "orchestration"
    SYSTEM_CONTROL = "system_control"


@dataclass
class Capability:
    """Represents an agent capability."""
    name: str
    capability_type: CapabilityType
    version: str = "1.0"
    supported_parameters: Dict[str, Any] = field(default_factory=dict)
    
    def matches(self, required_type: CapabilityType) -> bool:
        """Check if capability matches required type."""
        return self.capability_type == required_type


@dataclass
class HealthMetrics:
    """Agent health metrics."""
    cpu_usage: float = 0.0  # 0-100%
    memory_usage: float = 0.0  # 0-100%
    task_queue_size: int = 0
    error_count: int = 0
    error_rate: float = 0.0  # 0-100%
    last_heartbeat: datetime = field(default_factory=datetime.now)
    
    def is_healthy(self) -> bool:
        """Check if agent is healthy."""
        return (self.error_rate < 5.0 and 
                self.cpu_usage < 90 and 
                self.memory_usage < 85)


@dataclass
class AgentConfig:
    """Agent configuration."""
    max_tasks: int = 10
    timeout: int = 300  # seconds
    retry_policy: str = "exponential"
    resource_limits: Dict[str, Any] = field(default_factory=dict)
    heartbeat_interval: int = 10  # seconds
    max_failures: int = 5


class BaseAgent(ABC):
    """Abstract base class for all agents."""
    
    def __init__(self, agent_id: Optional[str] = None, role: AgentRole = AgentRole.WORKER,
                 config: Optional[AgentConfig] = None, logger: Optional[logging.Logger] = None):
        """Initialize agent.
        
        Args:
            agent_id: Unique agent identifier
            role: Agent role in system
            config: Agent configuration
            logger: Logger instance
        """
        self.agent_id = agent_id or str(uuid.uuid4())
        self.role = role
        self.config = config or AgentConfig()
        self.logger = logger or logging.getLogger(__name__)
        self.state = AgentState.IDLE
        self.capabilities: List[Capability] = []
        self.metrics = HealthMetrics()
        self.task_queue: List[Dict[str, Any]] = []
        self.active_tasks: Set[str] = set()
        self.created_at = datetime.now()
        self.started_at: Optional[datetime] = None
    
    @abstractmethod
    def initialize(self) -> bool:
        """Initialize agent.
        
        Returns:
            True if initialization successful, False otherwise
        """
        pass
    
    @abstractmethod
    def shutdown(self) -> bool:
        """Shutdown agent gracefully."""
        pass
    
    @abstractmethod
    def execute_task(self, task_id: str, task_data: Dict[str, Any]) -> Any:
        """Execute a task.
        
        Args:
            task_id: Task identifier
            task_data: Task data and parameters
        
        Returns:
            Task result
        """
        pass
    
    def add_capability(self, capability: Capability) -> None:
        """Add capability to agent."""
        self.capabilities.append(capability)
        self.logger.debug(f"Capability added: {capability.name}")
    
    def has_capability(self, capability_type: CapabilityType) -> bool:
        """Check if agent has specific capability."""
        return any(cap.matches(capability_type) for cap in self.capabilities)
    
    def enqueue_task(self, task_id: str, task_data: Dict[str, Any]) -> bool:
        """Enqueue task for execution.
        
        Returns:
            True if task queued successfully
        """
        if len(self.task_queue) >= self.config.max_tasks:
            self.logger.warning("Task queue full")
            return False
        
        self.task_queue.append({"task_id": task_id, "data": task_data})
        self.metrics.task_queue_size = len(self.task_queue)
        return True
    
    def is_available(self) -> bool:
        """Check if agent is available for new tasks."""
        return (self.state == AgentState.READY and 
                len(self.task_queue) < self.config.max_tasks and 
                self.metrics.is_healthy())
    
    def update_health(self, cpu: float, memory: float, errors: int = 0) -> None:
        """Update agent health metrics."""
        self.metrics.cpu_usage = cpu
        self.metrics.memory_usage = memory
        self.metrics.error_count = errors
        self.metrics.last_heartbeat = datetime.now()
        
        if self.metrics.error_count > 0:
            self.metrics.error_rate = min(100.0, (errors / max(1, len(self.active_tasks))) * 100)
    
    def get_info(self) -> Dict[str, Any]:
        """Get agent information."""
        return {
            "agent_id": self.agent_id,
            "role": self.role.value,
            "state": self.state.value,
            "capabilities": [c.name for c in self.capabilities],
            "active_tasks": len(self.active_tasks),
            "queue_size": len(self.task_queue),
            "metrics": {
                "cpu_usage": self.metrics.cpu_usage,
                "memory_usage": self.metrics.memory_usage,
                "error_rate": self.metrics.error_rate,
                "is_healthy": self.metrics.is_healthy()
            }
        }


class AgentRegistry:
    """Registry for agent discovery and management."""
    
    def __init__(self, logger: Optional[logging.Logger] = None):
        """Initialize agent registry."""
        self.logger = logger or logging.getLogger(__name__)
        self.agents: Dict[str, BaseAgent] = {}
        self.capability_index: Dict[CapabilityType, List[str]] = {}
    
    def register(self, agent: BaseAgent) -> bool:
        """Register agent in registry.
        
        Returns:
            True if registration successful
        """
        if agent.agent_id in self.agents:
            self.logger.warning(f"Agent already registered: {agent.agent_id}")
            return False
        
        self.agents[agent.agent_id] = agent
        
        # Index capabilities
        for capability in agent.capabilities:
            if capability.capability_type not in self.capability_index:
                self.capability_index[capability.capability_type] = []
            self.capability_index[capability.capability_type].append(agent.agent_id)
        
        self.logger.debug(f"Agent registered: {agent.agent_id}")
        return True
    
    def unregister(self, agent_id: str) -> bool:
        """Unregister agent from registry."""
        if agent_id not in self.agents:
            return False
        
        agent = self.agents.pop(agent_id)
        
        # Remove from capability index
        for capability in agent.capabilities:
            if capability.capability_type in self.capability_index:
                self.capability_index[capability.capability_type].remove(agent_id)
        
        self.logger.debug(f"Agent unregistered: {agent_id}")
        return True
    
    def get_agent(self, agent_id: str) -> Optional[BaseAgent]:
        """Get agent by ID."""
        return self.agents.get(agent_id)
    
    def find_agents_by_capability(self, capability_type: CapabilityType) -> List[BaseAgent]:
        """Find agents with specific capability."""
        agent_ids = self.capability_index.get(capability_type, [])
        return [self.agents[aid] for aid in agent_ids if aid in self.agents]
    
    def find_available_agents(self) -> List[BaseAgent]:
        """Find all available agents."""
        return [agent for agent in self.agents.values() if agent.is_available()]
    
    def get_all_agents(self) -> List[BaseAgent]:
        """Get all registered agents."""
        return list(self.agents.values())
    
    def get_registry_stats(self) -> Dict[str, Any]:
        """Get registry statistics."""
        agents = list(self.agents.values())
        return {
            "total_agents": len(agents),
            "available_agents": sum(1 for a in agents if a.is_available()),
            "total_capabilities": len(self.capability_index),
            "total_active_tasks": sum(len(a.active_tasks) for a in agents),
            "average_cpu_usage": sum(a.metrics.cpu_usage for a in agents) / max(1, len(agents)),
            "average_memory_usage": sum(a.metrics.memory_usage for a in agents) / max(1, len(agents))
        }


class AgentFactory:
    """Factory for creating agents."""
    
    @staticmethod
    def create_worker_agent(agent_id: Optional[str] = None, 
                           logger: Optional[logging.Logger] = None) -> BaseAgent:
        """Create worker agent."""
        # This would be implemented by concrete agent classes
        class ConcreteWorkerAgent(BaseAgent):
            def initialize(self) -> bool:
                self.state = AgentState.INITIALIZING
                self.started_at = datetime.now()
                self.state = AgentState.READY
                return True
            
            def shutdown(self) -> bool:
                self.state = AgentState.SHUTDOWN
                return True
            
            def execute_task(self, task_id: str, task_data: Dict[str, Any]) -> Any:
                self.active_tasks.add(task_id)
                try:
                    result = {"task_id": task_id, "status": "completed", "result": task_data}
                    return result
                finally:
                    self.active_tasks.discard(task_id)
        
        return ConcreteWorkerAgent(agent_id=agent_id, role=AgentRole.WORKER, logger=logger)
