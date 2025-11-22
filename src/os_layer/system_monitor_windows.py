"""Windows System Monitor for Phase 0 OS Integration Layer.

Provides real-time system resource monitoring including CPU, memory, disk,
and process metrics with alert thresholds and diagnostic collection.
"""

import psutil
import threading
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass, asdict
from datetime import datetime
from collections import deque

from .base import SystemMonitor, OSPlatform, SystemMetrics
from .exceptions import MonitoringError, ResourceExhaustedError


@dataclass
class ResourceAlert:
    """Resource alert data."""
    timestamp: str
    metric: str  # 'cpu', 'memory', 'disk'
    value: float
    threshold: float
    severity: str  # 'warning', 'critical'


class WindowsSystemMonitor(SystemMonitor):
    """Windows system resource monitoring.
    
    Features:
    - Real-time CPU, memory, disk monitoring
    - Process-level metrics collection
    - Configurable resource thresholds
    - Alert system with callbacks
    - Historical metrics tracking
    - Diagnostic information collection
    """
    
    def __init__(
        self,
        cpu_threshold: float = 80.0,
        memory_threshold: float = 85.0,
        disk_threshold: float = 90.0,
        history_size: int = 1000
    ):
        """Initialize Windows system monitor.
        
        Args:
            cpu_threshold: CPU usage threshold (%)
            memory_threshold: Memory usage threshold (%)
            disk_threshold: Disk usage threshold (%)
            history_size: Max historical metrics to keep
        """
        super().__init__()
        self.cpu_threshold = cpu_threshold
        self.memory_threshold = memory_threshold
        self.disk_threshold = disk_threshold
        self._history = deque(maxlen=history_size)
        self._lock = threading.Lock()
        self._alert_callbacks: List[Callable] = []
        self._monitoring = False
        self._monitor_thread: Optional[threading.Thread] = None
        self._process_cache: Dict[int, psutil.Process] = {}
    
    def get_platform(self) -> OSPlatform:
        """Get platform type."""
        return OSPlatform.WINDOWS
    
    def get_metrics(self) -> SystemMetrics:
        """Get current system metrics.
        
        Returns:
            SystemMetrics with current resource usage
            
        Raises:
            MonitoringError: If collection fails
        """
        try:
            with self._lock:
                cpu_percent = psutil.cpu_percent(interval=0.1)
                memory = psutil.virtual_memory()
                disk = psutil.disk_usage('C:\\')
                
                metrics = SystemMetrics(
                    timestamp=datetime.utcnow().isoformat(),
                    cpu_percent=cpu_percent,
                    memory_percent=memory.percent,
                    memory_used_mb=memory.used / (1024 * 1024),
                    memory_available_mb=memory.available / (1024 * 1024),
                    disk_percent=disk.percent,
                    disk_used_gb=disk.used / (1024 ** 3),
                    disk_free_gb=disk.free / (1024 ** 3),
                    process_count=len(psutil.pids())
                )
                
                # Store in history
                self._history.append(asdict(metrics))
                
                # Check thresholds
                self._check_thresholds(metrics)
                
                return metrics
        except Exception as e:
            raise MonitoringError(
                f"Failed to collect system metrics: {str(e)}",
                {"error": str(e)}
            )
    
    def get_process_info(self, pid: int) -> Dict:
        """Get process information.
        
        Args:
            pid: Process ID
            
        Returns:
            Dictionary with process metrics
            
        Raises:
            MonitoringError: If process not found
        """
        try:
            with self._lock:
                # Try cache first
                if pid in self._process_cache:
                    proc = self._process_cache[pid]
                else:
                    proc = psutil.Process(pid)
                    self._process_cache[pid] = proc
                
                try:
                    return {
                        'pid': pid,
                        'name': proc.name(),
                        'status': proc.status(),
                        'create_time': datetime.fromtimestamp(proc.create_time()).isoformat(),
                        'cpu_percent': proc.cpu_percent(),
                        'memory_mb': proc.memory_info().rss / (1024 * 1024),
                        'num_threads': proc.num_threads(),
                        'io_counters': {
                            'read_bytes': proc.io_counters().read_bytes,
                            'write_bytes': proc.io_counters().write_bytes,
                        }
                    }
                except psutil.NoSuchProcess:
                    del self._process_cache[pid]
                    raise MonitoringError(
                        f"Process {pid} not found",
                        {"pid": pid}
                    )
        except MonitoringError:
            raise
        except Exception as e:
            raise MonitoringError(
                f"Failed to get process info: {str(e)}",
                {"pid": pid, "error": str(e)}
            )
    
    def get_top_processes(
        self,
        limit: int = 10,
        sort_by: str = 'memory'
    ) -> List[Dict]:
        """Get top processes by resource usage.
        
        Args:
            limit: Number of processes to return
            sort_by: 'cpu' or 'memory'
            
        Returns:
            List of process information dicts
            
        Raises:
            MonitoringError: If collection fails
        """
        try:
            with self._lock:
                processes = []
                for proc in psutil.process_iter(['pid', 'name', 'memory_percent', 'cpu_percent']):
                    try:
                        processes.append({
                            'pid': proc.info['pid'],
                            'name': proc.info['name'],
                            'memory_percent': proc.info['memory_percent'] or 0,
                            'cpu_percent': proc.info['cpu_percent'] or 0,
                        })
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass
                
                # Sort by requested metric
                if sort_by == 'cpu':
                    processes.sort(key=lambda x: x['cpu_percent'], reverse=True)
                else:
                    processes.sort(key=lambda x: x['memory_percent'], reverse=True)
                
                return processes[:limit]
        except Exception as e:
            raise MonitoringError(
                f"Failed to get top processes: {str(e)}",
                {"sort_by": sort_by, "error": str(e)}
            )
    
    def start_monitoring(self, interval: int = 5) -> bool:
        """Start background resource monitoring.
        
        Args:
            interval: Check interval in seconds
            
        Returns:
            True if started successfully
        """
        if self._monitoring:
            return False
        
        self._monitoring = True
        self._monitor_thread = threading.Thread(
            target=self._monitor_loop,
            args=(interval,),
            daemon=True
        )
        self._monitor_thread.start()
        return True
    
    def stop_monitoring(self) -> bool:
        """Stop background monitoring.
        
        Returns:
            True if stopped
        """
        self._monitoring = False
        if self._monitor_thread:
            self._monitor_thread.join(timeout=5)
        return True
    
    def register_alert_callback(self, callback: Callable) -> None:
        """Register callback for resource alerts.
        
        Args:
            callback: Function to call on alert (ResourceAlert) -> None
        """
        with self._lock:
            self._alert_callbacks.append(callback)
    
    def unregister_alert_callback(self, callback: Callable) -> None:
        """Unregister alert callback.
        
        Args:
            callback: Callback to remove
        """
        with self._lock:
            if callback in self._alert_callbacks:
                self._alert_callbacks.remove(callback)
    
    def get_metrics_history(self, limit: Optional[int] = None) -> List[Dict]:
        """Get historical metrics.
        
        Args:
            limit: Max items to return (None = all)
            
        Returns:
            List of historical metrics
        """
        with self._lock:
            history = list(self._history)
            if limit:
                history = history[-limit:]
            return history
    
    def clear_history(self) -> None:
        """Clear metrics history."""
        with self._lock:
            self._history.clear()
    
    def get_diagnostics(self) -> Dict:
        """Get system diagnostic information.
        
        Returns:
            Dictionary with diagnostic data
        """
        try:
            metrics = self.get_metrics()
            top_procs = self.get_top_processes(limit=5)
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'current_metrics': asdict(metrics),
                'top_processes': top_procs,
                'cpu_count': psutil.cpu_count(),
                'boot_time': datetime.fromtimestamp(psutil.boot_time()).isoformat(),
                'uptime_seconds': datetime.utcnow().timestamp() - psutil.boot_time(),
            }
        except Exception as e:
            raise MonitoringError(
                f"Failed to collect diagnostics: {str(e)}",
                {"error": str(e)}
            )
    
    def _check_thresholds(self, metrics: SystemMetrics) -> None:
        """Check resource thresholds and trigger alerts.
        
        Args:
            metrics: Current system metrics
        """
        alerts = []
        
        if metrics.cpu_percent > self.cpu_threshold:
            alerts.append(ResourceAlert(
                timestamp=datetime.utcnow().isoformat(),
                metric='cpu',
                value=metrics.cpu_percent,
                threshold=self.cpu_threshold,
                severity='critical' if metrics.cpu_percent > 95 else 'warning'
            ))
        
        if metrics.memory_percent > self.memory_threshold:
            if metrics.memory_percent > 95:
                raise ResourceExhaustedError(
                    f"Memory exhausted: {metrics.memory_percent}%",
                    {"memory_percent": metrics.memory_percent}
                )
            alerts.append(ResourceAlert(
                timestamp=datetime.utcnow().isoformat(),
                metric='memory',
                value=metrics.memory_percent,
                threshold=self.memory_threshold,
                severity='warning'
            ))
        
        if metrics.disk_percent > self.disk_threshold:
            alerts.append(ResourceAlert(
                timestamp=datetime.utcnow().isoformat(),
                metric='disk',
                value=metrics.disk_percent,
                threshold=self.disk_threshold,
                severity='critical' if metrics.disk_percent > 98 else 'warning'
            ))
        
        # Call registered callbacks
        for alert in alerts:
            for callback in self._alert_callbacks:
                try:
                    callback(alert)
                except Exception:
                    pass  # Ignore callback errors
    
    def _monitor_loop(self, interval: int) -> None:
        """Background monitoring loop.
        
        Args:
            interval: Check interval in seconds
        """
        while self._monitoring:
            try:
                self.get_metrics()
                threading.Event().wait(interval)
            except Exception:
                pass  # Continue monitoring on error
