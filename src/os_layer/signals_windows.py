"""Windows Signal Handler for Phase 0 OS Integration Layer.

Provides Windows event handling and graceful shutdown coordination
with signal registration, listener management, and state tracking.
"""

import signal
import threading
from typing import Dict, Callable, List, Optional
from enum import Enum
from datetime import datetime

from .base import SignalHandler, OSPlatform
from .exceptions import SignalHandlingError


class WindowsSignal(Enum):
    """Windows-compatible signals."""
    SIGINT = signal.SIGINT      # Ctrl+C
    SIGTERM = signal.SIGTERM    # Termination request
    SIGABRT = signal.SIGABRT    # Abnormal termination


class WindowsSignalHandler(SignalHandler):
    """Windows signal and event handler.
    
    Features:
    - Windows signal registration and handling
    - Graceful shutdown coordination
    - Signal listener management
    - State tracking and statistics
    - Thread-safe operations
    - Event sequencing and ordering
    """
    
    def __init__(self):
        """Initialize Windows signal handler."""
        super().__init__()
        self._handlers: Dict[signal.Signals, List[Callable]] = {}
        self._lock = threading.Lock()
        self._shutdown_requested = False
        self._shutdown_time: Optional[datetime] = None
        self._signal_count: Dict[int, int] = {}
        self._listener_callbacks: List[Callable] = []
        self._graceful_timeout = 30  # seconds
    
    def get_platform(self) -> OSPlatform:
        """Get platform type."""
        return OSPlatform.WINDOWS
    
    def register_signal(
        self,
        sig: int,
        handler: Callable[[int, object], None]
    ) -> bool:
        """Register signal handler.
        
        Args:
            sig: Signal number (e.g., signal.SIGTERM)
            handler: Handler function
            
        Returns:
            True if registered successfully
            
        Raises:
            SignalHandlingError: If registration fails
        """
        try:
            with self._lock:
                # Convert to Windows signal
                if sig not in [signal.SIGINT, signal.SIGTERM, signal.SIGABRT]:
                    raise SignalHandlingError(
                        f"Unsupported signal: {sig}",
                        {"signal": sig}
                    )
                
                # Initialize handler list if needed
                if sig not in self._handlers:
                    self._handlers[sig] = []
                
                # Add handler to list
                self._handlers[sig].append(handler)
                
                # Register with signal module
                signal.signal(sig, self._signal_dispatcher)
                
                return True
        except SignalHandlingError:
            raise
        except Exception as e:
            raise SignalHandlingError(
                f"Failed to register signal handler: {str(e)}",
                {"signal": sig, "error": str(e)}
            )
    
    def unregister_signal(self, sig: int) -> bool:
        """Unregister all handlers for signal.
        
        Args:
            sig: Signal number
            
        Returns:
            True if unregistered
        """
        try:
            with self._lock:
                if sig in self._handlers:
                    del self._handlers[sig]
                    # Reset to default handler
                    signal.signal(sig, signal.SIG_DFL)
                return True
        except Exception as e:
            raise SignalHandlingError(
                f"Failed to unregister signal: {str(e)}",
                {"signal": sig, "error": str(e)}
            )
    
    def register_listener(
        self,
        callback: Callable[[int, str], None]
    ) -> None:
        """Register signal listener callback.
        
        Args:
            callback: Function to call on any signal
                     signature: (signal_num: int, description: str) -> None
        """
        with self._lock:
            self._listener_callbacks.append(callback)
    
    def unregister_listener(self, callback: Callable) -> None:
        """Unregister signal listener.
        
        Args:
            callback: Callback to remove
        """
        with self._lock:
            if callback in self._listener_callbacks:
                self._listener_callbacks.remove(callback)
    
    def trigger_shutdown(self, graceful: bool = True) -> bool:
        """Trigger graceful shutdown.
        
        Args:
            graceful: Whether to request graceful shutdown
            
        Returns:
            True if shutdown initiated
        """
        with self._lock:
            self._shutdown_requested = True
            self._shutdown_time = datetime.utcnow()
            return True
    
    def is_shutdown_requested(self) -> bool:
        """Check if shutdown has been requested.
        
        Returns:
            True if shutdown requested
        """
        with self._lock:
            return self._shutdown_requested
    
    def get_shutdown_elapsed(self) -> Optional[float]:
        """Get seconds elapsed since shutdown request.
        
        Returns:
            Elapsed seconds or None if not requested
        """
        with self._lock:
            if not self._shutdown_time:
                return None
            elapsed = (datetime.utcnow() - self._shutdown_time).total_seconds()
            return elapsed
    
    def is_graceful_timeout_exceeded(self) -> bool:
        """Check if graceful timeout exceeded.
        
        Returns:
            True if timeout exceeded
        """
        elapsed = self.get_shutdown_elapsed()
        if elapsed is None:
            return False
        return elapsed > self._graceful_timeout
    
    def set_graceful_timeout(self, timeout: int) -> None:
        """Set graceful shutdown timeout.
        
        Args:
            timeout: Timeout in seconds
        """
        with self._lock:
            self._graceful_timeout = timeout
    
    def get_signal_statistics(self) -> Dict:
        """Get signal handling statistics.
        
        Returns:
            Dictionary with signal counts
        """
        with self._lock:
            return {
                'total_signals': sum(self._signal_count.values()),
                'signals_by_type': dict(self._signal_count),
                'shutdown_requested': self._shutdown_requested,
                'shutdown_time': self._shutdown_time.isoformat() if self._shutdown_time else None,
                'graceful_timeout': self._graceful_timeout,
                'registered_handlers': len(self._handlers),
            }
    
    def reset_statistics(self) -> None:
        """Reset signal statistics."""
        with self._lock:
            self._signal_count.clear()
    
    def _signal_dispatcher(
        self,
        sig: signal.Signals,
        frame: object
    ) -> None:
        """Internal signal dispatcher.
        
        Args:
            sig: Signal number
            frame: Current stack frame
        """
        with self._lock:
            # Update statistics
            self._signal_count[sig] = self._signal_count.get(sig, 0) + 1
            
            # Get registered handlers for this signal
            handlers = self._handlers.get(sig, [])
        
        # Call handlers (outside lock)
        for handler in handlers:
            try:
                handler(sig, frame)
            except Exception:
                pass  # Continue with other handlers
        
        # Call listeners (outside lock)
        sig_name = self._get_signal_name(sig)
        for listener in self._listener_callbacks:
            try:
                listener(sig, sig_name)
            except Exception:
                pass  # Continue with other listeners
    
    def _get_signal_name(self, sig: int) -> str:
        """Get human-readable signal name.
        
        Args:
            sig: Signal number
            
        Returns:
            Signal name
        """
        signal_names = {
            signal.SIGINT: 'SIGINT',
            signal.SIGTERM: 'SIGTERM',
            signal.SIGABRT: 'SIGABRT',
        }
        return signal_names.get(sig, f'SIGNAL({sig})')
