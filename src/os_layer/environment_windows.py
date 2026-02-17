"""Windows Environment Manager for Phase 0 OS Integration Layer.

Provides comprehensive environment variable and Windows Registry management
with thread-safe operations, atomic writes, and comprehensive error handling.
"""

import os
import re
import winreg
from typing import Dict, Optional, List, Tuple
from threading import Lock
from pathlib import Path

from .base import EnvironmentManager, OSPlatform
from .exceptions import (
    EnvironmentError,
    RegistryAccessError,
    InvalidConfigError,
)


class WindowsEnvironmentManager(EnvironmentManager):
    """Windows-specific environment variable and registry manager.
    
    Features:
    - Thread-safe environment variable management
    - Windows Registry read/write operations
    - Environment variable expansion and validation
    - Persistence across sessions
    - Atomic operations with rollback support
    """
    
    # Registry hives for environment variables
    SYSTEM_ENV_PATH = r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment"
    USER_ENV_PATH = r"Environment"
    
    # Registry roots
    REGISTRY_ROOTS = {
        "SYSTEM": winreg.HKEY_LOCAL_MACHINE,
        "USER": winreg.HKEY_CURRENT_USER,
    }
    
    def __init__(self):
        """Initialize Windows environment manager."""
        super().__init__()
        self._lock = Lock()
        self._env_cache: Dict[str, str] = {}
        self._registry_cache: Dict[str, Dict[str, str]] = {}
        self._backup_store: Dict[str, str] = {}
    
    def get_platform(self) -> OSPlatform:
        """Get platform type."""
        return OSPlatform.WINDOWS
    
    def get_variable(self, name: str, default: Optional[str] = None) -> Optional[str]:
        """Get environment variable value.
        
        Args:
            name: Variable name
            default: Default value if not found
            
        Returns:
            Variable value or default
            
        Raises:
            EnvironmentError: If retrieval fails
        """
        try:
            with self._lock:
                # Try cache first
                if name in self._env_cache:
                    return self._env_cache[name]
                
                # Try OS environment
                value = os.environ.get(name, default)
                if value:
                    self._env_cache[name] = value
                return value
        except Exception as e:
            raise EnvironmentError(
                f"Failed to get environment variable '{name}'",
                {"variable": name, "error": str(e)}
            )
    
    def set_variable(
        self,
        name: str,
        value: str,
        scope: str = "USER",
        persist: bool = True
    ) -> bool:
        """Set environment variable.
        
        Args:
            name: Variable name
            value: Variable value
            scope: "USER" or "SYSTEM" (requires admin)
            persist: Whether to persist to registry
            
        Returns:
            True if successful
            
        Raises:
            EnvironmentError: If operation fails
            InvalidConfigError: If parameters invalid
        """
        if not name or not isinstance(value, str):
            raise InvalidConfigError(
                "Invalid environment variable name or value",
                {"name": name, "value": value}
            )
        
        if scope not in ["USER", "SYSTEM"]:
            raise InvalidConfigError(
                f"Invalid scope: {scope}. Must be 'USER' or 'SYSTEM'",
                {"scope": scope}
            )
        
        try:
            with self._lock:
                # Backup original value
                original = os.environ.get(name)
                self._backup_store[name] = original or ""
                
                # Set in current process
                os.environ[name] = value
                self._env_cache[name] = value
                
                # Persist to registry if requested
                if persist:
                    self._set_registry_variable(name, value, scope)
                
                return True
        except RegistryAccessError:
            raise
        except Exception as e:
            raise EnvironmentError(
                f"Failed to set environment variable '{name}'",
                {"name": name, "value": value, "error": str(e)}
            )
    
    def delete_variable(self, name: str, scope: str = "USER") -> bool:
        """Delete environment variable.
        
        Args:
            name: Variable name
            scope: "USER" or "SYSTEM" (requires admin)
            
        Returns:
            True if successful
            
        Raises:
            EnvironmentError: If deletion fails
        """
        try:
            with self._lock:
                # Backup original value
                if name in os.environ:
                    self._backup_store[name] = os.environ[name]
                    del os.environ[name]
                
                # Remove from cache
                if name in self._env_cache:
                    del self._env_cache[name]
                
                # Remove from registry
                self._delete_registry_variable(name, scope)
                
                return True
        except Exception as e:
            raise EnvironmentError(
                f"Failed to delete environment variable '{name}'",
                {"name": name, "error": str(e)}
            )
    
    def expand_variables(self, text: str) -> str:
        """Expand environment variables in text.
        
        Supports %VAR% and ${VAR} syntax.
        
        Args:
            text: Text containing environment variables
            
        Returns:
            Expanded text
            
        Raises:
            EnvironmentError: If expansion fails
        """
        try:
            with self._lock:
                # Expand %VAR% syntax
                def replace_percent(match):
                    var_name = match.group(1)
                    return os.environ.get(var_name, match.group(0))
                
                result = re.sub(r'%([A-Za-z_][A-Za-z0-9_]*)%', replace_percent, text)
                
                # Expand ${VAR} syntax
                def replace_dollar(match):
                    var_name = match.group(1)
                    return os.environ.get(var_name, match.group(0))
                
                result = re.sub(r'\$\{([A-Za-z_][A-Za-z0-9_]*)\}', replace_dollar, result)
                
                return result
        except Exception as e:
            raise EnvironmentError(
                f"Failed to expand variables in text",
                {"text": text[:100], "error": str(e)}
            )
    
    def get_all_variables(self) -> Dict[str, str]:
        """Get all environment variables.
        
        Returns:
            Dictionary of all environment variables
        """
        with self._lock:
            return dict(os.environ)
    
    def restore_backup(self) -> bool:
        """Restore backed up environment variables.
        
        Returns:
            True if successful
        """
        try:
            with self._lock:
                for name, value in self._backup_store.items():
                    if value:
                        os.environ[name] = value
                    elif name in os.environ:
                        del os.environ[name]
                
                self._backup_store.clear()
                self._env_cache.clear()
                return True
        except Exception as e:
            raise EnvironmentError(
                f"Failed to restore backup: {str(e)}",
                {"error": str(e)}
            )
    
    def _set_registry_variable(self, name: str, value: str, scope: str) -> None:
        """Write environment variable to registry.
        
        Args:
            name: Variable name
            value: Variable value
            scope: "USER" or "SYSTEM"
            
        Raises:
            RegistryAccessError: If operation fails
        """
        try:
            root = self.REGISTRY_ROOTS[scope]
            path = self.USER_ENV_PATH if scope == "USER" else self.SYSTEM_ENV_PATH
            
            with winreg.OpenKey(root, path, 0, winreg.KEY_WRITE) as key:
                winreg.SetValueEx(key, name, 0, winreg.REG_SZ, value)
        except PermissionError as e:
            raise RegistryAccessError(
                f"Permission denied accessing registry (admin required)",
                {"scope": scope, "variable": name}
            )
        except Exception as e:
            raise RegistryAccessError(
                f"Failed to write to registry: {str(e)}",
                {"scope": scope, "variable": name, "error": str(e)}
            )
    
    def _delete_registry_variable(self, name: str, scope: str) -> None:
        """Delete environment variable from registry.
        
        Args:
            name: Variable name
            scope: "USER" or "SYSTEM"
            
        Raises:
            RegistryAccessError: If operation fails
        """
        try:
            root = self.REGISTRY_ROOTS[scope]
            path = self.USER_ENV_PATH if scope == "USER" else self.SYSTEM_ENV_PATH
            
            with winreg.OpenKey(root, path, 0, winreg.KEY_WRITE) as key:
                winreg.DeleteValue(key, name)
        except FileNotFoundError:
            # Variable doesn't exist in registry - OK
            pass
        except PermissionError as e:
            raise RegistryAccessError(
                f"Permission denied accessing registry (admin required)",
                {"scope": scope, "variable": name}
            )
        except Exception as e:
            raise RegistryAccessError(
                f"Failed to delete from registry: {str(e)}",
                {"scope": scope, "variable": name, "error": str(e)}
            )
    
    def read_registry(self, hive: str, path: str) -> Dict[str, str]:
        """Read registry values.
        
        Args:
            hive: "SYSTEM" or "USER"
            path: Registry path
            
        Returns:
            Dictionary of registry values
            
        Raises:
            RegistryAccessError: If operation fails
        """
        try:
            root = self.REGISTRY_ROOTS.get(hive)
            if not root:
                raise InvalidConfigError(
                    f"Invalid registry hive: {hive}",
                    {"hive": hive}
                )
            
            with self._lock:
                result = {}
                try:
                    with winreg.OpenKey(root, path, 0, winreg.KEY_READ) as key:
                        index = 0
                        while True:
                            try:
                                name, value, _ = winreg.EnumValue(key, index)
                                result[name] = value
                                index += 1
                            except OSError:
                                break
                except FileNotFoundError:
                    raise RegistryAccessError(
                        f"Registry path not found: {path}",
                        {"hive": hive, "path": path}
                    )
                
                return result
        except Exception as e:
            raise RegistryAccessError(
                f"Failed to read registry: {str(e)}",
                {"hive": hive, "path": path, "error": str(e)}
            )
    
    def write_registry(
        self,
        hive: str,
        path: str,
        name: str,
        value: str,
        value_type: str = "REG_SZ"
    ) -> bool:
        """Write registry value.
        
        Args:
            hive: "SYSTEM" or "USER"
            path: Registry path
            name: Value name
            value: Value data
            value_type: "REG_SZ", "REG_DWORD", etc.
            
        Returns:
            True if successful
            
        Raises:
            RegistryAccessError: If operation fails
        """
        try:
            root = self.REGISTRY_ROOTS.get(hive)
            if not root:
                raise InvalidConfigError(
                    f"Invalid registry hive: {hive}",
                    {"hive": hive}
                )
            
            with self._lock:
                reg_type = getattr(winreg, value_type, winreg.REG_SZ)
                
                try:
                    with winreg.OpenKey(root, path, 0, winreg.KEY_WRITE) as key:
                        winreg.SetValueEx(key, name, 0, reg_type, value)
                        return True
                except PermissionError:
                    raise RegistryAccessError(
                        f"Permission denied (admin required)",
                        {"hive": hive, "path": path}
                    )
        except RegistryAccessError:
            raise
        except Exception as e:
            raise RegistryAccessError(
                f"Failed to write registry: {str(e)}",
                {"hive": hive, "path": path, "error": str(e)}
            )
