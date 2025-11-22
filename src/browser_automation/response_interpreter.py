"""Response Interpreter Module (Phase 11 - Advanced System Control)

Detects and interprets page changes resulting from executed actions.
Provides feedback on action success and page state changes.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime
import hashlib

logger = logging.getLogger(__name__)


class ChangeType(Enum):
    """Types of page changes detected."""
    URL_CHANGED = "url_changed"
    CONTENT_CHANGED = "content_changed"
    ELEMENTS_ADDED = "elements_added"
    ELEMENTS_REMOVED = "elements_removed"
    ERROR_DISPLAYED = "error_displayed"
    SUCCESS_DISPLAYED = "success_displayed"
    REDIRECT = "redirect"
    TIMEOUT = "timeout"
    NO_CHANGE = "no_change"


class ChangeConfidence(Enum):
    """Confidence level in detected changes."""
    LOW = 0.33
    MEDIUM = 0.66
    HIGH = 1.0


@dataclass
class PageChange:
    """Represents a detected page change."""
    change_type: ChangeType
    timestamp: datetime = field(default_factory=datetime.now)
    confidence: ChangeConfidence = ChangeConfidence.HIGH
    old_state: Dict[str, Any] = field(default_factory=dict)
    new_state: Dict[str, Any] = field(default_factory=dict)
    differences: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class InterpreterResult:
    """Result of response interpretation."""
    action_successful: bool
    change_detected: bool
    primary_change: Optional[PageChange] = None
    secondary_changes: List[PageChange] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    error_message: Optional[str] = None


class ResponseInterpreter:
    """Interprets page changes from executed actions."""
    
    def __init__(self):
        """Initialize interpreter."""
        self.previous_state: Optional[Dict[str, Any]] = None
        self.change_history: List[PageChange] = []
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    def detect_changes(self, before_state: Dict[str, Any], after_state: Dict[str, Any]) -> InterpreterResult:
        """Detect changes between page states.
        
        Args:
            before_state: Page state before action
            after_state: Page state after action
            
        Returns:
            InterpreterResult with detected changes
        """
        result = InterpreterResult(action_successful=False, change_detected=False)
        
        # Check URL change
        if before_state.get('url') != after_state.get('url'):
            change = PageChange(
                change_type=ChangeType.URL_CHANGED,
                old_state={'url': before_state.get('url')},
                new_state={'url': after_state.get('url')},
                confidence=ChangeConfidence.HIGH
            )
            result.primary_change = change
            result.change_detected = True
            result.action_successful = True
            self.change_history.append(change)
            self.logger.info(f"URL changed: {before_state.get('url')} -> {after_state.get('url')}")
        
        # Check content change
        before_hash = self._hash_content(before_state.get('content', ''))
        after_hash = self._hash_content(after_state.get('content', ''))
        
        if before_hash != after_hash:
            change = PageChange(
                change_type=ChangeType.CONTENT_CHANGED,
                old_state={'content_hash': before_hash},
                new_state={'content_hash': after_hash},
                confidence=ChangeConfidence.HIGH
            )
            if not result.primary_change:
                result.primary_change = change
                result.action_successful = True
            else:
                result.secondary_changes.append(change)
            result.change_detected = True
            self.change_history.append(change)
        
        # Check for errors
        if after_state.get('error'):
            change = PageChange(
                change_type=ChangeType.ERROR_DISPLAYED,
                new_state={'error': after_state.get('error')},
                confidence=ChangeConfidence.HIGH
            )
            result.secondary_changes.append(change)
            result.error_message = after_state.get('error')
            result.action_successful = False
            self.change_history.append(change)
        
        return result
    
    def _hash_content(self, content: str) -> str:
        """Generate hash of content for comparison."""
        return hashlib.md5(content.encode()).hexdigest()
    
    def interpret_result(self, action_result: Dict[str, Any], page_change: PageChange) -> str:
        """Generate interpretation of action result.
        
        Args:
            action_result: Result of executed action
            page_change: Detected page change
            
        Returns:
            Interpretation message
        """
        if page_change.change_type == ChangeType.URL_CHANGED:
            return f"Navigation successful to {page_change.new_state.get('url')}"
        elif page_change.change_type == ChangeType.CONTENT_CHANGED:
            return "Page content updated"
        elif page_change.change_type == ChangeType.ERROR_DISPLAYED:
            return f"Error: {page_change.metadata.get('error', 'Unknown error')}"
        else:
            return f"Change detected: {page_change.change_type.value}"
    
    def get_change_history(self) -> List[PageChange]:
        """Get all detected changes."""
        return self.change_history.copy()
    
    def clear_history(self) -> None:
        """Clear change history."""
        self.change_history.clear()
