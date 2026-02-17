"""Context Preservation Module (Phase 10, Tier 2 - State Management)

Maintains session state, browser context, cookies, and interaction history.
Provides session recovery and state management for long-running automation tasks.

Архитектура:
- SessionContext: Container for session data
- ContextSnapshot: Point-in-time session snapshot
- ContextPreserver: Manages session state preservation
- StateRecovery: Handles session recovery on reconnection
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List, Dict, Any, Callable
import logging
import json
from datetime import datetime
from collections import deque

# Configure logging
logger = logging.getLogger(__name__)


class SessionStatus(Enum):
    """Status of browser session."""
    ACTIVE = "active"
    IDLE = "idle"
    PAUSED = "paused"
    DISCONNECTED = "disconnected"
    RECOVERED = "recovered"
    TERMINATED = "terminated"


class CookiePolicy(Enum):
    """Cookie handling policy."""
    PERSIST = "persist"  # Save and restore cookies
    TEMPORARY = "temporary"  # Use cookies but don't persist
    REJECT = "reject"  # Don't use cookies


@dataclass
class Cookie:
    """HTTP cookie representation."""
    name: str
    value: str
    domain: str
    path: str = "/"
    secure: bool = False
    httpOnly: bool = False
    expiry: Optional[int] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'name': self.name,
            'value': self.value,
            'domain': self.domain,
            'path': self.path,
            'secure': self.secure,
            'httpOnly': self.httpOnly,
            'expiry': self.expiry
        }


@dataclass
class SessionContext:
    """Container for browser session context."""
    session_id: str
    current_url: Optional[str] = None
    cookies: Dict[str, Cookie] = field(default_factory=dict)
    storage: Dict[str, Any] = field(default_factory=dict)  # localStorage, sessionStorage
    headers: Dict[str, str] = field(default_factory=dict)
    user_agent: Optional[str] = None
    viewport: Dict[str, int] = field(default_factory=lambda: {'width': 1920, 'height': 1080})
    status: SessionStatus = SessionStatus.ACTIVE
    created_at: datetime = field(default_factory=datetime.now)
    last_activity: datetime = field(default_factory=datetime.now)
    interaction_count: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'session_id': self.session_id,
            'current_url': self.current_url,
            'cookies': {k: v.to_dict() for k, v in self.cookies.items()},
            'storage': self.storage,
            'headers': self.headers,
            'user_agent': self.user_agent,
            'viewport': self.viewport,
            'status': self.status.value,
            'created_at': self.created_at.isoformat(),
            'last_activity': self.last_activity.isoformat(),
            'interaction_count': self.interaction_count,
            'metadata': self.metadata
        }


@dataclass
class ContextSnapshot:
    """Point-in-time snapshot of session context."""
    snapshot_id: str
    session_id: str
    context: SessionContext
    timestamp: datetime = field(default_factory=datetime.now)
    description: str = ""
    page_title: Optional[str] = None
    page_content_hash: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'snapshot_id': self.snapshot_id,
            'session_id': self.session_id,
            'context': self.context.to_dict(),
            'timestamp': self.timestamp.isoformat(),
            'description': self.description,
            'page_title': self.page_title,
            'page_content_hash': self.page_content_hash
        }


class ContextPreserver:
    """Manages session context preservation and recovery."""
    
    def __init__(self, max_snapshots: int = 50, cookie_policy: CookiePolicy = CookiePolicy.PERSIST):
        """Initialize context preserver.
        
        Args:
            max_snapshots: Maximum number of snapshots to keep
            cookie_policy: Cookie handling policy
        """
        self.context: Optional[SessionContext] = None
        self.snapshots: deque = deque(maxlen=max_snapshots)
        self.cookie_policy = cookie_policy
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    def create_session(self, session_id: str, user_agent: Optional[str] = None) -> SessionContext:
        """Create new session context.
        
        Args:
            session_id: Unique session identifier
            user_agent: Browser user agent string
            
        Returns:
            Created SessionContext
        """
        self.context = SessionContext(
            session_id=session_id,
            user_agent=user_agent or "Mozilla/5.0",
            status=SessionStatus.ACTIVE
        )
        self.logger.info(f"Created session: {session_id}")
        return self.context
    
    def add_cookie(self, cookie: Cookie) -> None:
        """Add cookie to session."""
        if self.context and self.cookie_policy != CookiePolicy.REJECT:
            self.context.cookies[cookie.name] = cookie
            self.logger.debug(f"Added cookie: {cookie.name}")
    
    def update_url(self, url: str) -> None:
        """Update current URL."""
        if self.context:
            self.context.current_url = url
            self.context.last_activity = datetime.now()
    
    def record_interaction(self) -> None:
        """Record user interaction."""
        if self.context:
            self.context.interaction_count += 1
            self.context.last_activity = datetime.now()
    
    def create_snapshot(self, description: str = "", page_title: Optional[str] = None) -> Optional[ContextSnapshot]:
        """Create session snapshot.
        
        Args:
            description: Snapshot description
            page_title: Current page title
            
        Returns:
            Created ContextSnapshot or None
        """
        if not self.context:
            return None
        
        snapshot = ContextSnapshot(
            snapshot_id=f"snap_{len(self.snapshots)}_{int(datetime.now().timestamp())}",
            session_id=self.context.session_id,
            context=self.context,
            description=description,
            page_title=page_title
        )
        
        self.snapshots.append(snapshot)
        self.logger.info(f"Created snapshot: {snapshot.snapshot_id}")
        return snapshot
    
    def get_snapshots(self) -> List[ContextSnapshot]:
        """Get all snapshots."""
        return list(self.snapshots)
    
    def get_latest_snapshot(self) -> Optional[ContextSnapshot]:
        """Get latest snapshot."""
        return self.snapshots[-1] if self.snapshots else None
    
    def restore_from_snapshot(self, snapshot: ContextSnapshot) -> bool:
        """Restore session from snapshot.
        
        Args:
            snapshot: Snapshot to restore from
            
        Returns:
            Success status
        """
        try:
            self.context = snapshot.context
            self.context.status = SessionStatus.RECOVERED
            self.logger.info(f"Restored from snapshot: {snapshot.snapshot_id}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to restore snapshot: {e}")
            return False
    
    def export_context(self, include_sensitive: bool = False) -> Dict[str, Any]:
        """Export session context.
        
        Args:
            include_sensitive: Include sensitive data like cookies
            
        Returns:
            Exported context dictionary
        """
        if not self.context:
            return {}
        
        context_dict = self.context.to_dict()
        
        if not include_sensitive:
            context_dict.pop('cookies', None)
            context_dict.pop('headers', None)
        
        return context_dict
    
    def clear_session(self) -> None:
        """Clear current session."""
        if self.context:
            self.context.status = SessionStatus.TERMINATED
            self.logger.info(f"Session terminated: {self.context.session_id}")
            self.context = None
