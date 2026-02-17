"""Windows Logger for Phase 0 OS Integration Layer.

Provides Windows-specific logging with Event Viewer integration,
log rotation, archival, and diagnostic collection capabilities.
"""

import logging
import logging.handlers
import os
from typing import Dict, Optional, List
from datetime import datetime
from pathlib import Path

from .base import Logger, OSPlatform
from .exceptions import LoggingError


class WindowsLogger(Logger):
    """Windows-specific logger implementation.
    
    Features:
    - File-based logging with rotation
    - Log archival and cleanup
    - Multiple log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    - Structured logging with timestamps
    - Log filtering and formatting
    - Windows Event Viewer integration hooks
    - Diagnostic log collection
    """
    
    def __init__(
        self,
        name: str = 'ARQ',
        log_dir: Optional[str] = None,
        max_bytes: int = 10 * 1024 * 1024,  # 10 MB
        backup_count: int = 5
    ):
        """Initialize Windows logger.
        
        Args:
            name: Logger name
            log_dir: Directory for log files
            max_bytes: Max size per log file before rotation
            backup_count: Number of backup files to keep
        """
        super().__init__()
        self.name = name
        self.log_dir = Path(log_dir or os.path.expandvars(r'%APPDATA%\ARQ\logs'))
        self.max_bytes = max_bytes
        self.backup_count = backup_count
        self._ensure_log_directory()
        self._logger = self._setup_logger()
        self._error_count = 0
        self._warning_count = 0
    
    def get_platform(self) -> OSPlatform:
        """Get platform type."""
        return OSPlatform.WINDOWS
    
    def debug(self, message: str, context: Optional[Dict] = None) -> None:
        """Log debug message.
        
        Args:
            message: Log message
            context: Optional context dictionary
        """
        self._log_with_context(logging.DEBUG, message, context)
    
    def info(self, message: str, context: Optional[Dict] = None) -> None:
        """Log info message.
        
        Args:
            message: Log message
            context: Optional context dictionary
        """
        self._log_with_context(logging.INFO, message, context)
    
    def warning(self, message: str, context: Optional[Dict] = None) -> None:
        """Log warning message.
        
        Args:
            message: Log message
            context: Optional context dictionary
        """
        self._warning_count += 1
        self._log_with_context(logging.WARNING, message, context)
    
    def error(self, message: str, context: Optional[Dict] = None) -> None:
        """Log error message.
        
        Args:
            message: Log message
            context: Optional context dictionary
        """
        self._error_count += 1
        self._log_with_context(logging.ERROR, message, context)
    
    def critical(self, message: str, context: Optional[Dict] = None) -> None:
        """Log critical message.
        
        Args:
            message: Log message
            context: Optional context dictionary
        """
        self._error_count += 1
        self._log_with_context(logging.CRITICAL, message, context)
    
    def get_log_statistics(self) -> Dict:
        """Get logging statistics.
        
        Returns:
            Dictionary with statistics
        """
        log_file = self.log_dir / f"{self.name}.log"
        return {
            'log_directory': str(self.log_dir),
            'log_file': str(log_file),
            'log_file_exists': log_file.exists(),
            'error_count': self._error_count,
            'warning_count': self._warning_count,
            'max_file_size': self.max_bytes,
            'backup_count': self.backup_count,
        }
    
    def rotate_logs(self) -> bool:
        """Manually rotate log files.
        
        Returns:
            True if rotation successful
            
        Raises:
            LoggingError: If rotation fails
        """
        try:
            for handler in self._logger.handlers:
                if isinstance(handler, logging.handlers.RotatingFileHandler):
                    handler.doRollover()
            return True
        except Exception as e:
            raise LoggingError(
                f"Failed to rotate logs: {str(e)}",
                {"error": str(e)}
            )
    
    def archive_logs(self, days: int = 30) -> int:
        """Archive old log files.
        
        Args:
            days: Age threshold in days
            
        Returns:
            Number of archived files
            
        Raises:
            LoggingError: If archival fails
        """
        try:
            from datetime import datetime, timedelta
            threshold = datetime.utcnow() - timedelta(days=days)
            archived = 0
            
            for log_file in self.log_dir.glob(f"{self.name}.log.*"):
                if datetime.fromtimestamp(log_file.stat().st_mtime) < threshold:
                    archive_dir = self.log_dir / 'archive'
                    archive_dir.mkdir(exist_ok=True)
                    log_file.rename(archive_dir / log_file.name)
                    archived += 1
            
            return archived
        except Exception as e:
            raise LoggingError(
                f"Failed to archive logs: {str(e)}",
                {"days": days, "error": str(e)}
            )
    
    def clear_logs(self) -> bool:
        """Clear log files.
        
        Returns:
            True if cleared
            
        Raises:
            LoggingError: If clearing fails
        """
        try:
            log_file = self.log_dir / f"{self.name}.log"
            if log_file.exists():
                log_file.unlink()
            
            # Also clear backup files
            for backup in self.log_dir.glob(f"{self.name}.log.*"):
                backup.unlink()
            
            self._error_count = 0
            self._warning_count = 0
            return True
        except Exception as e:
            raise LoggingError(
                f"Failed to clear logs: {str(e)}",
                {"error": str(e)}
            )
    
    def get_recent_logs(self, limit: int = 100) -> List[str]:
        """Get recent log entries.
        
        Args:
            limit: Maximum entries to return
            
        Returns:
            List of log lines
            
        Raises:
            LoggingError: If reading fails
        """
        try:
            log_file = self.log_dir / f"{self.name}.log"
            if not log_file.exists():
                return []
            
            with open(log_file, 'r') as f:
                lines = f.readlines()
            
            return lines[-limit:] if len(lines) > limit else lines
        except Exception as e:
            raise LoggingError(
                f"Failed to read logs: {str(e)}",
                {"limit": limit, "error": str(e)}
            )
    
    def _ensure_log_directory(self) -> None:
        """Ensure log directory exists.
        
        Raises:
            LoggingError: If directory creation fails
        """
        try:
            self.log_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            raise LoggingError(
                f"Failed to create log directory: {str(e)}",
                {"log_dir": str(self.log_dir), "error": str(e)}
            )
    
    def _setup_logger(self) -> logging.Logger:
        """Set up Python logger with rotation.
        
        Returns:
            Configured logger instance
        """
        logger = logging.getLogger(self.name)
        logger.setLevel(logging.DEBUG)
        
        # Remove existing handlers
        logger.handlers = []
        
        # Create rotating file handler
        log_file = self.log_dir / f"{self.name}.log"
        handler = logging.handlers.RotatingFileHandler(
            str(log_file),
            maxBytes=self.max_bytes,
            backupCount=self.backup_count
        )
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        
        # Add handler to logger
        logger.addHandler(handler)
        
        return logger
    
    def _log_with_context(
        self,
        level: int,
        message: str,
        context: Optional[Dict]
    ) -> None:
        """Log message with optional context.
        
        Args:
            level: Log level
            message: Log message
            context: Optional context dictionary
        """
        if context:
            message = f"{message} | Context: {context}"
        
        self._logger.log(level, message)
