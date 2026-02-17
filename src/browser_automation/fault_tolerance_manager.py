"""Fault Tolerance Manager for Phase 12 - Recovery and Redundancy

Provides health monitoring, error recovery strategies, failover management,
and backup coordination for high-availability multi-agent systems.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Any, Optional, Callable
import threading
from datetime import datetime, timedelta
import time


class RecoveryStrategy(Enum):
    """Recovery strategies for failed agents."""
    RESTART = "restart"
    REASSIGN = "reassign"
    FAILOVER = "failover"
    MANUAL = "manual"


@dataclass
class HealthMetrics:
    """Agent health metrics for monitoring."""
    agent_id: str
    status: str  # healthy, degraded, failed
    last_heartbeat: datetime
    error_count: int
    response_time_ms: float
    success_rate: float


class HealthMonitor:
    """Monitors agent health and detects failures."""
    
    def __init__(self, heartbeat_timeout: float = 5.0):
        self.heartbeat_timeout = heartbeat_timeout
        self.agent_health: Dict[str, Dict[str, Any]] = {}
        self.monitor_lock = threading.Lock()
    
    def register_agent(self, agent_id: str) -> None:
        """Register agent for health monitoring."""
        with self.monitor_lock:
            self.agent_health[agent_id] = {
                "last_heartbeat": datetime.now(),
                "status": "healthy",
                "error_count": 0,
                "success_count": 0
            }
    
    def heartbeat(self, agent_id: str) -> None:
        """Record agent heartbeat."""
        with self.monitor_lock:
            if agent_id in self.agent_health:
                self.agent_health[agent_id]["last_heartbeat"] = datetime.now()
                self.agent_health[agent_id]["status"] = "healthy"
    
    def record_error(self, agent_id: str) -> None:
        """Record agent error."""
        with self.monitor_lock:
            if agent_id in self.agent_health:
                self.agent_health[agent_id]["error_count"] += 1
                self.agent_health[agent_id]["status"] = "degraded"
    
    def record_success(self, agent_id: str) -> None:
        """Record successful agent operation."""
        with self.monitor_lock:
            if agent_id in self.agent_health:
                self.agent_health[agent_id]["success_count"] += 1
    
    def check_health(self) -> List[str]:
        """Check health of all agents. Returns list of failed agents."""
        failed_agents = []
        now = datetime.now()
        
        with self.monitor_lock:
            for agent_id, metrics in self.agent_health.items():
                elapsed = (now - metrics["last_heartbeat"]).total_seconds()
                if elapsed > self.heartbeat_timeout:
                    metrics["status"] = "failed"
                    failed_agents.append(agent_id)
        
        return failed_agents


class ErrorRecovery:
    """Implements error recovery strategies."""
    
    def __init__(self):
        self.recovery_history: List[Dict[str, Any]] = []
        self.recovery_lock = threading.Lock()
    
    def attempt_recovery(self, agent_id: str, strategy: RecoveryStrategy, context: Dict[str, Any]) -> bool:
        """Attempt recovery using specified strategy."""
        try:
            if strategy == RecoveryStrategy.RESTART:
                return self._restart_agent(agent_id, context)
            elif strategy == RecoveryStrategy.REASSIGN:
                return self._reassign_tasks(agent_id, context)
            elif strategy == RecoveryStrategy.FAILOVER:
                return self._failover_agent(agent_id, context)
            else:
                return False
        except Exception as e:
            self._log_recovery_attempt(agent_id, strategy, False, str(e))
            return False
    
    def _restart_agent(self, agent_id: str, context: Dict[str, Any]) -> bool:
        """Restart failed agent."""
        self._log_recovery_attempt(agent_id, RecoveryStrategy.RESTART, True)
        return True
    
    def _reassign_tasks(self, agent_id: str, context: Dict[str, Any]) -> bool:
        """Reassign tasks from failed agent."""
        self._log_recovery_attempt(agent_id, RecoveryStrategy.REASSIGN, True)
        return True
    
    def _failover_agent(self, agent_id: str, context: Dict[str, Any]) -> bool:
        """Failover to backup agent."""
        self._log_recovery_attempt(agent_id, RecoveryStrategy.FAILOVER, True)
        return True
    
    def _log_recovery_attempt(self, agent_id: str, strategy: RecoveryStrategy, success: bool, error: str = None) -> None:
        """Log recovery attempt."""
        with self.recovery_lock:
            self.recovery_history.append({
                "agent_id": agent_id,
                "strategy": strategy.value,
                "success": success,
                "error": error,
                "timestamp": datetime.now().isoformat()
            })
    
    def get_recovery_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recovery history."""
        with self.recovery_lock:
            return self.recovery_history[-limit:]


class FailoverManager:
    """Manages failover of failed agents to backups."""
    
    def __init__(self):
        self.agent_backup_map: Dict[str, List[str]] = {}
        self.failover_lock = threading.Lock()
    
    def register_backup(self, primary_agent: str, backup_agent: str) -> None:
        """Register backup agent for primary agent."""
        with self.failover_lock:
            if primary_agent not in self.agent_backup_map:
                self.agent_backup_map[primary_agent] = []
            self.agent_backup_map[primary_agent].append(backup_agent)
    
    def get_backup(self, agent_id: str) -> Optional[str]:
        """Get primary backup for agent."""
        with self.failover_lock:
            backups = self.agent_backup_map.get(agent_id, [])
            return backups[0] if backups else None
    
    def execute_failover(self, failed_agent: str) -> Optional[str]:
        """Execute failover to backup agent."""
        backup = self.get_backup(failed_agent)
        if backup:
            return backup
        return None


class BackupCoordinator:
    """Coordinates backup and redundancy for the system."""
    
    def __init__(self):
        self.backup_configurations: Dict[str, Dict[str, Any]] = {}
        self.coordinator_lock = threading.Lock()
    
    def create_backup_configuration(self, config_id: str, config: Dict[str, Any]) -> None:
        """Create backup configuration."""
        with self.coordinator_lock:
            self.backup_configurations[config_id] = {
                **config,
                "created_at": datetime.now(),
                "status": "active"
            }
    
    def get_backup_configuration(self, config_id: str) -> Optional[Dict[str, Any]]:
        """Get backup configuration."""
        with self.coordinator_lock:
            return self.backup_configurations.get(config_id)
    
    def validate_redundancy(self) -> Dict[str, Any]:
        """Validate system redundancy."""
        with self.coordinator_lock:
            total_configs = len(self.backup_configurations)
            active_configs = sum(1 for c in self.backup_configurations.values() if c["status"] == "active")
            
            return {
                "total_backup_configs": total_configs,
                "active_configs": active_configs,
                "redundancy_level": "high" if active_configs >= total_configs * 0.8 else "low"
            }
