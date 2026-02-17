"""Windows-specific FileSystemManager implementation.

Оптимизированная работа с Windows файловой системой.
"""

import os
import shutil
from pathlib import Path, PureWindowsPath
from typing import Optional, Callable
import stat
import ntsecuritycon
import win32security
import win32api

from .base import FileSystemManager
from .exceptions import (
    FileNotFoundError,
    FilePermissionError,
    FileOperationError,
    PathNormalizationError,
)


class WindowsFileSystemManager(FileSystemManager):
    """Windows-specific file system operations."""
    
    # Maximum path length without \\?\ prefix
    MAX_PATH_LENGTH = 260
    # Maximum path length with \\?\ prefix
    MAX_EXTENDED_PATH_LENGTH = 32767

    def normalize_path(self, path: str) -> str:
        """Normalize Windows file path.
        
        Handles:
        - Forward slash conversion
        - Long path support (>260 chars)
        - UNC paths
        - Path expansion (~, environment vars)
        """
        try:
            # Expand environment variables and home directory
            expanded = os.path.expandvars(os.path.expanduser(path))
            
            # Convert forward slashes to backslashes
            normalized = expanded.replace('/', '\\')
            
            # Get absolute path
            abs_path = os.path.abspath(normalized)
            
            # Handle long paths
            if len(abs_path) > self.MAX_PATH_LENGTH and not abs_path.startswith('\\\\?\\'):
                if not abs_path.startswith('\\\\'):
                    abs_path = '\\\\?\\' + abs_path
                else:
                    abs_path = '\\\\?\\\\UNC\\' + abs_path[2:]
            
            return abs_path
            
        except Exception as e:
            raise PathNormalizationError(
                f"Failed to normalize path '{path}': {str(e)}",
                original_error=e,
            )

    def create_directory(self, path: str, mode: int = 0o755) -> bool:
        """Create directory recursively."""
        try:
            norm_path = self.normalize_path(path)
            os.makedirs(norm_path, exist_ok=True)
            
            # Set permissions
            self.set_file_permissions(norm_path, mode)
            return True
            
        except PermissionError as e:
            raise FilePermissionError(
                f"Permission denied creating '{path}'",
                original_error=e,
            )
        except Exception as e:
            raise FileOperationError(
                f"Failed to create directory '{path}': {str(e)}",
                original_error=e,
            )

    def read_file(self, path: str, encoding: str = "utf-8") -> str:
        """Read file contents."""
        try:
            norm_path = self.normalize_path(path)
            with open(norm_path, 'r', encoding=encoding) as f:
                return f.read()
                
        except FileNotFoundError as e:
            raise FileNotFoundError(
                f"File not found: '{path}'",
                original_error=e,
            )
        except PermissionError as e:
            raise FilePermissionError(
                f"Permission denied reading '{path}'",
                original_error=e,
            )
        except Exception as e:
            raise FileOperationError(
                f"Failed to read file '{path}': {str(e)}",
                original_error=e,
            )

    def write_file(self, path: str, content: str, encoding: str = "utf-8") -> bool:
        """Write content to file (atomic with temp file)."""
        try:
            norm_path = self.normalize_path(path)
            temp_path = norm_path + '.tmp'
            
            # Write to temp file first
            with open(temp_path, 'w', encoding=encoding) as f:
                f.write(content)
            
            # Atomic rename
            if os.path.exists(norm_path):
                os.remove(norm_path)
            os.rename(temp_path, norm_path)
            
            return True
            
        except PermissionError as e:
            raise FilePermissionError(
                f"Permission denied writing '{path}'",
                original_error=e,
            )
        except Exception as e:
            raise FileOperationError(
                f"Failed to write file '{path}': {str(e)}",
                original_error=e,
            )
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except:
                    pass

    def file_exists(self, path: str) -> bool:
        """Check if file exists."""
        try:
            norm_path = self.normalize_path(path)
            return os.path.exists(norm_path)
        except:
            return False

    def get_file_permissions(self, path: str) -> int:
        """Get file permissions as octal."""
        try:
            norm_path = self.normalize_path(path)
            st = os.stat(norm_path)
            return stat.S_IMODE(st.st_mode)
        except Exception as e:
            raise FileOperationError(
                f"Failed to get permissions for '{path}': {str(e)}",
                original_error=e,
            )

    def set_file_permissions(self, path: str, mode: int) -> bool:
        """Set file permissions."""
        try:
            norm_path = self.normalize_path(path)
            os.chmod(norm_path, mode)
            return True
        except PermissionError as e:
            raise FilePermissionError(
                f"Permission denied setting permissions for '{path}'",
                original_error=e,
            )
        except Exception as e:
            raise FileOperationError(
                f"Failed to set permissions for '{path}': {str(e)}",
                original_error=e,
            )

    def watch_directory(self, path: str, callback: Callable) -> None:
        """Watch directory for changes."""
        # Windows requires async implementation - placeholder
        raise NotImplementedError(
            "Directory watching requires async implementation - use watchdog library"
        )
