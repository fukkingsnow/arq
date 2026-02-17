"""Custom exceptions for OS Layer module.

Дифференцированные исключения для понятного обработки ошибок.
"""


class OSLayerException(Exception):
    """Base exception for all OS Layer errors."""
    def __init__(self, message: str, error_code: int = None, original_error: Exception = None):
        self.message = message
        self.error_code = error_code
        self.original_error = original_error
        super().__init__(message)


class ProcessException(OSLayerException):
    """Exception for process management errors."""
    pass


class ProcessSpawnError(ProcessException):
    """Failed to spawn a new process."""
    pass


class ProcessTerminationError(ProcessException):
    """Failed to terminate a process."""
    pass


class ProcessNotFoundError(ProcessException):
    """Process with specified PID not found."""
    pass


class ProcessTimeoutError(ProcessException):
    """Process operation timed out."""
    pass


class FileSystemException(OSLayerException):
    """Exception for file system errors."""
    pass


class FileNotFoundError(FileSystemException):
    """File or directory not found."""
    pass


class FilePermissionError(FileSystemException):
    """Insufficient permissions for file operation."""
    pass


class FileOperationError(FileSystemException):
    """Generic file operation failed."""
    pass


class PathNormalizationError(FileSystemException):
    """Failed to normalize file path."""
    pass


class EnvironmentException(OSLayerException):
    """Exception for environment/configuration errors."""
    pass


class EnvironmentVariableError(EnvironmentException):
    """Failed to get/set environment variable."""
    pass


class ConfigurationError(EnvironmentException):
    """Configuration loading or validation failed."""
    pass


class RegistryError(EnvironmentException):
    """Windows Registry operation failed (Windows only)."""
    pass


class SystemMonitorException(OSLayerException):
    """Exception for system monitoring errors."""
    pass


class MetricsCollectionError(SystemMonitorException):
    """Failed to collect system metrics."""
    pass


class ResourceLimitError(SystemMonitorException):
    """Resource limit exceeded."""
    pass


class SignalException(OSLayerException):
    """Exception for signal handling errors."""
    pass


class SignalHandlerRegistrationError(SignalException):
    """Failed to register signal handler."""
    pass


class ShutdownException(SignalException):
    """Raised when graceful shutdown is triggered."""
    pass


class LoggerException(OSLayerException):
    """Exception for logging errors."""
    pass


class LogFileError(LoggerException):
    """Failed to write to log file."""
    pass


class DiagnosticsError(LoggerException):
    """Failed to collect diagnostic information."""
    pass


# Platform-specific errors

class PlatformNotSupportedError(OSLayerException):
    """Operating system is not supported."""
    pass


class WindowsOnlyError(PlatformNotSupportedError):
    """Operation is Windows-only."""
    pass


class UnixOnlyError(PlatformNotSupportedError):
    """Operation is Unix-only (Linux/macOS)."""
    pass
