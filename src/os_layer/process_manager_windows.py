"""Windows-specific ProcessManager implementation.

Оптимизированная реализация для Windows 10/11.
"""

import os
import subprocess
import psutil
from datetime import datetime
from typing import Dict, Optional, List, Tuple
from threading import Lock

from .base import ProcessManager, ProcessInfo
from .exceptions import (
    ProcessSpawnError,
    ProcessTerminationError,
    ProcessNotFoundError,
    ProcessTimeoutError,
)


class WindowsProcessManager(ProcessManager):
    """Windows-specific process management using psutil and subprocess."""

    def __init__(self, max_processes: int = 100):
        """Initialize Windows ProcessManager.
        
        Args:
            max_processes: Maximum concurrent processes to track
        """
        self.max_processes = max_processes
        self._processes = {}  # pid -> process info
        self._lock = Lock()
        self._output_buffers = {}  # pid -> (stdout, stderr)

    def spawn_process(
        self,
        command: str,
        args: List[str] = None,
        env: Optional[Dict[str, str]] = None,
        cwd: Optional[str] = None,
        capture_output: bool = True,
    ) -> int:
        """Spawn a new Windows process.
        
        Args:
            command: Executable name or path
            args: Command line arguments
            env: Environment variables
            cwd: Working directory
            capture_output: Capture stdout/stderr
            
        Returns:
            Process ID (PID)
            
        Raises:
            ProcessSpawnError: If process creation fails
        """
        if args is None:
            args = []
        
        with self._lock:
            if len(self._processes) >= self.max_processes:
                raise ProcessSpawnError(
                    f"Maximum process limit ({self.max_processes}) reached"
                )
        
        try:
            # Build command with arguments
            full_command = [command] + args
            
            # Configure subprocess
            kwargs = {
                "cwd": cwd,
                "shell": False,  # Better security
                "creationflags": (
                    subprocess.CREATE_NEW_PROCESS_GROUP |  # For graceful termination
                    subprocess.DETACHED_PROCESS  # Detach from parent
                ),
            }
            
            if env:
                kwargs["env"] = {**os.environ, **env}
            
            if capture_output:
                kwargs["stdout"] = subprocess.PIPE
                kwargs["stderr"] = subprocess.PIPE
                kwargs["universal_newlines"] = True
            
            # Spawn process
            proc = subprocess.Popen(full_command, **kwargs)
            pid = proc.pid
            
            # Store process info
            with self._lock:
                self._processes[pid] = {
                    "process": proc,
                    "created_at": datetime.now(),
                    "cmdline": " ".join(full_command),
                }
                if capture_output:
                    self._output_buffers[pid] = ("", "")
            
            return pid
            
        except Exception as e:
            raise ProcessSpawnError(
                f"Failed to spawn process '{command}': {str(e)}",
                original_error=e,
            )

    def get_process_info(self, pid: int) -> ProcessInfo:
        """Get detailed information about a process.
        
        Args:
            pid: Process ID
            
        Returns:
            ProcessInfo with process details
            
        Raises:
            ProcessNotFoundError: If process doesn't exist
        """
        try:
            ps_proc = psutil.Process(pid)
            
            # Get status
            status = ps_proc.status()
            
            # Get CPU and memory
            with ps_proc.oneshot():  # Optimize multiple accesses
                cpu_percent = ps_proc.cpu_percent(interval=0.1)
                memory_info = ps_proc.memory_info()
                create_time = ps_proc.create_time()
                cmdline = " ".join(ps_proc.cmdline())
                name = ps_proc.name()
            
            return ProcessInfo(
                pid=pid,
                name=name,
                status=status,
                cpu_percent=cpu_percent,
                memory_mb=memory_info.rss / (1024 * 1024),
                created_at=datetime.fromtimestamp(create_time),
                cmdline=cmdline,
            )
            
        except psutil.NoSuchProcess:
            raise ProcessNotFoundError(f"Process {pid} not found")
        except Exception as e:
            raise ProcessNotFoundError(
                f"Error retrieving process {pid} info: {str(e)}",
                original_error=e,
            )

    def terminate_process(
        self,
        pid: int,
        graceful: bool = True,
        timeout: int = 5,
    ) -> bool:
        """Terminate a process.
        
        Args:
            pid: Process ID
            graceful: Try SIGTERM before SIGKILL
            timeout: Timeout in seconds for graceful termination
            
        Returns:
            True if successful, False otherwise
            
        Raises:
            ProcessNotFoundError: If process not found
            ProcessTerminationError: If termination fails
        """
        with self._lock:
            if pid not in self._processes:
                raise ProcessNotFoundError(f"Process {pid} not found")
            
            proc_info = self._processes[pid]
            proc = proc_info["process"]
        
        try:
            if not proc.is_running():
                with self._lock:
                    del self._processes[pid]
                    if pid in self._output_buffers:
                        del self._output_buffers[pid]
                return True
            
            if graceful:
                # Try graceful termination first
                try:
                    proc.terminate()  # SIGTERM on Windows
                    proc.wait(timeout=timeout)
                    with self._lock:
                        if pid in self._processes:
                            del self._processes[pid]
                        if pid in self._output_buffers:
                            del self._output_buffers[pid]
                    return True
                except subprocess.TimeoutExpired:
                    pass  # Fall through to kill
            
            # Force kill
            proc.kill()
            proc.wait(timeout=5)
            
            with self._lock:
                if pid in self._processes:
                    del self._processes[pid]
                if pid in self._output_buffers:
                    del self._output_buffers[pid]
            
            return True
            
        except Exception as e:
            raise ProcessTerminationError(
                f"Failed to terminate process {pid}: {str(e)}",
                original_error=e,
            )

    def is_process_alive(self, pid: int) -> bool:
        """Check if a process is still running.
        
        Args:
            pid: Process ID
            
        Returns:
            True if process is running, False otherwise
        """
        with self._lock:
            if pid not in self._processes:
                return False
            proc = self._processes[pid]["process"]
        
        try:
            return proc.is_running()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            return False

    def get_process_output(self, pid: int) -> Tuple[str, str]:
        """Get stdout and stderr from a process.
        
        Args:
            pid: Process ID
            
        Returns:
            Tuple of (stdout, stderr)
            
        Raises:
            ProcessNotFoundError: If process not found
        """
        with self._lock:
            if pid not in self._output_buffers:
                raise ProcessNotFoundError(
                    f"Process {pid} not found or output not captured"
                )
            return self._output_buffers[pid]

    def set_process_output(self, pid: int, stdout: str, stderr: str) -> None:
        """Store captured process output.
        
        Args:
            pid: Process ID
            stdout: Standard output
            stderr: Standard error
        """
        with self._lock:
            if pid in self._output_buffers:
                self._output_buffers[pid] = (stdout, stderr)

    def get_all_processes(self) -> Dict[int, ProcessInfo]:
        """Get information about all tracked processes.
        
        Returns:
            Dictionary of pid -> ProcessInfo
        """
        result = {}
        with self._lock:
            pids = list(self._processes.keys())
        
        for pid in pids:
            try:
                result[pid] = self.get_process_info(pid)
            except ProcessNotFoundError:
                # Process exited
                with self._lock:
                    if pid in self._processes:
                        del self._processes[pid]
        
        return result

    def cleanup_dead_processes(self) -> int:
        """Remove dead processes from tracking.
        
        Returns:
            Number of processes cleaned up
        """
        dead_pids = []
        with self._lock:
            for pid, info in list(self._processes.items()):
                if not info["process"].is_running():
                    dead_pids.append(pid)
            
            for pid in dead_pids:
                del self._processes[pid]
                if pid in self._output_buffers:
                    del self._output_buffers[pid]
        
        return len(dead_pids)
