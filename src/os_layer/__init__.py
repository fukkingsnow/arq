"""ARQ OS Integration Layer (Phase 0).

Этот пакет предоставляет хроссплатформенные абстракции для:
- Управление процессами (Windows/Linux/macOS)
- Операции с файловой системой
- Определение окружения и конфигураций
- Мониторинг ресурсов системы
- Обработка сигналов и эвентов
- Логирование и диагностика
"""

__version__ = "0.1.0"
__author__ = "ARQ Development Team"
__all__ = [
    # Base classes and interfaces
    "OSPlatform",
    "ProcessInfo",
    "SystemMetrics",
    "ProcessManager",
    "FileSystemManager",
    "EnvironmentManager",
    "SystemMonitor",
    "SignalHandler",
    "Logger",
    # Exceptions
    "OSLayerException",
    "ProcessException",
    "ProcessSpawnError",
    "ProcessTerminationError",
    "ProcessNotFoundError",
    "ProcessTimeoutError",
    "FileSystemException",
    "FileNotFoundError",
    "FilePermissionError",
    "FileOperationError",
    "PathNormalizationError",
    "EnvironmentException",
    "EnvironmentVariableError",
    "ConfigurationError",
    "RegistryError",
    "SystemMonitorException",
    "MetricsCollectionError",
    "ResourceLimitError",
    "SignalException",
    "SignalHandlerRegistrationError",
    "ShutdownException",
    "LoggerException",
    "LogFileError",
    "DiagnosticsError",
    "PlatformNotSupportedError",
    "WindowsOnlyError",
    "UnixOnlyError",
]

# Import base classes
from .base import (
    OSPlatform,
    ProcessInfo,
    SystemMetrics,
    ProcessManager,
    FileSystemManager,
    EnvironmentManager,
    SystemMonitor,
    SignalHandler,
    Logger,
)

# Import exceptions
from .exceptions import (
    OSLayerException,
    ProcessException,
    ProcessSpawnError,
    ProcessTerminationError,
    ProcessNotFoundError,
    ProcessTimeoutError,
    FileSystemException,
    FileNotFoundError,
    FilePermissionError,
    FileOperationError,
    PathNormalizationError,
    EnvironmentException,
    EnvironmentVariableError,
    ConfigurationError,
    RegistryError,
    SystemMonitorException,
    MetricsCollectionError,
    ResourceLimitError,
    SignalException,
    SignalHandlerRegistrationError,
    ShutdownException,
    LoggerException,
    LogFileError,
    DiagnosticsError,
    PlatformNotSupportedError,
    WindowsOnlyError,
    UnixOnlyError,
)
