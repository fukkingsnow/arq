"""Base classes and abstract interfaces for OS Layer integration.

Этот модуль определяет абстрактные базовые классы и интерфейсы,
которые реализуют конкретные платформа.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, Optional, Callable
from datetime import datetime


class OSPlatform(Enum):
    """Supported operating systems."""
    WINDOWS = "windows"
    LINUX = "linux"
    MACOS = "macos"


@dataclass
class ProcessInfo:
    """Information about a running process."""
    pid: int
    name: str
    status: str  # 'running', 'stopped', 'zombie'
    cpu_percent: float
    memory_mb: float
    created_at: datetime
    cmdline: str


@dataclass
class SystemMetrics:
    """System-wide performance metrics."""
    cpu_percent: float
    memory_used_mb: float
    memory_available_mb: float
    disk_usage_percent: float
    process_count: int
    thread_count: int
    timestamp: datetime


class OSLayerException(Exception):
    """Base exception for OS Layer operations."""
    pass


class ProcessManager(ABC):
    """Abstract base class for cross-platform process management."""

    @abstractmethod
    def spawn_process(
        self,
        command: str,
        args: list,
        env: Optional[Dict[str, str]] = None,
        cwd: Optional[str] = None
    ) -> int:
        """Spawn a new process. Returns process ID."""
        pass

    @abstractmethod
    def get_process_info(self, pid: int) -> ProcessInfo:
        """Get information about a running process."""
        pass

    @abstractmethod
    def terminate_process(self, pid: int, graceful: bool = True, timeout: int = 5) -> bool:
        """Terminate a process. Returns True if successful."""
        pass

    @abstractmethod
    def is_process_alive(self, pid: int) -> bool:
        """Check if a process is still running."""
        pass

    @abstractmethod
    def get_process_output(self, pid: int) -> tuple:
        """Get stdout and stderr from a process."""
        pass


class FileSystemManager(ABC):
    """Abstract base class for cross-platform file system operations."""

    @abstractmethod
    def normalize_path(self, path: str) -> str:
        """Normalize a file path to platform-specific format."""
        pass

    @abstractmethod
    def create_directory(self, path: str, mode: int = 0o755) -> bool:
        """Create a directory recursively."""
        pass

    @abstractmethod
    def read_file(self, path: str, encoding: str = "utf-8") -> str:
        """Read file contents."""
        pass

    @abstractmethod
    def write_file(self, path: str, content: str, encoding: str = "utf-8") -> bool:
        """Write content to file (atomic)."""
        pass

    @abstractmethod
    def file_exists(self, path: str) -> bool:
        """Check if file exists."""
        pass

    @abstractmethod
    def get_file_permissions(self, path: str) -> int:
        """Get file permissions as octal."""
        pass

    @abstractmethod
    def set_file_permissions(self, path: str, mode: int) -> bool:
        """Set file permissions."""
        pass

    @abstractmethod
    def watch_directory(self, path: str, callback: Callable) -> None:
        """Watch directory for changes and invoke callback."""
        pass


class EnvironmentManager(ABC):
    """Abstract base class for environment and configuration management."""

    @abstractmethod
    def get_env_var(self, name: str, default: Optional[str] = None) -> Optional[str]:
        """Get environment variable value."""
        pass

    @abstractmethod
    def set_env_var(self, name: str, value: str) -> bool:
        """Set environment variable."""
        pass

    @abstractmethod
    def get_all_env_vars(self) -> Dict[str, str]:
        """Get all environment variables."""
        pass

    @abstractmethod
    def get_platform_config(self, key: str) -> Optional[Any]:
        """Get platform-specific configuration."""
        pass

    @abstractmethod
    def read_registry(self, hive: str, path: str, key: str) -> Optional[Any]:
        """Read from Windows Registry (Windows only)."""
        pass


class SystemMonitor(ABC):
    """Abstract base class for system monitoring."""

    @abstractmethod
    def get_system_metrics(self) -> SystemMetrics:
        """Get current system metrics."""
        pass

    @abstractmethod
    def get_process_metrics(self, pid: int) -> Dict[str, Any]:
        """Get metrics for specific process."""
        pass

    @abstractmethod
    def start_monitoring(self, interval: int = 1) -> None:
        """Start continuous monitoring."""
        pass

    @abstractmethod
    def stop_monitoring(self) -> None:
        """Stop monitoring."""
        pass

    @abstractmethod
    def set_alert_callback(self, callback: Callable) -> None:
        """Set callback for resource alerts."""
        pass


class SignalHandler(ABC):
    """Abstract base class for signal and event handling."""

    @abstractmethod
    def register_signal_handler(self, signal_name: str, handler: Callable) -> bool:
        """Register handler for system signal."""
        pass

    @abstractmethod
    def unregister_signal_handler(self, signal_name: str) -> bool:
        """Unregister signal handler."""
        pass

    @abstractmethod
    def trigger_graceful_shutdown(self, timeout: int = 10) -> None:
        """Trigger graceful shutdown sequence."""
        pass

    @abstractmethod
    def is_shutdown_requested(self) -> bool:
        """Check if shutdown has been requested."""
        pass


class Logger(ABC):
    """Abstract base class for logging and diagnostics."""

    @abstractmethod
    def debug(self, message: str, **kwargs) -> None:
        """Log debug message."""
        pass

    @abstractmethod
    def info(self, message: str, **kwargs) -> None:
        """Log info message."""
        pass

    @abstractmethod
    def warning(self, message: str, **kwargs) -> None:
        """Log warning message."""
        pass

    @abstractmethod
    def error(self, message: str, **kwargs) -> None:
        """Log error message."""
        pass

    @abstractmethod
    def critical(self, message: str, **kwargs) -> None:
        """Log critical message."""
        pass

    @abstractmethod
    def collect_diagnostics(self) -> Dict[str, Any]:
        """Collect diagnostic information for troubleshooting."""
        pass
